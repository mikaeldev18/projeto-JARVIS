import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from orchestrator import JarvisOrchestrator
from services.whisper import transcribe
from services.elevenlabs import text_to_speech

app = FastAPI(title="J.A.R.V.I.S", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = JarvisOrchestrator()


@app.get("/health")
async def health():
    return {"status": "online", "system": "J.A.R.V.I.S"}


@app.websocket("/ws/voice")
async def ws_voice(websocket: WebSocket):
    await websocket.accept()
    history: list[dict] = []

    async def send(payload: dict):
        await websocket.send_text(json.dumps(payload, ensure_ascii=False))

    try:
        while True:
            data = await websocket.receive()

            # ── Áudio binário (MediaRecorder webm) ──────────────────────────
            if "bytes" in data:
                audio_bytes: bytes = data["bytes"]

                await send({"type": "status", "message": "Transcrevendo..."})
                try:
                    transcript = await transcribe(audio_bytes)
                except Exception as e:
                    import logging
                    logging.error(f"STT error: {e}")
                    await send({"type": "error", "message": f"Erro ao transcrever: {str(e)[:80]}"})
                    continue

                if not transcript.strip():
                    await send({"type": "error", "message": "Áudio não reconhecido."})
                    continue

                await send({"type": "transcript", "text": transcript})
                await _handle_text(transcript, history, send)

            # ── Mensagem de texto via JSON ───────────────────────────────────
            elif "text" in data:
                try:
                    msg = json.loads(data["text"])
                except json.JSONDecodeError:
                    continue

                if msg.get("type") == "text_message":
                    text_input = msg.get("text", "").strip()
                    image_input = msg.get("image")  # base64 data URL or None
                    if text_input or image_input:
                        await _handle_text(text_input, history, send, image=image_input)

    except WebSocketDisconnect:
        pass


def _summarize_for_voice(text: str, max_chars: int = 450) -> str:
    """Extrai os primeiros parágrafos significativos para síntese de voz.
    Agentes retornam textos longos com markdown — só falamos o início."""
    import re
    # Remove linhas de markdown (---,###,**) e linhas vazias consecutivas
    lines = text.splitlines()
    clean = []
    for line in lines:
        stripped = line.strip()
        if stripped in ('---', '===', '***'): continue
        if re.match(r'^#{1,4}\s', stripped): continue  # headings
        if not stripped: continue
        # Remove bold/italic markers
        stripped = re.sub(r'\*{1,3}([^*]+)\*{1,3}', r'\1', stripped)
        stripped = re.sub(r'_{1,2}([^_]+)_{1,2}', r'\1', stripped)
        clean.append(stripped)
    result = ' '.join(clean)
    if len(result) <= max_chars:
        return result
    # Corta no último ponto antes do limite
    cut = result[:max_chars]
    last_period = max(cut.rfind('.'), cut.rfind('!'), cut.rfind('?'))
    if last_period > max_chars // 2:
        return cut[:last_period + 1]
    return cut.rstrip() + '...'


async def _handle_text(text: str, history: list[dict], send, image: str | None = None) -> None:
    await send({"type": "status", "message": "Processando..."})

    try:
        result = await orchestrator.process(text, history, image=image)
    except Exception:
        await send({"type": "error", "message": "Erro ao processar. Verifique as configurações e tente novamente."})
        return

    # Atualiza histórico (mantém últimas 20 trocas = 40 mensagens)
    history.append({"role": "user", "content": text or "[imagem enviada]"})
    history.append({"role": "assistant", "content": result["response"]})
    if len(history) > 40:
        del history[:-40]

    await send({"type": "status", "message": "Sintetizando voz..."})

    full_text = result["response"]

    # Cria resumo para voz (máx 500 chars) — agentes retornam textos longos
    voice_text = _summarize_for_voice(full_text)

    audio_b64 = ""
    try:
        audio_b64 = await text_to_speech(voice_text)
    except Exception:
        pass  # TTS é opcional — resposta de texto sempre entregue

    await send({
        "type": "response",
        "agent": result["agent"],
        "task_summary": result["task_summary"],
        "confidence": result["confidence"],
        "text": full_text,
        "voice_text": voice_text,
        "audio": audio_b64,
    })
