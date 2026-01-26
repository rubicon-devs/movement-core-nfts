import type { Metadata } from 'next'
import { Inter, Orbitron } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import { Analytics } from '@vercel/analytics/react'

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
  
  // Open Graph (Facebook, Discord, Slack, Telegram, etc.)
  openGraph: {
    title: 'Movement Core NFTs',
    description: 'Community-driven selection of the top NFT collections on Movement blockchain',
    url: 'https://movementnfts.com',
    siteName: 'Movement Core NFTs',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Movement Core NFTs',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Movement Core NFTs',
    description: 'Community-driven selection of the top NFT collections on Movement blockchain',
    images: ['/og-image.png'],
  },
  
  metadataBase: new URL('https://movementnfts.com'),
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
        <Analytics />
      </body>
    </html>
  )
} 