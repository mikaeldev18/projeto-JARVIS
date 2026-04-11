import httpx
import base64
from config import ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID


async def text_to_speech(text: str) -> str:
    """Converte texto em fala via ElevenLabs e retorna áudio em base64."""
    if not ELEVENLABS_API_KEY or not ELEVENLABS_VOICE_ID:
        return ""

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
    }
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
            "style": 0.0,
            "use_speaker_boost": True,
        },
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(url, json=payload, headers=headers)
        if response.status_code == 200:
            return base64.b64encode(response.content).decode("utf-8")
        return ""


async def text_to_speech_stream(text: str):
    """Streaming TTS — yielda chunks de bytes de áudio."""
    if not ELEVENLABS_API_KEY or not ELEVENLABS_VOICE_ID:
        return

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}/stream"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
    }
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
        },
    }

    async with httpx.AsyncClient(timeout=60) as client:
        async with client.stream("POST", url, json=payload, headers=headers) as response:
            if response.status_code == 200:
                async for chunk in response.aiter_bytes(chunk_size=4096):
                    yield chunk
