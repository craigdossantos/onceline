import type { Metadata } from 'next'
import { DM_Sans, Fraunces } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import './globals.css'

const dmSans = DM_Sans({ 
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600'],
})

const fraunces = Fraunces({ 
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'Onceline — Your Life, Beautifully Told',
  description: 'Transform your memories into a stunning visual narrative. Onceline helps you capture and celebrate the moments that define your story.',
  keywords: ['timeline', 'life story', 'memories', 'memoir', 'personal history', 'narrative'],
  openGraph: {
    title: 'Onceline — Your Life, Beautifully Told',
    description: 'Transform your memories into a stunning visual narrative.',
    type: 'website',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fraunces.variable}`}>
      <body className="min-h-screen antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
