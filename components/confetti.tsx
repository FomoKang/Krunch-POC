"use client"

import { useEffect, useState } from "react"

interface ConfettiPiece {
  id: number
  x: number
  color: string
  delay: number
  duration: number
  rotation: number
}

export function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])

  useEffect(() => {
    if (active) {
      const colors = ["#FF6B8A", "#FF0060", "#ffffff", "#FFD700", "#00FF88", "#00D4FF"]
      const newPieces: ConfettiPiece[] = []

      for (let i = 0; i < 50; i++) {
        newPieces.push({
          id: i,
          x: Math.random() * 100,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 0.3,
          duration: 2 + Math.random() * 2,
          rotation: Math.random() * 720,
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
        const borderRadius = Math.random() > 0.5 ? "50%" : "0%"
        return (
          <div
            key={piece.id}
            className="absolute w-3 h-3"
            style={{
              left: `${piece.x}%`,
              top: '-10px',
              backgroundColor: piece.color,
              borderRadius,
              animation: `confetti-fall ${piece.duration}s linear ${piece.delay}s forwards`,
              '--rotation': `${piece.rotation}deg`,
            } as React.CSSProperties}
          />
        )
      })}
    </div>
  )
}
