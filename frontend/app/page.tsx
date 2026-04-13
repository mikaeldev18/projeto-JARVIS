'use client'
import { useState, useEffect, useCallback } from 'react'
import { Orb } from '@/components/Orb'
import { Chat } from '@/components/Chat'
import { SettingsPanel } from '@/components/SettingsPanel'
import { useJarvis } from '@/lib/useJarvis'
import { useSettings } from '@/lib/useSettings'
import { AGENT_COLOR, AGENT_LABEL, AgentId } from '@/lib/types'

const ALL_AGENTS: AgentId[] = ['jarvis', 'design', 'landing_page', 'meta_copy', 'email_copy', 'google_mentor', 'meta_mentor']

/* ────────────────────────────────────────────────
   SpeakingDisplay
──────────────────────────────────────────────── */
function SpeakingDisplay({ text, color, visible }: { text: string; color: string; visible: boolean }) {
  const [shown, setShown] = useState('')
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (!visible || !text) { setShown(''); setIdx(0); return }
    setShown(''); setIdx(0)
  }, [text, visible])

  useEffect(() => {
    if (!visible || idx >= text.length) return
    const delay = text.length > 200 ? 12 : text.length > 100 ? 18 : 25
    const t = setTimeout(() => { setShown(text.slice(0, idx + 1)); setIdx(i => i + 1) }, delay)
    return () => clearTimeout(t)
  }, [idx, text, visible])

  if (!visible) return null

  return (
    <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)',
      bottom: 'max(14%, 90px)', width: 'min(480px, 90vw)', zIndex: 20,
      display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', borderRadius: 14, padding: '12px 16px', textAlign: 'center',
        background: 'rgba(0,0,0,0.82)', border: '1px solid ' + color + '40',
        backdropFilter: 'blur(12px)', boxShadow: '0 0 28px ' + color + '20',
        color: 'rgba(226,226,240,0.95)', maxHeight: 140, overflowY: 'auto' }}>
        <div style={{ fontSize: 9, letterSpacing: '0.3em', color, marginBottom: 6 }}>J.A.R.V.I.S</div>
        <span style={{ fontSize: 12, lineHeight: 1.6 }}>
          {shown}
          {idx < text.length && (
            <span style={{ display: 'inline-block', width: 2, height: 14, background: color,
              marginLeft: 2, verticalAlign: 'middle', animation: 'blink-cursor 0.7s step-end infinite' }} />
          )}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{ width: 4 + Math.sin((i / 4) * Math.PI) * 3, height: 4 + Math.sin((i / 4) * Math.PI) * 3,
            borderRadius: '50%', background: color, opacity: 0.6,
            animation: 'speaking-bar 0.8s ' + (i * 0.12) + 's ease-in-out infinite alternate' }} />
        ))}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────
   ORB SCALE based on settings.orbSize
──────────────────────────────────────────────── */
const ORB_SCALE: Record<string, number> = { sm: 0.75, md: 1, lg: 1.25 }

/* ────────────────────────────────────────────────
   Page
──────────────────────────────────────────────── */
export default function Page() {
  const { state, startListening, stopListening, sendText } = useJarvis()
  const { settings, update: updateSettings, loaded } = useSettings()
  const accent = AGENT_COLOR[state.agent]

  const [tab, setTab] = useState<'orb' | 'chat' | 'settings'>('orb')
  const [showSettings, setShowSettings] = useState(false)

  const handleSend = useCallback((text: string, image?: string) => {
    sendText(text, image)
    // Switch to chat tab in stacked/side layouts
    if (settings.layout !== 'chat-only') setTab('chat')
  }, [sendText, settings.layout])

  const assistantCount = state.messages.filter(m => m.role === 'assistant').length

  // orb scale CSS override
  const orbScaleFactor = ORB_SCALE[settings.orbSize] ?? 1

  if (!loaded) return null // avoid flash

  /* ── LAYOUT: chat-only ──────────────────────── */
  if (settings.layout === 'chat-only') {
    return (
      <main style={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100vw', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.4em', color: accent, fontWeight: 600 }}>J.A.R.V.I.S</div>
            <div style={{ fontSize: 8, letterSpacing: '0.2em', color: 'rgba(226,226,240,0.2)' }}>MARKETING INTELLIGENCE</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 9, color: accent }}>{AGENT_LABEL[state.agent]}</span>
            <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: 'none',
              cursor: 'pointer', color: 'rgba(226,226,240,0.3)', padding: 4 }}>
              <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'>
                <circle cx='12' cy='12' r='3'/><path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'/>
              </svg>
            </button>
          </div>
        </header>
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <Chat messages={state.messages} status={state.status} processing={state.processing}
            connected={state.connected} accentColor={accent} settings={settings} onSend={handleSend} />
        </div>
        {showSettings && (
          <SettingsPanel settings={settings} update={updateSettings} accentColor={accent} onClose={() => setShowSettings(false)} />
        )}
      </main>
    )
  }

  /* ── LAYOUT: side (desktop side-by-side) ────── */
  if (settings.layout === 'side') {
    return (
      <main style={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100vw', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.4em', color: accent, fontWeight: 600 }}>J.A.R.V.I.S</div>
            <div style={{ fontSize: 8, letterSpacing: '0.2em', color: 'rgba(226,226,240,0.2)' }}>MARKETING INTELLIGENCE</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: state.connected ? '#4ade80' : '#f87171',
                boxShadow: state.connected ? '0 0 5px #4ade80' : 'none', display: 'inline-block' }} />
              <span style={{ fontSize: 9, color: state.connected ? '#4ade80' : '#f87171' }}>
                {state.connected ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <span style={{ fontSize: 9, color: accent }}>{AGENT_LABEL[state.agent]}</span>
            <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: 'none',
              cursor: 'pointer', color: 'rgba(226,226,240,0.3)', padding: 4 }}>
              <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'>
                <circle cx='12' cy='12' r='3'/><path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'/>
              </svg>
            </button>
          </div>
        </header>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
          {/* Left: Orb */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', position: 'relative', borderRight: '1px solid rgba(255,255,255,0.04)' }}>

            {/* Agent list sidebar */}
            <div style={{ position: 'absolute', left: 16, top: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ALL_AGENTS.map(id => {
                const active = state.agent === id; const color = AGENT_COLOR[id]
                return (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: active ? 1 : 0.3, transition: 'opacity .2s' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0,
                      boxShadow: active ? '0 0 6px ' + color : 'none' }} />
                    <span style={{ fontSize: 8, letterSpacing: '0.12em', color }}>{AGENT_LABEL[id]}</span>
                  </div>
                )
              })}
            </div>

            <div style={{ transform: `scale(${orbScaleFactor})`, transformOrigin: 'center center' }}>
              <Orb agent={state.agent} listening={state.listening} processing={state.processing}
                speaking={state.speaking} onDown={startListening} onUp={stopListening} />
            </div>

            <div style={{ marginTop: 20, fontSize: 9, letterSpacing: '0.2em', color: 'rgba(226,226,240,0.3)',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 20, padding: '4px 12px' }}>
              {state.status.toUpperCase()}
            </div>

            <SpeakingDisplay text={state.speakingText} color={accent} visible={state.speaking} />

            {/* Scan line */}
            <div style={{ position: 'absolute', left: 0, right: 0, height: 1, pointerEvents: 'none',
              background: 'linear-gradient(90deg, transparent, ' + accent + '30, transparent)',
              animation: 'scan 6s linear infinite' }} />
          </div>

          {/* Right: Chat */}
          <div style={{ width: 420, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Chat messages={state.messages} status={state.status} processing={state.processing}
              connected={state.connected} accentColor={accent} settings={settings} onSend={handleSend} />
          </div>
        </div>

        {showSettings && (
          <SettingsPanel settings={settings} update={updateSettings} accentColor={accent} onClose={() => setShowSettings(false)} />
        )}
      </main>
    )
  }

  /* ── LAYOUT: stacked (default — orb top, chat bottom, tabs on mobile) */
  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100vw',
      overflow: 'hidden', position: 'relative', zIndex: 1 }}>

      {/* Scan line */}
      <div style={{ position: 'fixed', left: 0, right: 0, height: 1, pointerEvents: 'none', zIndex: 2,
        background: 'linear-gradient(90deg, transparent, ' + accent + '30, transparent)',
        animation: 'scan 6s linear infinite' }} />

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.4em', color: accent, fontWeight: 600 }}>J.A.R.V.I.S</div>
          <div style={{ fontSize: 8, letterSpacing: '0.2em', color: 'rgba(226,226,240,0.2)' }}>MARKETING INTELLIGENCE</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: state.connected ? '#4ade80' : '#f87171',
              boxShadow: state.connected ? '0 0 5px #4ade80' : 'none', display: 'inline-block' }} />
            <span style={{ fontSize: 9, color: state.connected ? '#4ade80' : '#f87171', letterSpacing: '0.12em' }}>
              {state.connected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <span style={{ fontSize: 9, color: accent, letterSpacing: '0.1em' }}>{AGENT_LABEL[state.agent]}</span>
          <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: 'none',
            cursor: 'pointer', color: 'rgba(226,226,240,0.35)', padding: '2px 4px', borderRadius: 6,
            transition: 'color .2s' }}>
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'>
              <circle cx='12' cy='12' r='3'/>
              <path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'/>
            </svg>
          </button>
        </div>
      </header>

      {/* Body — stacked: desktop = side-by-side inside stacked, mobile = tabs */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Sidebar agents — desktop only, inside stacked layout */}
        <aside className='sidebar-desktop' style={{ width: 180, flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.04)', padding: '16px 14px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 8, letterSpacing: '0.3em', color: 'rgba(226,226,240,0.2)', marginBottom: 8 }}>AGENTES</div>
            {ALL_AGENTS.map(id => {
              const active = state.agent === id; const color = AGENT_COLOR[id]
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 7,
                  opacity: active ? 1 : 0.3, transition: 'opacity .2s', padding: '3px 0' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0,
                    boxShadow: active ? '0 0 6px ' + color : 'none' }} />
                  <span style={{ fontSize: 9, letterSpacing: '0.1em', color }}>{AGENT_LABEL[id]}</span>
                </div>
              )
            })}
          </div>
          <div style={{ fontSize: 8, color: 'rgba(226,226,240,0.1)', lineHeight: 1.8 }}>
            J.A.R.V.I.S v1.0<br />MARKETING AI
          </div>
        </aside>

        {/* Main area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

          {/* Desktop: orb top half */}
          <div className='orb-section' style={{ display: tab === 'orb' ? 'flex' : 'none' }}
            data-desktop-always='true'>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', position: 'relative', minHeight: 0 }}>

              <div style={{ transform: `scale(${orbScaleFactor})`, transformOrigin: 'center center' }}>
                <Orb agent={state.agent} listening={state.listening} processing={state.processing}
                  speaking={state.speaking} onDown={startListening} onUp={stopListening} />
              </div>

              <div style={{ marginTop: 16, fontSize: 9, letterSpacing: '0.2em', color: 'rgba(226,226,240,0.3)',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 20, padding: '4px 12px' }}>
                {state.status.toUpperCase()}
              </div>

              <SpeakingDisplay text={state.speakingText} color={accent} visible={state.speaking} />
            </div>

            {/* Mobile: compact input under orb */}
            <div className='mobile-input' style={{ padding: '8px 14px 10px',
              borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(10,10,15,0.97)' }}>
              <Chat messages={[]} status={state.status} processing={state.processing}
                connected={state.connected} accentColor={accent} settings={settings}
                onSend={handleSend} compact />
            </div>
          </div>

          {/* Desktop: chat bottom half — always visible on desktop, tab on mobile */}
          <div className='chat-section' style={{ display: tab === 'chat' ? 'flex' : 'none',
            flex: 1, flexDirection: 'column', overflow: 'hidden', minHeight: 0,
            borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <Chat messages={state.messages} status={state.status} processing={state.processing}
              connected={state.connected} accentColor={accent} settings={settings} onSend={handleSend} />
          </div>

        </div>
      </div>

      {/* Tab bar — mobile */}
      <nav className='tab-bar' style={{ borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexShrink: 0 }}>
        {(['orb', 'chat'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '13px 0', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 10, letterSpacing: '0.25em',
            color: tab === t ? accent : 'rgba(226,226,240,0.3)',
            borderTop: tab === t ? '1px solid ' + accent : '1px solid transparent',
            fontFamily: 'inherit', transition: 'color .2s', position: 'relative',
          }}>
            {t === 'orb' ? '◈ ORBE' : '◉ CHAT'}
            {t === 'chat' && tab === 'orb' && assistantCount > 0 && (
              <span style={{ position: 'absolute', top: 8, right: 'calc(50% - 28px)', width: 15, height: 15,
                borderRadius: '50%', background: accent, color: '#000', fontSize: 8, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {assistantCount > 9 ? '9+' : assistantCount}
              </span>
            )}
          </button>
        ))}
        <button onClick={() => setShowSettings(true)} style={{
          width: 54, padding: '13px 0', background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(226,226,240,0.3)', borderTop: '1px solid transparent',
          fontFamily: 'inherit', transition: 'color .2s', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'>
            <circle cx='12' cy='12' r='3'/>
            <path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'/>
          </svg>
        </button>
      </nav>

      {showSettings && (
        <SettingsPanel settings={settings} update={updateSettings} accentColor={accent} onClose={() => setShowSettings(false)} />
      )}
    </main>
  )
}
