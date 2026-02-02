import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Onceline - Every Life is a Story Worth Telling',
  description: 'Build a beautiful visual timeline of your life through conversation. Document memories, milestones, and the moments that made you who you are.',
  keywords: ['timeline', 'life story', 'memories', 'biography', 'personal history', 'memoir'],
  openGraph: {
    title: 'Onceline - Every Life is a Story Worth Telling',
    description: 'Build a beautiful visual timeline of your life through conversation.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
