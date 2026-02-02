"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Home, Trophy, Users, User, ChevronRight, Sparkles, Flame, Zap, Store, Search, Bell, Star, Crown } from "lucide-react"
import { useSiteTheme } from "@/components/theme-provider"
import { useLocale } from "@/components/locale-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { artistRankDataFull } from "@/lib/artist-rank-data"

// 일반인 프로필 풀 (user1~10 + collector 혼합)
const generalProfilePool = [
  "/images/collector1-avatar.jpg", "/images/collector2-avatar.jpg", "/user1-profile.jpg", "/user2-profile.jpg", "/user3-profile.jpg",
  "/user4-profile.jpg", "/images/collector3-avatar.jpg", "/user5-profile.jpg", "/user6-profile.jpg", "/images/collector4-avatar.jpg",
  "/user7-profile.jpg", "/user8-profile.jpg", "/images/collector5-avatar.jpg", "/user9-profile.jpg", "/user10-profile.jpg",
]

// Top Collectors Data — 일반인 프로필 풀에서 혼합 사용 (collector + user1~10)
const topCollectorsData = [
  { rank: 1, userId: "VIP_DRAGON", artistFan: "G-DRAGON", avatar: "/user11-profile.jpg", badge: "2 LEGEND 3 UNIQUE", totalSpent: 847000000, itemsOwned: 23 },
  { rank: 2, userId: "SonnyLover7", artistFan: "SON HEUNG MIN", avatar: generalProfilePool[2], badge: "1 LEGEND 7 UNIQUE", totalSpent: 523000000, itemsOwned: 18 },
  { rank: 3, userId: "GoblinHunter", artistFan: "GONG YOO", avatar: generalProfilePool[7], badge: "5 UNIQUE", totalSpent: 412000000, itemsOwned: 14 },
  { rank: 4, userId: "StayForever_", artistFan: "FELIX", avatar: generalProfilePool[10], badge: "3 UNIQUE", totalSpent: 298000000, itemsOwned: 11 },
  { rank: 5, userId: "SquidFanatic", artistFan: "PARK GYU YOUNG", avatar: generalProfilePool[13], badge: "1 UNIQUE", totalSpent: 187000000, itemsOwned: 8 },
]

function formatKRW(num: number) {
  if (num >= 1_000_000_000) {
    return `₩\u2009${(num / 1_000_000_000).toFixed(1)}B`
  }
  if (num >= 1_000_000) {
    return `₩\u2009${(num / 1_000_000).toFixed(1)}M`
  }
  return `₩\u2009${num.toLocaleString()}`
}

function getBadgeStyle(badge: string, isBlack?: boolean) {
  if (isBlack) {
    if (badge.includes("LEGEND") && badge.includes("UNIQUE")) {
      return "bg-transparent text-white font-bold border border-[rgba(255,105,180,0.5)]"
    }
    if (badge.includes("LEGEND")) {
      return "bg-transparent text-white font-bold border border-[rgba(255,105,180,0.5)]"
    }
    if (badge.includes("UNIQUE")) {
      return "bg-[rgba(255,105,180,0.2)] text-white font-bold border border-[rgba(255,105,180,0.4)]"
    }
    return "bg-[#404040] text-white border border-white/10"
  }
  if (badge.includes("LEGEND") && badge.includes("UNIQUE")) {
    return "bg-gradient-to-r from-amber-400 via-yellow-500 to-[#FF6B9D] text-white shadow-lg shadow-amber-500/50"
  }
  if (badge.includes("LEGEND")) {
    return "bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 text-black shadow-lg shadow-amber-500/50"
  }
  if (badge.includes("UNIQUE")) {
    return "bg-gradient-to-r from-[#FF6B9D] via-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/50"
  }
  return "bg-zinc-600 text-white"
}

const INITIAL_LIST_COUNT = 7
const STATS = {
  totalVolume: 2400000000,
  activeCollectors: 15234,
  newArtists: 23,
}

const CAT_LABELS: Record<string, string> = { All: "전체", "K-POP": "K-POP", Actor: "배우", Athlete: "운동선수", Influencer: "인플루언서" }

export default function RankingPage() {
  const { theme } = useSiteTheme()
  const { locale } = useLocale()
  const isKo = locale === "ko"
  const basePath = theme === "black" ? "/black" : ""
  const [activeTab, setActiveTab] = useState<"artist" | "collector">("artist")
  const [showMore, setShowMore] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [sortBy, setSortBy] = useState<"sales" | "volume" | "new">("sales")
  const logoSrc = theme === "black" ? "/logo-white.png" : "/logo-pink.png"

  const topThree = artistRankDataFull.slice(0, 3)
  const listCount = showMore ? 20 : INITIAL_LIST_COUNT
  const restArtists = artistRankDataFull.slice(3, listCount)
  const hasMore = artistRankDataFull.length > INITIAL_LIST_COUNT

  return (
    <div className="min-h-screen bg-black text-white pb-for-nav relative overflow-hidden">
      {/* Ambient lighting effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FF6B9D]/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/3 right-0 w-80 h-80 bg-amber-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Header — 모바일: 로고·우측 한 줄·테마 안 짤리게 */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-[#FF6B9D]/20 overflow-visible">
        <div className="flex items-center justify-between gap-2 px-3 py-3 min-h-[3.5rem] sm:min-h-[6rem] sm:px-4">
          <div className="h-12 w-24 min-w-0 flex-shrink-0 sm:h-[72px] sm:w-[225px]">
            <Link href={basePath || "/"} className="block h-full w-full">
              <Image
                src={logoSrc}
                alt="Krunch"
                width={225}
                height={72}
                className={`h-full w-full object-contain object-left ${theme !== "black" ? "scale-[1.02] origin-center" : ""}`}
              />
            </Link>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 overflow-visible">
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <Sparkles className={`w-4 h-4 shrink-0 sm:w-5 sm:h-5 ${theme === "black" ? "text-white" : "text-[#FF6B9D]"}`} />
              <span className={isKo ? "font-sans font-bold tracking-tight text-sm sm:text-base text-white/95 uppercase whitespace-nowrap" : "font-display text-sm sm:text-lg tracking-wide text-white uppercase whitespace-nowrap"}>{isKo ? "랭킹" : "Ranking"}</span>
            </div>
            <Link href={`${basePath}/search`} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors shrink-0">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
            </Link>
            <Link href={`${basePath}/notifications`} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors relative shrink-0">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
              <span className={`absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${theme === "black" ? "bg-white" : "bg-[#FF6B9D]"}`} />
            </Link>
            <ThemeToggle inline />
            <LanguageToggle inline />
          </div>
        </div>
      </header>

      {/* Tab Switcher — 모드 바뀌어도 세로 높이 동일하게 (다크는 배경만 absolute) */}
      <div className="px-4 pt-6 relative z-10">
        <div className="flex gap-2 rounded-full relative">
          {theme === "black" && (
            <div className="absolute inset-0 rounded-full bg-black/40 backdrop-blur-sm ring-1 ring-[rgba(255,105,180,0.25)] pointer-events-none" aria-hidden />
          )}
          <button
            onClick={() => setActiveTab("artist")}
            className={`flex-1 py-3 px-6 rounded-[24px] text-sm font-bold transition-all duration-300 ease-in-out relative overflow-hidden ${
              activeTab === "artist"
                ? theme === "black"
                  ? "bg-transparent text-white border-2 border-white/90"
                  : "bg-gradient-to-r from-[#FF006E] to-[#FF4D94] text-white shadow-lg shadow-[#FF006E]/40"
                : theme === "black"
                  ? "text-white/50 hover:text-white/80 border border-white/10"
                  : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white/80"
            }`}
          >
            {activeTab === "artist" && theme !== "black" && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            )}
            <span className="relative z-10">{isKo ? "아티스트 랭킹" : "Artist Rank"}</span>
          </button>
          <button
            onClick={() => setActiveTab("collector")}
            className={`flex-1 py-3 px-6 rounded-[24px] text-sm font-bold transition-all duration-300 ease-in-out relative overflow-hidden ${
              activeTab === "collector"
                ? theme === "black"
                  ? "bg-transparent text-white border-2 border-white/90"
                  : "bg-gradient-to-r from-[#FF006E] to-[#FF4D94] text-white shadow-lg shadow-[#FF006E]/40"
                : theme === "black"
                  ? "text-white/50 hover:text-white/80 border border-white/10"
                  : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white/80"
            }`}
          >
            {activeTab === "collector" && theme !== "black" && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            )}
            <span className="relative z-10">{isKo ? "최고 컬렉터" : "Top Collectors"}</span>
          </button>
        </div>
      </div>

      {activeTab === "artist" ? (
        <div className="px-4 pt-6 relative z-10 space-y-4">
          {/* This week stats card */}
          <div className="rounded-xl p-3 border border-white/10 bg-white/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-sm shrink-0" aria-hidden>📊</span>
              <p className="text-xs font-bold text-white/90 uppercase tracking-wider">
                {isKo ? "이번 주 통계" : "This Week's Stats"}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-1.5 text-sm">
              <p className="text-white/90"><span className="text-white/50 text-xs">{isKo ? "총 거래액:" : "Total Volume:"}</span> <span className="font-bold text-white">₩ {(STATS.totalVolume / 1_000_000_000).toFixed(1)}B</span></p>
              <p className="text-white/90"><span className="text-white/50 text-xs">{isKo ? "활성 컬렉터:" : "Active Collectors:"}</span> <span className="font-bold text-white">{STATS.activeCollectors.toLocaleString()}</span></p>
              <p className="text-white/90"><span className="text-white/50 text-xs">{isKo ? "신규 아티스트:" : "New Artists:"}</span> <span className="font-bold text-white">{STATS.newArtists}</span></p>
            </div>
          </div>

          {/* 필터 & 정렬 — 핑크/다크 공통 */}
          <div className="flex flex-wrap items-center gap-2">
            {["All", "K-POP", "Actor", "Athlete", "Influencer"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  categoryFilter === cat
                    ? theme === "black"
                      ? "bg-white/15 text-white border border-white/20"
                      : "bg-[#FF006E]/20 text-[#FF6B9D] border border-[#FF6B9D]/40"
                    : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white/80"
                }`}
              >
                {isKo ? CAT_LABELS[cat] ?? cat : cat}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">{isKo ? "정렬" : "Sort"}</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "sales" | "volume" | "new")}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-[#FF6B9D]/50"
              >
                <option value="sales">{isKo ? "판매량순" : "By Sales"}</option>
                <option value="volume">{isKo ? "거래액순" : "By Volume"}</option>
                <option value="new">{isKo ? "신규순" : "By New"}</option>
              </select>
            </div>
          </div>

          {/* 상위 3명 포디엄 — 진입: 아래→위 페이드인 0.3초, 0.1초 간격 */}
          <div className="flex items-end justify-center gap-3 mb-10">
            {/* 2위 (JENNIE) — 클릭 시 아티스트 페이지 */}
            <div className="rank-podium-in flex flex-col items-center w-[30%] group" style={{ animationDelay: "0s" }}>
              <Link href={`${basePath}/artist/${topThree[1].rank}`} className="flex flex-col items-center w-full cursor-pointer hover:opacity-90 active:opacity-95 transition-opacity">
              <div className="relative mb-3">
                <div className={`absolute inset-0 rounded-full blur-xl transition-opacity ${theme === "black" ? "bg-white/10 opacity-50" : "bg-[#C0C0C0]/30 opacity-50 group-hover:opacity-75"}`} />
                <div
                  className={`relative w-18 h-18 rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-black bg-black ${theme === "black" ? "rank-2-ring-dark" : ""}`}
                  style={theme !== "black" ? { boxShadow: "0 0 0 2px #C0C0C0" } : undefined}
                >
                  <Image src={topThree[1].avatar || "/placeholder.svg"} alt={isKo && topThree[1].nameKo ? topThree[1].nameKo : topThree[1].name} width={72} height={72} className="object-cover w-full h-full" />
                </div>
                <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 border-black rank-2-badge ${theme === "black" ? "" : "bg-[#C0C0C0] text-black shadow-lg shadow-[#C0C0C0]/50"}`}>
                  2
                </div>
              </div>
              <p className="rank-2-name text-sm text-center truncate w-full mb-1">{isKo && topThree[1].nameKo ? topThree[1].nameKo : topThree[1].name}</p>
              <p className="rank-2-score text-xs font-semibold mb-3">{formatKRW(topThree[1].totalSales)}</p>
              <div className="rank-2-bar w-full h-20 rounded-t-xl border-t" />
              </Link>
            </div>

            {/* 1위 (G-DRAGON) — 클릭 시 아티스트 페이지 */}
            <div className="rank-podium-in flex flex-col items-center w-[36%] group" style={{ animationDelay: "0.1s" }}>
              <Link href={`${basePath}/artist/${topThree[0].rank}`} className="flex flex-col items-center w-full cursor-pointer hover:opacity-90 active:opacity-95 transition-opacity">
              <div className="relative mb-3">
                <div className={`absolute inset-0 rounded-full blur-2xl ${theme === "black" ? "opacity-0" : "bg-gradient-to-r from-amber-500/90 via-yellow-600/80 to-amber-600/90 opacity-45 rank-1-glow"}`} />
                {theme === "black" ? (
                  <div className="relative rank-1-avatar-ring-dark w-24 h-24 rounded-full">
                    <div className="w-full h-full rounded-full overflow-hidden bg-black">
                      <Image src={topThree[0].avatar || "/placeholder.svg"} alt={isKo && topThree[0].nameKo ? topThree[0].nameKo : topThree[0].name} width={96} height={96} className="object-cover w-full h-full" />
                    </div>
                  </div>
                ) : (
                  <div className="relative rank-1-gold-ring w-24 h-24 rounded-full overflow-hidden ring-4 ring-offset-4 ring-offset-black shadow-2xl">
                    <Image src={topThree[0].avatar || "/placeholder.svg"} alt={isKo && topThree[0].nameKo ? topThree[0].nameKo : topThree[0].name} width={96} height={96} className="object-cover w-full h-full" />
                  </div>
                )}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full flex items-center justify-center text-base font-black rank-1-badge shadow-xl shadow-amber-500/40">
                  <Crown className="w-5 h-5" fill="currentColor" />
                </div>
                {theme !== "black" && (
                  <div className="absolute -top-2 right-0">
                    <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
                  </div>
                )}
              </div>
              <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${theme === "black" ? "rank-1-label-dark text-white/90" : "text-amber-400/90"}`}>{isKo ? "1위" : "1st PLACE"}</p>
              <p className={`rank-1-name text-lg text-center mb-1 ${theme === "black" ? "rank-1-name-dark" : ""}`}>{isKo && topThree[0].nameKo ? topThree[0].nameKo : topThree[0].name}</p>
              <p className={`rank-1-score mb-3 ${theme === "black" ? "rank-1-score-dark text-base font-bold" : "text-base font-bold scale-[1.3] origin-center"}`}>{formatKRW(topThree[0].totalSales)}</p>
              <div className="rank-1-bar w-full h-32 rounded-t-xl border-t-2" />
              </Link>
            </div>

            {/* 3위 (SON HEUNG MIN) — 클릭 시 아티스트 페이지 */}
            <div className="rank-podium-in flex flex-col items-center w-[30%] group" style={{ animationDelay: "0.2s" }}>
              <Link href={`${basePath}/artist/${topThree[2].rank}`} className="flex flex-col items-center w-full cursor-pointer hover:opacity-90 active:opacity-95 transition-opacity">
              <div className="relative mb-3">
                <div className={`absolute inset-0 rounded-full blur-xl transition-opacity ${theme === "black" ? "bg-white/10 opacity-40" : "bg-[#CD7F32]/40 opacity-35 group-hover:opacity-50"}`} />
                <div
                  className={`relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-black bg-black ${theme === "black" ? "rank-3-ring-dark" : ""}`}
                  style={theme !== "black" ? { boxShadow: "0 0 0 2px #CD7F32" } : undefined}
                >
                  <Image src={topThree[2].avatar || "/placeholder.svg"} alt={isKo && topThree[2].nameKo ? topThree[2].nameKo : topThree[2].name} width={64} height={64} className="object-cover w-full h-full" />
                </div>
                <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-black rank-3-badge ${theme === "black" ? "" : "bg-[#CD7F32] text-black shadow-lg shadow-[#CD7F32]/50"}`}>
                  3
                </div>
              </div>
              <p className="rank-3-name text-sm font-bold text-center truncate w-full mb-1">{isKo && topThree[2].nameKo ? topThree[2].nameKo : topThree[2].name}</p>
              <p className="rank-3-score text-xs font-semibold mb-3">{formatKRW(topThree[2].totalSales)}</p>
              <div className="rank-3-bar w-full h-16 rounded-t-xl border-t" />
              </Link>
            </div>
          </div>

          {/* 나머지 순위 — 진입은 wrapper에만 적용(하이라이트와 충돌 방지) / 순위 변동 시 3초 하이라이트 */}
          <div className="space-y-3">
            {restArtists.map((artist, index) => (
              <div key={artist.rank} className="rank-list-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <Link
                  href={`${basePath}/artist/${artist.rank}`}
                  className={`rank-list-item group flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 relative overflow-hidden cursor-pointer ${
                    theme === "black"
                      ? "border-white/5 hover:bg-white/[0.08] hover:border-white/20 rank-list-item-dark"
                      : "bg-white/[0.03] border-white/10 hover:bg-white/[0.08] hover:border-[#FF006E]/30 hover:translate-x-1"
                  } ${artist.rankChange !== undefined && artist.rankChange !== 0 ? "rank-item-just-changed" : ""}`}
                >
                {theme !== "black" && <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B9D]/0 via-[#FF6B9D]/5 to-[#FF6B9D]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />}
                <span
                  className={`rank-list-number w-8 h-8 min-w-[32px] rounded-full flex items-center justify-center text-sm font-black relative z-10 ${theme === "black" ? "bg-[rgba(255,0,110,0.2)] text-[#FF1493]" : "bg-[rgba(255,0,110,0.2)] text-[#FF6B9D]"}`}
                >
                  {artist.rank}
                </span>
                <div className={`relative w-12 h-12 rounded-full overflow-hidden ring-2 transition-all ${theme === "black" ? "ring-white/20 group-hover:ring-[rgba(255,105,180,0.4)]" : "ring-white/20 group-hover:ring-[#FF6B9D]/50"}`}>
                  <Image
                    src={artist.avatar || "/placeholder.svg"}
                    alt={isKo && artist.nameKo ? artist.nameKo : artist.name}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex-1 min-w-0 relative z-10">
                  <p className="rank-list-name text-white text-base font-bold truncate">{isKo && artist.nameKo ? artist.nameKo : artist.name}</p>
                  <p className={`text-xs font-medium ${theme === "black" ? "text-[#808080]" : "text-white/50"}`}>
                    {isKo ? `${artist.itemsSold}건 낙찰` : `${artist.itemsSold} items sold`}
                    {artist.rankChange !== undefined && artist.rankChange !== 0 && (
                      <span className={`ml-1.5 font-semibold ${artist.rankChange > 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                        {artist.rankChange > 0 ? `↑${artist.rankChange}` : `↓${Math.abs(artist.rankChange)}`}
                      </span>
                    )}
                    {artist.rankChange === 0 && <span className="ml-1.5 text-[#6B7280]">-</span>}
                  </p>
                  <p className={`text-[10px] mt-0.5 ${theme === "black" ? "text-[#606060]" : "text-white/40"}`}>
                    {formatKRW(artist.totalSales)} (₩\u2009{artist.totalSales.toLocaleString()})
                  </p>
                </div>
                <div className="text-right relative z-10">
                  <p className="rank-list-score text-white font-bold relative z-10 text-base">{formatKRW(artist.totalSales)}</p>
                </div>
                <ChevronRight className={`rank-list-arrow w-5 h-5 shrink-0 ${theme === "black" ? "" : "text-white/20 transition-all group-hover:text-[#FF6B9D] group-hover:translate-x-1"}`} />
              </Link>
              </div>
            ))}
          </div>
          {hasMore && (
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${theme === "black" ? "bg-white/10 text-white border border-white/10 hover:bg-white/15" : "bg-white/5 text-white/80 border border-white/10 hover:bg-white/10"}`}
            >
              {showMore ? (isKo ? "접기" : "Collapse") : (isKo ? "더보기 (8~20위)" : "See more (8–20)")}
            </button>
          )}
        </div>
      ) : (
        <div className="px-4 pt-8 space-y-4 relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <Crown className={`w-5 h-5 ${theme === "black" ? "text-white" : "text-[#FF6B9D]"}`} />
            <p className={isKo ? "text-white font-sans font-bold text-lg tracking-tight" : "text-white font-display text-lg tracking-wide font-medium"}>{isKo ? "아티스트별 최고 팬" : "Top Fans by Artist"}</p>
          </div>
          {topCollectorsData.map((collector) => (
            <div
              key={collector.rank}
              className={`group p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden cursor-pointer ${
                theme === "black"
                  ? collector.rank === 1
                    ? "bg-[#1a1a1a] border-2 border-[rgba(255,105,180,0.3)] shadow-[0_8px_32px_rgba(255,105,180,0.2)] hover:bg-[#222] hover:border-[rgba(255,105,180,0.45)] hover:shadow-[0_8px_32px_rgba(255,105,180,0.28)]"
                    : "bg-[#1a1a1a] border border-white/10 hover:bg-[#222] hover:border-[rgba(255,105,180,0.35)] hover:shadow-[0_4px_20px_rgba(255,105,180,0.18)]"
                  : collector.rank === 1
                    ? "bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border-amber-500/40 shadow-2xl shadow-amber-500/20"
                    : "bg-gradient-to-r from-white/5 via-white/5 to-transparent border-white/10 hover:border-[#FF6B9D]/50 hover:shadow-lg hover:shadow-[#FF6B9D]/20"
              }`}
            >
              {/* 블랙 모드: 카드 안 아주 살짝 핑크 그라데이션 */}
              {theme === "black" && (
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none opacity-[0.07]"
                  style={{
                    background: collector.rank === 1
                      ? "linear-gradient(135deg, rgba(255,105,180,0.15) 0%, transparent 50%, rgba(255,20,147,0.08) 100%)"
                      : "linear-gradient(135deg, rgba(255,105,180,0.12) 0%, transparent 60%)",
                  }}
                />
              )}
              {collector.rank === 1 && theme !== "black" && (
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 via-yellow-400/10 to-orange-400/10 animate-pulse" />
              )}
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <span
                      className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-lg z-10 ${
                        theme === "black"
                          ? collector.rank === 1
                            ? "bg-white/95 text-black border border-[rgba(255,105,180,0.4)]"
                            : collector.rank === 2
                              ? "bg-[#C0C0C0] text-black"
                              : collector.rank === 3
                                ? "bg-[#808080] text-white"
                                : "bg-white/10 text-white/60"
                          : collector.rank === 1
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
                    <div className={`w-12 h-12 rounded-full overflow-hidden ring-2 transition-all ${theme === "black" ? "ring-white/20 group-hover:ring-[rgba(255,105,180,0.4)]" : "ring-white/20 group-hover:ring-[#FF6B9D]/50"}`}>
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
                    <p className={`text-white font-bold text-base transition-colors ${theme === "black" ? "group-hover:text-[#FF8FAB]" : "group-hover:text-[#FF6B9D]"}`}>{collector.userId}</p>
                    <p className={`text-xs font-medium ${theme === "black" ? "text-[#808080]" : "text-white/50"}`}>{isKo ? `${collector.artistFan}의 최고 열성 팬` : `${collector.artistFan}'s No.1 Fan`}</p>
                  </div>
                </div>
                <span className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wider whitespace-pre-line text-center leading-tight ${getBadgeStyle(collector.badge, theme === "black")}`}>
                  {collector.badge
                    .replace(/(\d+)\s+(LEGEND|UNIQUE)/g, "$1\u00A0$2") // 숫자와 단어 사이를 non-breaking space로
                    .replace(/(\d+\u00A0(?:LEGEND|UNIQUE))\s+(?=\d+)/g, "$1\n")} {/* 숫자+단어 쌍 사이에만 줄바꿈 */}
                </span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-white/10 relative z-10">
                <div>
                  <p className={`text-[10px] uppercase tracking-wider font-bold mb-1 ${theme === "black" ? "text-[#808080]" : "text-white/40"}`}>{isKo ? "총 사용액" : "Total Spent"}</p>
                  <p className={`text-white font-bold transition-colors ${theme === "black" ? "text-lg group-hover:text-[#FF8FAB]" : "text-base group-hover:text-[#FF6B9D]"}`}>{formatKRW(collector.totalSpent)}</p>
                </div>
                <div className="text-right">
                  <p className={`text-[10px] uppercase tracking-wider font-bold mb-1 ${theme === "black" ? "text-[#808080]" : "text-white/40"}`}>{isKo ? "보유 아이템" : "Items Owned"}</p>
                  <p className={`text-white font-bold ${theme === "black" ? "text-lg" : "text-base"}`}>{collector.itemsOwned}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
