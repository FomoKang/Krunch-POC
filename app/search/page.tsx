"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Search, X, TrendingUp, Clock, Flame } from "lucide-react"

// 트렌딩 검색어
const trendingSearches = [
  { id: 1, keyword: "G-DRAGON PEACEMINUSONE", hot: true },
  { id: 2, keyword: "손흥민 버버리", hot: true },
  { id: 3, keyword: "오징어게임2 마스크", hot: false },
  { id: 4, keyword: "펠릭스 휴먼메이드", hot: false },
  { id: 5, keyword: "공유 루이비통", hot: false },
]

// 최근 검색어
const recentSearches = [
  "PEACEMINUSONE Cap",
  "Burberry Trench",
  "Supreme Hoodie",
]

// 추천 아이템
const recommendedItems = [
  {
    id: 1,
    name: "PEACEMINUSONE Cap",
    artist: "G-DRAGON",
    image: "/peaceminusone-gd-cap-burgundy-red-with-flames-stre.jpg",
    status: "LIVE",
    currentBid: "₩6,733,184",
  },
  {
    id: 2,
    name: "Burberry Trench Jacket",
    artist: "SON HEUNG MIN",
    image: "/son-burberry.png",
    status: "UPCOMING",
    currentBid: "Jan 28, 2026",
  },
  {
    id: 3,
    name: "Louis Vuitton Jacket",
    artist: "GONG YOO",
    image: "/gongyoo-suit.png",
    status: "UPCOMING",
    currentBid: "Coming Soon",
  },
]

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [recentList, setRecentList] = useState(recentSearches)

  const removeRecent = (keyword: string) => {
    setRecentList(recentList.filter((item) => item !== keyword))
  }

  const clearAllRecent = () => {
    setRecentList([])
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 검색 헤더 */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/" className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artists, items, collections..."
              className="w-full bg-white/10 border border-white/10 rounded-full py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#FF6B9D]/50 focus:ring-1 focus:ring-[#FF6B9D]/50 transition-all"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full"
              >
                <X className="w-4 h-4 text-white/40" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-8">
        {/* 최근 검색어 */}
        {recentList.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-white/40" />
                <h2 className="text-sm font-medium text-white/60">Recent Searches</h2>
              </div>
              <button
                onClick={clearAllRecent}
                className="text-xs text-[#FF6B9D] hover:text-[#FF6B9D]/80 transition-colors"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentList.map((keyword) => (
                <div
                  key={keyword}
                  className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5"
                >
                  <span className="text-sm text-white/80">{keyword}</span>
                  <button
                    onClick={() => removeRecent(keyword)}
                    className="p-0.5 hover:bg-white/10 rounded-full"
                  >
                    <X className="w-3 h-3 text-white/40" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 트렌딩 검색어 */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[#FF6B9D]" />
            <h2 className="text-sm font-medium text-white/60">Trending Now</h2>
          </div>
          <div className="space-y-1">
            {trendingSearches.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setSearchQuery(item.keyword)}
                className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors"
              >
                <span
                  className={`w-6 text-center font-bold ${
                    index < 3 ? "text-[#FF6B9D]" : "text-white/40"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="flex-1 text-left text-white/90">{item.keyword}</span>
                {item.hot && (
                  <span className="flex items-center gap-1 text-xs text-orange-400">
                    <Flame className="w-3 h-3" />
                    HOT
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* 추천 아이템 */}
        <section>
          <h2 className="text-sm font-medium text-white/60 mb-4">Recommended For You</h2>
          <div className="space-y-3">
            {recommendedItems.map((item) => (
              <Link
                key={item.id}
                href={item.status === "LIVE" ? "/auction" : "#"}
                className="flex items-center gap-4 p-3 bg-white/5 border border-white/10 rounded-xl hover:border-[#FF6B9D]/30 transition-colors"
              >
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-black">
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                  {item.status === "LIVE" && (
                    <div className="absolute top-1 left-1 flex items-center gap-1 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                      </span>
                      LIVE
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium text-sm truncate">{item.name}</h3>
                  <p className="text-white/40 text-xs mt-0.5">{item.artist}</p>
                  <p className={`text-xs mt-1 ${item.status === "LIVE" ? "text-[#FF6B9D]" : "text-white/60"}`}>
                    {item.currentBid}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
