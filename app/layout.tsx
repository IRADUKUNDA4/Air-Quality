import React from "react"
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { PWAInstallBanner } from '@/components/pwa-install-banner'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const geistSans = Geist({ 
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: 'AirQuality Rwanda - Air Quality Monitoring Dashboard',
  description: 'Real-time air quality monitoring and AQI tracking for Rwanda. Monitor PM2.5, PM10, SO2, NO2, CO, and O3 levels.',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AirQuality Rwanda',
  },
  icons: {
    icon: [
      {
        url: '/aq_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/dark_mode.svg',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/tablet_mac.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/tablet_mac.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#090d16',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen w-full max-w-full overflow-x-hidden font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Analytics />
          <PWAInstallBanner />
        </ThemeProvider>
      </body>
    </html>
  )
}