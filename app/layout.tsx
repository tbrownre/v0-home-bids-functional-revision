import React from "react"
import type { Metadata } from 'next'
import { Red_Hat_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ScrollRestoration } from '@/components/scroll-restoration'
import { Footer } from '@/components/footer'
import { ScrollToTop } from '@/components/scroll-to-top'
import './globals.css'

const redHatDisplay = Red_Hat_Display({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: 'HomeBids.io - Better bids. Better homes.',
  description: 'HomeBids.io connects homeowners with trusted local pros through competitive job bidding. Contractors only pay when they win work.',
  metadataBase: new URL('https://homebids.io'),
  openGraph: {
    title: 'HomeBids.io - Better bids. Better homes.',
    description: 'HomeBids.io connects homeowners with trusted local pros through competitive job bidding. Contractors only pay when they win work.',
    url: 'https://homebids.io',
    siteName: 'HomeBids.io',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HomeBids.io - Better bids. Better homes.',
    description: 'HomeBids.io connects homeowners with trusted local pros through competitive job bidding. Contractors only pay when they win work.',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.jpg',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.jpg',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.jpg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <ScrollRestoration />
        {children}
        <Footer />
        <ScrollToTop />
        <Analytics />
      </body>
    </html>
  )
}
