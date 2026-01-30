import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Inter, Anton, Syne } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
})

const syne = Syne({
  weight: ["700", "800"],
  subsets: ["latin"],
  variable: "--font-syne",
})

export const metadata: Metadata = {
  title: "KRUNCH - PREMIUM K-POP AUCTION",
  description: "단 하나뿐인 스타의 의상을 소유하다",
  generator: "v0.app",
  metadataBase: new URL('https://krunch-mockup.vercel.app'),
  openGraph: {
    title: "KRUNCH - PREMIUM K-POP AUCTION",
    description: "단 하나뿐인 스타의 의상을 소유하다",
    type: "website",
    locale: "ko_KR",
    siteName: "KRUNCH",
    url: "https://krunch-mockup.vercel.app",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "KRUNCH - PREMIUM K-POP AUCTION",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KRUNCH - PREMIUM K-POP AUCTION",
    description: "단 하나뿐인 스타의 의상을 소유하다",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`dark ${inter.variable} ${anton.variable} ${syne.variable}`}>
      <body className={`font-sans antialiased bg-black text-white`}>
        <ThemeProvider>
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
