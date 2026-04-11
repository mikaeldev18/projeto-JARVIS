'use client'

import { useEffect, useRef, useState } from 'react'
import { AgentId, AGENT_COLOR, AGENT_LABEL, ChatMessage } from '@/lib/types'

interface ChatProps {
  messages: ChatMessage[]
  status: string
  processing: boolean
  connected: boolean
  onSend: (t: string) => void
}

export function Chat({ messages, status, processing, connected, onSend }: ChatProps) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, processing])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || processing) return
    onSend(input.trim())
    setInput('')
  }

  const statusColor = connected
    ? status === 'Online' ? '#4ade80' : '#fbbf24'
    : '#f87171'

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'rgba(0,0,0,0.18)',
    }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 10, letterSpacing: '0.3em', color: 'rgba(226,226,240,0.3)' }}>
          HISTÓRICO
        </span>
        <span style={{ fontSize: 10, letterSpacing: '0.2em', color: statusColor }}>
          {status.toUpperCase()}
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {messages.length === 0 && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 12, opacity: .25,
          }}>
            <div style={{ fontSize: 32 }}>◈</div>
            <p style={{ fontSize: 10, letterSpacing: '0.2em', textAlign: 'center', lineHeight: 1.8 }}>
              SEGURE O ORBE PARA FALAR<br />OU DIGITE ABAIXO
            </p>
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {processing && (
          <div style={{ display: 'flex', gap: 5, padding: '8px 12px', alignSelf: 'flex-start' }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                width: 5, height: 5,
                borderRadius: '50%',
                background: '#00d4ff',
                animation: `dot-bounce 1.2s ${i * .2}s ease-in-out infinite`,
              }} />
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={submit}
        style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0,
        }}
      >
        <div style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 8,
          padding: '8px 12px',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Digite uma mensagem..."
            disabled={processing}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'rgba(226,226,240,0.9)',
              fontSize: 12,
              fontFamily: 'inherit',
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || processing}
            style={{
              background: 'none',
              border: 'none',
              cursor: input.trim() && !processing ? 'pointer' : 'default',
              color: '#00d4ff',
              fontSize: 10,
              letterSpacing: '0.2em',
              opacity: input.trim() && !processing ? 1 : 0.25,
              fontFamily: 'inherit',
              padding: '2px 4px',
            }}
          >
            ENVIAR
          </button>
        </div>
      </form>
    </div>
  )
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'
  const agentColor = msg.agent ? AGENT_COLOR[msg.agent] : '#00d4ff'
  const agentLabel = msg.agent ? AGENT_LABEL[msg.agent] : null

  return (
    <div className="anim-fade-up" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      gap: 4,
    }}>
      {/* Agent badge */}
      {!isUser && agentLabel && (
        <span style={{
          fontSize: 9,
          letterSpacing: '0.25em',
          color: agentColor,
          background: `${agentColor}12`,
          border: `1px solid ${agentColor}30`,
          borderRadius: 4,
          padding: '2px 6px',
        }}>
          {agentLabel}
        </span>
      )}

      {/* Bubble */}
      <div style={{
        maxWidth: '88%',
        padding: '8px 12px',
        borderRadius: 8,
        fontSize: 12,
        lineHeight: 1.7,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        ...(isUser ? {
          background: 'rgba(0,212,255,0.07)',
          border: '1px solid rgba(0,212,255,0.18)',
          color: 'rgba(226,226,240,0.92)',
        } : {
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(226,226,240,0.85)',
        }),
      }}>
        {msg.text}
      </div>

      {/* Timestamp */}
      <span style={{ fontSize: 9, color: 'rgba(226,226,240,0.18)', letterSpacing: '0.1em' }}>
        {msg.ts.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  )
}
