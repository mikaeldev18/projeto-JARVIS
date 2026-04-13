'use client'

import { useState } from 'react'
import { Orb }  from '@/components/Orb'
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

      {/* ── Scan line ── */}
      <div style={{
        position: 'fixed', left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${accent}30, transparent)`,
        animation: 'scan 6s linear infinite',
        pointerEvents: 'none', zIndex: 2,
      }} />

      {/* ── Header mobile ── */}
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

      {/* ── Desktop: 3 colunas | Mobile: tabs ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* ── Left sidebar — apenas desktop ── */}
        <aside style={{
          width: 200,
          flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.04)',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          // esconde no mobile via inline (usamos @media no globals.css)
        }} className="sidebar-desktop">
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

        {/* ── Center orb — desktop sempre visível, mobile tab ── */}
        <section
          className={`orb-section ${tab === 'orb' ? 'tab-active' : 'tab-hidden'}`}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <Orb
            agent={state.agent}
            listening={state.listening}
            processing={state.processing}
            onDown={startListening}
            onUp={stopListening}
          />
          <div style={{
            position: 'absolute', bottom: 24,
            fontSize: 10, letterSpacing: '0.2em',
            color: 'rgba(226,226,240,0.3)',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 20, padding: '4px 14px',
          }}>
            {state.status.toUpperCase()}
          </div>
        </section>

        {/* ── Right chat — desktop sempre visível, mobile tab ── */}
        <aside
          className={`chat-section ${tab === 'chat' ? 'tab-active' : 'tab-hidden'}`}
          style={{
            width: 360,
            flexShrink: 0,
            borderLeft: '1px solid rgba(255,255,255,0.04)',
            display: 'flex',
            flexDirection: 'column',
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

      {/* ── Bottom tab bar — apenas mobile ── */}
      <nav className="tab-bar" style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexShrink: 0,
      }}>
        {([['orb', '◈ ORBE'], ['chat', '◉ CHAT']] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '14px 0',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 10,
              letterSpacing: '0.25em',
              color: tab === t ? accent : 'rgba(226,226,240,0.3)',
              borderTop: tab === t ? `1px solid ${accent}` : '1px solid transparent',
              fontFamily: 'inherit',
              transition: 'color .2s',
            }}
          >
            {label}
          </button>
        ))}
      </nav>
    </main>
  )
}
