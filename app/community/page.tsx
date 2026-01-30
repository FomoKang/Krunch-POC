"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, Bell, Home, Trophy, Users, User, MessageCircle, Flame, Zap, Store } from "lucide-react"
import { useSiteTheme } from "@/components/theme-provider"

// Fashion Battle 데이터
const fashionBattles = [
  {
    id: 1,
    title: "Luxury Bag Battle",
    leftCeleb: {
      name: "JENNIE",
      outfit: "샤넬 실버백",
      image: "/jennie-bag.jpg",
      votes: 65,
    },
    rightCeleb: {
      name: "가원",
      outfit: "백 공항패션",
      image: "/gawon-bag.jpg",
      votes: 35,
    },
    totalVotes: 15234,
    comments: [
      { user: "ChanelLover", text: "JENNIE's Chanel bag is iconic!" },
      { user: "PradaFan", text: "Gawon's airport style is so elegant" },
    ],
    isHot: true,
  },
  {
    id: 2,
    title: "Airport Fashion Showdown",
    leftCeleb: {
      name: "FELIX",
      outfit: "카멜 코트 공항룩",
      image: "/felix-airport.jpg",
      votes: 58,
    },
    rightCeleb: {
      name: "민규",
      outfit: "공항 패션",
      image: "/mingyu-airport.jpg",
      votes: 42,
    },
    totalVotes: 18765,
    comments: [
      { user: "StayForever", text: "Felix's camel coat is perfection!" },
      { user: "CaratFan", text: "Mingyu's airport style is so clean" },
    ],
    isHot: true,
  },
  {
    id: 3,
    title: "Airport Style Battle",
    leftCeleb: {
      name: "카리나",
      outfit: "공항 패션",
      image: "/karina-airport.jpg",
      votes: 62,
    },
    rightCeleb: {
      name: "이나경",
      outfit: "공항 패션",
      image: "/nagyeong-airport.jpg",
      votes: 38,
    },
    totalVotes: 14256,
    comments: [
      { user: "MYDay", text: "Karina's airport style is so chic!" },
      { user: "FashionLover", text: "Inagyeong's style is amazing!" },
    ],
    isHot: true,
  },
  {
    id: 4,
    title: "High Fashion Battle",
    leftCeleb: {
      name: "정해인",
      outfit: "돌체앤가바나",
      image: "/jhi-dgas.jpg",
      votes: 52,
    },
    rightCeleb: {
      name: "시온",
      outfit: "발렌티노",
      image: "/xion-valentino.jpg",
      votes: 48,
    },
    totalVotes: 12456,
    comments: [
      { user: "DGFan", text: "Jung Hae In's Dolce look is stunning!" },
      { user: "NCTzen", text: "Sion's Valentino is fire!" },
    ],
    isHot: false,
  },
]

// 투표 바 컴포넌트 (원래 빨강/파랑 유지)
function VoteBar({ leftPercent, rightPercent }: { leftPercent: number; rightPercent: number }) {
  return (
    <div className="flex h-2 rounded-full overflow-hidden bg-white/10">
      <div 
        className="bg-gradient-to-r from-[#FF3B5C] to-[#FF6B8A] transition-all duration-500"
        style={{ width: `${leftPercent}%` }}
      />
      <div 
        className="bg-gradient-to-r from-[#3B8BFF] to-[#6BB3FF] transition-all duration-500"
        style={{ width: `${rightPercent}%` }}
      />
    </div>
  )
}

// Fashion Battle 카드 컴포넌트 (블랙 모드: battle-card, hot-badge, vote-count, comment-user 등)
function BattleCard({ battle, isBlack }: { battle: typeof fashionBattles[0]; isBlack?: boolean }) {
  const [voted, setVoted] = useState<"left" | "right" | null>(null)
  const [leftVotes, setLeftVotes] = useState(battle.leftCeleb.votes)
  const [rightVotes, setRightVotes] = useState(battle.rightCeleb.votes)

  const handleVote = (side: "left" | "right") => {
    if (voted) return
    setVoted(side)
    if (side === "left") {
      setLeftVotes(prev => prev + 1)
    } else {
      setRightVotes(prev => prev + 1)
    }
  }

  const total = leftVotes + rightVotes
  const leftPercent = Math.round((leftVotes / total) * 100)
  const rightPercent = 100 - leftPercent

  const leftBorder = voted === "left" ? "border-[#FF3B5C] shadow-lg shadow-[#FF3B5C]/30" : "border-transparent hover:border-[#FF3B5C]/50"
  const rightBorder = voted === "right" ? "border-[#3B8BFF] shadow-lg shadow-[#3B8BFF]/30" : "border-transparent hover:border-[#3B8BFF]/50"
  const leftOverlay = "from-[#FF3B5C]/40"
  const rightOverlay = "from-[#3B8BFF]/40"
  const leftBadge = "bg-[#FF3B5C]"
  const rightBadge = "bg-[#3B8BFF]"

  return (
    <div className={`rounded-2xl overflow-hidden relative ${isBlack ? "battle-card" : "bg-[#0d0d0d] border border-white/10"}`}>
      {/* Hot 뱃지 */}
      {battle.isHot && (
        <div className="absolute top-3 right-3 z-30 flex items-center gap-1 text-white text-xs font-bold px-2 py-1 rounded-full hot-badge">
          <Flame className="w-3 h-3" />
          HOT
        </div>
      )}

      {/* 배틀 타이틀 */}
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-white/80 text-sm font-medium">{battle.title}</h3>
      </div>

      {/* VS 이미지 영역 */}
      <div className="relative px-4">
        <div className="flex gap-2 relative">
          {/* 왼쪽 셀럽 */}
          <button 
            onClick={() => handleVote("left")}
            className={`flex-1 relative rounded-xl overflow-hidden border-2 transition-all duration-300 ${leftBorder}`}
          >
            <div className="aspect-[3/4] relative bg-gradient-to-br from-[#1a0a0a] to-[#0d0505]">
              <Image
                src={battle.leftCeleb.image || "/placeholder.svg"}
                alt={battle.leftCeleb.name}
                fill
                className="object-cover"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${leftOverlay} to-transparent`} />
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                <p className="text-white font-bold text-sm">{battle.leftCeleb.name}</p>
                <p className="text-white/60 text-xs">{battle.leftCeleb.outfit}</p>
              </div>
            </div>
            <div className={`absolute top-2 left-2 ${leftBadge} text-white text-xs font-bold px-2 py-1 rounded-full ${voted ? "opacity-100" : "opacity-0"} transition-opacity`}>
              {leftPercent}%
            </div>
          </button>

          {/* 오른쪽 셀럽 */}
          <button 
            onClick={() => handleVote("right")}
            className={`flex-1 relative rounded-xl overflow-hidden border-2 transition-all duration-300 ${rightBorder}`}
          >
            <div className="aspect-[3/4] relative bg-gradient-to-br from-[#0a0a1a] to-[#05050d]">
              <Image
                src={battle.rightCeleb.image || "/placeholder.svg"}
                alt={battle.rightCeleb.name}
                fill
                className="object-cover"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${rightOverlay} to-transparent`} />
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                <p className="text-white font-bold text-sm">{battle.rightCeleb.name}</p>
                <p className="text-white/60 text-xs">{battle.rightCeleb.outfit}</p>
              </div>
            </div>
            <div className={`absolute top-2 right-2 ${rightBadge} text-white text-xs font-bold px-2 py-1 rounded-full ${voted ? "opacity-100" : "opacity-0"} transition-opacity`}>
              {rightPercent}%
            </div>
          </button>
        </div>
      </div>

      {/* 투표 바 */}
      <div className="px-4 pt-4">
        <VoteBar leftPercent={leftPercent} rightPercent={rightPercent} />
        <p className={`text-xs mt-2 text-center ${isBlack ? "vote-count" : "text-white/40"}`}>
          {battle.totalVotes.toLocaleString()} votes
        </p>
      </div>

      {/* 댓글 미리보기 */}
      <div className="px-4 py-3 mt-2 border-t border-white/5">
        <div className="space-y-2">
          {battle.comments.map((comment, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <User className="w-3 h-3 text-white/40" />
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-xs font-medium ${isBlack ? "comment-user" : "text-[#FF6B9D]"}`}>{comment.user}</span>
                <p className={`text-xs truncate ${isBlack ? "comment-text" : "text-white/60"}`}>{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
        <button className={`flex items-center gap-1 text-xs mt-3 transition-colors ${isBlack ? "view-all-comments" : "text-white/40 hover:text-white/60"}`}>
          <MessageCircle className="w-4 h-4" />
          View all comments
        </button>
      </div>
    </div>
  )
}

export default function CommunityPage() {
  const theme = useSiteTheme()
  const basePath = theme === "black" ? "/black" : ""
  const logoSrc = theme === "black" ? "/logo-white.png" : "/logo-pink.png"
  return (
    <div className="min-h-screen bg-black text-white pb-for-nav">
      {/* 상단 네비게이션 */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href={basePath || "/"} className={theme === "black" ? "block -mt-1" : ""}>
            <Image
              src={logoSrc}
              alt="Krunch"
              width={theme === "black" ? 248 : 150}
              height={theme === "black" ? 79 : 48}
              className={theme === "black" ? "h-[79px] w-[247px] object-contain object-left" : "h-12 w-[150px] object-contain object-left"}
            />
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className={`w-5 h-5 ${theme === "black" ? "text-white" : "text-[#FF6B9D]"}`} />
              <span className="font-display text-lg tracking-wide text-white uppercase">Community</span>
            </div>
            <Link href={`${basePath}/search`} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Search className="w-5 h-5 text-white/80" />
            </Link>
            <Link href={`${basePath}/notifications`} className="p-2 hover:bg-white/10 rounded-full transition-colors relative">
              <Bell className="w-5 h-5 text-white/80" />
              <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${theme === "black" ? "bg-white" : "bg-[#FF6B9D]"}`} />
            </Link>
          </div>
        </div>
      </header>

      <main className="px-4 py-6">
        {/* 페이지 타이틀 — 블랙 모드: arena-header, arena-icon, arena-subtitle */}
        <div className="mb-6">
          <h1 className={`font-display text-3xl tracking-wide uppercase italic flex items-center gap-2 ${theme === "black" ? "arena-header" : "text-white"}`}>
            FASHION ARENA
            <Zap className={`w-6 h-6 ${theme === "black" ? "arena-icon" : "text-yellow-400"}`} />
          </h1>
          <p className={`text-sm mt-1 ${theme === "black" ? "arena-subtitle" : "text-white/50"}`}>Vote for your favorite celebrity style</p>
        </div>

        {/* 배틀 피드 */}
        <div className="space-y-6">
          {fashionBattles.map((battle) => (
            <BattleCard key={battle.id} battle={battle} isBlack={theme === "black"} />
          ))}
        </div>
      </main>

      {/* 하단 탭바 — safe-area 적용으로 항상 보이게 */}
      <nav className="nav-bottom-bar bg-black/95 backdrop-blur-sm border-t border-white/10">
        <div className="flex items-center justify-around py-3">
          <Link href={basePath || "/"} className="flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors">
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </Link>
          <Link href={`${basePath}/ranking`} className="flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors">
            <Trophy className="w-6 h-6" />
            <span className="text-xs font-medium">Ranking</span>
          </Link>
          <Link href={`${basePath}/community`} className={`flex flex-col items-center gap-1 ${theme === "black" ? "text-white" : "text-[#FF6B9D]"}`}>
            <Users className="w-6 h-6" />
            <span className="text-xs font-medium">Community</span>
          </Link>
          <Link href={`${basePath}/market`} className="flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors">
            <Store className="w-6 h-6" />
            <span className="text-xs font-medium">2nd Market</span>
          </Link>
          <Link href={`${basePath}/profile`} className="flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors">
            <User className="w-6 h-6" />
            <span className="text-xs font-medium">My Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
