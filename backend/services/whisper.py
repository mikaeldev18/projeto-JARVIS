import httpx
from config import ELEVENLABS_API_KEY


def _detect_mime(audio_bytes: bytes) -> tuple[str, str]:
    """Detecta o MIME type e extensão pelo magic bytes do áudio."""
    if audio_bytes[:4] == b'OggS':
        return "audio/ogg", "audio.ogg"
    if audio_bytes[:4] == b'fLaC':
        return "audio/flac", "audio.flac"
    if audio_bytes[:3] == b'ID3' or audio_bytes[:2] == b'\xff\xfb':
        return "audio/mpeg", "audio.mp3"
    if audio_bytes[4:8] in (b'ftyp', b'moov') or audio_bytes[:4] == b'\x00\x00\x00\x1c':
        return "audio/mp4", "audio.mp4"
    # webm magic: \x1a\x45\xdf\xa3
    if audio_bytes[:4] == b'\x1a\x45\xdf\xa3':
        return "audio/webm", "audio.webm"
    # default
    return "audio/webm", "audio.webm"


async def transcribe(audio_bytes: bytes, filename: str | None = None) -> str:
    """Transcreve áudio usando ElevenLabs Scribe (STT)."""
    mime, auto_filename = _detect_mime(audio_bytes)
    fname = filename or auto_filename

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "https://api.elevenlabs.io/v1/speech-to-text",
            headers={"xi-api-key": ELEVENLABS_API_KEY},
            files={"file": (fname, audio_bytes, mime)},
            data={"model_id": "scribe_v1", "language_code": "por"},
        )
        response.raise_for_status()
        data = response.json()
        return data.get("text") or data.get("transcript") or ""
