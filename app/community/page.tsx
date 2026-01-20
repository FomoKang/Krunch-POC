"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, Bell, Home, Trophy, Users, User, MessageCircle, Flame, Zap, Store } from "lucide-react"

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

// 투표 바 컴포넌트
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

// Fashion Battle 카드 컴포넌트
function BattleCard({ battle }: { battle: typeof fashionBattles[0] }) {
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

  return (
    <div className="bg-[#0d0d0d] rounded-2xl overflow-hidden border border-white/10 relative">
      {/* Hot 뱃지 */}
      {battle.isHot && (
        <div className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
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
            className={`flex-1 relative rounded-xl overflow-hidden border-2 transition-all duration-300 ${
              voted === "left" 
                ? "border-[#FF3B5C] shadow-lg shadow-[#FF3B5C]/30" 
                : "border-transparent hover:border-[#FF3B5C]/50"
            }`}
          >
            <div className="aspect-[3/4] relative bg-gradient-to-br from-[#1a0a0a] to-[#0d0505]">
              <Image
                src={battle.leftCeleb.image || "/placeholder.svg"}
                alt={battle.leftCeleb.name}
                fill
                className="object-cover"
              />
              {/* 레드 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#FF3B5C]/40 to-transparent" />
              {/* 이름 */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                <p className="text-white font-bold text-sm">{battle.leftCeleb.name}</p>
                <p className="text-white/60 text-xs">{battle.leftCeleb.outfit}</p>
              </div>
            </div>
            {/* 투표 퍼센트 */}
            <div className={`absolute top-2 left-2 bg-[#FF3B5C] text-white text-xs font-bold px-2 py-1 rounded-full ${
              voted ? "opacity-100" : "opacity-0"
            } transition-opacity`}>
              {leftPercent}%
            </div>
          </button>

          {/* 오른쪽 셀럽 */}
          <button 
            onClick={() => handleVote("right")}
            className={`flex-1 relative rounded-xl overflow-hidden border-2 transition-all duration-300 ${
              voted === "right" 
                ? "border-[#3B8BFF] shadow-lg shadow-[#3B8BFF]/30" 
                : "border-transparent hover:border-[#3B8BFF]/50"
            }`}
          >
            <div className="aspect-[3/4] relative bg-gradient-to-br from-[#0a0a1a] to-[#05050d]">
              <Image
                src={battle.rightCeleb.image || "/placeholder.svg"}
                alt={battle.rightCeleb.name}
                fill
                className="object-cover"
              />
              {/* 블루 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#3B8BFF]/40 to-transparent" />
              {/* 이름 */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                <p className="text-white font-bold text-sm">{battle.rightCeleb.name}</p>
                <p className="text-white/60 text-xs">{battle.rightCeleb.outfit}</p>
              </div>
            </div>
            {/* 투표 퍼센트 */}
            <div className={`absolute top-2 right-2 bg-[#3B8BFF] text-white text-xs font-bold px-2 py-1 rounded-full ${
              voted ? "opacity-100" : "opacity-0"
            } transition-opacity`}>
              {rightPercent}%
            </div>
          </button>
        </div>
      </div>

      {/* 투표 바 */}
      <div className="px-4 pt-4">
        <VoteBar leftPercent={leftPercent} rightPercent={rightPercent} />
        <p className="text-white/40 text-xs mt-2 text-center">
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
                <span className="text-[#FF6B9D] text-xs font-medium">{comment.user}</span>
                <p className="text-white/60 text-xs truncate">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="flex items-center gap-1 text-white/40 text-xs mt-3 hover:text-white/60 transition-colors">
          <MessageCircle className="w-4 h-4" />
          View all comments
        </button>
      </div>
    </div>
  )
}

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* 상단 네비게이션 */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/">
            <Image src="/logo-pink.png" alt="Krunch" width={150} height={48} className="h-12 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#FF6B9D]" />
              <span className="font-display text-lg tracking-wide text-white uppercase">Community</span>
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

      <main className="px-4 py-6">
        {/* 페이지 타이틀 */}
        <div className="mb-6">
          <h1 className="font-display text-3xl tracking-wide text-white uppercase italic flex items-center gap-2">
            FASHION ARENA
            <Zap className="w-6 h-6 text-yellow-400" />
          </h1>
          <p className="text-white/50 text-sm mt-1">Vote for your favorite celebrity style</p>
        </div>

        {/* 배틀 피드 */}
        <div className="space-y-6">
          {fashionBattles.map((battle) => (
            <BattleCard key={battle.id} battle={battle} />
          ))}
        </div>
      </main>

      {/* 하단 탭바 */}
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
          <Link href="/community" className="flex flex-col items-center gap-1 text-[#FF6B9D]">
            <Users className="w-6 h-6" />
            <span className="text-xs font-medium">Community</span>
          </Link>
          <Link href="/market" className="flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors">
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
