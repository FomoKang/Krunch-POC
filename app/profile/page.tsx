"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Home, Trophy, Users, User, Settings, QrCode, Wallet, Store, Search, Bell } from "lucide-react"


export default function ProfilePage() {
  const [showQR, setShowQR] = useState(false)
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
                  <div 
                    className="relative flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2 cursor-pointer"
                    onMouseEnter={() => setShowQR(true)}
                    onMouseLeave={() => setShowQR(false)}
                  >
                    <QrCode className="w-8 h-8 text-white/80" />
                    {/* QR Image on Hover */}
                    {showQR && (
                      <div className="absolute top-full right-0 mt-2 z-50 p-2 bg-white rounded-lg shadow-2xl">
                        <Image 
                          src="/Krunch-QR.jpg" 
                          alt="Krunch QR Code" 
                          width={200} 
                          height={200}
                          className="rounded"
                        />
                      </div>
                    )}
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
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <action.icon className={`w-4 h-4 ${action.iconColor}`} />
                </div>
                <span className="text-xs text-white/70">{action.label}</span>
              </button>
            ))}
          </section>

          {/* 3D Gallery Section */}
          <section className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display tracking-wide flex items-center gap-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 uppercase">MY GALLERY</span>
              </h2>
              <button type="button" className="text-xs text-pink-400 hover:text-pink-300 transition-colors">
                Add Item
              </button>
            </div>

            {/* 3D Gallery Space */}
            <div 
              className="relative rounded-2xl overflow-hidden bg-black/40"
              style={{
                minHeight: "450px",
                perspective: "1200px",
                perspectiveOrigin: "center center",
              }}
            >
              {/* Gallery Container with 3D transform */}
              <div 
                className="relative w-full h-[450px]"
                style={{
                  transformStyle: "preserve-3d",
                  transform: "rotateX(5deg)",
                }}
              >
                {/* Back Wall - Main Display */}
                <div 
                  className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-white/15 via-white/8 to-black/30"
                  style={{
                    transform: "translateZ(-80px) scale(0.9)",
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* Grid pattern for gallery wall */}
                  <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                      `,
                      backgroundSize: "40px 40px",
                    }}
                  />
                  
                  {/* Art Hooks/Spots on Back Wall */}
                  <div className="absolute top-1/4 left-1/4 w-24 h-32 bg-black/30 border border-white/20 rounded-lg cursor-pointer hover:border-pink-400/50 transition-colors" />
                  <div className="absolute top-1/4 right-1/4 w-24 h-32 bg-black/30 border border-white/20 rounded-lg cursor-pointer hover:border-pink-400/50 transition-colors" />
                  <div className="absolute top-2/3 left-1/2 -translate-x-1/2 w-24 h-32 bg-black/30 border border-white/20 rounded-lg cursor-pointer hover:border-pink-400/50 transition-colors" />
                </div>

                {/* Left Wall */}
                <div 
                  className="absolute left-0 top-0 w-1/4 h-full bg-gradient-to-r from-white/12 to-transparent"
                  style={{
                    transform: "rotateY(-25deg) translateX(-20%) translateZ(-60px)",
                    transformStyle: "preserve-3d",
                  }}
                >
                  <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-20 h-28 bg-black/30 border border-white/20 rounded-lg cursor-pointer hover:border-pink-400/50 transition-colors" />
                  <div className="absolute top-2/3 left-1/2 -translate-x-1/2 w-20 h-28 bg-black/30 border border-white/20 rounded-lg cursor-pointer hover:border-pink-400/50 transition-colors" />
                </div>

                {/* Right Wall */}
                <div 
                  className="absolute right-0 top-0 w-1/4 h-full bg-gradient-to-l from-white/12 to-transparent"
                  style={{
                    transform: "rotateY(25deg) translateX(20%) translateZ(-60px)",
                    transformStyle: "preserve-3d",
                  }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-20 h-28 bg-black/30 border border-white/20 rounded-lg cursor-pointer hover:border-pink-400/50 transition-colors" />
                </div>

                {/* Gallery Floor */}
                <div 
                  className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-gray-900 via-gray-800/50 to-transparent"
                  style={{
                    transform: "rotateX(75deg) translateY(50%) translateZ(-100px)",
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* Floor reflection effect */}
                  <div className="absolute inset-0 opacity-20" style={{
                    background: "repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 21px)",
                  }} />
                </div>

                {/* Gallery Lighting - Spotlights */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-1/4 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                  <div className="absolute top-0 right-1/4 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />
                </div>

                {/* Empty State */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center z-10">
                    <p className="text-white/40 text-sm mb-2">Your gallery is empty</p>
                    <p className="text-white/20 text-xs">Add items from your vault to display here</p>
                  </div>
                </div>
              </div>
            </div>
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
