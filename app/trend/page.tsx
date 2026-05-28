"use client"

import { Fragment, useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight, Sparkles, Flame, Zap, Search, Bell, Crown, MessageCircle, Heart, Check, Wallet, Gift, BadgeCheck } from "lucide-react"
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


// 댓글 타입 (프로필 사진 추가)
type CommentItem = { user: string; text: string; avatar?: string }

// Fashion Battle 데이터 (titleKo / outfitEn: locale별 표시)
const fashionBattles = [
  {
    id: 1,
    title: "Luxury Bag Battle",
    titleKo: "명품 백 배틀",
    leftCeleb: { name: "JENNIE", nameKo: "제니", nameEn: "JENNIE", outfit: "샤넬 실버백", outfitEn: "Chanel Silver Bag", image: "/jennie-bag.jpg", votes: 65 },
    rightCeleb: { name: "가원", nameKo: "가원", nameEn: "Gawon", outfit: "백 공항패션", outfitEn: "Bag Airport Fashion", image: "/gawon-bag.jpg", votes: 35 },
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
    titleKo: "공항 패션 배틀",
    leftCeleb: { name: "FELIX", nameKo: "펠릭스", nameEn: "FELIX", outfit: "카멜 코트 공항룩", outfitEn: "Camel Coat Airport Look", image: "/felix-airport.jpg", votes: 58 },
    rightCeleb: { name: "민규", nameKo: "민규", nameEn: "Mingyu", outfit: "공항 패션", outfitEn: "Airport Fashion", image: "/mingyu-airport.jpg", votes: 42 },
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
    titleKo: "공항 스타일 배틀",
    leftCeleb: { name: "카리나", nameKo: "카리나", nameEn: "Karina", outfit: "공항 패션", outfitEn: "Airport Fashion", image: "/karina-airport.jpg", votes: 62 },
    rightCeleb: { name: "이나경", nameKo: "이나경", nameEn: "Na Gyeong", outfit: "공항 패션", outfitEn: "Airport Fashion", image: "/nagyeong-airport.jpg", votes: 38 },
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
    titleKo: "하이엔드 배틀",
    leftCeleb: { name: "정해인", nameKo: "정해인", nameEn: "Jung Hae In", outfit: "돌체앤가바나", outfitEn: "Dolce & Gabbana", image: "/jhi-dgas.jpg", votes: 52 },
    rightCeleb: { name: "시온", nameKo: "시온", nameEn: "Sion", outfit: "발렌티노", outfitEn: "Valentino", image: "/xion-valentino.jpg", votes: 48 },
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
  const grayLeft = "bg-[#374151] transition-all duration-500"
  const grayRight = "bg-[#4B5563] transition-all duration-500"
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
function BattleCard({ battle, isBlack, isKo }: { battle: BattleItem; isBlack?: boolean; isKo?: boolean }) {
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
          <span className="text-sm font-medium text-white">{isKo ? "투표 완료!" : "Vote submitted!"}</span>
        </div>
      )}

      <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <StatusChip label="Meme Mission" isBlack={isBlack} />
            <StatusChip label="Wallet-gated Vote" isBlack={isBlack} />
            <StatusChip label="Community Reward" isBlack={isBlack} />
          </div>
          <h3 className="text-white/80 text-sm font-medium">{isKo && "titleKo" in battle ? battle.titleKo : battle.title}</h3>
          <p className={`mt-1 text-[11px] ${isBlack ? "text-white/45" : "text-white/40"}`}>Connect wallet to vote and unlock rewards</p>
        </div>
        {/* HOT 뱃지: 고정 높이로 모드 바꿔도 세로 위치 동일 */}
        {battle.isHot && (
          <div className={`rounded-xl px-2.5 py-1.5 min-h-[3.25rem] min-w-[4rem] flex flex-col items-end justify-center text-right flex-shrink-0 ${isBlack ? "bg-transparent" : "hot-badge shadow-lg"}`}>
            <div className="flex items-center justify-end gap-1">
              {isBlack ? <span className="text-white text-sm leading-none">🔥</span> : <Flame className="w-3.5 h-3.5 shrink-0 text-white" />}
              <span className="text-white text-xs font-bold tracking-tight">HOT</span>
            </div>
            <div className={`text-[10px] font-semibold mt-0.5 leading-tight tabular-nums ${isBlack ? "text-white/80" : "text-white/95"}`}>
              {isKo
                ? `${formatParticipants(displayTotal)}명 참여${endsInHours != null && endsInHours <= 24 ? ` · ${endsInHours}시간 뒤 종료` : ""}`
                : `${formatParticipants(displayTotal)} participants${endsInHours != null && endsInHours <= 24 ? ` · ${endsInHours}h left` : ""}`}
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
                <p className={isBlack ? "text-white font-bold text-sm" : "text-white font-bold text-sm"}>{isKo ? ("nameKo" in battle.leftCeleb ? battle.leftCeleb.nameKo : battle.leftCeleb.name) : ("nameEn" in battle.leftCeleb ? battle.leftCeleb.nameEn : battle.leftCeleb.name)}</p>
                <p className={isBlack ? "text-[#A0A0A0] text-xs" : "text-white/60 text-xs"}>{isKo ? battle.leftCeleb.outfit : "outfitEn" in battle.leftCeleb ? battle.leftCeleb.outfitEn : battle.leftCeleb.outfit}</p>
              </div>
            </div>
            <div className={`absolute top-2 left-2 ${leftBadge} text-white text-xs font-bold px-2 py-1 rounded-full tabular-nums ${voted ? "opacity-100" : "opacity-0"} transition-opacity`}>
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
                <p className="text-white font-bold text-sm">{isKo ? ("nameKo" in battle.rightCeleb ? battle.rightCeleb.nameKo : battle.rightCeleb.name) : ("nameEn" in battle.rightCeleb ? battle.rightCeleb.nameEn : battle.rightCeleb.name)}</p>
                <p className={isBlack ? "text-[#A0A0A0] text-xs" : "text-white/60 text-xs"}>{isKo ? battle.rightCeleb.outfit : "outfitEn" in battle.rightCeleb ? battle.rightCeleb.outfitEn : battle.rightCeleb.outfit}</p>
              </div>
            </div>
            <div className={`absolute top-2 right-2 ${rightBadge} text-white text-xs font-bold px-2 py-1 rounded-full tabular-nums ${voted ? "opacity-100" : "opacity-0"} transition-opacity`}>
              {rightPercent}%
            </div>
          </button>
        </div>
        {voted && (
          <p className="text-[10px] text-center text-white/40 mt-1.5">{isKo ? "이미 투표했어요" : "You already voted"}</p>
        )}
      </div>

      {/* 투표 바: 0.5초 카운트업 반영, 선택 쪽 펄스 */}
      <div className="px-4 pt-4">
        <VoteBar leftPercent={leftPercent} rightPercent={rightPercent} pulseSide={voted} isBlack={isBlack} />
        <p className="text-xs mt-2 text-center tabular-nums text-white/40">
          {isKo ? `${displayTotal.toLocaleString()}표` : `${displayTotal.toLocaleString()} votes`}
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
          <span className="text-[10px] text-white/40">{isKo ? "반응" : "Reactions"}</span>
          {["👍", "😍", "🔥", "👏"].map((emoji, i) => (
            <button key={i} type="button" className="text-base hover:scale-125 transition-transform" aria-label={isKo ? `반응 ${emoji}` : `Reaction ${emoji}`}>
              {emoji}
            </button>
          ))}
        </div>
        <button className={`flex items-center gap-1 text-xs mt-3 transition-colors ${isBlack ? "view-all-comments" : "text-white/40 hover:text-white/60"}`}>
          <MessageCircle className="w-4 h-4" />
          {isKo ? "댓글 모두 보기" : "View all comments"}
        </button>
      </div>
    </div>
  )
}

function StatusChip({ label, isBlack }: { label: string; isBlack?: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-bold leading-none ${
      isBlack
        ? "border-[rgba(255,105,180,0.35)] bg-white/[0.03] text-white/80"
        : "border-[#FF6B9D]/25 bg-[#FF6B9D]/10 text-[#FF8FAB]"
    }`}>
      {label}
    </span>
  )
}

function WalletCollabCard({ connected, onConnect, isBlack }: { connected: boolean; onConnect: () => void; isBlack?: boolean }) {
  return (
    <section className={`rounded-2xl border p-4 relative overflow-hidden ${
      isBlack
        ? "bg-[#121212] border-white/10 shadow-[0_8px_30px_rgba(255,105,180,0.08)]"
        : "bg-white/[0.04] border-white/10"
    }`}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF6B9D]/70 to-transparent" />
      {!connected ? (
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FF6B9D]/15 ring-1 ring-[#FF6B9D]/30">
            <Wallet className="h-5 w-5 text-[#FF6B9D]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF8FAB]">Krunch × MemeCore</p>
            <h2 className="mt-1 text-lg font-bold text-white">Connect Wallet</h2>
            <p className="mt-1 text-xs leading-relaxed text-white/58">Connect to join meme missions, vote, and unlock community rewards</p>
            <p className="mt-2 text-[11px] text-white/35">Supports MeCo Wallet, MetaMask, OKX Wallet</p>
          </div>
          <button
            type="button"
            onClick={onConnect}
            className="shrink-0 rounded-full bg-gradient-to-r from-[#FF006E] to-[#FF4D94] px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-[#FF006E]/25 transition-transform active:scale-95"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-400/12 ring-1 ring-emerald-300/25">
            <BadgeCheck className="h-5 w-5 text-emerald-300" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-400/12 px-2 py-1 text-[10px] font-bold text-emerald-200 ring-1 ring-emerald-300/20">Wallet Connected</span>
              <span className="text-xs font-semibold text-white/80">0x8A3F...19C2</span>
            </div>
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#FF6B9D]/12 px-2.5 py-1 text-[11px] font-bold text-[#FF8FAB] ring-1 ring-[#FF6B9D]/25">
              <Sparkles className="h-3 w-3" />
              Meme Pass Holder
            </div>
            <p className="mt-2 text-xs text-white/55">Vote, comment, and join missions</p>
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <button type="button" className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-bold text-white/80">My Missions</button>
            <button type="button" className="rounded-full border border-[#FF6B9D]/25 px-3 py-1.5 text-[11px] font-bold text-[#FF8FAB]">Rewards</button>
          </div>
        </div>
      )}
    </section>
  )
}

function MissionPreviewCard({ isBlack }: { isBlack?: boolean }) {
  const missions = ["Vote in 1 battle", "Leave 1 comment", "React to 3 posts"]
  const rewards = ["Meme Badge", "Fan XP", "Early Access Entry"]

  return (
    <section className={`rounded-2xl border p-4 ${
      isBlack
        ? "bg-[#121212] border-white/10"
        : "bg-white/[0.035] border-white/10"
    }`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-white">Mission Preview</p>
          <p className="mt-1 text-[11px] text-white/40">Community actions, light rewards</p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF6B9D]/12 ring-1 ring-[#FF6B9D]/25">
          <Gift className="h-4 w-4 text-[#FF8FAB]" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-2">
        {missions.map((mission) => (
          <div key={mission} className="flex items-center gap-2 text-xs text-white/65">
            <Check className="h-3.5 w-3.5 text-[#FF8FAB]" />
            <span>{mission}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {rewards.map((reward) => (
          <span key={reward} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-white/70 ring-1 ring-white/10">
            {reward}
          </span>
        ))}
      </div>
    </section>
  )
}

export default function TrendPage() {
  const { theme } = useSiteTheme()
  const { locale } = useLocale()
  const isKo = locale === "ko"
  const basePath = theme === "black" ? "/black" : ""
  const [activeMainTab, setActiveMainTab] = useState<"ranking" | "community">("community")
  const [walletConnected, setWalletConnected] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [sortBy, setSortBy] = useState<"sales" | "volume" | "new">("sales")
  const logoSrc = theme === "black" ? "/logo-white.png" : "/logo-pink.png"

  const [showMore, setShowMore] = useState(false)
  const topThree = artistRankDataFull.slice(0, 3)
  const nextFour = artistRankDataFull.slice(3, 7)
  const restArtists = artistRankDataFull.slice(7, 20)

  return (
    <div className="min-h-screen bg-black text-white pb-for-nav relative overflow-hidden">
      {/* Ambient lighting effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {theme === "black" ? (
          <>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FF69B4]/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/3 right-0 w-80 h-80 bg-white/5 rounded-full blur-[100px]" />
          </>
        ) : (
          <>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FF6B9D]/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/3 right-0 w-80 h-80 bg-amber-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
            <div className="absolute top-1/2 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: "2s" }} />
          </>
        )}
      </div>

      {/* Header — 모바일: 로고·우측 한 줄·테마 안 짤리게 */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b overflow-visible ${theme === "black" ? "bg-black/95 border-white/10" : "bg-black/80 border-[#FF6B9D]/20"}`}>
        <div className="flex items-center justify-between gap-1.5 px-2.5 py-3 min-h-[3.5rem] sm:min-h-[6rem] sm:gap-2 sm:px-4">
          <div className="h-16 w-32 min-w-0 flex-shrink-0 sm:h-[72px] sm:w-[225px]">
            <Link href={basePath || "/"} className="block h-full w-full">
              <Image
                src={logoSrc}
                alt="Krunch"
                width={225}
                height={72}
                className={`h-full w-full object-contain object-left`}
              />
            </Link>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 overflow-visible">
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <Sparkles className={`w-4 h-4 shrink-0 sm:w-5 sm:h-5 ${theme === "black" ? "text-white" : "text-[#FF6B9D]"}`} />
              <span className={isKo ? "font-sans font-bold tracking-tight text-xs sm:text-base text-white/95 uppercase whitespace-nowrap" : "font-display text-xs sm:text-lg tracking-wide text-white uppercase whitespace-nowrap"}>Meme</span>
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

      {/* Segmented Control — 랭킹 | 커뮤니티 */}
      <div className="px-4 pt-6 relative z-10">
        <div className="flex gap-2 rounded-full relative">
          {theme === "black" && (
            <div className="absolute inset-0 rounded-full bg-black/40 backdrop-blur-sm ring-1 ring-[rgba(255,105,180,0.25)] pointer-events-none" aria-hidden />
          )}
          <button
            onClick={() => setActiveMainTab("community")}
            className={`flex-1 py-3 px-6 rounded-[24px] text-sm font-bold transition-all duration-300 ease-in-out relative overflow-hidden border-2 ${
              activeMainTab === "community"
                ? theme === "black"
                  ? "bg-transparent text-white border-white/90"
                  : "bg-gradient-to-r from-[#FF006E] to-[#FF4D94] text-white shadow-lg shadow-[#FF006E]/40 border-transparent"
                : theme === "black"
                  ? "text-white/50 hover:text-white/80 border border-white/10"
                  : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white/80"
            }`}
          >
            {activeMainTab === "community" && theme !== "black" && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            )}
            <span className="relative z-10">Community</span>
          </button>
          <button
            onClick={() => setActiveMainTab("ranking")}
            className={`flex-1 py-3 px-6 rounded-[24px] text-sm font-bold transition-all duration-300 ease-in-out relative overflow-hidden border-2 ${
              activeMainTab === "ranking"
                ? theme === "black"
                  ? "bg-transparent text-white border-white/90"
                  : "bg-gradient-to-r from-[#FF006E] to-[#FF4D94] text-white shadow-lg shadow-[#FF006E]/40 border-transparent"
                : theme === "black"
                  ? "text-white/50 hover:text-white/80 border border-white/10"
                  : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white/80"
            }`}
          >
            {activeMainTab === "ranking" && theme !== "black" && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            )}
            <span className="relative z-10">Ranking</span>
          </button>
        </div>
      </div>

      {activeMainTab === "ranking" ? (
        <div className="px-4 pt-6 relative z-10 space-y-8">
          {/* 섹션 1: Top Artists */}
          <div>
            <div className="mb-4">
              <h2 className={`text-lg font-bold ${theme === "black" ? "text-white" : "text-white"}`}>
                {isKo ? "Top Artists" : "Top Artists"}
              </h2>
            </div>

            {/* 상위 3명 포디엄 */}
            <div className="flex items-end justify-center gap-3 mb-6">
              {/* 2위 */}
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
                  <p className="rank-2-score text-xs font-semibold mb-3 tabular-nums">{formatKRW(topThree[1].totalSales)}</p>
                  <div className="rank-2-bar w-full h-20 rounded-t-xl border-t" />
                </Link>
              </div>

              {/* 1위 */}
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
                  <p className={`rank-1-score mb-3 tabular-nums ${theme === "black" ? "rank-1-score-dark text-base font-bold" : "text-base font-bold scale-[1.3] origin-center"}`}>{formatKRW(topThree[0].totalSales)}</p>
                  <div className="rank-1-bar w-full h-32 rounded-t-xl border-t-2" />
                </Link>
              </div>

              {/* 3위 */}
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
                  <p className="rank-3-score text-xs font-semibold mb-3 tabular-nums">{formatKRW(topThree[2].totalSales)}</p>
                  <div className="rank-3-bar w-full h-16 rounded-t-xl border-t" />
                </Link>
              </div>
            </div>

            {/* 4~7위 리스트 */}
            <div className="space-y-3 mb-6">
              {nextFour.map((artist, index) => (
                <div key={artist.rank} className="rank-list-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <Link
                    href={`${basePath}/artist/${artist.rank}`}
                    className={`rank-list-item group flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 relative overflow-hidden cursor-pointer ${
                      theme === "black"
                        ? "border-white/5 hover:bg-white/[0.08] hover:border-white/20 rank-list-item-dark"
                        : "bg-white/[0.03] border-white/5 hover:bg-white/[0.08] hover:border-[#FF006E]/30 hover:translate-x-1"
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
                        <span className="tabular-nums">{isKo ? `${artist.itemsSold}건 낙찰` : `${artist.itemsSold} items sold`}</span>
                        {artist.rankChange !== undefined && artist.rankChange !== 0 && (
                          <span className={`ml-1.5 font-semibold tabular-nums ${artist.rankChange > 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                            {artist.rankChange > 0 ? `↑${artist.rankChange}` : `↓${Math.abs(artist.rankChange)}`}
                          </span>
                        )}
                        {artist.rankChange === 0 && <span className={`ml-1.5 ${theme === "black" ? "text-[#6B7280]" : "text-[#6B7280]"}`}>-</span>}
                      </p>
                      <p className={`text-[10px] mt-0.5 tabular-nums ${theme === "black" ? "text-[#606060]" : "text-white/40"}`}>
                        {formatKRW(artist.totalSales)} (₩{'\u2009'}{artist.totalSales.toLocaleString()})
                      </p>
                    </div>
                    <div className="text-right relative z-10">
                      <p className="rank-list-score text-white font-bold relative z-10 text-base tabular-nums">{formatKRW(artist.totalSales)}</p>
                    </div>
                    <ChevronRight className={`rank-list-arrow w-5 h-5 shrink-0 ${theme === "black" ? "" : "text-white/20 transition-all group-hover:text-[#FF6B9D] group-hover:translate-x-1"}`} />
                  </Link>
                </div>
              ))}
            </div>

            {/* 8위 이상 (펼쳐짐) */}
            {showMore && (
              <div className="space-y-3 mb-6">
                {restArtists.map((artist, index) => (
                  <div key={artist.rank} className="rank-list-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <Link
                      href={`${basePath}/artist/${artist.rank}`}
                      className={`rank-list-item group flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 relative overflow-hidden cursor-pointer ${
                        theme === "black"
                          ? "border-white/5 hover:bg-white/[0.08] hover:border-white/20 rank-list-item-dark"
                          : "bg-white/[0.03] border-white/5 hover:bg-white/[0.08] hover:border-[#FF006E]/30 hover:translate-x-1"
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
                          <span className="tabular-nums">{isKo ? `${artist.itemsSold}건 낙찰` : `${artist.itemsSold} items sold`}</span>
                          {artist.rankChange !== undefined && artist.rankChange !== 0 && (
                            <span className={`ml-1.5 font-semibold tabular-nums ${artist.rankChange > 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                              {artist.rankChange > 0 ? `↑${artist.rankChange}` : `↓${Math.abs(artist.rankChange)}`}
                            </span>
                          )}
                          {artist.rankChange === 0 && <span className={`ml-1.5 ${theme === "black" ? "text-[#6B7280]" : "text-[#6B7280]"}`}>-</span>}
                        </p>
                        <p className={`text-[10px] mt-0.5 tabular-nums ${theme === "black" ? "text-[#606060]" : "text-white/40"}`}>
                          {formatKRW(artist.totalSales)} (₩{'\u2009'}{artist.totalSales.toLocaleString()})
                        </p>
                      </div>
                      <div className="text-right relative z-10">
                        <p className="rank-list-score text-white font-bold relative z-10 text-base tabular-nums">{formatKRW(artist.totalSales)}</p>
                      </div>
                      <ChevronRight className={`rank-list-arrow w-5 h-5 shrink-0 ${theme === "black" ? "" : "text-white/20 transition-all group-hover:text-[#FF6B9D] group-hover:translate-x-1"}`} />
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {/* See more 버튼 */}
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                theme === "black"
                  ? "bg-white/10 text-white border border-white/10 hover:bg-white/15"
                  : "bg-white/5 text-white/80 border border-white/10 hover:bg-white/10"
              }`}
            >
              <span>{showMore ? (isKo ? "접기" : "Collapse") : (isKo ? "더보기" : "See more")}</span>
              <ChevronRight className={`w-4 h-4 transition-transform ${showMore ? "rotate-[-90deg]" : "rotate-90"}`} />
            </button>
          </div>

          {/* 섹션 2: Top Collectors - 가로 스크롤 */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Crown className={`w-5 h-5 ${theme === "black" ? "text-white" : "text-[#FF6B9D]"}`} />
              <h2 className={`text-lg font-bold ${theme === "black" ? "text-white" : "text-white"}`}>
                {isKo ? "Top Collectors" : "Top Collectors"}
              </h2>
            </div>
            <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
              <div className="flex gap-4" style={{ width: "max-content" }}>
                {topCollectorsData.map((collector) => (
                  <div
                    key={collector.rank}
                    className={`group flex-shrink-0 w-[280px] p-5 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden cursor-pointer ${
                      theme === "black"
                        ? collector.rank === 1
                          ? "bg-[#1a1a1a] border-[rgba(255,105,180,0.3)] shadow-[0_8px_32px_rgba(255,105,180,0.2)] hover:bg-[#222] hover:border-[rgba(255,105,180,0.45)] hover:shadow-[0_8px_32px_rgba(255,105,180,0.28)]"
                          : "bg-[#1a1a1a] border-white/10 hover:bg-[#222] hover:border-[rgba(255,105,180,0.35)] hover:shadow-[0_4px_20px_rgba(255,105,180,0.18)]"
                        : collector.rank === 1
                          ? "bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border-amber-500/40 shadow-2xl shadow-amber-500/20"
                          : "bg-gradient-to-r from-white/5 via-white/5 to-transparent border-transparent hover:border-[#FF6B9D]/50 hover:shadow-lg hover:shadow-[#FF6B9D]/20"
                    }`}
                  >
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
                    </div>
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wider whitespace-pre-line text-center leading-tight block mb-4 ${getBadgeStyle(collector.badge, theme === "black")}`}>
                      {collector.badge
                        .replace(/(\d+)\s+(LEGEND|UNIQUE)/g, "$1\u00A0$2")
                        .replace(/(\d+\u00A0(?:LEGEND|UNIQUE))\s+(?=\d+)/g, "$1\n")}
                    </span>
                    <div className="flex items-center justify-between pt-4 border-t border-white/10 relative z-10">
                      <div>
                        <p className={`text-[10px] uppercase tracking-wider font-bold mb-1 ${theme === "black" ? "text-[#808080]" : "text-white/40"}`}>{isKo ? "총 사용액" : "Total Spent"}</p>
                        <p className={`text-white font-bold transition-colors tabular-nums ${theme === "black" ? "text-base group-hover:text-[#FF8FAB]" : "text-base group-hover:text-[#FF6B9D]"}`}>{formatKRW(collector.totalSpent)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-[10px] uppercase tracking-wider font-bold mb-1 ${theme === "black" ? "text-[#808080]" : "text-white/40"}`}>{isKo ? "보유 아이템" : "Items Owned"}</p>
                        <p className={`text-white font-bold tabular-nums ${theme === "black" ? "text-base" : "text-base"}`}>{collector.itemsOwned}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <main className="px-4 py-6">
          <div className="mb-5">
            <WalletCollabCard connected={walletConnected} onConnect={() => setWalletConnected(true)} isBlack={theme === "black"} />
          </div>

          {/* 페이지 타이틀 */}
          <div className="mb-6">
            <p className={`mb-2 text-[10px] font-bold uppercase tracking-[0.22em] ${theme === "black" ? "text-[#FF8FAB]" : "text-[#FF6B9D]"}`}>KRUNCH × MEMECORE</p>
            <h1 className={`font-display text-3xl tracking-wide uppercase italic flex items-center gap-2 ${theme === "black" ? "arena-header" : "text-white"}`}>
              FASHION ARENA
              <Zap className={`w-6 h-6 ${theme === "black" ? "arena-icon" : "text-yellow-400"}`} />
            </h1>
            <p className={`text-sm mt-1 ${theme === "black" ? "arena-subtitle" : "text-white/50"}`}>Vote, react, and join fan missions</p>
          </div>

          {/* 배틀 피드 */}
          <div className="space-y-6">
            {fashionBattles.map((battle, index) => (
              <Fragment key={battle.id}>
                <BattleCard battle={battle} isBlack={theme === "black"} isKo={isKo} />
                {index === 0 && <MissionPreviewCard isBlack={theme === "black"} />}
              </Fragment>
            ))}
          </div>
        </main>
      )}
    </div>
  )
}
