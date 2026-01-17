"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, Bell, Home, Users, User } from "lucide-react"

// Splash Screen Component
function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/logo-pink.png"
          alt="Krunch Logo"
          width={200}
          height={67}
          className="h-auto animate-pulse"
        />
        <div className="w-32 h-1 bg-primary/20 rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-[loading_3s_ease-in-out_forwards]" />
        </div>
      </div>
    </div>
  )
}

// Legend Drop 타이머 컴포넌트
function CountdownTimer() {
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
    <div className="font-mono text-3xl md:text-4xl font-bold text-[#FF6B9D] tracking-wider">
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
    return <SplashScreen />
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* 상단 네비게이션 */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <Image src="/logo-pink.png" alt="Krunch" width={100} height={32} className="h-8 w-auto" />
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Search className="w-5 h-5 text-white/80" />
            </button>
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors relative">
              <Bell className="w-5 h-5 text-white/80" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF6B9D] rounded-full" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-8">
        {/* LEGEND DROP 섹션 */}
        <section>
          <h2 className="text-xl font-bold text-[#FF6B9D] mb-4 tracking-wider">LEGEND DROP</h2>
          <Link href="/auction" className="block">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#2a1a1a] to-[#1a0a0a] border border-white/10">
              {/* 배경 이미지 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#3d1a2a] via-[#1a0a0a] to-[#0d0505]" />

              <div className="relative p-5">
                {/* Live Now 뱃지 */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex items-center gap-1.5 bg-[#FF6B9D] text-black text-xs font-bold px-3 py-1 rounded-full">
                    <span className="w-2 h-2 bg-black rounded-full animate-pulse" />
                    LIVE NOW
                  </span>
                </div>

                {/* 상품 이미지 */}
                <div className="flex flex-col items-center">
                  {/* 상품 비디오 - cap-spin.mp4 */}
                  <div className="relative w-full aspect-[4/3] max-h-64 rounded-xl overflow-hidden bg-black/50 mb-5">
                    <video
                      src="/cap-spin.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* 상품 정보 */}
                  <div className="w-full text-center">
                    <h3 className="font-bold text-white text-lg md:text-xl">PEACEMINUSONE</h3>
                    <p className="text-white/60 text-sm md:text-base mt-1">Übermensch 2025 World Tour Special Merch</p>
                    <p className="text-white/40 text-xs mt-0.5">Übermensch Cap (Burgundy) customized</p>

                    {/* 타이머 */}
                    <div className="mt-5">
                      <CountdownTimer />
                    </div>
                  </div>
                </div>

                {/* 현재 입찰가 */}
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-white/60 text-sm">Current Bid</span>
                  <span className="text-[#FF6B9D] font-bold text-xl md:text-2xl">₩6,733,184</span>
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* UNIQUE DROPS 섹션 */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4 tracking-wider">UNIQUE DROPS</h2>
          <div className="grid grid-cols-2 gap-3">
            {uniqueDrops.map((item) => (
              <div
                key={item.id}
                className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#FF6B9D]/30 hover:border-[#FF6B9D]/50 transition-colors"
              >
                <div className="relative aspect-[4/3] bg-transparent">
                  <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                </div>
                <div className="p-3">
                  <h3 className="text-white text-sm font-medium line-clamp-1">{item.name}</h3>
                  <p className="text-white/40 text-xs mt-0.5 italic">{item.subtitle}</p>
                  <p className="text-[#FF6B9D] text-xs mt-2 font-medium">
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
            ))}
          </div>
        </section>
      </main>

      {/* 하단 탭바 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t border-white/10 z-50">
        <div className="flex items-center justify-around py-3">
          <Link href="/" className="flex flex-col items-center gap-1 text-[#FF6B9D]">
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </Link>
          <Link
            href="/community"
            className="flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors"
          >
            <Users className="w-6 h-6" />
            <span className="text-xs font-medium">Community</span>
          </Link>
          <Link
            href="/profile"
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
