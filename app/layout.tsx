import type { Metadata } from 'next'
import { Barlow_Condensed, Inter } from 'next/font/google'
import './globals.css'

/**
 * Free stand-ins for the Jack & Jones brand face (Italian Plate No2, which is
 * commercially licensed and not ours to ship). Barlow Condensed carries the
 * same tight, expanded, uppercase feel for headings; Inter handles body text
 * and figures, where legibility matters more than character.
 */
const display = Barlow_Condensed({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['600', '700', '800'],
})

const sans = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Your Money Plan',
  description:
    'A private retirement and money planner — plain English, no jargon.',
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en-GB"
      className={`${display.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  )
}
