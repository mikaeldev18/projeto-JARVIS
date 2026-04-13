'use client'
import { Settings, LayoutMode, ChatBubbleStyle, FontSize } from '@/lib/useSettings'
import { AGENT_COLOR } from '@/lib/types'

interface Props {
  settings: Settings
  update: (p: Partial<Settings>) => void
  accentColor: string
  onClose: () => void
}

function Section({ title }: { title: string }) {
  return (
    <div style={{ fontSize: 9, letterSpacing: '0.3em', color: 'rgba(226,226,240,0.25)', marginBottom: 10, marginTop: 20 }}>
      {title}
    </div>
  )
}

function OptionGroup<T extends string>({
  value, onChange, options, accent,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; icon?: string; desc?: string }[]
  accent: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {options.map(opt => {
        const active = value === opt.value
        return (
          <button key={opt.value} onClick={() => onChange(opt.value)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
              borderRadius: 8, cursor: 'pointer', transition: 'all .15s',
              background: active ? accent + '15' : 'rgba(255,255,255,0.03)',
              border: '1px solid ' + (active ? accent + '60' : 'rgba(255,255,255,0.07)'),
              color: active ? accent : 'rgba(226,226,240,0.6)',
              fontFamily: 'inherit', textAlign: 'left', width: '100%',
            }}>
            {opt.icon && <span style={{ fontSize: 16, flexShrink: 0 }}>{opt.icon}</span>}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: active ? 600 : 400, letterSpacing: '0.05em' }}>{opt.label}</div>
              {opt.desc && <div style={{ fontSize: 9, color: 'rgba(226,226,240,0.3)', marginTop: 2 }}>{opt.desc}</div>}
            </div>
            {active && (
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent, flexShrink: 0,
                boxShadow: '0 0 6px ' + accent }} />
            )}
          </button>
        )
      })}
    </div>
  )
}

function Toggle({ label, desc, value, onChange, accent }: {
  label: string; desc?: string; value: boolean; onChange: (v: boolean) => void; accent: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div>
        <div style={{ fontSize: 11, color: 'rgba(226,226,240,0.7)' }}>{label}</div>
        {desc && <div style={{ fontSize: 9, color: 'rgba(226,226,240,0.25)', marginTop: 2 }}>{desc}</div>}
      </div>
      <button onClick={() => onChange(!value)} style={{
        width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', transition: 'all .2s',
        background: value ? accent : 'rgba(255,255,255,0.1)', position: 'relative', flexShrink: 0,
      }}>
        <span style={{
          position: 'absolute', top: 3, left: value ? 19 : 3, width: 14, height: 14,
          borderRadius: '50%', background: '#fff', transition: 'left .2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
        }} />
      </button>
    </div>
  )
}

export function SettingsPanel({ settings, update, accentColor, onClose }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end',
      justifyContent: 'center',
    }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      }} />

      {/* Panel */}
      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 480,
        background: '#0d0d14', borderRadius: '18px 18px 0 0',
        border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none',
        padding: '0 20px 40px', maxHeight: '85dvh', overflowY: 'auto',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.6)',
        animation: 'slide-up 0.25s ease',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 4px' }}>
          <div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16,
          borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 13, letterSpacing: '0.2em', color: accentColor, fontWeight: 600 }}>CONFIGURAÇÕES</div>
            <div style={{ fontSize: 9, letterSpacing: '0.15em', color: 'rgba(226,226,240,0.25)', marginTop: 2 }}>J.A.R.V.I.S v1.0</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(226,226,240,0.35)', fontSize: 18, lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        {/* Layout */}
        <Section title="LAYOUT DA INTERFACE" />
        <OptionGroup<LayoutMode>
          value={settings.layout}
          onChange={v => update({ layout: v })}
          accent={accentColor}
          options={[
            { value: 'stacked', label: 'Orbe + Chat', icon: '⬛', desc: 'Orbe no topo, chat embaixo — melhor para mobile' },
            { value: 'side',    label: 'Lado a Lado', icon: '⬜', desc: 'Orbe à esquerda, chat à direita — melhor para desktop' },
            { value: 'chat-only', label: 'Só Chat',  icon: '💬', desc: 'Interface de chat pura, sem orbe' },
          ]}
        />

        {/* Chat style */}
        <Section title="ESTILO DAS MENSAGENS" />
        <OptionGroup<ChatBubbleStyle>
          value={settings.bubbleStyle}
          onChange={v => update({ bubbleStyle: v })}
          accent={accentColor}
          options={[
            { value: 'minimal',  label: 'Minimal',  icon: '◻', desc: 'Bolhas leves com bordas sutis' },
            { value: 'cards',    label: 'Cards',    icon: '▪', desc: 'Cards com fundo sólido e sombra' },
            { value: 'terminal', label: 'Terminal', icon: '>', desc: 'Estilo linha de comando — sem bolhas' },
          ]}
        />

        {/* Font size */}
        <Section title="TAMANHO DO TEXTO" />
        <OptionGroup<FontSize>
          value={settings.fontSize}
          onChange={v => update({ fontSize: v })}
          accent={accentColor}
          options={[
            { value: 'sm', label: 'Pequeno', desc: '11px — mais mensagens visíveis' },
            { value: 'md', label: 'Médio',   desc: '13px — padrão' },
            { value: 'lg', label: 'Grande',  desc: '15px — mais legível' },
          ]}
        />

        {/* Orb size */}
        <Section title="TAMANHO DO ORBE" />
        <OptionGroup
          value={settings.orbSize}
          onChange={v => update({ orbSize: v })}
          accent={accentColor}
          options={[
            { value: 'sm', label: 'Compacto', desc: 'Orbe menor, mais espaço para chat' },
            { value: 'md', label: 'Padrão',   desc: 'Tamanho original' },
            { value: 'lg', label: 'Grande',   desc: 'Orbe com destaque visual máximo' },
          ]}
        />

        {/* Toggles */}
        <Section title="PREFERÊNCIAS" />
        <Toggle label="Identificação do agente" desc="Mostra qual agente respondeu acima das mensagens"
          value={settings.showAgentBadge} onChange={v => update({ showAgentBadge: v })} accent={accentColor} />
        <Toggle label="Horário das mensagens" desc="Exibe o timestamp abaixo de cada mensagem"
          value={settings.showTimestamp} onChange={v => update({ showTimestamp: v })} accent={accentColor} />
        <Toggle label="Som (voz)" desc="Reproduz a resposta em áudio via ElevenLabs"
          value={settings.soundEnabled} onChange={v => update({ soundEnabled: v })} accent={accentColor} />

        {/* Color legend */}
        <Section title="AGENTES" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {(Object.entries(AGENT_COLOR) as [string, string][]).map(([id, color]) => (
            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px',
              borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0,
                boxShadow: '0 0 6px ' + color + '80' }} />
              <span style={{ fontSize: 9, letterSpacing: '0.12em', color: 'rgba(226,226,240,0.5)' }}>
                {id.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 9, color: 'rgba(226,226,240,0.12)', letterSpacing: '0.15em' }}>
          CONFIGURAÇÕES SALVAS AUTOMATICAMENTE
        </div>
      </div>
    </div>
  )
}
