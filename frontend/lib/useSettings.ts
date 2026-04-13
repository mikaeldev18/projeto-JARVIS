'use client'
import { useCallback, useEffect, useState } from 'react'

export type LayoutMode = 'stacked' | 'side' | 'chat-only'
export type ChatBubbleStyle = 'minimal' | 'cards' | 'terminal'
export type FontSize = 'sm' | 'md' | 'lg'

export interface Settings {
  layout: LayoutMode
  bubbleStyle: ChatBubbleStyle
  fontSize: FontSize
  soundEnabled: boolean
  showAgentBadge: boolean
  showTimestamp: boolean
  orbSize: 'sm' | 'md' | 'lg'
}

const DEFAULTS: Settings = {
  layout: 'stacked',
  bubbleStyle: 'minimal',
  fontSize: 'md',
  soundEnabled: true,
  showAgentBadge: true,
  showTimestamp: true,
  orbSize: 'md',
}

const KEY = 'jarvis-settings-v1'

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) })
    } catch {}
    setLoaded(true)
  }, [])

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  return { settings, update, loaded }
}
