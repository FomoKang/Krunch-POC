"use client"

import { useState, useEffect } from "react"

export default function Loading() {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 500)
    return () => clearInterval(t)
  }, [])
  const message = elapsed >= 10 ? "조금만 더 기다려주세요..." : elapsed >= 3 ? "잠시만 기다려주세요..." : null

  return (
    <div className="min-h-screen bg-black text-white pb-for-nav">
      {/* 스켈레톤 헤더 */}
      <div className="sticky top-0 z-40 h-[6rem] bg-black/90 border-b border-white/10 skeleton-shimmer">
        <div className="h-full max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="h-9 w-48 rounded bg-white/10" />
          <div className="flex gap-2">
            <div className="h-9 w-9 rounded-full bg-white/10" />
            <div className="h-9 w-9 rounded-full bg-white/10" />
          </div>
        </div>
      </div>
      {/* 스켈레톤 본문 */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="h-8 w-64 rounded bg-white/10 skeleton-shimmer" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-white/5 border border-white/10 skeleton-shimmer">
              <div className="aspect-[3/4] bg-white/10" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 rounded bg-white/10" />
                <div className="h-3 w-1/2 rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {message && (
        <p className="fixed bottom-24 left-1/2 -translate-x-1/2 text-white/60 text-sm animate-in fade-in duration-300">
          {message}
        </p>
      )}
    </div>
  )
}
