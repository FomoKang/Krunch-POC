import { ImageResponse } from '@vercel/og'

export const runtime = 'edge'

export async function GET() {
  // Fetch fonts
  const antonFont = fetch(
    new URL('https://fonts.gstatic.com/s/anton/v25/1Ptgg87LROyAm0K08i4gS7lu.woff2')
  ).then((res) => res.arrayBuffer())

  const syneFont = fetch(
    new URL('https://fonts.gstatic.com/s/syne/v22/8vIH7w4qzmVxm2BL9G98X8fv.woff2')
  ).then((res) => res.arrayBuffer())

  const interFont = fetch(
    new URL('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2')
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
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255, 107, 157, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255, 107, 157, 0.1) 0%, transparent 50%)',
        }}
      >
        {/* KRUNCH Logo Text */}
        <div
          style={{
            display: 'flex',
            fontFamily: 'Anton',
            fontSize: 140,
            fontWeight: 400,
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
            fontFamily: 'Syne',
            fontSize: 44,
            color: '#fff',
            marginBottom: 24,
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          단 하나뿐인 스타의 의상과 연결되세요
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: 'flex',
            fontFamily: 'Inter',
            fontSize: 26,
            color: '#FF6B9D',
            fontWeight: 600,
            letterSpacing: '0.15em',
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
          data: await antonFont,
          style: 'normal',
          weight: 400,
        },
        {
          name: 'Syne',
          data: await syneFont,
          style: 'normal',
          weight: 700,
        },
        {
          name: 'Inter',
          data: await interFont,
          style: 'normal',
          weight: 600,
        },
      ],
    }
  )
}
