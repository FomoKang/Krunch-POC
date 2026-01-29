import type { Metadata } from "next"

const base = "https://krunch-mockup.vercel.app"
// 쿼리 붙여서 메신저 캐시 무효화 (카카오톡 등이 예전 핑크 이미지 캐시해 둔 상태 방지)
const ogImageUrl = `${base}/black/opengraph-image?mode=black`

export const metadata: Metadata = {
  openGraph: {
    title: "KRUNCH - PREMIUM K-POP AUCTION",
    description: "단 하나뿐인 스타의 의상을 소유하다",
    url: `${base}/black`,
    images: [
      {
        url: ogImageUrl,
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
    images: [ogImageUrl],
  },
}

export default function BlackLayout({
  children,
}: { children: React.ReactNode }) {
  return <>{children}</>
}
