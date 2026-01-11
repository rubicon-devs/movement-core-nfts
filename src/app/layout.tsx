import type { Metadata } from 'next'
import { Inter, Orbitron } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'Movement Core NFTs',
  description: 'Community-driven selection of the top NFT collections on Movement blockchain',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable}`}>
      <body className={`${inter.className} bg-movement-black text-white antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}