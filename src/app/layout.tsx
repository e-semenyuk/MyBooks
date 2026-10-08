import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AppProviders from '@/components/providers/AppProviders'
import AppShell from '@/components/AppShell'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Digital Bookstore',
  description: 'A modern digital bookstore built with Next.js and Supabase',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  )
}

