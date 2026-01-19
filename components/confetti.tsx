"use client"

import { useEffect, useState } from "react"

interface ConfettiPiece {
  id: number
  x: number
  y: number
  color: string
  delay: number
  duration: number
  rotation: number
  size: number
  shape: "circle" | "square" | "star" | "sparkle"
  velocityX: number
  velocityY: number
}

export function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])

  useEffect(() => {
    if (active) {
      // 프리미엄 색상 팔레트 - 핑크 계열 중심
      const colors = [
        "#FF6B9D", // 메인 핑크
        "#FF0060", // 딥 핑크
        "#FFB6C1", // 라이트 핑크
        "#FF1493", // 딥 핑크
        "#FF69B4", // 핫 핑크
        "#FFFFFF", // 화이트
        "#FFD700", // 골드
        "#FFA500", // 오렌지
        "#FF6B8A", // 코랄
      ]
      const newPieces: ConfettiPiece[] = []

      // 더 많은 파티클로 풍부한 효과
      for (let i = 0; i < 120; i++) {
        const shapeTypes: ("circle" | "square" | "star" | "sparkle")[] = ["circle", "square", "star", "sparkle"]
        newPieces.push({
          id: i,
          x: Math.random() * 100,
          y: -10 - Math.random() * 20, // 시작 위치를 더 위로
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 0.5,
          duration: 3 + Math.random() * 2.5,
          rotation: Math.random() * 1080, // 더 많은 회전
          size: 4 + Math.random() * 6, // 다양한 크기
          shape: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
          velocityX: (Math.random() - 0.5) * 2, // 좌우 움직임
          velocityY: 1 + Math.random() * 1.5, // 낙하 속도
        })
      }
      setPieces(newPieces)
    } else {
      setPieces([])
    }
  }, [active])

  if (!active || pieces.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {pieces.map((piece) => {
        const isStar = piece.shape === "star"
        const isSparkle = piece.shape === "sparkle"
        
        return (
          <div
            key={piece.id}
            className="absolute"
            style={{
              left: `${piece.x}%`,
              top: `${piece.y}%`,
              width: `${piece.size}px`,
              height: `${piece.size}px`,
              animation: `confetti-fall-premium ${piece.duration}s ease-out ${piece.delay}s forwards`,
              '--rotation': `${piece.rotation}deg`,
              '--velocity-x': `${piece.velocityX}vw`,
              '--velocity-y': `${piece.velocityY}vh`,
              filter: `drop-shadow(0 0 ${piece.size / 2}px ${piece.color}80)`,
            } as React.CSSProperties}
          >
            {isStar ? (
              <svg
                width={piece.size}
                height={piece.size}
                viewBox="0 0 24 24"
                fill={piece.color}
                className="opacity-90"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ) : isSparkle ? (
              <svg
                width={piece.size}
                height={piece.size}
                viewBox="0 0 24 24"
                fill="none"
                className="opacity-90"
              >
                <path
                  d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                  stroke={piece.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <div
                className={`w-full h-full ${piece.shape === "circle" ? "rounded-full" : ""}`}
                style={{
                  backgroundColor: piece.color,
                  opacity: 0.95,
                  boxShadow: `0 0 ${piece.size}px ${piece.color}60, inset 0 0 ${piece.size / 2}px rgba(255, 255, 255, 0.3)`,
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
