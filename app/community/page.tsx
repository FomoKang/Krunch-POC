"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, Bell, Home, Trophy, Users, User, MessageCircle, Flame, Zap, Store, Heart, Check } from "lucide-react"
import { useSiteTheme } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"

// 댓글 타입 (프로필 사진 추가)
type CommentItem = { user: string; text: string; avatar?: string }

// Fashion Battle 데이터 (endsIn: 마감까지 시간, 참여자 수는 totalVotes)
const fashionBattles = [
  {
    id: 1,
    title: "Luxury Bag Battle",
    leftCeleb: { name: "JENNIE", outfit: "샤넬 실버백", image: "/jennie-bag.jpg", votes: 65 },
    rightCeleb: { name: "가원", outfit: "백 공항패션", image: "/gawon-bag.jpg", votes: 35 },
    totalVotes: 15234,
    comments: [
      { user: "ChanelLover", text: "JENNIE's Chanel bag is iconic!", avatar: "/images/jennie-avatar.jpg" },
      { user: "PradaFan", text: "Gawon's airport style is so elegant", avatar: "/user1-profile.jpg" },
    ] as CommentItem[],
    isHot: true,
    endsInHours: 2,
  },
  {
    id: 2,
    title: "Airport Fashion Showdown",
    leftCeleb: { name: "FELIX", outfit: "카멜 코트 공항룩", image: "/felix-airport.jpg", votes: 58 },
    rightCeleb: { name: "민규", outfit: "공항 패션", image: "/mingyu-airport.jpg", votes: 42 },
    totalVotes: 18765,
    comments: [
      { user: "StayForever", text: "Felix's camel coat is perfection!", avatar: "/images/felix-avatar.jpg" },
      { user: "CaratFan", text: "Mingyu's airport style is so clean", avatar: "/user3-profile.jpg" },
    ] as CommentItem[],
    isHot: true,
    endsInHours: 24,
  },
  {
    id: 3,
    title: "Airport Style Battle",
    leftCeleb: { name: "카리나", outfit: "공항 패션", image: "/karina-airport.jpg", votes: 62 },
    rightCeleb: { name: "이나경", outfit: "공항 패션", image: "/nagyeong-airport.jpg", votes: 38 },
    totalVotes: 14256,
    comments: [
      { user: "MYDay", text: "Karina's airport style is so chic!", avatar: "/images/karina-avatar.jpg" },
      { user: "FashionLover", text: "Inagyeong's style is amazing!", avatar: "/user5-profile.jpg" },
    ] as CommentItem[],
    isHot: true,
    endsInHours: 48,
  },
  {
    id: 4,
    title: "High Fashion Battle",
    leftCeleb: { name: "정해인", outfit: "돌체앤가바나", image: "/jhi-dgas.jpg", votes: 52 },
    rightCeleb: { name: "시온", outfit: "발렌티노", image: "/xion-valentino.jpg", votes: 48 },
    totalVotes: 12456,
    comments: [
      { user: "DGFan", text: "Jung Hae In's Dolce look is stunning!", avatar: "/user7-profile.jpg" },
      { user: "NCTzen", text: "Sion's Valentino is fire!", avatar: "/user9-profile.jpg" },
    ] as CommentItem[],
    isHot: false,
    endsInHours: null as number | null,
  },
]

// 투표 바 (다크모드: 투표 전 무채색 두 가지 회색, 투표 후 선택한 쪽만 핑크)
function VoteBar({ leftPercent, rightPercent, pulseSide, isBlack }: { leftPercent: number; rightPercent: number; pulseSide?: "left" | "right" | null; isBlack?: boolean }) {
  const trackBg = isBlack ? "bg-[#374151]" : "bg-white/10"
  const grayLeft = "bg-[#374151] transition-all duration-500"   /* 왼쪽 무채색: 더 어두운 회색 */
  const grayRight = "bg-[#4B5563] transition-all duration-500"  /* 오른쪽 무채색: 살짝 밝은 회색 */
  const pinkBar = "bg-gradient-to-r from-[#FF6B9D] to-[#FF8FAB] transition-all duration-500 animate-pulse"
  const leftFilled = isBlack
    ? pulseSide === "left"
      ? pinkBar
      : grayLeft
    : `bg-gradient-to-r from-[#FF6B9D] to-[#FF8FAB] transition-all duration-500 ${pulseSide === "left" ? "animate-pulse" : ""}`
  const rightFilled = isBlack
    ? pulseSide === "right"
      ? pinkBar
      : grayRight
    : `bg-gradient-to-r from-[#3B8BFF] to-[#6BB3FF] transition-all duration-500 ${pulseSide === "right" ? "animate-pulse" : ""}`

  return (
    <div className={`flex h-2 rounded-full overflow-hidden ${trackBg}`}>
      <div className={leftFilled} style={{ width: `${leftPercent}%` }} />
      <div className={rightFilled} style={{ width: `${rightPercent}%` }} />
    </div>
  )
}

// 숫자 카운트업 (0.5초)
function useAnimatedCount(target: number, duration = 500, enabled = true) {
  const [display, setDisplay] = useState(target)
  const prevRef = useRef(target)
  useEffect(() => {
    if (!enabled || target === prevRef.current) return
    const start = prevRef.current
    const startTime = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1)
      const eased = 1 - (1 - t) * (1 - t)
      setDisplay(Math.round(start + (target - start) * eased))
      if (t < 1) requestAnimationFrame(tick)
      else prevRef.current = target
    }
    requestAnimationFrame(tick)
  }, [target, duration, enabled])
  return display
}

// 참여자 수 포맷 (18K 등)
function formatParticipants(n: number) {
  if (n >= 10000) return `${(n / 1000).toFixed(0)}K`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

type BattleItem = (typeof fashionBattles)[0]

// Fashion Battle 카드: 투표 애니메이션, 토스트, HOT 개선, 댓글 프로필/이모지, 이미지 호버·하트
function BattleCard({ battle, isBlack }: { battle: BattleItem; isBlack?: boolean }) {
  const [voted, setVoted] = useState<"left" | "right" | null>(null)
  const [leftVotes, setLeftVotes] = useState(battle.leftCeleb.votes)
  const [rightVotes, setRightVotes] = useState(battle.rightCeleb.votes)
  const [showToast, setShowToast] = useState(false)
  const [heartAnim, setHeartAnim] = useState<"left" | "right" | null>(null)

  const displayLeft = useAnimatedCount(leftVotes, 500, true)
  const displayRight = useAnimatedCount(rightVotes, 500, true)
  const total = leftVotes + rightVotes
  const displayTotal = displayLeft + displayRight
  const leftPercent = total ? Math.round((leftVotes / total) * 100) : 50
  const rightPercent = 100 - leftPercent

  const handleVote = (side: "left" | "right") => {
    if (voted) return
    setVoted(side)
    setHeartAnim(side)
    setTimeout(() => setHeartAnim(null), 600)
    if (side === "left") setLeftVotes((prev) => prev + 1)
    else setRightVotes((prev) => prev + 1)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  const leftBorder = isBlack
    ? voted === "left"
      ? "border-[#FF3B5C] shadow-lg shadow-[#FF3B5C]/30"
      : "border-[rgba(255,255,255,0.15)] hover:border-[rgba(255,255,255,0.3)]"
    : voted === "left"
      ? "border-[#FF3B5C] shadow-lg shadow-[#FF3B5C]/30"
      : "border-transparent hover:border-[#FF3B5C]/50"
  const rightBorder = isBlack
    ? voted === "right"
      ? "border-[#3B8BFF] shadow-lg shadow-[#3B8BFF]/30"
      : "border-[rgba(255,255,255,0.15)] hover:border-[rgba(255,255,255,0.3)]"
    : voted === "right"
      ? "border-[#3B8BFF] shadow-lg shadow-[#3B8BFF]/30"
      : "border-transparent hover:border-[#3B8BFF]/50"
  const leftOverlay = "from-[#FF3B5C]/40"
  const rightOverlay = "from-[#3B8BFF]/40"
  const leftBadge = "bg-[#FF3B5C]"
  const rightBadge = "bg-[#3B8BFF]"
  const battleWithEnds = battle as BattleItem & { endsInHours?: number | null }
  const endsInHours = battleWithEnds.endsInHours ?? null

  return (
    <div className={`rounded-2xl overflow-hidden relative ${isBlack ? "battle-card" : "bg-[#0d0d0d] border border-white/10"}`}>
      {/* 투표 완료 토스트 */}
      {showToast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2 rounded-full bg-black/90 border border-white/20 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-white">투표 완료!</span>
        </div>
      )}

      <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-3">
        <h3 className="text-white/80 text-sm font-medium flex-1 min-w-0">{battle.title}</h3>
        {/* HOT 뱃지: 고정 높이로 모드 바꿔도 세로 위치 동일 */}
        {battle.isHot && (
          <div className={`rounded-xl px-2.5 py-1.5 min-h-[3.25rem] min-w-[4rem] flex flex-col items-end justify-center text-right flex-shrink-0 ${isBlack ? "bg-transparent" : "hot-badge shadow-lg"}`}>
            <div className="flex items-center justify-end gap-1">
              {isBlack ? <span className="text-white text-sm leading-none">🔥</span> : <Flame className="w-3.5 h-3.5 shrink-0 text-white" />}
              <span className="text-white text-xs font-bold tracking-tight">HOT</span>
            </div>
            <div className={`text-[10px] font-semibold mt-0.5 leading-tight ${isBlack ? "text-white/80" : "text-white/95"}`}>
              {formatParticipants(displayTotal)}명
              {endsInHours != null && endsInHours <= 24 && ` · ${endsInHours}시간 남음`}
            </div>
          </div>
        )}
      </div>

      {/* VS 이미지: 호버 1.02배, 투표 전 반투명 하트 / 투표 후 채워진 하트 + 애니메이션, 중복 방지 */}
      <div className="relative px-4">
        <div className="flex gap-2 relative">
          {/* 왼쪽 */}
          <button
            type="button"
            onClick={() => handleVote("left")}
            disabled={!!voted}
            className={`flex-1 relative rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-[1.02] disabled:pointer-events-none disabled:opacity-100 ${leftBorder} ${voted && voted !== "left" ? "opacity-60" : ""}`}
          >
            <div className="aspect-[3/4] relative bg-gradient-to-br from-[#1a0a0a] to-[#0d0505]">
              <Image
                src={battle.leftCeleb.image || "/placeholder.svg"}
                alt={battle.leftCeleb.name}
                fill
                className="object-cover"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${leftOverlay} to-transparent`} />
              {/* 하트: 투표 전 원형 배경으로 구분, 투표 후 채움 + 애니메이션 */}
              <div className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm ring-1 ring-white/20">
                {voted === "left" ? (
                  <Heart className={`w-4 h-4 fill-[#FF3B5C] text-[#FF3B5C] ${heartAnim === "left" ? "animate-[heart-pop_0.5s_ease-out]" : ""}`} />
                ) : (
                  <Heart className="w-4 h-4 text-white stroke-white/90" strokeWidth={2} fill="none" />
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                <p className={isBlack ? "text-white font-bold text-sm" : "text-white font-bold text-sm"}>{battle.leftCeleb.name}</p>
                <p className={isBlack ? "text-[#A0A0A0] text-xs" : "text-white/60 text-xs"}>{battle.leftCeleb.outfit}</p>
              </div>
            </div>
            <div className={`absolute top-2 left-2 ${leftBadge} text-white text-xs font-bold px-2 py-1 rounded-full ${voted ? "opacity-100" : "opacity-0"} transition-opacity`}>
              {leftPercent}%
            </div>
          </button>

          {/* 오른쪽 */}
          <button
            type="button"
            onClick={() => handleVote("right")}
            disabled={!!voted}
            className={`flex-1 relative rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-[1.02] disabled:pointer-events-none disabled:opacity-100 ${rightBorder} ${voted && voted !== "right" ? "opacity-60" : ""}`}
          >
            <div className="aspect-[3/4] relative bg-gradient-to-br from-[#0a0a1a] to-[#05050d]">
              <Image
                src={battle.rightCeleb.image || "/placeholder.svg"}
                alt={battle.rightCeleb.name}
                fill
                className="object-cover"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${rightOverlay} to-transparent`} />
              <div className="absolute top-2 left-2 flex items-center justify-center w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm ring-1 ring-white/20">
                {voted === "right" ? (
                  <Heart className={`w-4 h-4 fill-[#3B8BFF] text-[#3B8BFF] ${heartAnim === "right" ? "animate-[heart-pop_0.5s_ease-out]" : ""}`} />
                ) : (
                  <Heart className="w-4 h-4 text-white stroke-white/90" strokeWidth={2} fill="none" />
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                <p className="text-white font-bold text-sm">{battle.rightCeleb.name}</p>
                <p className={isBlack ? "text-[#A0A0A0] text-xs" : "text-white/60 text-xs"}>{battle.rightCeleb.outfit}</p>
              </div>
            </div>
            <div className={`absolute top-2 right-2 ${rightBadge} text-white text-xs font-bold px-2 py-1 rounded-full ${voted ? "opacity-100" : "opacity-0"} transition-opacity`}>
              {rightPercent}%
            </div>
          </button>
        </div>
        {voted && (
          <p className="text-[10px] text-center text-white/40 mt-1.5">이미 투표했어요</p>
        )}
      </div>

      {/* 투표 바: 0.5초 카운트업 반영, 선택 쪽 펄스 */}
      <div className="px-4 pt-4">
        <VoteBar leftPercent={leftPercent} rightPercent={rightPercent} pulseSide={voted} isBlack={isBlack} />
        <p className={`text-xs mt-2 text-center ${isBlack ? "vote-count" : "text-white/40"}`}>
          {displayTotal.toLocaleString()} votes
        </p>
      </div>

      {/* 댓글 미리보기 2개: 프로필 사진 + 이모지 반응 */}
      <div className="px-4 py-3 mt-2 border-t border-white/5">
        <div className="space-y-2">
          {battle.comments.slice(0, 2).map((comment, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-white/10 ring-2 ring-white/10">
                <Image
                  src={comment.avatar || "/images/profile-avatar.jpg"}
                  alt=""
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-xs font-medium ${isBlack ? "text-white" : "text-[#FF6B9D]"}`}>{comment.user}</span>
                <p className={`text-xs truncate ${isBlack ? "text-[#808080]" : "text-white/60"}`}>{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] text-white/40">반응</span>
          {["👍", "😍", "🔥", "👏"].map((emoji, i) => (
            <button key={i} type="button" className="text-base hover:scale-125 transition-transform" aria-label={`반응 ${emoji}`}>
              {emoji}
            </button>
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
  const { theme } = useSiteTheme()
  const basePath = theme === "black" ? "/black" : ""
  const logoSrc = theme === "black" ? "/logo-white.png" : "/logo-pink.png"
  return (
    <div className="min-h-screen bg-black text-white pb-for-nav">
      {/* 상단 네비게이션 — 모바일: 로고·우측 한 줄·테마 안 짤리게 */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/5 overflow-visible">
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
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <Users className={`w-4 h-4 shrink-0 sm:w-5 sm:h-5 ${theme === "black" ? "text-white" : "text-[#FF6B9D]"}`} />
              <span className="font-display text-sm sm:text-lg tracking-wide text-white uppercase whitespace-nowrap">Community</span>
            </div>
            <Link href={`${basePath}/search`} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors shrink-0">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
            </Link>
            <Link href={`${basePath}/notifications`} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors relative shrink-0">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
              <span className={`absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${theme === "black" ? "bg-white" : "bg-[#FF6B9D]"}`} />
            </Link>
            <ThemeToggle inline />
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

    </div>
  )
}
