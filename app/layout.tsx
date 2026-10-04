import React from "react"
import type { Metadata, Viewport } from 'next'
import { Red_Hat_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ScrollRestoration } from '@/components/scroll-restoration'
import { FooterWrapper } from '@/components/footer-wrapper'
import { ScrollToTop } from '@/components/scroll-to-top'
import { SignInModalProvider } from '@/components/sign-in-modal-provider'
import './globals.css'
import { SITE_URL, SITE_NAME, TAGLINE, DEFAULT_DESCRIPTION, OG_IMAGE } from '@/lib/seo'

const redHatDisplay = Red_Hat_Display({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800", "900"] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // IOSZOOM (Tim, Sep 28): stops Safari's automatic zoom-in when a text field is
  // tapped (the page would stay zoomed until the phone was rotated). iOS still
  // allows pinch-zoom with this set, so accessibility is unaffected.
  maximumScale: 1,
  themeColor: '#f9f9f9',
}

export const metadata: Metadata = {
  title: `${SITE_NAME} — ${TAGLINE}`,
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  metadataBase: new URL(SITE_URL),
  keywords: [
    'contractor bid software',
    'AI estimate generator for contractors',
    'bid builder by text',
    'home improvement bids',
    'get contractor bids free',
    'contractor landing page',
    'HomeBids',
  ],
  authors: [{ name: 'HomeBids LLC', url: SITE_URL }],
  creator: 'HomeBids LLC',
  publisher: 'HomeBids LLC',
  category: 'business',
  formatDetection: { telephone: false },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  openGraph: {
    title: `${SITE_NAME} — ${TAGLINE}`,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'en_US',
    type: 'website',
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — ${TAGLINE}`,
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE.url.replace('/opengraph-image', '/twitter-image')],
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

// Organization + WebSite structured data: tells Google the official name, logo and tagline.
const ORG_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      legalName: 'HomeBids LLC',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/brand/homebids-logo.png`, width: 1363, height: 193 },
      slogan: TAGLINE,
      description: DEFAULT_DESCRIPTION,
      areaServed: 'US',
      address: { '@type': 'PostalAddress', addressLocality: 'Gilbert', addressRegion: 'AZ', addressCountry: 'US' },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'en-US',
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background overflow-x-hidden" suppressHydrationWarning>
      <body className={`${redHatDisplay.className} antialiased overflow-x-hidden`} suppressHydrationWarning>
        <ScrollRestoration />
        <SignInModalProvider>
          {children}
        </SignInModalProvider>
        <FooterWrapper />
        <ScrollToTop />
        <Analytics />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }} />
        {/* Rewardful affiliate tracking (Sep 26) — public site tag; reads ?via= links and
            hands the referral to checkout.
            Sep 30: plain <script> tags instead of next/script. With next/script the rw.js tag
            was injected client-side only (never in the server HTML), so Rewardful's install
            scanner kept showing "Action required: Add Rewardful to your website" even though
            browser tracking worked. Plain tags render verbatim in the HTML — exactly their
            generic snippet (React hoists the async one into <head>). */}
        <script
          id="rewardful-queue"
          dangerouslySetInnerHTML={{
            __html: "(function(w,r){w._rwq=r;w[r]=w[r]||function(){(w[r].q=w[r].q||[]).push(arguments)}})(window,'rewardful');",
          }}
        />
        <script async src="https://r.wdfl.co/rw.js" data-rewardful="02cbe3"></script>
      </body>
    </html>
  )
}
