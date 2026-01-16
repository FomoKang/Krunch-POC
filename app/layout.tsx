import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display, Anton } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _inter = Inter({ subsets: ["latin"] })

const _playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["700"],
})

const _anton = Anton({
  subsets: ["latin"],
  weight: ["400"],
})

export const metadata: Metadata = {
  title: "KRUNCH | Live Auction",
  description: "Exclusive streetwear auctions - cop the heat before it's gone",
    generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: "#080808",
  width: "device-width",
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
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
