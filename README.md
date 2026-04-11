# J.A.R.V.I.S — Marketing Intelligence System

> Just A Rather Very Intelligent System para marketing digital

## Stack

| Camada   | Tecnologia                          |
|----------|-------------------------------------|
| Backend  | FastAPI + WebSocket (Python 3.12)   |
| LLM      | Claude Sonnet 4 (Anthropic)         |
| STT      | OpenAI Whisper-1                    |
| TTS      | ElevenLabs eleven_multilingual_v2   |
| Frontend | Next.js 14 App Router + TypeScript  |
| Deploy   | Docker Compose                      |

## Agentes

| Agente          | Cor       | Especialidade                              |
|-----------------|-----------|--------------------------------------------|
| J.A.R.V.I.S     | `#00d4ff` | Conversa geral e roteamento de intenção    |
| Design          | `#ff6b9d` | Direção de arte e briefings visuais        |
| Landing Page    | `#c084fc` | Páginas de alta conversão                  |
| Meta Copy       | `#4ade80` | Copy Meta Ads — 3 variações PAS/AIDA/BAB  |
| Email Copy      | `#fbbf24` | Email marketing e subject lines            |
| Google Mentor   | `#f87171` | Mentoria Google Ads (Search/PMax/Shopping) |
| Meta Mentor     | `#60a5fa` | Mentoria Meta Ads (estratégia/pixel/CAPI)  |

## Fluxo

```
Áudio (WebM) ──► WebSocket /ws/voice
                    │
                    ▼
             Whisper STT ──► Texto transcrito
                    │
                    ▼
            Orchestrator ──► Claude classifica intent
                    │         {agent, task_summary, confidence}
                    ▼
          Agente especializado ──► Resposta em PT-BR
                    │
                    ▼
          ElevenLabs TTS ──► Áudio base64
                    │
                    ▼
         JSON { agent, text, audio } ──► Frontend
```

---

## Setup

### 1. Pré-requisitos

- Docker + Docker Compose  **ou** Python 3.12 + Node.js 20
- Chaves de API: Anthropic, OpenAI, ElevenLabs

### 2. Variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` com suas chaves:

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-proj-...
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_VOICE_ID=...        # ID da voz no painel ElevenLabs
```

> **Como obter o ELEVENLABS_VOICE_ID:** acesse [elevenlabs.io](https://elevenlabs.io) → Voices → clique na voz desejada → copie o ID na URL ou no painel.

---

## Rodando com Docker (recomendado)

```bash
# Na pasta jarvis/
docker-compose up --build
```

| Serviço   | URL                          |
|-----------|------------------------------|
| Frontend  | http://localhost:3000        |
| Backend   | http://localhost:8000        |
| Health    | http://localhost:8000/health |
| WebSocket | ws://localhost:8000/ws/voice |

---

## Rodando localmente (desenvolvimento)

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

---

## Como usar

1. Acesse **http://localhost:3000**
2. **Voz**: segure o orbe central → fale → solte para enviar
3. **Texto**: digite na caixa inferior direita e pressione Enter
4. O orbe muda de cor conforme o agente ativo
5. Respostas aparecem no painel direito com badge do agente

---

## Estrutura do projeto

```
jarvis/
├── backend/
│   ├── main.py              # FastAPI + WebSocket /ws/voice
│   ├── orchestrator.py      # Classifica intent → roteia para agente
│   ├── config.py            # Carrega .env
│   ├── agents/
│   │   ├── base.py          # BaseAgent(name, system_prompt)
│   │   ├── design.py
│   │   ├── landing_page.py
│   │   ├── meta_copy.py
│   │   ├── email_copy.py
│   │   ├── google_mentor.py
│   │   └── meta_mentor.py
│   ├── services/
│   │   ├── claude_client.py # Anthropic async SDK
│   │   ├── elevenlabs.py    # TTS streaming
│   │   └── whisper.py       # STT
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── page.tsx         # UI: orbe + push-to-talk + chat
│   │   ├── layout.tsx
│   │   └── globals.css      # Dark theme HUD
│   ├── components/
│   │   ├── Orb.tsx          # Orbe animado 200px
│   │   └── Chat.tsx         # Painel de chat com badges
│   ├── lib/
│   │   ├── types.ts         # AgentId, cores, labels
│   │   └── useJarvis.ts     # Hook WebSocket + MediaRecorder
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Protocolo WebSocket

### Cliente → Servidor
| Tipo    | Formato                                  |
|---------|------------------------------------------|
| Áudio   | `ArrayBuffer` (audio/webm via MediaRecorder) |
| Texto   | `{"type": "text_message", "text": "..."}` |

### Servidor → Cliente
| `type`       | Campos                                              |
|--------------|-----------------------------------------------------|
| `status`     | `message: string`                                   |
| `transcript` | `text: string`                                      |
| `response`   | `agent, task_summary, confidence, text, audio: b64` |
| `error`      | `message: string`                                   |
