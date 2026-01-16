"use client"

import { useState, useEffect } from "react"

interface CountdownTimerProps {
  initialSeconds: number
  onComplete?: () => void
}

export function CountdownTimer({ initialSeconds, onComplete }: CountdownTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds)

  useEffect(() => {
    if (seconds <= 0) {
      onComplete?.()
      return
    }

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          onComplete?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [seconds, onComplete])

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const formatNumber = (num: number) => num.toString().padStart(2, "0")

  return (
    <div className="flex items-center justify-center gap-1">
      <div className="flex items-center">
        <span className="text-4xl font-mono font-black text-primary neon-glow tracking-wider">
          {formatNumber(hours)}
        </span>
        <span className="text-4xl font-mono font-black text-primary neon-glow mx-1">:</span>
        <span className="text-4xl font-mono font-black text-primary neon-glow tracking-wider">
          {formatNumber(minutes)}
        </span>
        <span className="text-4xl font-mono font-black text-primary neon-glow mx-1">:</span>
        <span className="text-4xl font-mono font-black text-primary neon-glow tracking-wider">
          {formatNumber(secs)}
        </span>
      </div>
    </div>
  )
}
