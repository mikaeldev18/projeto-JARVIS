export type AgentId =
  | 'jarvis' | 'design' | 'landing_page'
  | 'meta_copy' | 'email_copy' | 'google_mentor' | 'meta_mentor'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  agent?: AgentId
  image?: string
  ts: Date
}

export const AGENT_COLOR: Record<AgentId, string> = {
  jarvis:        '#00d4ff',
  design:        '#ff6b9d',
  landing_page:  '#c084fc',
  meta_copy:     '#4ade80',
  email_copy:    '#fbbf24',
  google_mentor: '#f87171',
  meta_mentor:   '#60a5fa',
}

export const AGENT_LABEL: Record<AgentId, string> = {
  jarvis:        'J.A.R.V.I.S',
  design:        'DESIGN',
  landing_page:  'LANDING',
  meta_copy:     'META COPY',
  email_copy:    'EMAIL',
  google_mentor: 'GOOGLE',
  meta_mentor:   'META',
}