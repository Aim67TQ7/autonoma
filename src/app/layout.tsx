import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Autonoma - Autonomous Project Intelligence',
  description: 'AI-powered project management that replaces the traditional PM role',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0f]">{children}</body>
    </html>
  )
}
