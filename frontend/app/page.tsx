'use client'

import { useState } from 'react'
import { Orb } from '@/components/Orb'
import { Chat } from '@/components/Chat'
import { useJarvis } from '@/lib/useJarvis'
import { AGENT_COLOR, AGENT_LABEL, AgentId } from '@/lib/types'

const ALL_AGENTS: AgentId[] = [
  'jarvis', 'design', 'landing_page',
  'meta_copy', 'email_copy', 'google_mentor', 'meta_mentor',
]

export default function Page() {
  const { state, startListening, stopListening, sendText } = useJarvis()
  const accent = AGENT_COLOR[state.agent]
  const [tab, setTab] = useState<'orb' | 'chat'>('orb')
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim() || state.processing) return
    sendText(input.trim())
    setInput('')
    setTab('chat')
  }

  return (
    <main style={{
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
    }}>

      {/* Scan line */}
      <div style={{
        position: 'fixed', left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${accent}30, transparent)`,
        animation: 'scan 6s linear infinite',
        pointerEvents: 'none', zIndex: 2,
      }} />

      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.4em', color: accent, fontWeight: 600 }}>J.A.R.V.I.S</div>
          <div style={{ fontSize: 8, letterSpacing: '0.2em', color: 'rgba(226,226,240,0.2)' }}>MARKETING INTELLIGENCE</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 9, letterSpacing: '0.2em', color: state.connected ? '#4ade80' : '#f87171' }}>
            {state.connected ? 'ONLINE' : 'OFFLINE'}
          </span>
          <span style={{ fontSize: 9, letterSpacing: '0.1em', color: accent }}>
            {AGENT_LABEL[state.agent]}
          </span>
        </div>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Sidebar — desktop only */}
        <aside className="sidebar-desktop" style={{
          width: 200, flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.04)',
          padding: '24px 16px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: '0.3em', color: 'rgba(226,226,240,0.2)', marginBottom: 10 }}>SISTEMA</div>
              {[
                { k: 'STATUS', v: state.connected ? 'ONLINE' : 'OFFLINE', c: state.connected ? '#4ade80' : '#f87171' },
                { k: 'AGENTE', v: AGENT_LABEL[state.agent], c: accent },
                { k: 'MODELO', v: 'HAIKU 4.5', c: 'rgba(226,226,240,0.4)' },
              ].map(({ k, v, c }) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 9, letterSpacing: '0.2em', color: 'rgba(226,226,240,0.25)' }}>{k}</span>
                  <span style={{ fontSize: 9, color: c }}>{v}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 9, letterSpacing: '0.3em', color: 'rgba(226,226,240,0.2)', marginBottom: 10 }}>AGENTES</div>
              {ALL_AGENTS.map(id => {
                const active = state.agent === id
                const color = AGENT_COLOR[id]
                return (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, opacity: active ? 1 : 0.35 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: active ? `0 0 6px ${color}` : 'none' }} />
                    <span style={{ fontSize: 9, letterSpacing: '0.15em', color }}>{AGENT_LABEL[id]}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div style={{ fontSize: 9, color: 'rgba(226,226,240,0.12)', lineHeight: 1.8 }}>
            J.A.R.V.I.S v1.0<br />MARKETING INTELLIGENCE
          </div>
        </aside>

        {/* Center — Orb */}
        <section
          className={`orb-section ${tab === 'orb' ? 'tab-active' : 'tab-hidden'}`}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
        >
          <Orb
            agent={state.agent}
            listening={state.listening}
            processing={state.processing}
            onDown={startListening}
            onUp={stopListening}
          />

          {/* Status pill */}
          <div style={{
            marginTop: 24,
            fontSize: 10, letterSpacing: '0.2em',
            color: 'rgba(226,226,240,0.3)',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 20, padding: '4px 14px',
          }}>
            {state.status.toUpperCase()}
          </div>

          {/* Input móvel dentro do orbe — mobile only */}
          <div className="mobile-input" style={{
            position: 'absolute',
            bottom: 0,
            left: 0, right: 0,
            padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(10,10,15,0.95)',
          }}>
            <div style={{
              display: 'flex', gap: 8, alignItems: 'center',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, padding: '8px 12px',
            }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Digite uma mensagem..."
                disabled={state.processing}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: 'rgba(226,226,240,0.9)', fontSize: 13, fontFamily: 'inherit',
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || state.processing}
                style={{
                  background: 'none', border: 'none', cursor: input.trim() && !state.processing ? 'pointer' : 'default',
                  color: accent, fontSize: 10, letterSpacing: '0.2em',
                  opacity: input.trim() && !state.processing ? 1 : 0.25, fontFamily: 'inherit',
                }}
              >
                ENVIAR
              </button>
            </div>
          </div>
        </section>

        {/* Right — Chat */}
        <aside
          className={`chat-section ${tab === 'chat' ? 'tab-active' : 'tab-hidden'}`}
          style={{
            width: 360, flexShrink: 0,
            borderLeft: '1px solid rgba(255,255,255,0.04)',
            display: 'flex', flexDirection: 'column',
          }}
        >
          <Chat
            messages={state.messages}
            status={state.status}
            processing={state.processing}
            connected={state.connected}
            onSend={sendText}
          />
        </aside>
      </div>

      {/* Tab bar — mobile only */}
      <nav className="tab-bar" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexShrink: 0 }}>
        {(['orb', 'chat'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '14px 0',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 10, letterSpacing: '0.25em',
              color: tab === t ? accent : 'rgba(226,226,240,0.3)',
              borderTop: tab === t ? `1px solid ${accent}` : '1px solid transparent',
              fontFamily: 'inherit', transition: 'color .2s',
            }}
          >
            {t === 'orb' ? '◈ ORBE' : '◉ CHAT'}
          </button>
        ))}
      </nav>
    </main>
  )
}
