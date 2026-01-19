"use client"

import Link from "next/link"
import Image from "next/image"
import { Home, Trophy, Users, User, Store, Search, Bell } from "lucide-react"

export default function SecondMarketPage() {
  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/">
            <Image src="/logo-pink.png" alt="Krunch" width={150} height={48} className="h-12 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-[#FF6B9D]" />
              <span className="font-display text-lg tracking-wide text-white uppercase">2nd Market</span>
            </div>
            <Link href="/search" className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Search className="w-5 h-5 text-white/80" />
            </Link>
            <Link href="/notifications" className="p-2 hover:bg-white/10 rounded-full transition-colors relative">
              <Bell className="w-5 h-5 text-white/80" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF6B9D] rounded-full" />
            </Link>
          </div>
        </div>
      </header>

      <main className="px-4 flex flex-col items-center justify-center text-center gap-4 min-h-[calc(100vh-200px)]">
        <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#FF6B9D]/40 flex items-center justify-center shadow-lg shadow-[#FF6B9D]/20">
          <Store className="w-8 h-8 text-[#FF6B9D]" />
        </div>
        <h1 className="font-display text-3xl tracking-wide text-white uppercase italic">
          2nd Market
        </h1>
        <p className="text-white/60 text-sm max-w-xs">
          Peer-to-peer trading is <span className="text-[#FF6B9D] font-semibold">coming soon</span>.{" "}
          Soon you&apos;ll be able to resell and discover rare collections directly from other Krunch users.
        </p>
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
          <Link href="/market" className="flex flex-col items-center gap-1 text-[#FF6B9D]">
            <Store className="w-6 h-6" />
            <span className="text-xs font-medium">2nd Market</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors">
            <User className="w-6 h-6" />
            <span className="text-xs font-medium">My Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}