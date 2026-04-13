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
}

const WS = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000/ws/voice'

function uid() { return Math.random().toString(36).slice(2) }

export function useJarvis() {
  const ws        = useRef<WebSocket | null>(null)
  const recorder  = useRef<MediaRecorder | null>(null)
  const chunks    = useRef<Blob[]>([])
  const audioEl   = useRef<HTMLAudioElement | null>(null)

  const [state, setState] = useState<State>({
    connected: false,
    status: 'Conectando...',
    agent: 'jarvis',
    messages: [],
    listening: false,
    processing: false,
  })

  const patch = useCallback((p: Partial<State>) =>
    setState(s => ({ ...s, ...p })), [])

  const pushMsg = useCallback((m: Omit<ChatMessage, 'id' | 'ts'>) =>
    setState(s => ({
      ...s,
      messages: [...s.messages, { ...m, id: uid(), ts: new Date() }],
    })), [])

  const playAudio = useCallback((b64: string) => {
    if (!b64) return
    audioEl.current?.pause()
    const a = new Audio(`data:audio/mpeg;base64,${b64}`)
    audioEl.current = a
    a.play().catch(() => {})
  }, [])

  // ── WebSocket ──────────────────────────────────────────────
  const connect = useCallback(() => {
    const socket = new WebSocket(WS)
    ws.current = socket

    socket.onopen  = () => patch({ connected: true, status: 'Online' })
    socket.onclose = () => {
      patch({ connected: false, status: 'Reconectando...', listening: false, processing: false })
      setTimeout(connect, 3000)
    }
    socket.onerror = () => patch({ status: 'Erro de conexão' })

    socket.onmessage = (ev) => {
      const d = JSON.parse(ev.data)
      switch (d.type) {
        case 'status':
          patch({ status: d.message, processing: true })
          break
        case 'transcript':
          pushMsg({ role: 'user', text: d.text })
          break
        case 'response':
          patch({ agent: d.agent as AgentId, status: 'Online', processing: false })
          pushMsg({ role: 'assistant', text: d.text, agent: d.agent })
          playAudio(d.audio)
          break
        case 'error':
          patch({ status: d.message, processing: false })
          break
      }
    }
  }, [patch, pushMsg, playAudio])

  useEffect(() => { connect(); return () => ws.current?.close() }, [connect])

  // ── Push-to-talk ───────────────────────────────────────────
  const startListening = useCallback(async () => {
    if (state.listening || state.processing) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      recorder.current = mr
      chunks.current   = []

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunks.current, { type: 'audio/webm' })
        ws.current?.send(await blob.arrayBuffer())
        patch({ listening: false, processing: true, status: 'Transcrevendo...' })
      }

      mr.start()
      patch({ listening: true, status: 'Ouvindo...' })
    } catch {
      patch({ status: 'Microfone não disponível' })
    }
  }, [state.listening, state.processing, patch])

  const stopListening = useCallback(() => {
    if (recorder.current?.state === 'recording') recorder.current.stop()
  }, [])

  // ── Text input ─────────────────────────────────────────────
  const sendText = useCallback((text: string) => {
    if (!text.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) return
    pushMsg({ role: 'user', text })
    ws.current.send(JSON.stringify({ type: 'text_message', text }))
    patch({ processing: true, status: 'Processando...' })
  }, [pushMsg, patch])

  return { state, startListening, stopListening, sendText }
}
