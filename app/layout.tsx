import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'AirQaulity Rwanda - Air Quality Monitoring Dashboard',
  description: 'Real-time air quality monitoring and AQI tracking for Rwanda. Monitor PM2.5, PM10, SO2, NO2, CO, and O3 levels.',
  generator: 'v0.app',
  manifest: '/manifest.json',
  icons: {
    icon: [
      {
        url: '/light_mode.svg',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
