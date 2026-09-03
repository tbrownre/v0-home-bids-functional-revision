import React from "react"
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Red_Hat_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ScrollRestoration } from '@/components/scroll-restoration'
import { FooterWrapper } from '@/components/footer-wrapper'
import { ScrollToTop } from '@/components/scroll-to-top'
import { SignInModalProvider } from '@/components/sign-in-modal-provider'
import './globals.css'

const redHatDisplay = Red_Hat_Display({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800", "900"] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f9f9f9',
}

export const metadata: Metadata = {
  title: 'HomeBids - Better bids. Better homes.',
  description: 'HomeBids connects homeowners with trusted local pros through competitive job bidding. Contractors only pay when they win work.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://homebids.ai'),
  openGraph: {
    title: 'HomeBids - Better bids. Better homes.',
    description: 'HomeBids connects homeowners with trusted local pros through competitive job bidding. Contractors only pay when they win work.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://homebids.ai',
    siteName: 'HomeBids',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://homebids.ai'}/opengraph-image?v=5`,
        width: 1200,
        height: 630,
        alt: 'HomeBids - Better bids. Better homes.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HomeBids - Better bids. Better homes.',
    description: 'HomeBids connects homeowners with trusted local pros through competitive job bidding. Contractors only pay when they win work.',
    images: [`${process.env.NEXT_PUBLIC_SITE_URL || 'https://homebids.ai'}/twitter-image?v=5`],
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
    <html lang="en" className="bg-background overflow-x-hidden" suppressHydrationWarning>
      <body className={`${redHatDisplay.className} antialiased overflow-x-hidden`} suppressHydrationWarning>
        {/* Meta Pixel Code */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1392753292786487');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1392753292786487&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {/* End Meta Pixel Code */}
        <ScrollRestoration />
        <SignInModalProvider>
          {children}
        </SignInModalProvider>
        <FooterWrapper />
        <ScrollToTop />
        <Analytics />
      </body>
    </html>
  )
}
