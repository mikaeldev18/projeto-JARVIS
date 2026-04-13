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
                except Exception:
                    await send({"type": "error", "message": "Não foi possível transcrever o áudio. Tente digitar sua mensagem."})
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

    audio_b64 = ""
    try:
        audio_b64 = await text_to_speech(result["response"])
    except Exception:
        pass  # TTS é opcional — resposta de texto sempre entregue

    await send({
        "type": "response",
        "agent": result["agent"],
        "task_summary": result["task_summary"],
        "confidence": result["confidence"],
        "text": result["response"],
        "audio": audio_b64,
    })
