import { ImageResponse } from '@vercel/og'

export const runtime = 'edge'

export async function GET() {
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
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255, 107, 157, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255, 107, 157, 0.1) 0%, transparent 50%)',
        }}
      >
        {/* KRUNCH Logo Text */}
        <div
          style={{
            display: 'flex',
            fontSize: 120,
            fontWeight: 900,
            background: 'linear-gradient(to bottom right, #FF6B9D 0%, #C9184A 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            letterSpacing: '-0.05em',
            marginBottom: 40,
          }}
        >
          KRUNCH
        </div>

        {/* Main Text */}
        <div
          style={{
            display: 'flex',
            fontSize: 42,
            color: '#fff',
            marginBottom: 20,
            fontWeight: 600,
            letterSpacing: '-0.02em',
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
            letterSpacing: '0.1em',
          }}
        >
          PREMIUM K-POP AUCTION
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
