import { ImageResponse } from "next/og"

const size = { width: 1200, height: 630 }

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 800,
            color: "#e5e5e5",
            letterSpacing: "0.02em",
            marginBottom: 24,
          }}
        >
          KRUNCH
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#a3a3a3",
            marginBottom: 12,
          }}
        >
          단 하나뿐인 스타의 의상을 소유하다
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#737373",
            letterSpacing: "0.05em",
          }}
        >
          PREMIUM K-POP AUCTION
        </div>
      </div>
    ),
    {
      ...size,
      headers: {
        "Cache-Control": "public, max-age=86400",
        "Content-Type": "image/png",
      },
    }
  )
}
