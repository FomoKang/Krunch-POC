import { ImageResponse } from '@vercel/og'

export const runtime = 'edge'

export async function GET() {
  try {
    // Fetch Anton font
    const antonFont = await fetch(
      'https://fonts.gstatic.com/s/anton/v25/1Ptgg87LROyAm0K08i4gS7lu.woff'
    ).then((res) => res.arrayBuffer())

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
            backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255, 107, 157, 0.2) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255, 107, 157, 0.15) 0%, transparent 50%)',
          }}
        >
          {/* KRUNCH Logo Text - Anton Font */}
          <div
            style={{
              display: 'flex',
              fontFamily: '"Anton"',
              fontSize: 150,
              fontWeight: 400,
              background: 'linear-gradient(135deg, #FF6B9D 0%, #FF1493 50%, #C9184A 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '0em',
              marginBottom: 50,
              textTransform: 'uppercase',
            }}
          >
            KRUNCH
          </div>

          {/* Main Text */}
          <div
            style={{
              display: 'flex',
              fontSize: 46,
              color: '#ffffff',
              marginBottom: 28,
              fontWeight: 700,
              letterSpacing: '-0.01em',
            }}
          >
            단 하나뿐인 스타의 의상과 연결되세요
          </div>

          {/* Subtitle */}
          <div
            style={{
              display: 'flex',
              fontSize: 28,
              color: '#FF6B9D',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            PREMIUM K-POP AUCTION
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
  } catch (error) {
    // Fallback if font loading fails
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000',
            color: '#fff',
            fontSize: 40,
          }}
        >
          Error loading fonts
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  }
}
