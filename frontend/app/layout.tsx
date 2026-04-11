import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'J.A.R.V.I.S — Marketing Intelligence',
  description: 'Just A Rather Very Intelligent System para marketing digital',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
