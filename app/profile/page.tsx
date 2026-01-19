"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Home, Trophy, Users, User, Settings, QrCode, Wallet, Shield, Star, ChevronRight, Store, Search, Bell } from "lucide-react"


export default function ProfilePage() {
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)

  // Won items data
  const wonItems = [
    {
      id: 1,
      name: "PEACEMINUSONE Cap",
      artist: "G-DRAGON",
      image: "/cap-spin.mp4",
      date: "2025.12.15",
      price: "₩6,733,184",
    },
    {
      id: 2,
      name: "Burberry Trench",
      artist: "SON HEUNG MIN",
      image: "/son-burberry.png",
      date: "2025.11.28",
      price: "₩4,250,000",
    },
    {
      id: 3,
      name: "The Recruiter Suit",
      artist: "GONG YOO",
      image: "/gongyoo-suit.png",
      date: "2025.10.05",
      price: "₩8,900,000",
    },
    {
      id: 4,
      name: "Human Made Heart Tee",
      artist: "FELIX",
      image: "/felix-human.png",
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
            <Link href="/">
              <Image src="/logo-pink.png" alt="Krunch" width={150} height={48} className="h-12 w-auto" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#FF6B9D]" />
                <span className="font-display text-lg tracking-wide text-white uppercase">My Vault</span>
              </div>
              <Link href="/search" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <Search className="w-5 h-5 text-white/80" />
              </Link>
              <Link href="/notifications" className="p-2 hover:bg-white/10 rounded-full transition-colors relative">
                <Bell className="w-5 h-5 text-white/80" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF6B9D] rounded-full" />
              </Link>
              <button type="button" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <Settings className="w-5 h-5 text-white/70" />
              </button>
            </div>
          </div>
        </header>

        <main className="relative z-10 px-4 py-4 space-y-4">
          {/* Holographic ID Card */}
          <div className="relative">
            <div 
              className="relative rounded-2xl p-4 overflow-hidden"
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
                  <div className="flex items-start gap-6">
                    <div>
                      <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">MEMBER ID</p>
                      <p className="text-lg font-mono tracking-wider">KR-2024-00847</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">K-Point</p>
                      <p className="text-lg font-mono text-orange-400 tracking-wider">530,000</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
                    <QrCode className="w-8 h-8 text-white/80" />
                  </div>
                </div>

                {/* User info */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-purple-500/50 bg-black/20">
                      <img
                        src="/profile-avatar.jpg"
                        alt="Fomo_KR"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to images folder if root doesn't work
                          const target = e.target as HTMLImageElement
                          if (target.src.includes('/profile-avatar.jpg') && !target.src.includes('/images/')) {
                            target.src = '/images/profile-avatar.jpg'
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="font-display text-lg tracking-wide uppercase">Fomo_KR</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 font-semibold">
                        LEVEL 3
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
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


          {/* The Vault - Won Items */}
          <section className="pt-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display tracking-wide flex items-center gap-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 uppercase">MY VAULT</span>
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
                    {/* Background with stage effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-purple-950/60 to-transparent">
                      {/* Stage floor */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[110%] h-10 bg-gradient-to-t from-black via-purple-900/50 to-transparent rounded-[50%]" />
                      {/* Spotlights */}
                      <div className="absolute inset-0 opacity-40">
                        <div
                          className="absolute top-[-10%] left-1/4 w-24 h-full bg-gradient-to-b from-purple-500/50 to-transparent"
                          style={{
                            transform: "rotate(-18deg)",
                            animation: "spotlight1 4s ease-in-out infinite",
                          }}
                        />
                        <div
                          className="absolute top-[-10%] right-1/4 w-20 h-full bg-gradient-to-b from-pink-500/50 to-transparent"
                          style={{
                            transform: "rotate(18deg)",
                            animation: "spotlight2 5s ease-in-out infinite",
                          }}
                        />
                      </div>
                    </div>

                    {/* Item image on stage */}
                    <div className="relative aspect-[4/5] px-4 pt-4 pb-6 flex items-center justify-center">
                      {item.image.endsWith('.mp4') ? (
                        <video
                          src={item.image}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-contain rounded-lg drop-shadow-[0_12px_25px_rgba(0,0,0,0.9)]"
                        />
                      ) : (
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          fill
                          className="object-contain rounded-lg drop-shadow-[0_12px_25px_rgba(0,0,0,0.9)]"
                        />
                      )}
                      
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
                        <p className="text-xs font-mono text-[#FF6B9D]">{item.price}</p>
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
              { icon: Wallet, label: "Charge", iconColor: "text-white/80" },
              { icon: Trophy, label: "Badges", iconColor: "text-white/80" },
              { icon: Settings, label: "Settings", iconColor: "text-white/80" },
            ].map((action, index) => (
              <button
                key={index}
                type="button"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <action.icon className={`w-5 h-5 ${action.iconColor}`} />
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
            <Link href="/market" className="flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors">
              <Store className="w-6 h-6" />
              <span className="text-xs font-medium">2nd Market</span>
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
