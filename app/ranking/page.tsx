"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Home, Trophy, Users, User, ChevronRight, Sparkles } from "lucide-react"

// Artist Rank Data
const artistRankData = [
  {
    rank: 1,
    name: "G-DRAGON",
    avatar: "/images/gd-avatar.png",
    totalSales: 2847000000,
    itemsSold: 47,
  },
  {
    rank: 2,
    name: "SON HEUNG MIN",
    avatar: "/images/son-avatar.png",
    totalSales: 1923000000,
    itemsSold: 32,
  },
  {
    rank: 3,
    name: "GONG YOO",
    avatar: "/images/gong-avatar.png",
    totalSales: 1456000000,
    itemsSold: 28,
  },
  {
    rank: 4,
    name: "FELIX",
    avatar: "/images/felix-avatar.png",
    totalSales: 987000000,
    itemsSold: 19,
  },
  {
    rank: 5,
    name: "PARK GYU YOUNG",
    avatar: "/images/park-avatar.png",
    totalSales: 654000000,
    itemsSold: 15,
  },
]

// Top Collectors Data
const topCollectorsData = [
  {
    rank: 1,
    userId: "VIP_Dragon_01",
    artistFan: "G-DRAGON",
    badge: "LEGENDARY",
    totalSpent: 847000000,
    itemsOwned: 23,
  },
  {
    rank: 2,
    userId: "SonnyLover7",
    artistFan: "SON HEUNG MIN",
    badge: "EPIC",
    totalSpent: 523000000,
    itemsOwned: 18,
  },
  {
    rank: 3,
    userId: "GoblinHunter",
    artistFan: "GONG YOO",
    badge: "EPIC",
    totalSpent: 412000000,
    itemsOwned: 14,
  },
  {
    rank: 4,
    userId: "StayForever_",
    artistFan: "FELIX",
    badge: "RARE",
    totalSpent: 298000000,
    itemsOwned: 11,
  },
  {
    rank: 5,
    userId: "SquidFanatic",
    artistFan: "PARK GYU YOUNG",
    badge: "RARE",
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
  switch (badge) {
    case "LEGENDARY":
      return "bg-gradient-to-r from-amber-400 to-yellow-500 text-black"
    case "EPIC":
      return "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
    case "RARE":
      return "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
    default:
      return "bg-zinc-600 text-white"
  }
}

export default function RankingPage() {
  const [activeTab, setActiveTab] = useState<"artist" | "collector">("artist")

  // 상위 3명
  const topThree = artistRankData.slice(0, 3)
  const restArtists = artistRankData.slice(3)

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <Image src="/logo-pink.png" alt="Krunch" width={100} height={32} className="h-8 w-auto" />
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FF6B9D]" />
            <span className="text-[#FF6B9D] font-medium text-sm">RANKING</span>
          </div>
        </div>
      </header>

      {/* Tab Switcher */}
      <div className="px-4 pt-4">
        <div className="flex bg-white/5 rounded-full p-1">
          <button
            onClick={() => setActiveTab("artist")}
            className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
              activeTab === "artist"
                ? "bg-[#FF6B9D] text-black"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            Artist Rank
          </button>
          <button
            onClick={() => setActiveTab("collector")}
            className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
              activeTab === "collector"
                ? "bg-[#FF6B9D] text-black"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            Top Collectors
          </button>
        </div>
      </div>

      {activeTab === "artist" ? (
        <div className="px-4 pt-6">
          {/* 상위 3명 포디엄 스타일 */}
          <div className="flex items-end justify-center gap-2 mb-8">
            {/* 2위 */}
            <div className="flex flex-col items-center w-[30%]">
              <div className="relative mb-2">
                <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-slate-400/50">
                  <Image
                    src={topThree[1].avatar || "/placeholder.svg"}
                    alt={topThree[1].name}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-6 bg-slate-400 rounded-full flex items-center justify-center text-black text-xs font-bold">
                  2
                </div>
              </div>
              <p className="text-white text-xs font-medium text-center truncate w-full">{topThree[1].name}</p>
              <p className="text-white/40 text-[10px]">{formatKRW(topThree[1].totalSales)}</p>
              <div className="w-full h-16 bg-gradient-to-t from-slate-500/20 to-transparent rounded-t-lg mt-2" />
            </div>

            {/* 1위 */}
            <div className="flex flex-col items-center w-[34%]">
              <div className="relative mb-2">
                <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                  <Image
                    src={topThree[0].avatar || "/placeholder.svg"}
                    alt={topThree[0].name}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-7 h-7 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center text-black text-sm font-bold shadow-[0_0_10px_rgba(251,191,36,0.5)]">
                  1
                </div>
              </div>
              <p className="text-white text-sm font-bold text-center">{topThree[0].name}</p>
              <p className="text-[#FF6B9D] text-xs font-medium">{formatKRW(topThree[0].totalSales)}</p>
              <div className="w-full h-24 bg-gradient-to-t from-amber-500/20 to-transparent rounded-t-lg mt-2" />
            </div>

            {/* 3위 */}
            <div className="flex flex-col items-center w-[30%]">
              <div className="relative mb-2">
                <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-amber-700/50">
                  <Image
                    src={topThree[2].avatar || "/placeholder.svg"}
                    alt={topThree[2].name}
                    width={56}
                    height={56}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 bg-amber-700 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                  3
                </div>
              </div>
              <p className="text-white text-xs font-medium text-center truncate w-full">{topThree[2].name}</p>
              <p className="text-white/40 text-[10px]">{formatKRW(topThree[2].totalSales)}</p>
              <div className="w-full h-12 bg-gradient-to-t from-amber-700/20 to-transparent rounded-t-lg mt-2" />
            </div>
          </div>

          {/* 나머지 순위 */}
          <div className="space-y-2">
            {restArtists.map((artist) => (
              <div
                key={artist.rank}
                className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5"
              >
                <span className="w-6 text-center text-white/40 font-medium">{artist.rank}</span>
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src={artist.avatar || "/placeholder.svg"}
                    alt={artist.name}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{artist.name}</p>
                  <p className="text-white/40 text-xs">{artist.itemsSold} items</p>
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-sm font-medium">{formatKRW(artist.totalSales)}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-4 pt-6 space-y-3">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-4">Top Fans by Artist</p>
          {topCollectorsData.map((collector) => (
            <div
              key={collector.rank}
              className={`p-4 rounded-xl border ${
                collector.rank === 1
                  ? "bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20"
                  : "bg-white/5 border-white/5"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      collector.rank === 1
                        ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-black"
                        : collector.rank === 2
                          ? "bg-slate-400 text-black"
                          : collector.rank === 3
                            ? "bg-amber-700 text-white"
                            : "bg-white/10 text-white/60"
                    }`}
                  >
                    {collector.rank}
                  </span>
                  <div>
                    <p className="text-white font-medium text-sm">{collector.userId}</p>
                    <p className="text-white/40 text-xs">{collector.artistFan}&apos;s No.1 Fan</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getBadgeStyle(collector.badge)}`}>
                  {collector.badge}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div>
                  <p className="text-white/40 text-[10px] uppercase">Total Spent</p>
                  <p className="text-white font-medium text-sm">₩{formatKRW(collector.totalSpent)}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-[10px] uppercase">Items Owned</p>
                  <p className="text-white font-medium text-sm">{collector.itemsOwned}</p>
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
          <Link href="/profile" className="flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors">
            <User className="w-6 h-6" />
            <span className="text-xs">My Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
