import type { Metadata } from 'next'
import { Inter, Source_Serif_4 } from 'next/font/google'
import './globals.css'
import AppProviders from '@/components/providers/AppProviders'
import AppShell from '@/components/AppShell'

const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const serif = Source_Serif_4({ subsets: ['latin'], variable: '--font-serif', display: 'swap' })

export const metadata: Metadata = {
  title: 'Digital Bookstore',
  description: 'A curated catalog of books, delivered.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="font-sans">
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  )
}
