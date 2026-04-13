'use client'
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { AgentId, AGENT_COLOR, AGENT_LABEL, ChatMessage } from '@/lib/types'
import { Settings } from '@/lib/useSettings'

const MAX_IMG = 4 * 1024 * 1024

function fileToB64(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = rej
    r.readAsDataURL(f)
  })
}

function resizeImg(url: string, max = 1920): Promise<string> {
  return new Promise(res => {
    const img = new Image()
    img.onload = () => {
      const { width: w, height: h } = img
      if (w <= max && h <= max) { res(url); return }
      const s = max / Math.max(w, h)
      const c = document.createElement('canvas')
      c.width = Math.round(w * s); c.height = Math.round(h * s)
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      res(c.toDataURL('image/jpeg', 0.85))
    }
    img.src = url
  })
}

/** Render markdown-lite: bold, inline code, headers, bullets, numbered lists */
function MdText({ text, color, style }: { text: string; color: string; style?: React.CSSProperties }) {
  const lines = text.split('\n')

  function renderInline(raw: string): React.ReactNode[] {
    const parts: React.ReactNode[] = []
    // patterns: **bold**, *italic*, `code`, ~~strike~~
    const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|~~(.+?)~~)/g
    let last = 0; let m: RegExpExecArray | null; let i = 0
    while ((m = re.exec(raw)) !== null) {
      if (m.index > last) parts.push(raw.slice(last, m.index))
      if (m[2]) parts.push(<strong key={i++} style={{ color, fontWeight: 700 }}>{m[2]}</strong>)
      else if (m[3]) parts.push(<em key={i++} style={{ fontStyle: 'italic' }}>{m[3]}</em>)
      else if (m[4]) parts.push(
        <code key={i++} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 3, padding: '1px 5px', fontSize: '0.9em', color: '#e2e8f0', fontFamily: 'inherit' }}>
          {m[4]}
        </code>
      )
      else if (m[5]) parts.push(<s key={i++} style={{ opacity: 0.5 }}>{m[5]}</s>)
      last = re.lastIndex
    }
    if (last < raw.length) parts.push(raw.slice(last))
    return parts
  }

  const nodes: React.ReactNode[] = []
  let inList = false; let listItems: React.ReactNode[] = []; let listOrdered = false

  const flushList = () => {
    if (!inList) return
    const El = listOrdered ? 'ol' : 'ul'
    nodes.push(
      <El key={`list-${nodes.length}`} style={{ margin: '4px 0 4px 14px', padding: 0, listStyle: listOrdered ? 'decimal' : 'disc' }}>
        {listItems}
      </El>
    )
    listItems = []; inList = false; listOrdered = false
  }

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd()

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|={3,})$/.test(line.trim())) {
      flushList()
      nodes.push(<hr key={idx} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 0' }} />)
      return
    }

    // Heading
    const hMatch = line.match(/^(#{1,4})\s+(.+)/)
    if (hMatch) {
      flushList()
      const level = hMatch[1].length
      const sz = [16, 14, 13, 12][level - 1] ?? 12
      nodes.push(
        <div key={idx} style={{ fontSize: sz, fontWeight: 700, color, margin: `${level <= 2 ? 10 : 6}px 0 4px`, letterSpacing: '0.03em' }}>
          {renderInline(hMatch[2])}
        </div>
      )
      return
    }

    // Numbered list
    const olMatch = line.match(/^(\d+)\.\s+(.+)/)
    if (olMatch) {
      if (!inList || !listOrdered) { flushList(); inList = true; listOrdered = true }
      listItems.push(<li key={idx} style={{ fontSize: 'inherit', lineHeight: 1.6, padding: '1px 0' }}>{renderInline(olMatch[2])}</li>)
      return
    }

    // Bullet list
    const ulMatch = line.match(/^[-*•]\s+(.+)/)
    if (ulMatch) {
      if (!inList || listOrdered) { flushList(); inList = true; listOrdered = false }
      listItems.push(<li key={idx} style={{ fontSize: 'inherit', lineHeight: 1.6, padding: '1px 0' }}>{renderInline(ulMatch[1])}</li>)
      return
    }

    // Empty line
    if (!line.trim()) {
      flushList()
      nodes.push(<div key={idx} style={{ height: 6 }} />)
      return
    }

    // Normal paragraph
    flushList()
    nodes.push(<div key={idx} style={{ lineHeight: 1.65 }}>{renderInline(line)}</div>)
  })

  flushList()
  return <div style={{ ...style, fontSize: 'inherit' }}>{nodes}</div>
}

const FONT_SIZE: Record<string, number> = { sm: 11, md: 13, lg: 15 }

interface ChatProps {
  messages: ChatMessage[]
  status: string
  processing: boolean
  connected: boolean
  accentColor: string
  settings: Settings
  onSend: (text: string, image?: string) => void
  compact?: boolean // for mobile orb-section embed
}

export function Chat({
  messages, status, processing, connected, accentColor, settings, onSend, compact = false,
}: ChatProps) {
  const [input, setInput] = useState('')
  const [pendingImg, setPendingImg] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [imgError, setImgError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, processing])

  const handleImg = useCallback(async (f: File) => {
    setImgError('')
    if (!f.type.startsWith('image/')) { setImgError('Apenas imagens'); return }
    if (f.size > MAX_IMG) { setImgError('Máx. 4 MB'); return }
    setPendingImg(await resizeImg(await fileToB64(f)))
  }, [])

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) handleImg(f); e.target.value = ''
  }
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const f = e.dataTransfer.files?.[0]; if (f) handleImg(f)
  }
  const onPaste = (e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'))
    if (item) { const f = item.getAsFile(); if (f) handleImg(f) }
  }

  const submit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()
    if ((!input.trim() && !pendingImg) || processing) return
    onSend(input.trim(), pendingImg ?? undefined)
    setInput(''); setPendingImg(null)
  }, [input, pendingImg, processing, onSend])

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  useEffect(() => {
    const el = taRef.current; if (!el) return
    el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [input])

  const canSend = Boolean((input.trim() || pendingImg) && !processing)
  const sc = connected ? (status === 'Online' ? '#4ade80' : '#fbbf24') : '#f87171'
  const bs = settings.bubbleStyle
  const fs = FONT_SIZE[settings.fontSize] ?? 13

  // Bubble styles per mode
  function bubbleStyle(isUser: boolean, agentColor: string): React.CSSProperties {
    if (bs === 'terminal') {
      return {
        background: 'none', border: 'none', padding: '2px 0',
        color: isUser ? accentColor : 'rgba(226,226,240,0.85)',
        fontSize: fs, lineHeight: 1.6, fontFamily: 'inherit',
      }
    }
    if (bs === 'cards') {
      return {
        maxWidth: '86%', padding: '10px 14px', borderRadius: 10,
        background: isUser ? accentColor + '22' : 'rgba(20,20,30,0.9)',
        border: '1px solid ' + (isUser ? accentColor + '50' : agentColor + '30'),
        boxShadow: isUser ? 'none' : '0 2px 12px rgba(0,0,0,0.3)',
        color: 'rgba(226,226,240,0.92)', fontSize: fs,
      }
    }
    // minimal (default)
    return {
      maxWidth: '84%', padding: '8px 12px', borderRadius: 10,
      background: isUser ? accentColor + '12' : 'rgba(255,255,255,0.04)',
      border: '1px solid ' + (isUser ? accentColor + '30' : 'rgba(255,255,255,0.07)'),
      color: isUser ? 'rgba(226,226,240,0.95)' : 'rgba(226,226,240,0.85)',
      fontSize: fs,
    }
  }

  if (compact) {
    // Compact mode: just the input bar (for mobile under orb)
    return (
      <form onSubmit={submit} onPaste={onPaste}>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'flex-end',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid ' + (canSend ? accentColor + '50' : 'rgba(255,255,255,0.08)'),
          borderRadius: 12, padding: '7px 10px', transition: 'border-color .3s',
        }}>
          <button type='button' onClick={() => fileRef.current?.click()} disabled={processing}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: pendingImg ? accentColor : 'rgba(226,226,240,0.25)', flexShrink: 0, paddingBottom: 2 }}>
            <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.6'>
              <rect x='3' y='3' width='18' height='18' rx='3' /><circle cx='8.5' cy='8.5' r='1.5' fill='currentColor' stroke='none' /><path d='M21 15l-5-5L5 21' />
            </svg>
          </button>
          <textarea ref={taRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey}
            placeholder='Enviar mensagem...' disabled={processing} rows={1}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', resize: 'none',
              color: 'rgba(226,226,240,0.9)', fontSize: 12, fontFamily: 'inherit', minHeight: 20, maxHeight: 80, lineHeight: 1.5 }} />
          <button type='submit' disabled={!canSend}
            style={{ background: 'none', border: 'none', cursor: canSend ? 'pointer' : 'default',
              color: accentColor, opacity: canSend ? 1 : 0.2, transition: 'opacity .2s', flexShrink: 0, paddingBottom: 2 }}>
            <svg width='15' height='15' viewBox='0 0 24 24' fill='currentColor'><path d='M2.01 21L23 12 2.01 3 2 10l15 2-15 2z' /></svg>
          </button>
        </div>
        <input ref={fileRef} type='file' accept='image/*' style={{ display: 'none' }} onChange={onFileInput} />
      </form>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}
      onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}>

      {isDragging && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: accentColor + '10',
          border: '2px dashed ' + accentColor + '60', borderRadius: 8, backdropFilter: 'blur(4px)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📷</div>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', color: accentColor }}>SOLTE A IMAGEM AQUI</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc,
            boxShadow: connected && status === 'Online' ? '0 0 5px ' + sc : 'none', display: 'inline-block' }} />
          <span style={{ fontSize: 9, letterSpacing: '0.25em', color: 'rgba(226,226,240,0.4)' }}>
            CHAT {messages.length > 0 ? `· ${messages.length} MSG` : ''}
          </span>
        </div>
        <span style={{ fontSize: 9, letterSpacing: '0.15em', color: sc }}>{status.toUpperCase()}</span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px',
        display: 'flex', flexDirection: 'column', gap: bs === 'terminal' ? 4 : 14, minHeight: 0 }}>

        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 12, opacity: 0.2 }}>
            <svg width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.2'>
              <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
            </svg>
            <p style={{ fontSize: 10, letterSpacing: '0.2em', textAlign: 'center', lineHeight: 2 }}>
              SEGURE O ORBE PARA FALAR<br />OU ENVIE TEXTO / IMAGEM
            </p>
          </div>
        )}

        {messages.map(msg => {
          const u = msg.role === 'user'
          const ac = msg.agent ? AGENT_COLOR[msg.agent as AgentId] : accentColor

          if (bs === 'terminal') {
            return (
              <div key={msg.id} style={{ fontFamily: 'inherit', lineHeight: 1.6 }}>
                <span style={{ color: u ? accentColor : ac, fontSize: 10, opacity: 0.6, marginRight: 6 }}>
                  {u ? '>' : '$'}
                </span>
                {settings.showAgentBadge && !u && msg.agent && (
                  <span style={{ fontSize: 9, color: ac, marginRight: 6, opacity: 0.7 }}>
                    [{AGENT_LABEL[msg.agent as AgentId]}]
                  </span>
                )}
                <span style={{ color: u ? 'rgba(226,226,240,0.9)' : 'rgba(226,226,240,0.75)', fontSize: fs }}>
                  {msg.image ? '📷 ' : ''}
                  <MdText text={msg.text} color={ac} />
                </span>
                {settings.showTimestamp && (
                  <span style={{ fontSize: 8, color: 'rgba(226,226,240,0.2)', marginLeft: 8 }}>
                    {msg.ts.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            )
          }

          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: 4,
              alignItems: u ? 'flex-end' : 'flex-start' }}>

              {settings.showAgentBadge && !u && msg.agent && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: ac }} />
                  <span style={{ fontSize: 8, letterSpacing: '0.2em', color: ac }}>
                    {AGENT_LABEL[msg.agent as AgentId]}
                  </span>
                </div>
              )}

              {msg.image && (
                <div style={{ maxWidth: '80%', borderRadius: 10, overflow: 'hidden',
                  border: '1px solid ' + (u ? accentColor + '35' : 'rgba(255,255,255,0.08)') }}>
                  <img src={msg.image} alt='imagem'
                    style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} />
                </div>
              )}

              {msg.text && (
                <div style={{ ...bubbleStyle(u, ac), whiteSpace: 'pre-wrap' }}>
                  <MdText text={msg.text} color={u ? accentColor : ac} />
                </div>
              )}

              {settings.showTimestamp && (
                <span style={{ fontSize: 9, color: 'rgba(226,226,240,0.2)' }}>
                  {msg.ts.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          )
        })}

        {processing && (
          <div style={{ display: 'flex', alignItems: bs === 'terminal' ? 'center' : 'flex-start', gap: 6 }}>
            {bs === 'terminal' && (
              <span style={{ color: accentColor, fontSize: 10, opacity: 0.6 }}>$</span>
            )}
            <div style={bs === 'terminal' ? {} : {
              padding: '8px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <span style={{ display: 'flex', gap: 5 }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: accentColor,
                    animation: 'dot-bounce 1.2s ' + (i * 0.2) + 's ease-in-out infinite', display: 'inline-block' }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
        {pendingImg && (
          <div style={{ marginBottom: 8, position: 'relative', display: 'inline-flex' }}>
            <img src={pendingImg} alt='preview'
              style={{ height: 60, width: 'auto', borderRadius: 8, objectFit: 'cover',
                border: '1px solid ' + accentColor + '50' }} />
            <button onClick={() => { setPendingImg(null); setImgError('') }}
              style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%',
                background: '#f87171', border: 'none', color: '#000', fontSize: 11, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        )}
        {imgError && <p style={{ fontSize: 9, color: '#f87171', marginBottom: 6 }}>{imgError}</p>}

        <form onSubmit={submit}>
          <div style={{
            display: 'flex', gap: 8, alignItems: 'flex-end',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid ' + (canSend ? accentColor + '50' : 'rgba(255,255,255,0.07)'),
            borderRadius: 10, padding: '8px 10px', transition: 'border-color .3s',
            boxShadow: canSend ? '0 0 12px ' + accentColor + '10' : 'none',
          }}>
            <button type='button' onClick={() => fileRef.current?.click()} disabled={processing}
              style={{ background: 'none', border: 'none', cursor: processing ? 'not-allowed' : 'pointer',
                color: pendingImg ? accentColor : 'rgba(226,226,240,0.25)', opacity: processing ? 0.3 : 1,
                paddingBottom: 1, flexShrink: 0 }}>
              <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.6' strokeLinecap='round' strokeLinejoin='round'>
                <rect x='3' y='3' width='18' height='18' rx='3' />
                <circle cx='8.5' cy='8.5' r='1.5' fill='currentColor' stroke='none' />
                <path d='M21 15l-5-5L5 21' />
              </svg>
            </button>
            <textarea ref={taRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={onKey} onPaste={onPaste}
              placeholder={pendingImg ? 'Descrição (opcional)...' : 'Mensagem ou cole imagem...'}
              disabled={processing} rows={1}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', resize: 'none',
                color: 'rgba(226,226,240,0.9)', fontSize: 12, fontFamily: 'inherit',
                minHeight: 20, maxHeight: 110, lineHeight: 1.5 }} />
            <button type='submit' disabled={!canSend}
              style={{ background: 'none', border: 'none', cursor: canSend ? 'pointer' : 'default',
                color: accentColor, opacity: canSend ? 1 : 0.2,
                transform: canSend ? 'scale(1)' : 'scale(0.85)', transition: 'all .2s',
                paddingBottom: 1, flexShrink: 0 }}>
              <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M2.01 21L23 12 2.01 3 2 10l15 2-15 2z' />
              </svg>
            </button>
          </div>
          <p style={{ fontSize: 8, marginTop: 5, letterSpacing: '0.1em', textAlign: 'center', color: 'rgba(226,226,240,0.1)' }}>
            ENTER · SHIFT+ENTER NOVA LINHA · ARRASTAR OU CTRL+V IMAGEM
          </p>
        </form>
        <input ref={fileRef} type='file' accept='image/*' style={{ display: 'none' }} onChange={onFileInput} />
      </div>
    </div>
  )
}
