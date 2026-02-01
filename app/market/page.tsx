"use client"

import Link from "next/link"
import Image from "next/image"
import { Home, Trophy, Users, User, Store, Search, Bell } from "lucide-react"
import { useSiteTheme } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"

export default function SecondMarketPage() {
  const { theme } = useSiteTheme()
  const basePath = theme === "black" ? "/black" : ""
  const logoSrc = theme === "black" ? "/logo-white.png" : "/logo-pink.png"
  return (
    <div className="min-h-screen bg-black text-white pb-for-nav">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3 min-h-[6rem]">
          <div className="h-[72px] flex items-center shrink-0">
            <Link href={basePath || "/"} className="block">
              <Image
                src={logoSrc}
                alt="Krunch"
                width={225}
                height={72}
                className="h-[72px] w-[225px] object-contain object-left"
              />
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-2">
              <Store className={`w-5 h-5 ${theme === "black" ? "text-white store-icon-pink-outline" : "text-[#FF6B9D]"}`} />
              <span className="font-display text-lg tracking-wide text-white uppercase">2nd Market</span>
            </div>
            <Link href={`${basePath}/search`} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Search className="w-5 h-5 text-white/80" />
            </Link>
            <Link href={`${basePath}/notifications`} className="p-2 hover:bg-white/10 rounded-full transition-colors relative">
              <Bell className="w-5 h-5 text-white/80" />
              <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${theme === "black" ? "bg-white" : "bg-[#FF6B9D]"}`} />
            </Link>
            <ThemeToggle inline />
          </div>
        </div>
      </header>

      <main className="px-4 flex flex-col items-center justify-center text-center gap-4 min-h-[calc(100vh-200px)]">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${theme === "black" ? "bg-[#0a0a0a] border border-[rgba(255,105,180,0.3)]" : "bg-[#1a1a1a] border border-[#FF6B9D]/40 shadow-lg shadow-[#FF6B9D]/20"}`}>
          <Store className={`w-8 h-8 ${theme === "black" ? "text-white store-icon-pink-outline" : "text-[#FF6B9D]"}`} />
        </div>
        <h1 className="font-display text-3xl tracking-wide text-white uppercase italic">
          2nd Market
        </h1>
        <p className="text-white/60 text-sm max-w-xs">
          Peer-to-peer trading is{" "}
          <span className={theme === "black" ? "text-white font-semibold" : "text-[#FF6B9D] font-semibold"} style={theme === "black" ? { WebkitTextStroke: "1px rgba(255,105,180,0.4)" } : undefined}>
            coming soon
          </span>
          . Soon you&apos;ll be able to resell and discover rare collections directly from other Krunch users.
        </p>
      </main>

    </div>
  )
}