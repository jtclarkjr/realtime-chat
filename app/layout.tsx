import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { AnalyticsProvider } from '@/components/providers/analytics-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

const appName = process.env.APP_NAME || 'Realtime Chat'

export const metadata: Metadata = {
  title: {
    default: appName,
    template: `%s | ${appName}`
  },
  description:
    'A modern, real-time chat application. Features instant messaging, message persistence, and reconnection handling.',
  keywords: ['chat', 'realtime', 'nextjs', 'supabase', 'redis', 'websocket'],
  authors: [{ name: 'James' }],
  openGraph: {
    title: appName,
    description:
      'A modern, real-time chat application with instant messaging and message persistence.',
    type: 'website'
  }
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </QueryProvider>
        <AnalyticsProvider />
      </body>
    </html>
  )
}
