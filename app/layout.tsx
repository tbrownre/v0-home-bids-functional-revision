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
      <head>
        {/* Google Tag Manager */}
        <Script id="gtm" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-WFMP494H');
          `}
        </Script>
        {/* End Google Tag Manager */}
        {/* Whop Pixel */}
        <Script id="whop-pixel" strategy="afterInteractive">
          {`!function(w,d,s,u,n,a,b){if(w[n])return;a=w[n]={q:[],t:+new Date,s:[],o:u,track:function(){a.q.push([+new Date].concat([].slice.call(arguments)))},setScope:function(){a.s=[].slice.call(arguments).filter(function(x){return typeof x==="string"});a.q.push([+new Date,"setScope"].concat(a.s))},scope:function(){var c=[].slice.call(arguments);return{track:function(){a.q.push([+new Date].concat([].slice.call(arguments)).concat([{__scope:c}]))}}}};b=d.createElement(s);b.async=1;b.src=u+"/s.js";d.getElementsByTagName(s)[0].parentNode.insertBefore(b,d.getElementsByTagName(s)[0])}(window,document,"script","https://t.whop.tw","whop");whop.setScope("biz_dyDlM1fBzBICuR");whop.track("page");`}
        </Script>
        {/* End Whop Pixel */}
      </head>
      <body className={`${redHatDisplay.className} antialiased overflow-x-hidden`} suppressHydrationWarning>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WFMP494H"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
            title="Google Tag Manager"
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
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
