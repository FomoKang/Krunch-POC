import type { Metadata } from "next"

const base = "https://krunch-mockup.vercel.app"

export const metadata: Metadata = {
  openGraph: {
    title: "KRUNCH - PREMIUM K-POP AUCTION",
    description: "단 하나뿐인 스타의 의상을 소유하다",
    url: `${base}/black`,
    images: [
      {
        url: `${base}/black/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "KRUNCH - PREMIUM K-POP AUCTION (Dark)",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KRUNCH - PREMIUM K-POP AUCTION",
    description: "단 하나뿐인 스타의 의상을 소유하다",
    images: [`${base}/black/opengraph-image`],
  },
}

export default function BlackLayout({
  children,
}: { children: React.ReactNode }) {
  return <>{children}</>
}
