import anthropic
from config import ANTHROPIC_API_KEY


class ClaudeClient:
    def __init__(self):
        self.client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
        self.model = "claude-haiku-4-5-20251001"

    async def complete(self, system: str, messages: list[dict], max_tokens: int = 4096) -> str:
        response = await self.client.messages.create(
            model=self.model, max_tokens=max_tokens, system=system, messages=messages,
        )
        return response.content[0].text

    async def complete_json(self, system: str, messages: list[dict]) -> str:
        response = await self.client.messages.create(
            model=self.model, max_tokens=512, system=system, messages=messages,
        )
        return response.content[0].text

    def build_vision_message(self, text: str, image_data_url: str | None = None) -> dict:
        if not image_data_url:
            return {"role": "user", "content": text}
        try:
            header, b64 = image_data_url.split(",", 1)
            media_type = header.split(";")[0].split(":")[1]
        except Exception:
            b64 = image_data_url
            media_type = "image/jpeg"
        content: list = [{"type": "image", "source": {"type": "base64", "media_type": media_type, "data": b64}}]
        content.append({"type": "text", "text": text or "Analise esta imagem no contexto de marketing digital."})
        return {"role": "user", "content": content}
