import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

const size = { width: 1200, height: 630 }

export const runtime = "nodejs"

export async function GET() {
  const antonData = await readFile(
    join(process.cwd(), "public", "Anton-Regular.ttf")
  )

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
          background: "#000000",
          fontFamily: "Anton, system-ui, sans-serif",
        }}
      >
        {/* 핑크 og-image.png와 동일 폰트·크기: Anton, KRUNCH만 하얀색 */}
        <div
          style={{
            fontSize: 140,
            fontWeight: 400,
            color: "#ffffff",
            letterSpacing: "0.02em",
            marginBottom: 28,
          }}
        >
          KRUNCH
        </div>
        <div
          style={{
            fontSize: 36,
            color: "#ffffff",
            marginBottom: 14,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          단 하나뿐인 스타의 의상을 소유하다
        </div>
        <div
          style={{
            fontSize: 26,
            color: "#ffffff",
            letterSpacing: "0.08em",
            opacity: 0.95,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          PREMIUM K-POP AUCTION
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Anton",
          data: antonData,
          style: "normal",
          weight: 400,
        },
      ],
      headers: {
        "Cache-Control": "public, max-age=86400",
        "Content-Type": "image/png",
      },
    }
  )
}
