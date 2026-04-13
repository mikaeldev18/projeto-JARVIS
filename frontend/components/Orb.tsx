'use client'

import { AgentId, AGENT_COLOR, AGENT_LABEL } from '@/lib/types'

interface OrbProps {
  agent: AgentId
  listening: boolean
  processing: boolean
  speaking?: boolean
  onDown: () => void
  onUp: () => void
}

export function Orb({ agent, listening, processing, speaking = false, onDown, onUp }: OrbProps) {
  const c = AGENT_COLOR[agent]
  const animation = listening
    ? 'orb-listen 1s ease-in-out infinite'
    : processing || speaking
      ? 'none'
      : 'orb-idle 3s ease-in-out infinite'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, userSelect: 'none' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 'var(--orb-container)', height: 'var(--orb-container)' }}>

        {listening && (
          <>
            <span style={{ position: 'absolute', width: 'var(--ring3)', height: 'var(--ring3)',
              borderRadius: '50%', border: '1px solid ' + c, opacity: 0, animation: 'ring-expand 1.2s ease-out infinite' }} />
            <span style={{ position: 'absolute', width: 'var(--ring3)', height: 'var(--ring3)',
              borderRadius: '50%', border: '1px solid ' + c, opacity: 0, animation: 'ring-expand 1.2s ease-out .4s infinite' }} />
          </>
        )}

        <span style={{ position: 'absolute', width: 'var(--ring2)', height: 'var(--ring2)',
          borderRadius: '50%', border: '1px solid ' + c + '22', transition: 'border-color .5s' }} />
        <span style={{ position: 'absolute', width: 'var(--ring1)', height: 'var(--ring1)',
          borderRadius: '50%', border: '1px solid ' + c + '44', transition: 'border-color .5s',
          animation: speaking ? 'orb-idle 2s ease-in-out infinite' : 'none' }} />

        <button
          onPointerDown={onDown} onPointerUp={onUp} onPointerLeave={onUp}
          aria-label="Segure para falar"
          style={{
            position: 'relative',
            width: 'var(--orb)', height: 'var(--orb)',
            borderRadius: '50%',
            border: '1px solid ' + c + '88',
            background: 'radial-gradient(circle at 38% 36%, ' + c + '33, ' + c + '08 58%, transparent)',
            boxShadow: '0 0 48px ' + c + '44, 0 0 96px ' + c + '18, inset 0 0 32px ' + c + '12',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'box-shadow .4s, border-color .4s',
            animation,
            ['--orb-glow-sm']: '0 0 48px ' + c + '44, 0 0 96px ' + c + '18',
            ['--orb-glow-lg']: '0 0 72px ' + c + '88, 0 0 140px ' + c + '44',
          } as React.CSSProperties}
        >
          {processing && (
            <span style={{ position: 'absolute', inset: 12, borderRadius: '50%',
              border: '1px solid ' + c + '22', borderTopColor: c, animation: 'orb-think .9s linear infinite' }} />
          )}
          <span style={{ position: 'relative', zIndex: 1 }}>
            {listening ? (
              <svg width="var(--orb-icon)" height="var(--orb-icon)" viewBox="0 0 24 24" fill={c}>
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke={c} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                <line x1="12" y1="19" x2="12" y2="23" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="8" y1="23" x2="16" y2="23" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            ) : processing ? (
              <span style={{ display: 'flex', gap: 5 }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{ width: 'calc(var(--orb-icon) * 0.18)', height: 'calc(var(--orb-icon) * 0.18)',
                    borderRadius: '50%', background: c, animation: 'dot-bounce 1.2s ' + (i*.2) + 's ease-in-out infinite' }} />
                ))}
              </span>
            ) : (
              <svg width="var(--orb-icon)" height="var(--orb-icon)" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
          </span>
        </button>
      </div>

      <div style={{ textAlign: 'center', lineHeight: 1.6 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.3em', color: c, fontWeight: 600 }}>{AGENT_LABEL[agent]}</div>
        <div style={{ fontSize: 10, letterSpacing: '0.15em', color: 'rgba(226,226,240,0.3)', marginTop: 2 }}>
          {listening ? 'SOLTE PARA ENVIAR' : processing ? 'PROCESSANDO' : speaking ? 'FALANDO...' : 'SEGURE PARA FALAR'}
        </div>
      </div>
    </div>
  )
}