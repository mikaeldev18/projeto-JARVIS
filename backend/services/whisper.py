import httpx
from config import ELEVENLABS_API_KEY


async def transcribe(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    """Transcreve áudio usando ElevenLabs Scribe (STT)."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "https://api.elevenlabs.io/v1/speech-to-text",
            headers={"xi-api-key": ELEVENLABS_API_KEY},
            files={"file": (filename, audio_bytes, "audio/webm")},
            data={"model_id": "scribe_v1", "language_code": "por"},
        )
        response.raise_for_status()
        return response.json()["text"]
