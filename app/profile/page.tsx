"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Home, Trophy, Users, User, Settings, QrCode, Wallet, Shield, Star, ChevronRight } from "lucide-react"

// Fixed barcode widths (generated once)
const barcodeWidths = [2,1,2,1,1,2,1,2,2,1,1,2,1,1,2,2,1,2,1,1,2,1,2,1,1,2,2,1,1,2]

export default function ProfilePage() {
  const [displayPoints, setDisplayPoints] = useState(530000)
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  // K-Point ticker animation - runs only once on mount, super fast
  useEffect(() => {
    if (hasAnimated) return
    
    const targetPoints = 530000
    const duration = 500 // 0.5초만에 완료
    const steps = 20
    const increment = targetPoints / steps
    let current = 0
    
    setDisplayPoints(0)
    
    const timer = setInterval(() => {
      current += increment
      if (current >= targetPoints) {
        setDisplayPoints(targetPoints)
        clearInterval(timer)
        setHasAnimated(true)
      } else {
        setDisplayPoints(Math.floor(current))
      }
    }, duration / steps)
    
    return () => clearInterval(timer)
  }, [hasAnimated])

  // Won items data
  const wonItems = [
    {
      id: 1,
      name: "PEACEMINUSONE Cap",
      artist: "G-DRAGON",
      image: "/images/gd-avatar.png",
      date: "2025.12.15",
      price: "₩6,733,184",
    },
    {
      id: 2,
      name: "Burberry Trench",
      artist: "SON HEUNG MIN",
      image: "/images/son-avatar.png",
      date: "2025.11.28",
      price: "₩4,250,000",
    },
    {
      id: 3,
      name: "Louis Vuitton Jacket",
      artist: "GONG YOO",
      image: "/images/gong-avatar.png",
      date: "2025.10.05",
      price: "₩8,900,000",
    },
    {
      id: 4,
      name: "Human Made Tee",
      artist: "FELIX",
      image: "/images/felix-avatar.png",
      date: "2025.09.20",
      price: "₩1,850,000",
    },
  ]

  const userStats = [
    { label: "Total Bids", value: "127" },
    { label: "Won Items", value: "4" },
    { label: "Win Rate", value: "18%" },
  ]

  return (
    <>
      <div className="min-h-screen bg-black text-white pb-24">
        {/* Ambient lighting effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/3 right-0 w-80 h-80 bg-pink-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        {/* Header */}
        <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              MY VAULT
            </h1>
            <button type="button" className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <Settings className="w-5 h-5 text-white/70" />
            </button>
          </div>
        </header>

        <main className="relative z-10 px-4 py-6 space-y-6">
          {/* Holographic ID Card */}
          <div className="relative">
            <div 
              className="relative rounded-2xl p-6 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(236,72,153,0.3) 50%, rgba(59,130,246,0.3) 100%)",
                boxShadow: "0 0 40px rgba(139,92,246,0.3), inset 0 0 60px rgba(255,255,255,0.05)",
              }}
            >
              {/* Holographic overlay effect */}
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  background: "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
                }}
              />
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  background: "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
                  animation: "shimmer 3s infinite",
                }}
              />

              {/* Card content */}
              <div className="relative z-10">
                {/* Top row */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-xs text-white/50 mb-1">MEMBER ID</p>
                    <p className="text-lg font-mono tracking-wider">KR-2024-00847</p>
                  </div>
                  <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
                    <QrCode className="w-8 h-8 text-white/80" />
                  </div>
                </div>

                {/* User info */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-0.5">
                      <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                        <User className="w-8 h-8 text-white/80" />
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1">
                      <Star className="w-3 h-3 text-black" fill="black" />
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-lg">HYPEBEAST_KR</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 font-semibold">
                        LEVEL 3
                      </span>
                      <span className="text-xs text-pink-400 font-medium">HYPE BEAST</span>
                    </div>
                  </div>
                </div>

                {/* Barcode */}
                <div className="flex items-center gap-1 mb-4 opacity-60">
                  {barcodeWidths.map((w, i) => (
                    <div 
                      key={i} 
                      className="bg-white" 
                      style={{ 
                        width: `${w}px`, 
                        height: "24px" 
                      }} 
                    />
                  ))}
                </div>

                {/* Stats row */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  {userStats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <p className="text-lg font-bold">{stat.value}</p>
                      <p className="text-xs text-white/50">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* K-Point Balance */}
          <div 
            className="rounded-xl p-5 border border-white/10"
            style={{
              background: "linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(30,20,40,0.8) 100%)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-black" />
                </div>
                <div>
                  <p className="text-xs text-white/50">Available Balance</p>
                  <p className="text-2xl font-bold font-mono">
                    K-Point: <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">{displayPoints.toLocaleString()}</span>
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/30" />
            </div>
          </div>

          {/* The Vault - Won Items */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">THE VAULT</span>
                <span className="text-xs text-white/50 font-normal">Won Items</span>
              </h2>
              <button type="button" className="text-xs text-pink-400 hover:text-pink-300 transition-colors">
                View All
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {wonItems.map((item) => (
                <div
                  key={item.id}
                  className="relative group cursor-pointer"
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{
                    perspective: "1000px",
                  }}
                >
                  <div
                    className="relative rounded-xl overflow-hidden transition-transform duration-500"
                    style={{
                      transform: hoveredItem === item.id ? "rotateY(5deg) rotateX(-5deg)" : "rotateY(0) rotateX(0)",
                      transformStyle: "preserve-3d",
                    }}
                  >
                    {/* Background with concert stage effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-black to-pink-900/50">
                      <div className="absolute inset-0 opacity-30">
                        {/* Spotlight effects */}
                        <div 
                          className="absolute top-0 left-1/4 w-20 h-full bg-gradient-to-b from-purple-500/40 to-transparent"
                          style={{
                            transform: "rotate(-15deg)",
                            animation: "spotlight1 4s ease-in-out infinite",
                          }}
                        />
                        <div 
                          className="absolute top-0 right-1/4 w-16 h-full bg-gradient-to-b from-pink-500/40 to-transparent"
                          style={{
                            transform: "rotate(15deg)",
                            animation: "spotlight2 5s ease-in-out infinite",
                          }}
                        />
                      </div>
                    </div>

                    {/* Item image */}
                    <div className="relative aspect-square p-4">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        className="object-cover rounded-lg"
                      />
                      
                      {/* Verified badge */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-full px-2 py-1">
                        <Shield className="w-3 h-3 text-black" />
                        <span className="text-[10px] font-bold text-black">VERIFIED</span>
                      </div>

                      {/* Glow effect on hover */}
                      <div 
                        className="absolute inset-0 rounded-lg transition-opacity duration-300"
                        style={{
                          boxShadow: hoveredItem === item.id 
                            ? "0 0 30px rgba(168,85,247,0.5), inset 0 0 20px rgba(236,72,153,0.2)" 
                            : "none",
                          opacity: hoveredItem === item.id ? 1 : 0,
                        }}
                      />
                    </div>

                    {/* Item info */}
                    <div className="relative p-3 bg-black/60 backdrop-blur-sm border-t border-white/10">
                      <p className="font-semibold text-sm truncate">{item.name}</p>
                      <p className="text-xs text-pink-400">{item.artist}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-white/50">{item.date}</p>
                        <p className="text-xs font-mono text-green-400">{item.price}</p>
                      </div>
                    </div>

                    {/* Border glow */}
                    <div 
                      className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300"
                      style={{
                        border: "1px solid",
                        borderImage: "linear-gradient(135deg, rgba(168,85,247,0.5), rgba(236,72,153,0.5)) 1",
                        opacity: hoveredItem === item.id ? 1 : 0.3,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="grid grid-cols-3 gap-3">
            {[
              { icon: Wallet, label: "Charge", color: "from-green-500 to-emerald-600" },
              { icon: Trophy, label: "Badges", color: "from-yellow-500 to-orange-600" },
              { icon: Settings, label: "Settings", color: "from-gray-500 to-gray-600" },
            ].map((action, index) => (
              <button
                key={index}
                type="button"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-white/70">{action.label}</span>
              </button>
            ))}
          </section>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t border-white/10 z-50">
          <div className="flex items-center justify-around py-3">
            <Link href="/" className="flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors">
              <Home className="w-6 h-6" />
              <span className="text-xs font-medium">Home</span>
            </Link>
            <Link href="/ranking" className="flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors">
              <Trophy className="w-6 h-6" />
              <span className="text-xs font-medium">Ranking</span>
            </Link>
            <Link href="/community" className="flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors">
              <Users className="w-6 h-6" />
              <span className="text-xs font-medium">Community</span>
            </Link>
            <Link href="/profile" className="flex flex-col items-center gap-1 text-[#FF6B9D]">
              <User className="w-6 h-6" />
              <span className="text-xs font-medium">My Profile</span>
            </Link>
          </div>
        </nav>
      </div>
    </>
  )
}
