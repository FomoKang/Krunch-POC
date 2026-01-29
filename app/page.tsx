"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, Bell, Home, Users, User, Trophy, Store } from "lucide-react"
import { useSiteTheme } from "@/components/theme-provider"

// Splash Screen (테마 악센트)
function SplashScreen({ accentBg }: { accentBg: string }) {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <Image src="/logo-pink.png" alt="Krunch Logo" width={200} height={67} className="h-auto animate-pulse" />
        <div className="w-32 h-1 bg-white/20 rounded-full overflow-hidden">
          <div className={`h-full ${accentBg} animate-[loading_3s_ease-in-out_forwards]`} />
        </div>
      </div>
    </div>
  )
}

// Legend Drop 타이머 (테마 악센트)
function CountdownTimer({ accentText }: { accentText: string }) {
  const [time, setTime] = useState({ hours: 23, minutes: 58, seconds: 17 })

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => {
        let { hours, minutes, seconds } = prev
        seconds--
        if (seconds < 0) {
          seconds = 59
          minutes--
        }
        if (minutes < 0) {
          minutes = 59
          hours--
        }
        if (hours < 0) {
          hours = 23
          minutes = 59
          seconds = 59
        }
        return { hours, minutes, seconds }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (n: number) => n.toString().padStart(2, "0")

  return (
    <div className={`font-mono text-3xl md:text-4xl font-bold ${accentText} tracking-wider`}>
      {formatTime(time.hours)}:{formatTime(time.minutes)}:{formatTime(time.seconds)}
    </div>
  )
}

// Unique Drop 상품 데이터
const uniqueDrops = [
  {
    id: 1,
    name: "Burberry Trench Jacket",
    subtitle: "worn by SON HEUNG MIN",
    image: "/son-burberry.png",
    status: "date",
    date: "Jan 28, 2026",
  },
  {
    id: 2,
    name: "Squid Game 2 Guard Mask",
    subtitle: "worn by PARK GYU YOUNG",
    image: "/squid-mask.png",
    status: "Coming Soon",
    date: null,
  },
  {
    id: 3,
    name: "The Recruiter Suit",
    subtitle: "worn by GONG YOO",
    image: "/gongyoo-suit.png",
    status: "Live Now",
    date: null,
  },
  {
    id: 4,
    name: "Human Made Heart Tee",
    subtitle: "worn by FELIX",
    image: "/felix-human.png",
    status: "Sold Out",
    date: null,
  },
]

export default function HomePage() {
  const theme = useSiteTheme()
  const basePath = theme === "black" ? "/black" : ""
  const accentText = theme === "black" ? "text-white" : "text-primary"
  const accentBg = theme === "black" ? "bg-white" : "bg-primary"

  const [showSplash, setShowSplash] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // 스플래시 화면을 3초 후에 사라지게 함
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  if (!mounted || showSplash) {
    return <SplashScreen accentBg={accentBg} />
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* 상단 네비게이션 */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href={basePath || "/"}>
            <Image src="/logo-pink.png" alt="Krunch" width={150} height={48} className="h-12 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href={`${basePath}/search`} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Search className="w-5 h-5 text-white/80" />
            </Link>
            <Link href={`${basePath}/notifications`} className="p-2 hover:bg-white/10 rounded-full transition-colors relative">
              <Bell className="w-5 h-5 text-white/80" />
              <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${theme === "black" ? "bg-white" : "bg-[#FF6B9D]"}`} />
            </Link>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-8">
        {/* LEGEND DROP 섹션 */}
        <section>
          <h2 className={`font-display text-3xl tracking-wide uppercase italic mb-4 ${theme === "black" ? "black-mode-legend-title" : "text-white"}`}>LEGEND DROP</h2>
          <Link href={`${basePath}/auction`} className="block">
            <div className={`relative rounded-2xl overflow-hidden border ${theme === "black" ? "black-home-hero-card bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f]" : "bg-gradient-to-br from-[#2a1a1a] to-[#1a0a0a] border-white/10"}`}>
              {/* 배경 이미지 오버레이 — 블랙 모드: 레이어 분리 */}
              <div className={`absolute inset-0 ${theme === "black" ? "bg-gradient-to-br from-[#2a1a1a] via-[#0f0f0f] to-[#0a0a0a]" : "bg-gradient-to-br from-[#3d1a2a] via-[#1a0a0a] to-[#0d0505]"}`} />

              <div className="relative p-5">
                {/* Live Now 뱃지 — 블랙 모드: 흰 글자 + 핑크 테두리 / 핑크 모드: 핑크 배경 + 살짝 glow */}
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
                      theme === "black"
                        ? "bg-transparent text-white border border-[rgba(255,105,180,0.5)]"
                        : "bg-[#FF6B9D] text-black live-now-badge"
                    }`}
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                    </span>
                    LIVE NOW
                  </span>
                </div>

                {/* 상품 이미지 */}
                <div className="flex flex-col items-center">
                  <div className={`relative w-full aspect-[4/3] max-h-64 rounded-xl overflow-hidden mb-5 ${theme === "black" ? "bg-[radial-gradient(circle,#2a1a1a_0%,#0a0a0a_100%)]" : "bg-black/50"}`}>
                    <video
                      src="/cap-spin.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="w-full text-center">
                    <h3 className="font-bold text-white text-lg md:text-xl">PEACEMINUSONE</h3>
                    <p className={`text-sm md:text-base mt-1 ${theme === "black" ? "text-[#b0b0b0]" : "text-white/60"}`}>Übermensch 2025 World Tour Special Merch</p>
                    <p className={`text-xs mt-0.5 ${theme === "black" ? "text-[#808080]" : "text-white/40"}`}>Übermensch Cap (Burgundy) customized</p>

                    <div className={`mt-5 ${theme === "black" ? "font-mono text-3xl md:text-4xl font-bold text-white tracking-wider" : ""}`} style={theme === "black" ? { textShadow: "0 0 20px rgba(255,255,255,0.3)", letterSpacing: "2px" } : undefined}>
                      <CountdownTimer accentText={accentText} />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className={`text-sm uppercase tracking-wide ${theme === "black" ? "text-[#808080]" : "text-white/60"}`} style={theme === "black" ? { letterSpacing: "1px" } : undefined}>Current Bid</span>
                  <span className={`font-bold ${theme === "black" ? "text-white text-2xl md:text-3xl" : `${accentText} text-xl md:text-2xl`}`} style={theme === "black" ? { textShadow: "0 2px 8px rgba(255,255,255,0.2)" } : undefined}>₩6,733,184</span>
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* UNIQUE DROPS 섹션 */}
        <section>
          <h2 className={`font-display text-3xl tracking-wide uppercase italic mb-4 ${theme === "black" ? "black-mode-legend-title" : "text-white"}`}>UNIQUE DROPS</h2>
          <div className="grid grid-cols-2 gap-3">
            {uniqueDrops.map((item) => {
              const isFelix = item.id === 4
              const statusClass = theme === "black"
                ? "text-white text-xs mt-2 font-medium"
                : `${accentText} text-xs mt-2 font-medium`

              return (
                <div
                  key={item.id}
                  className={`rounded-xl overflow-hidden ${theme === "black" ? "black-home-unique-card" : "bg-[#1a1a1a] border border-[#FF6B9D]/30 hover:border-[#FF6B9D]/50"} transition-colors`}
                >
                  <div className="relative aspect-[4/3] bg-transparent">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      fill
                      className={
                        isFelix
                          ? "object-cover"
                          : "object-contain scale-[0.92] translate-x-2 translate-y-2"
                      }
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-white text-sm font-medium line-clamp-1">{item.name}</h3>
                    <p className={`text-xs mt-0.5 italic ${theme === "black" ? "text-[#b0b0b0]" : "text-white/40"}`}>{item.subtitle}</p>
                    <p
                      className={statusClass}
                      style={theme === "black" ? { WebkitTextStroke: "1px rgba(255,105,180,0.4)" } : undefined}
                    >
                      {item.status === "Coming Soon"
                        ? "Coming Soon"
                        : item.status === "Live Now"
                          ? "Live Now"
                          : item.status === "Sold Out"
                            ? "Sold Out"
                            : item.date}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>

      {/* 하단 탭바 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t border-white/10 z-50">
        <div className="flex items-center justify-around py-3">
          <Link href={basePath || "/"} className={`flex flex-col items-center gap-1 ${theme === "black" ? "text-white" : "text-[#FF6B9D]"}`}>
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </Link>
          <Link
            href={`${basePath}/ranking`}
            className="flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors"
          >
            <Trophy className="w-6 h-6" />
            <span className="text-xs font-medium">Ranking</span>
          </Link>
          <Link
            href={`${basePath}/community`}
            className="flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors"
          >
            <Users className="w-6 h-6" />
            <span className="text-xs font-medium">Community</span>
          </Link>
          <Link
            href={`${basePath}/market`}
            className="flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors"
          >
            <Store className="w-6 h-6" />
            <span className="text-xs font-medium">2nd Market</span>
          </Link>
          <Link
            href={`${basePath}/profile`}
            className="flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors"
          >
            <User className="w-6 h-6" />
            <span className="text-xs font-medium">My Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
