from abc import ABC
from services.claude_client import ClaudeClient


class BaseAgent(ABC):
    def __init__(self, name: str, system_prompt: str):
        self.name = name
        self.system_prompt = system_prompt
        self._client = ClaudeClient()

    async def execute(self, task: str, history: list[dict] | None = None) -> str:
        """Executa o agente com a tarefa e histórico de conversa opcionais."""
        messages: list[dict] = []
        if history:
            messages.extend(history)
        messages.append({"role": "user", "content": task})

        return await self._client.complete(
            system=self.system_prompt,
            messages=messages,
        )
