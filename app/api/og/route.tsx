import { ImageResponse } from '@vercel/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  // Load Anton font from public folder using fetch
  const fontUrl = new URL('/Anton-Regular.ttf', request.url)
  const antonFont = await fetch(fontUrl).then((res) => res.arrayBuffer())

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000',
        }}
      >
        {/* KRUNCH Logo - Anton Font */}
        <div
          style={{
            display: 'flex',
            fontFamily: 'Anton',
            fontSize: 170,
            fontWeight: 400,
            background: 'linear-gradient(90deg, #FF1493 0%, #FF6B9D 30%, #FF1493 60%, #C9184A 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            letterSpacing: '0.05em',
            marginBottom: 60,
            textTransform: 'uppercase',
          }}
        >
          KRUNCH
        </div>

        {/* Main Text - Korean */}
        <div
          style={{
            display: 'flex',
            fontSize: 50,
            color: '#ffffff',
            marginBottom: 32,
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}
        >
          단 하나뿐인 스타의 의상을 소유하다
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: 'flex',
            fontSize: 30,
            color: '#FF6B9D',
            fontWeight: 700,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
          }}
        >
          PREMIUM  K-POP  AUCTION
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Anton',
          data: antonFont,
          style: 'normal',
          weight: 400,
        },
      ],
    }
  )
}
