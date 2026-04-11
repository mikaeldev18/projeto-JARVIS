'use client'

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

  return (
    <main style={{
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
    }}>

      {/* ── Scan line ───────────────────────────────────────── */}
      <div style={{
        position: 'fixed',
        left: 0, right: 0,
        height: 1,
        background: `linear-gradient(90deg, transparent, ${accent}30, transparent)`,
        animation: 'scan 6s linear infinite',
        pointerEvents: 'none',
        zIndex: 2,
      }} />

      {/* ── Left sidebar ───────────────────────────────────── */}
      <aside style={{
        width: 220,
        flexShrink: 0,
        borderRight: '1px solid rgba(255,255,255,0.04)',
        padding: '28px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 32,
      }}>
        {/* System info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.3em', color: 'rgba(226,226,240,0.2)', marginBottom: 12 }}>
              SISTEMA
            </div>
            {[
              { k: 'STATUS',  v: state.connected ? 'ONLINE' : 'OFFLINE', c: state.connected ? '#4ade80' : '#f87171' },
              { k: 'AGENTE',  v: AGENT_LABEL[state.agent], c: accent },
              { k: 'MODELO',  v: 'SONNET 4', c: 'rgba(226,226,240,0.4)' },
            ].map(({ k, v, c }) => (
              <div key={k} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}>
                <span style={{ fontSize: 9, letterSpacing: '0.2em', color: 'rgba(226,226,240,0.25)' }}>{k}</span>
                <span style={{ fontSize: 9, letterSpacing: '0.1em', color: c }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Agent list */}
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.3em', color: 'rgba(226,226,240,0.2)', marginBottom: 12 }}>
              AGENTES
            </div>
            {ALL_AGENTS.map(id => {
              const active = state.agent === id
              const color  = AGENT_COLOR[id]
              return (
                <div key={id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8,
                  opacity: active ? 1 : 0.35,
                  transition: 'opacity .3s',
                }}>
                  <span style={{
                    width: 5, height: 5,
                    borderRadius: '50%',
                    background: color,
                    flexShrink: 0,
                    boxShadow: active ? `0 0 6px ${color}` : 'none',
                  }} />
                  <span style={{ fontSize: 9, letterSpacing: '0.15em', color }}>
                    {AGENT_LABEL[id]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ fontSize: 9, letterSpacing: '0.15em', color: 'rgba(226,226,240,0.12)', lineHeight: 1.8 }}>
          J.A.R.V.I.S v1.0<br />
          MARKETING INTELLIGENCE
        </div>
      </aside>

      {/* ── Center — Orb ───────────────────────────────────── */}
      <section style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        {/* Title */}
        <div style={{ position: 'absolute', top: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.5em', color: accent, fontWeight: 600 }}>
            J.A.R.V.I.S
          </div>
          <div style={{ fontSize: 9, letterSpacing: '0.3em', color: 'rgba(226,226,240,0.2)', marginTop: 4 }}>
            MARKETING INTELLIGENCE SYSTEM
          </div>
        </div>

        <Orb
          agent={state.agent}
          listening={state.listening}
          processing={state.processing}
          onDown={startListening}
          onUp={stopListening}
        />

        {/* Status pill */}
        <div style={{
          position: 'absolute',
          bottom: 40,
          fontSize: 10,
          letterSpacing: '0.2em',
          color: 'rgba(226,226,240,0.3)',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 20,
          padding: '4px 14px',
        }}>
          {state.status.toUpperCase()}
        </div>
      </section>

      {/* ── Right — Chat ───────────────────────────────────── */}
      <aside style={{
        width: 360,
        flexShrink: 0,
        borderLeft: '1px solid rgba(255,255,255,0.04)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Chat
          messages={state.messages}
          status={state.status}
          processing={state.processing}
          connected={state.connected}
          onSend={sendText}
        />
      </aside>
    </main>
  )
}
