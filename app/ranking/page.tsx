"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Home, Trophy, Users, User, ChevronRight, Sparkles, Flame, Zap, Store, Search, Bell, Star, Crown } from "lucide-react"

// Artist Rank Data
const artistRankData = [
  {
    rank: 1,
    name: "G-DRAGON",
    avatar: "/images/gd-avatar.jpg",
    totalSales: 2847000000,
    itemsSold: 47,
  },
  {
    rank: 2,
    name: "JENNIE",
    avatar: "/images/jennie-avatar.jpg",
    totalSales: 2150000000,
    itemsSold: 38,
  },
  {
    rank: 3,
    name: "SON HEUNG MIN",
    avatar: "/images/son-avatar.png",
    totalSales: 1923000000,
    itemsSold: 32,
  },
  {
    rank: 4,
    name: "GONG YOO",
    avatar: "/images/gong-avatar.jpg",
    totalSales: 1456000000,
    itemsSold: 28,
  },
  {
    rank: 5,
    name: "FELIX",
    avatar: "/images/felix-avatar.jpg",
    totalSales: 987000000,
    itemsSold: 19,
  },
  {
    rank: 6,
    name: "PARK GYU YOUNG",
    avatar: "/images/park-avatar.png",
    totalSales: 654000000,
    itemsSold: 15,
  },
  {
    rank: 7,
    name: "KARINA",
    avatar: "/images/karina-avatar.jpg",
    totalSales: 542000000,
    itemsSold: 12,
  },
]

// Top Collectors Data
const topCollectorsData = [
  {
    rank: 1,
    userId: "VIP_Dragon_01",
    artistFan: "G-DRAGON",
    avatar: "/images/collector1-avatar.jpg",
    badge: "2 LEGEND 3 UNIQUE",
    totalSpent: 847000000,
    itemsOwned: 23,
  },
  {
    rank: 2,
    userId: "SonnyLover7",
    artistFan: "SON HEUNG MIN",
    avatar: "/images/collector2-avatar.jpg",
    badge: "1 LEGEND 7 UNIQUE",
    totalSpent: 523000000,
    itemsOwned: 18,
  },
  {
    rank: 3,
    userId: "GoblinHunter",
    artistFan: "GONG YOO",
    avatar: "/images/collector3-avatar.jpg",
    badge: "5 UNIQUE",
    totalSpent: 412000000,
    itemsOwned: 14,
  },
  {
    rank: 4,
    userId: "StayForever_",
    artistFan: "FELIX",
    avatar: "/images/collector4-avatar.jpg",
    badge: "3 UNIQUE",
    totalSpent: 298000000,
    itemsOwned: 11,
  },
  {
    rank: 5,
    userId: "SquidFanatic",
    artistFan: "PARK GYU YOUNG",
    avatar: "/images/collector5-avatar.jpg",
    badge: "1 UNIQUE",
    totalSpent: 187000000,
    itemsOwned: 8,
  },
]

function formatKRW(num: number) {
  if (num >= 100000000) {
    return `${(num / 100000000).toFixed(1)}억`
  }
  if (num >= 10000000) {
    return `${(num / 10000000).toFixed(0)}천만`
  }
  return num.toLocaleString()
}

function getBadgeStyle(badge: string) {
  // LEGEND와 UNIQUE가 모두 있으면 골드+핑크 그라데이션, LEGEND만 있으면 골드, UNIQUE만 있으면 핑크
  if (badge.includes("LEGEND") && badge.includes("UNIQUE")) {
    return "bg-gradient-to-r from-amber-400 via-yellow-500 to-[#FF6B9D] text-white shadow-lg shadow-amber-500/50"
  } else if (badge.includes("LEGEND")) {
    return "bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 text-black shadow-lg shadow-amber-500/50"
  } else if (badge.includes("UNIQUE")) {
    return "bg-gradient-to-r from-[#FF6B9D] via-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/50"
  }
  return "bg-zinc-600 text-white"
}

export default function RankingPage() {
  const [activeTab, setActiveTab] = useState<"artist" | "collector">("artist")

  // 상위 3명
  const topThree = artistRankData.slice(0, 3)
  const restArtists = artistRankData.slice(3)

  return (
    <div className="min-h-screen bg-black text-white pb-24 relative overflow-hidden">
      {/* Ambient lighting effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FF6B9D]/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/3 right-0 w-80 h-80 bg-amber-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-[#FF6B9D]/20">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/">
            <Image src="/logo-pink.png" alt="Krunch" width={150} height={48} className="h-12 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FF6B9D]" />
              <span className="font-display text-lg tracking-wide text-white uppercase">Ranking</span>
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

      {/* Tab Switcher */}
      <div className="px-4 pt-6 relative z-10">
        <div className="flex bg-black/40 backdrop-blur-sm border border-[#FF6B9D]/30 rounded-full p-1 shadow-lg shadow-[#FF6B9D]/10">
          <button
            onClick={() => setActiveTab("artist")}
            className={`flex-1 py-3 rounded-full text-sm font-bold transition-all relative overflow-hidden ${
              activeTab === "artist"
                ? "bg-gradient-to-r from-[#FF6B9D] to-pink-500 text-black shadow-lg shadow-[#FF6B9D]/50"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {activeTab === "artist" && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            )}
            <span className="relative z-10">Artist Rank</span>
          </button>
          <button
            onClick={() => setActiveTab("collector")}
            className={`flex-1 py-3 rounded-full text-sm font-bold transition-all relative overflow-hidden ${
              activeTab === "collector"
                ? "bg-gradient-to-r from-[#FF6B9D] to-pink-500 text-black shadow-lg shadow-[#FF6B9D]/50"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {activeTab === "collector" && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            )}
            <span className="relative z-10">Top Collectors</span>
          </button>
        </div>
      </div>

      {activeTab === "artist" ? (
        <div className="px-4 pt-8 relative z-10">
          {/* 상위 3명 포디엄 스타일 - 더 힙하게 */}
          <div className="flex items-end justify-center gap-3 mb-10">
            {/* 2위 */}
            <div className="flex flex-col items-center w-[30%] group">
              <div className="relative mb-3">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative w-18 h-18 rounded-full overflow-hidden ring-2 ring-slate-400/60 ring-offset-2 ring-offset-black">
                  <Image
                    src={topThree[1].avatar || "/placeholder.svg"}
                    alt={topThree[1].name}
                    width={72}
                    height={72}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-7 h-7 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-black text-xs font-black shadow-lg shadow-slate-400/50 border-2 border-black">
                  2
                </div>
              </div>
              <p className="text-white text-sm font-bold text-center truncate w-full mb-1">{topThree[1].name}</p>
              <p className="text-[#FF6B9D] text-xs font-semibold mb-3">{formatKRW(topThree[1].totalSales)}</p>
              <div className="w-full h-20 bg-gradient-to-t from-slate-500/30 via-slate-500/20 to-transparent rounded-t-xl border-t border-slate-400/30 shadow-lg shadow-slate-500/20" />
            </div>

            {/* 1위 - 더 강조 */}
            <div className="flex flex-col items-center w-[36%] group">
              <div className="relative mb-3">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 rounded-full blur-2xl opacity-60 animate-pulse" />
                <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-amber-400/80 ring-offset-4 ring-offset-black shadow-2xl shadow-amber-400/50">
                  <Image
                    src={topThree[0].avatar || "/placeholder.svg"}
                    alt={topThree[0].name}
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-9 h-9 bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-black text-base font-black shadow-2xl shadow-amber-400/70 border-2 border-black">
                  <Trophy className="w-5 h-5" fill="currentColor" />
                </div>
                <div className="absolute -top-2 right-0">
                  <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
                </div>
              </div>
              <p className="text-white text-lg font-black text-center mb-1 bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
                {topThree[0].name}
              </p>
              <p className="text-[#FF6B9D] text-sm font-bold mb-3">{formatKRW(topThree[0].totalSales)}</p>
              <div className="w-full h-32 bg-gradient-to-t from-amber-500/40 via-amber-500/25 to-transparent rounded-t-xl border-t-2 border-amber-400/50 shadow-2xl shadow-amber-500/30" />
            </div>

            {/* 3위 */}
            <div className="flex flex-col items-center w-[30%] group">
              <div className="relative mb-3">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-700 to-amber-800 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
                <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-amber-700/60 ring-offset-2 ring-offset-black">
                  <Image
                    src={topThree[2].avatar || "/placeholder.svg"}
                    alt={topThree[2].name}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-gradient-to-br from-amber-700 to-amber-900 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-amber-700/50 border-2 border-black">
                  3
                </div>
              </div>
              <p className="text-white text-sm font-bold text-center truncate w-full mb-1">{topThree[2].name}</p>
              <p className="text-white/60 text-xs font-semibold mb-3">{formatKRW(topThree[2].totalSales)}</p>
              <div className="w-full h-16 bg-gradient-to-t from-amber-700/30 via-amber-700/15 to-transparent rounded-t-xl border-t border-amber-700/30 shadow-lg shadow-amber-700/20" />
            </div>
          </div>

          {/* 나머지 순위 - 더 힙한 카드 */}
          <div className="space-y-3">
            {restArtists.map((artist, index) => (
              <div
                key={artist.rank}
                className="group flex items-center gap-4 p-4 bg-gradient-to-r from-white/5 via-white/5 to-transparent rounded-2xl border border-white/10 hover:border-[#FF6B9D]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#FF6B9D]/20 hover:bg-white/10 relative overflow-hidden"
              >
                {/* 배경 글로우 효과 */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B9D]/0 via-[#FF6B9D]/5 to-[#FF6B9D]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <span className="w-8 text-center text-[#FF6B9D] font-black text-lg relative z-10">#{artist.rank}</span>
                <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-white/20 group-hover:ring-[#FF6B9D]/50 transition-all">
                  <Image
                    src={artist.avatar || "/placeholder.svg"}
                    alt={artist.name}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex-1 min-w-0 relative z-10">
                  <p className="text-white text-base font-bold truncate group-hover:text-[#FF6B9D] transition-colors">{artist.name}</p>
                  <p className="text-white/50 text-xs font-medium">{artist.itemsSold} items sold</p>
                </div>
                <div className="text-right relative z-10">
                  <p className="text-white font-bold text-base group-hover:text-[#FF6B9D] transition-colors">{formatKRW(artist.totalSales)}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-[#FF6B9D] group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-4 pt-8 space-y-4 relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <Crown className="w-5 h-5 text-[#FF6B9D]" />
            <p className="text-white font-display text-lg tracking-wide font-medium">Top Fans by Artist</p>
          </div>
          {topCollectorsData.map((collector) => (
            <div
              key={collector.rank}
              className={`group p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                collector.rank === 1
                  ? "bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border-amber-500/40 shadow-2xl shadow-amber-500/20"
                  : "bg-gradient-to-r from-white/5 via-white/5 to-transparent border-white/10 hover:border-[#FF6B9D]/50 hover:shadow-lg hover:shadow-[#FF6B9D]/20"
              }`}
            >
              {/* 배경 글로우 */}
              {collector.rank === 1 && (
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 via-yellow-400/10 to-orange-400/10 animate-pulse" />
              )}
              
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <span
                      className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-lg z-10 ${
                        collector.rank === 1
                          ? "bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500 text-black shadow-amber-400/50"
                          : collector.rank === 2
                            ? "bg-gradient-to-br from-slate-400 to-slate-600 text-black shadow-slate-400/50"
                            : collector.rank === 3
                              ? "bg-gradient-to-br from-amber-700 to-amber-900 text-white shadow-amber-700/50"
                              : "bg-white/10 text-white/60"
                      }`}
                    >
                      {collector.rank}
                    </span>
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white/20 group-hover:ring-[#FF6B9D]/50 transition-all">
                      <Image
                        src={collector.avatar || "/placeholder-user.jpg"}
                        alt={collector.userId}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-white font-bold text-base group-hover:text-[#FF6B9D] transition-colors">{collector.userId}</p>
                    <p className="text-white/50 text-xs font-medium">{collector.artistFan}&apos;s No.1 Fan</p>
                  </div>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-black tracking-wider ${getBadgeStyle(collector.badge)}`}>
                  {collector.badge}
                </span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-white/10 relative z-10">
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider font-bold mb-1">Total Spent</p>
                  <p className="text-white font-bold text-base group-hover:text-[#FF6B9D] transition-colors">₩{formatKRW(collector.totalSpent)}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider font-bold mb-1">Items Owned</p>
                  <p className="text-white font-bold text-base">{collector.itemsOwned}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t border-white/10 z-50">
        <div className="flex items-center justify-around py-3">
          <Link href="/" className="flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors">
            <Home className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/ranking" className="flex flex-col items-center gap-1 text-[#FF6B9D]">
            <Trophy className="w-6 h-6" />
            <span className="text-xs font-medium">Ranking</span>
          </Link>
          <Link href="/community" className="flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors">
            <Users className="w-6 h-6" />
            <span className="text-xs">Community</span>
          </Link>
          <Link href="/market" className="flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors">
            <Store className="w-6 h-6" />
            <span className="text-xs">2nd Market</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors">
            <User className="w-6 h-6" />
            <span className="text-xs">My Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
