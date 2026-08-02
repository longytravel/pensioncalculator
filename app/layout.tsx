import type { Metadata } from 'next'
import { Archivo, Bebas_Neue, Inter } from 'next/font/google'
import './globals.css'

/**
 * Free stand-ins for the faces the storefront actually loads, none of which we
 * can license: Italian Plate No2 Expanded for display, bebas-neue-pro for
 * labels, Tondo for soft text.
 *
 * Archivo is the closest free match to Italian Plate's expanded grotesk, Bebas
 * Neue is literally the free version of bebas-neue-pro, and Inter handles body
 * text and figures where legibility beats character.
 */
const display = Archivo({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
})

const label = Bebas_Neue({
  variable: '--font-label',
  subsets: ['latin'],
  weight: '400',
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
      className={`${display.variable} ${label.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  )
}
