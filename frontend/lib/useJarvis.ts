'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AgentId, ChatMessage } from './types'

type State = {
  connected: boolean
  status: string
  agent: AgentId
  messages: ChatMessage[]
  listening: boolean
  processing: boolean
  speaking: boolean
  speakingText: string
}

function getWsUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL
  if (typeof window === 'undefined') return 'ws://localhost:8000/ws/voice'
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return proto + '//' + window.location.hostname + ':8000/ws/voice'
}
const WS = getWsUrl()
function uid() { return Math.random().toString(36).slice(2) }

function getSupportedMime(): string {
  for (const t of ['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/mp4']) {
    if (MediaRecorder.isTypeSupported(t)) return t
  }
  return ''
}

export function useJarvis() {
  const ws       = useRef<WebSocket | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const chunks   = useRef<Blob[]>([])
  const audioEl  = useRef<HTMLAudioElement | null>(null)

  const [state, setState] = useState<State>({
    connected: false, status: 'Conectando...',
    agent: 'jarvis', messages: [],
    listening: false, processing: false,
    speaking: false, speakingText: '',
  })

  const patch = useCallback((p: Partial<State>) => setState(s => ({ ...s, ...p })), [])
  const pushMsg = useCallback((m: Omit<ChatMessage, 'id' | 'ts'>) =>
    setState(s => ({ ...s, messages: [...s.messages, { ...m, id: uid(), ts: new Date() }] })), [])

  const playAudio = useCallback((b64: string, text: string) => {
    if (!b64) return
    audioEl.current?.pause()
    const a = new Audio('data:audio/mpeg;base64,' + b64)
    audioEl.current = a
    patch({ speaking: true, speakingText: text })
    a.onended = () => patch({ speaking: false, speakingText: '' })
    a.onerror = () => patch({ speaking: false, speakingText: '' })
    a.play().catch(() => patch({ speaking: false, speakingText: '' }))
  }, [patch])

  const connect = useCallback(() => {
    const socket = new WebSocket(WS)
    ws.current = socket
    socket.onopen  = () => patch({ connected: true, status: 'Online' })
    socket.onclose = () => {
      patch({ connected: false, status: 'Reconectando...', listening: false, processing: false, speaking: false, speakingText: '' })
      setTimeout(connect, 3000)
    }
    socket.onerror = () => patch({ status: 'Erro de conexão' })
    socket.onmessage = (ev) => {
      const d = JSON.parse(ev.data)
      switch (d.type) {
        case 'status':     patch({ status: d.message, processing: true }); break
        case 'transcript': pushMsg({ role: 'user', text: d.text }); break
        case 'response': {
          patch({ agent: d.agent as AgentId, status: 'Online', processing: false })
          pushMsg({ role: 'assistant', text: d.text, agent: d.agent })
          const displayText = d.voice_text || d.text
          if (d.audio) playAudio(d.audio, displayText)
          else {
            // sem TTS: mostra texto por tempo proporcional ao tamanho
            const ms = Math.max(5000, Math.min(displayText.length * 60, 20000))
            patch({ speaking: true, speakingText: displayText })
            setTimeout(() => patch({ speaking: false, speakingText: '' }), ms)
          }
          break
        }
        case 'error': {
          const msg: string = d.message ?? ''
          const friendly = msg.includes('401') || msg.toLowerCase().includes('auth')
            ? 'Serviço indisponível — verifique as APIs'
            : msg.includes('transcrever') || msg.includes('STT')
              ? 'Não foi possível transcrever. Digite sua mensagem.'
              : 'Erro ao processar. Tente novamente.'
          patch({ status: friendly, processing: false })
          break
        }
      }
    }
  }, [patch, pushMsg, playAudio])

  useEffect(() => { connect(); return () => ws.current?.close() }, [connect])

  const startListening = useCallback(async () => {
    if (state.listening || state.processing) return
    if (audioEl.current) { audioEl.current.pause(); patch({ speaking: false, speakingText: '' }) }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000, channelCount: 1 }
      })
      const mime = getSupportedMime()
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      recorder.current = mr; chunks.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunks.current, { type: mime || 'audio/webm' })
        if (blob.size < 5000) { patch({ listening: false, processing: false, status: 'Fale por mais tempo' }); return }
        ws.current?.send(await blob.arrayBuffer())
        patch({ listening: false, processing: true, status: 'Transcrevendo...' })
      }
      mr.start(250)
      patch({ listening: true, status: 'Ouvindo...' })
    } catch (err) {
      const denied = err instanceof DOMException && err.name === 'NotAllowedError'
      patch({ status: denied ? 'Permissão de microfone negada' : 'Microfone não disponível' })
    }
  }, [state.listening, state.processing, patch])

  const stopListening = useCallback(() => {
    if (recorder.current?.state === 'recording') recorder.current.stop()
  }, [])

  const sendText = useCallback((text: string, image?: string) => {
    if (!text.trim() && !image) return
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return
    pushMsg({ role: 'user', text: text || '📷 Imagem enviada', image })
    ws.current.send(JSON.stringify({ type: 'text_message', text, image }))
    patch({ processing: true, status: 'Processando...' })
  }, [pushMsg, patch])

  return { state, startListening, stopListening, sendText }
}