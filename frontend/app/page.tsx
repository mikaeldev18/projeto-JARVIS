'use client'
import { useState, useEffect } from 'react'
import { Orb } from '@/components/Orb'
import { Chat } from '@/components/Chat'
import { useJarvis } from '@/lib/useJarvis'
import { AGENT_COLOR, AGENT_LABEL, AgentId } from '@/lib/types'

const ALL_AGENTS: AgentId[] = ['jarvis','design','landing_page','meta_copy','email_copy','google_mentor','meta_mentor']

function SpeakingDisplay({ text, color, visible }: { text: string; color: string; visible: boolean }) {
  const [shown, setShown] = useState('')
  const [idx, setIdx] = useState(0)
  useEffect(() => { if (!visible||!text) { setShown(''); setIdx(0); return }; setShown(''); setIdx(0) }, [text, visible])
  useEffect(() => {
    if (!visible || idx >= text.length) return
    const t = setTimeout(() => { setShown(text.slice(0,idx+1)); setIdx(i=>i+1) }, text.length>200?12:text.length>100?18:25)
    return () => clearTimeout(t)
  }, [idx, text, visible])
  if (!visible) return null
  return (
    <div className='speaking-display' style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', width:'min(500px,90vw)',
      zIndex:20, display:'flex', flexDirection:'column', alignItems:'center', padding:'0 16px' }}>
      <div style={{ width:'100%', borderRadius:14, padding:'12px 16px', textAlign:'center', fontSize:12, lineHeight:1.6,
        background:'rgba(0,0,0,0.8)', border:'1px solid '+color+'40', backdropFilter:'blur(12px)',
        boxShadow:'0 0 24px '+color+'20', color:'rgba(226,226,240,0.95)', maxHeight:130, overflowY:'auto' }}>
        <div style={{fontSize:9,letterSpacing:'0.3em',color,marginBottom:6}}>J.A.R.V.I.S</div>
        <span>{shown}{idx<text.length&&(<span style={{display:'inline-block',width:2,height:14,background:color,marginLeft:2,verticalAlign:'middle',animation:'blink-cursor 0.7s step-end infinite'}}/>)}</span>
      </div>
      <div style={{display:'flex',gap:5,marginTop:8}}>
        {[0,1,2,3,4].map(i=>(<div key={i} style={{width:4+Math.sin(i/4*Math.PI)*3,height:4+Math.sin(i/4*Math.PI)*3,borderRadius:'50%',background:color,opacity:.6,animation:'speaking-bar 0.8s '+(i*.12)+'s ease-in-out infinite alternate'}}/>))}
      </div>
    </div>
  )
}

export default function Page() {
  const { state, startListening, stopListening, sendText } = useJarvis()
  const accent = AGENT_COLOR[state.agent]
  const [tab, setTab] = useState<'orb'|'chat'>('orb')

  const handleSend = (text: string, image?: string) => {
    sendText(text, image)
    setTab('chat')
  }

  const assistantCount = state.messages.filter(m=>m.role==='assistant').length

  return (
    <main style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', height:'100dvh', width:'100vw', overflow:'hidden' }}>

      {/* Scan line */}
      <div style={{ position:'fixed', left:0, right:0, height:1,
        background:'linear-gradient(90deg, transparent, '+accent+'30, transparent)',
        animation:'scan 6s linear infinite', pointerEvents:'none', zIndex:2 }} />

      {/* Header */}
      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px',
        borderBottom:'1px solid rgba(255,255,255,0.04)', flexShrink:0 }}>
        <div>
          <div style={{fontSize:11,letterSpacing:'0.4em',color:accent,fontWeight:600}}>J.A.R.V.I.S</div>
          <div style={{fontSize:8,letterSpacing:'0.2em',color:'rgba(226,226,240,0.2)'}}>MARKETING INTELLIGENCE</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{display:'flex',alignItems:'center',gap:5}}>
            <span style={{width:5,height:5,borderRadius:'50%',background:state.connected?'#4ade80':'#f87171',
              boxShadow:state.connected?'0 0 5px #4ade80':'none',display:'inline-block'}} />
            <span style={{fontSize:9,letterSpacing:'0.15em',color:state.connected?'#4ade80':'#f87171'}}>
              {state.connected?'ONLINE':'OFFLINE'}
            </span>
          </div>
          <span style={{fontSize:9,letterSpacing:'0.1em',color:accent}}>{AGENT_LABEL[state.agent]}</span>
        </div>
      </header>

      {/* Body */}
      <div style={{flex:1,display:'flex',overflow:'hidden',minHeight:0}}>

        {/* Sidebar — desktop */}
        <aside className='sidebar-desktop' style={{ width:196, flexShrink:0, borderRight:'1px solid rgba(255,255,255,0.04)',
          padding:'20px 16px', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
          <div style={{display:'flex',flexDirection:'column',gap:22}}>
            <div>
              <div style={{fontSize:9,letterSpacing:'0.3em',color:'rgba(226,226,240,0.2)',marginBottom:10}}>SISTEMA</div>
              {[
                { k:'STATUS', v:state.connected?'ONLINE':'OFFLINE', c:state.connected?'#4ade80':'#f87171' },
                { k:'AGENTE', v:AGENT_LABEL[state.agent], c:accent },
                { k:'MODELO', v:'HAIKU 4.5', c:'rgba(226,226,240,0.4)' },
              ].map(({k,v,c})=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',marginBottom:7}}>
                  <span style={{fontSize:9,letterSpacing:'0.2em',color:'rgba(226,226,240,0.25)'}}>{k}</span>
                  <span style={{fontSize:9,color:c}}>{v}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{fontSize:9,letterSpacing:'0.3em',color:'rgba(226,226,240,0.2)',marginBottom:10}}>AGENTES</div>
              {ALL_AGENTS.map(id => {
                const active = state.agent===id; const color = AGENT_COLOR[id]
                return (
                  <div key={id} style={{display:'flex',alignItems:'center',gap:7,marginBottom:7,opacity:active?1:.35}}>
                    <span style={{width:5,height:5,borderRadius:'50%',background:color,flexShrink:0,boxShadow:active?'0 0 6px '+color:'none'}} />
                    <span style={{fontSize:9,letterSpacing:'0.12em',color}}>{AGENT_LABEL[id]}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div style={{fontSize:9,color:'rgba(226,226,240,0.12)',lineHeight:1.8}}>J.A.R.V.I.S v1.0<br/>MARKETING INTELLIGENCE</div>
        </aside>

        {/* Orb section */}
        <section className={'orb-section '+(tab==='orb'?'tab-active':'tab-hidden')}
          style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative'}}>
          <Orb agent={state.agent} listening={state.listening} processing={state.processing} speaking={state.speaking}
            onDown={startListening} onUp={stopListening} />

          <div style={{ marginTop:20, fontSize:9, letterSpacing:'0.2em', color:'rgba(226,226,240,0.3)',
            background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:20, padding:'4px 12px' }}>
            {state.status.toUpperCase()}
          </div>

          <SpeakingDisplay text={state.speakingText} color={accent} visible={state.speaking} />

          {/* Mobile text input dentro do orbe */}
          <div className='mobile-input' style={{ position:'absolute', bottom:0, left:0, right:0,
            padding:'10px 14px', borderTop:'1px solid rgba(255,255,255,0.05)', background:'rgba(10,10,15,0.96)' }}>
            <Chat messages={[]} status={state.status} processing={state.processing} connected={state.connected}
              accentColor={accent} onSend={handleSend} />
          </div>
        </section>

        {/* Chat section */}
        <aside className={'chat-section '+(tab==='chat'?'tab-active':'tab-hidden')}
          style={{width:360,flexShrink:0,borderLeft:'1px solid rgba(255,255,255,0.04)',display:'flex',flexDirection:'column'}}>
          <Chat messages={state.messages} status={state.status} processing={state.processing}
            connected={state.connected} accentColor={accent} onSend={handleSend} />
        </aside>
      </div>

      {/* Tab bar — mobile */}
      <nav className='tab-bar' style={{borderTop:'1px solid rgba(255,255,255,0.06)',display:'flex',flexShrink:0}}>
        {(['orb','chat'] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            flex:1, padding:'13px 0', background:'none', border:'none', cursor:'pointer',
            fontSize:10, letterSpacing:'0.25em',
            color: tab===t ? accent : 'rgba(226,226,240,0.3)',
            borderTop: tab===t ? '1px solid '+accent : '1px solid transparent',
            fontFamily:'inherit', transition:'color .2s',
            position:'relative',
          }}>
            {t==='orb' ? '◈ ORBE' : '◉ CHAT'}
            {t==='chat' && tab==='orb' && assistantCount>0 && (
              <span style={{position:'absolute',top:8,right:'calc(50% - 28px)',width:15,height:15,borderRadius:'50%',
                background:accent,color:'#000',fontSize:8,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>
                {assistantCount>9?'9+':assistantCount}
              </span>
            )}
          </button>
        ))}
      </nav>
    </main>
  )
}