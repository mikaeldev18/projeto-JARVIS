import json
import re
from services.claude_client import ClaudeClient
from agents.design import DesignAgent
from agents.landing_page import LandingPageAgent
from agents.meta_copy import MetaCopyAgent
from agents.email_copy import EmailCopyAgent
from agents.google_mentor import GoogleMentorAgent
from agents.meta_mentor import MetaMentorAgent

CLASSIFIER_SYSTEM = """Você é o classificador de intenção do J.A.R.V.I.S. Analise a mensagem do usuário e retorne APENAS um JSON válido identificando qual agente deve responder.

Agentes disponíveis:
- "jarvis": cumprimentos, perguntas gerais sobre o sistema, conversas fora dos outros domínios
- "design": direção de arte, criativos visuais, briefings de design, paleta de cores, tipografia, composição
- "landing_page": landing pages, páginas de vendas, estrutura de site, copy de página, seções de LP
- "meta_copy": copy para Facebook Ads, Instagram Ads, Meta Ads, anúncios de feed, stories, reels
- "email_copy": email marketing, subject lines, newsletters, sequências de email, automação de email
- "google_mentor": dúvidas sobre Google Ads, Search, Performance Max, Shopping, YouTube Ads, GTM
- "meta_mentor": estratégia Meta Ads, estrutura de campanhas, pixel, CAPI, públicos, criativos, escalada

Responda SOMENTE com JSON, sem texto adicional, sem markdown:
{"agent": "nome_do_agente", "task_summary": "resumo em até 10 palavras", "confidence": 0.95}"""

JARVIS_SYSTEM = """Você é J.A.R.V.I.S (Just A Rather Very Intelligent System), assistente de inteligência artificial especializado em marketing digital.

Personalidade: sofisticado, direto, levemente futurista. Respostas concisas e úteis.

Suas capacidades:
- Design e direção de arte para criativos
- Landing pages de alta conversão
- Copy para Meta Ads com 3 variações (PAS/AIDA/BAB)
- Email marketing com subject lines otimizadas
- Mentoria completa Google Ads (Search, PMax, Shopping, YouTube)
- Mentoria completa Meta Ads (estratégia, pixel, CAPI, escalonamento)

Quando o usuário fizer perguntas gerais, responda de forma útil e direcione para suas especialidades quando relevante.

Responda sempre em português brasileiro."""


class JarvisOrchestrator:
    def __init__(self):
        self._classifier = ClaudeClient()
        self._jarvis_client = ClaudeClient()
        self._agents = {
            "design": DesignAgent(),
            "landing_page": LandingPageAgent(),
            "meta_copy": MetaCopyAgent(),
            "email_copy": EmailCopyAgent(),
            "google_mentor": GoogleMentorAgent(),
            "meta_mentor": MetaMentorAgent(),
        }

    async def _classify(self, message: str) -> dict:
        try:
            raw = await self._classifier.complete_json(
                system=CLASSIFIER_SYSTEM,
                messages=[{"role": "user", "content": message}],
            )
            match = re.search(r'\{[^{}]+\}', raw, re.DOTALL)
            if match:
                data = json.loads(match.group())
                return {
                    "agent": str(data.get("agent", "jarvis")),
                    "task_summary": str(data.get("task_summary", "")),
                    "confidence": float(data.get("confidence", 0.5)),
                }
        except Exception:
            pass
        return {"agent": "jarvis", "task_summary": message[:60], "confidence": 0.5}

    async def process(self, message: str, history: list[dict] | None = None) -> dict:
        """Classifica a intent e roteia para o agente correto."""
        history = history or []
        intent = await self._classify(message)
        agent_name = intent["agent"]

        if agent_name in self._agents:
            response_text = await self._agents[agent_name].execute(message, history)
        else:
            agent_name = "jarvis"
            response_text = await self._jarvis_client.complete(
                system=JARVIS_SYSTEM,
                messages=history + [{"role": "user", "content": message}],
            )

        return {
            "agent": agent_name,
            "task_summary": intent["task_summary"],
            "confidence": intent["confidence"],
            "response": response_text,
        }
