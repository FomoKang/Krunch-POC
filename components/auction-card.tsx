"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Clock, ArrowUp } from "lucide-react"
import { Confetti } from "./confetti"
import { SuccessPopup } from "./success-popup"
import { useSiteTheme } from "./theme-provider"
import { useLocale } from "./locale-provider"
import { ThemeToggle } from "./theme-toggle"
import { LanguageToggle } from "./language-toggle"

const ONE_HOUR = 60 * 60
const TEN_MINUTES = 10 * 60
const TWENTY_FOUR_HOURS = 24 * 60 * 60

// Format number with thousand separators
const formatNumber = (value: string): string => {
  // Remove all non-numeric characters
  const numericValue = value.replace(/\D/g, "")
  if (!numericValue) return ""
  // Add thousand separators
  return parseInt(numericValue, 10).toLocaleString("en-US")
}

interface BidLogEntry {
  id: number
  username: string
  amount: number
  time: string
}

const AUCTION_THEMES = {
  default: {
    accent: "text-primary",
    accentBg: "bg-primary",
    accentBorder: "border-primary/30",
    accentBorderFocus: "border-primary/50 focus:border-primary",
    accentForeground: "text-primary-foreground",
    chartColor: "#FF6B9D",
  },
  black: {
    accent: "text-white",
    accentBg: "bg-[#FF006E]",
    accentForeground: "text-white",
    accentBorder: "border-[#1f1f1f]",
    accentBorderFocus: "border-[rgba(255,105,180,0.4)] focus:border-[rgba(255,105,180,0.5)]",
    chartColor: "#FF6B9D",
    chartGradient: true,
  },
} as const

type AuctionVariant = keyof typeof AUCTION_THEMES

// 가격 흐름 그래프: 그라디언트 채우기, 호버 툴팁, 다크모드 시 회색 + 호버 시 핑크
function PriceFlowChart({ data, chartColor = "#FF6B9D", useWhiteGrayGradient = false, useDarkGrayGraph = false }: { data: number[]; chartColor?: string; useWhiteGrayGradient?: boolean; useDarkGrayGraph?: boolean }) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<{ index: number; x: number; y: number; value: number } | null>(null)

  if (data.length < 2) return null
  const step = Math.max(1, Math.floor(data.length / 16))
  const sampled = data.filter((_, i) => i % step === 0 || i === data.length - 1)
  const min = Math.min(...sampled)
  const max = Math.max(...sampled)
  const range = max - min || 1
  const padding = { top: 10, right: 10, bottom: 10, left: 10 }
  const w = 400
  const h = 72

  const points: { x: number; y: number; value: number }[] = sampled.map((v, i) => ({
    x: padding.left + (i / (sampled.length - 1)) * (w - padding.left - padding.right),
    y: padding.top + (1 - (v - min) / range) * (h - padding.top - padding.bottom),
    value: v,
  }))
  const pathD = `M ${points.map((p) => `${p.x},${p.y}`).join(" L ")}`
  const areaD = `${pathD} L ${w - padding.right},${h - padding.bottom} L ${padding.left},${h - padding.bottom} Z`

  // 주요 변동점: 로컬 최소/최대 + 첫·끝 점
  const dotIndices = new Set<number>([0, sampled.length - 1])
  for (let i = 1; i < sampled.length - 1; i++) {
    const prev = sampled[i - 1]
    const curr = sampled[i]
    const next = sampled[i + 1]
    if ((curr <= prev && curr <= next) || (curr >= prev && curr >= next)) dotIndices.add(i)
  }

  const uid = useRef(`chart-${Math.random().toString(36).slice(2)}`).current
  const isHovered = hovered !== null
  const lineColor = useDarkGrayGraph ? (isHovered ? "#FF6B9D" : "#6B7280") : useWhiteGrayGradient ? undefined : chartColor
  const fillColor = useDarkGrayGraph ? (isHovered ? "#FF6B9D" : "#374151") : useWhiteGrayGradient ? "#FF69B4" : chartColor
  const fillOpacityTop = useDarkGrayGraph ? (isHovered ? "0.4" : "0.5") : useWhiteGrayGradient ? "0.25" : "0.45"
  const fillOpacityBottom = "0"
  const dotColor = useDarkGrayGraph ? (isHovered ? "#FF6B9D" : "#6B7280") : useWhiteGrayGradient ? "#fff" : chartColor

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = chartRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const xLocal = e.clientX - rect.left
    const xRatio = xLocal / rect.width
    const index = Math.round(xRatio * (sampled.length - 1))
    const clamped = Math.max(0, Math.min(index, sampled.length - 1))
    const p = points[clamped]
    if (p) setHovered({ index: clamped, x: xLocal, y: 0, value: p.value })
  }
  const handleMouseLeave = () => setHovered(null)

  return (
    <div
      ref={chartRef}
      className="relative w-full h-full cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full block">
        <defs>
          <linearGradient id={`fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity={fillOpacityTop} />
            <stop offset="100%" stopColor={fillColor} stopOpacity={fillOpacityBottom} />
          </linearGradient>
          {useWhiteGrayGradient && !useDarkGrayGraph && (
            <linearGradient id={`line-${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#666666" />
            </linearGradient>
          )}
        </defs>
        <path d={areaD} fill={`url(#fill-${uid})`} />
        <path
          d={pathD}
          fill="none"
          stroke={useDarkGrayGraph ? lineColor : useWhiteGrayGradient ? `url(#line-${uid})` : chartColor}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {Array.from(dotIndices).map((i) => (
          <circle
            key={i}
            cx={points[i].x}
            cy={points[i].y}
            r="3"
            fill={dotColor}
            className="opacity-90"
          />
        ))}
      </svg>
      {hovered && (
        <div
          className="absolute z-10 px-2.5 py-1.5 rounded-lg bg-black/90 text-white text-xs font-mono tabular-nums whitespace-nowrap pointer-events-none border border-white/10 shadow-lg"
          style={{
            left: hovered.x,
            top: 6,
            transform: "translateX(-50%)",
          }}
        >
          ₩{hovered.value.toLocaleString()}
        </div>
      )}
    </div>
  )
}

export function AuctionCard({ variant: variantProp }: { variant?: AuctionVariant } = {}) {
  const { theme: siteTheme } = useSiteTheme()
  const { locale } = useLocale()
  const variant: AuctionVariant = variantProp ?? siteTheme
  const theme = AUCTION_THEMES[variant]
  const isKo = locale === "ko"
  const [offerAmount, setOfferAmount] = useState(formatNumber("1"))
  const [currentBid, setCurrentBid] = useState(2450000)
  const [bidPulse, setBidPulse] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(TWENTY_FOUR_HOURS) // 24 hours in seconds
  const [demoTimePreset, setDemoTimePreset] = useState<0 | 1 | 2>(0) // 0=24h, 1=1h, 2=10min (시연용)
  const [showRedTime, setShowRedTime] = useState(false) // 1h 미만일 때 2초마다 흰색↔빨강
  const [bidLog, setBidLog] = useState<BidLogEntry[]>([])
  const [showBidLog, setShowBidLog] = useState(false)
  const [showAuctionCard, setShowAuctionCard] = useState(false)
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null)
  const logoSrc = variant === "black" ? "/logo-white.png" : "/logo-pink.png"
  // 시간별 가격 흐름 차트용 (포인트 적게 → 선 움직임 간략)
  const [priceHistory, setPriceHistory] = useState<number[]>(() =>
    Array.from({ length: 24 }, (_, i) => 2000000 + i * 18000 + Math.floor(Math.random() * 5000))
  )
  // 간헐적 비딩 알림 띠 (시간 밑에 팝업 형태)
  const [bidRibbon, setBidRibbon] = useState<{ username: string; amount: number } | null>(null)

  const BID_NAMES = [
    "StyleHunter", "AuctionPro", "Collector789", "StreetwearFan", "HypeBeast2024",
    "FashionLover", "SneakerHead", "UrbanCollector", "TrendSetter", "Fashionista",
  ]

  useEffect(() => {
    const showNext = () => {
      const amount = 2000000 + Math.floor(Math.random() * 2000000) + 500000
      setBidRibbon({
        username: BID_NAMES[Math.floor(Math.random() * BID_NAMES.length)],
        amount,
      })
      setTimeout(() => setBidRibbon(null), 2500)
    }
    const t = setTimeout(showNext, 800)
    const interval = setInterval(showNext, 5000)
    return () => {
      clearTimeout(t)
      clearInterval(interval)
    }
  }, [])

  // currentBid 변경 시 차트에 반영
  useEffect(() => {
    setPriceHistory((prev) => [...prev.slice(1), currentBid])
  }, [currentBid])

  // Handle input change with formatting
  const handleOfferChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    // Remove all non-numeric characters and format
    const formatted = formatNumber(inputValue)
    setOfferAmount(formatted)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBid((prev) => {
        const increment = Math.floor(Math.random() * 50000) + 10000
        setBidPulse(true)
        setTimeout(() => setBidPulse(false), 300)
        return prev + increment
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // 어제 대비 상승률 (기준가 고정 → 금액 오를수록 % 계속 올라감)
  const baselineBid = useRef(2000000)
  const risePercent = baselineBid.current > 0
    ? Math.round(((currentBid - baselineBid.current) / baselineBid.current) * 100)
    : 0

  useEffect(() => {
    if (timeRemaining <= 0) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(interval)
  }, [timeRemaining])

  const timeRemainingRef = useRef(timeRemaining)
  timeRemainingRef.current = timeRemaining
  // 1시간 미만: 2초 간격으로 흰색 ↔ 빨강 토글 (timeRemaining 의존 제거해 interval이 매초 리셋되지 않게)
  useEffect(() => {
    const t = setInterval(() => {
      const sec = timeRemainingRef.current
      if (sec > 0 && sec < ONE_HOUR) setShowRedTime((prev) => !prev)
    }, 2000)
    return () => clearInterval(t)
  }, [])

  const handleDemoTimeClick = () => {
    const next: 0 | 1 | 2 = demoTimePreset === 0 ? 1 : demoTimePreset === 1 ? 2 : 0
    setDemoTimePreset(next)
    setTimeRemaining(next === 0 ? TWENTY_FOUR_HOURS : next === 1 ? ONE_HOUR : TEN_MINUTES)
    setShowRedTime(false)
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleSetOffer = () => {
    // Parse the offer amount (remove commas)
    const numericAmount = parseInt(offerAmount.replace(/,/g, ""), 10)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return
    }

    // Update current bid
    setCurrentBid(numericAmount)
    setBidPulse(true)
    setTimeout(() => setBidPulse(false), 300)

    // Add to bid log
    const now = new Date()
    const timeString = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    
    const newBidEntry: BidLogEntry = {
      id: Date.now(),
      username: "You",
      amount: numericAmount,
      time: timeString,
    }

    setBidLog((prev) => [newBidEntry, ...prev].slice(0, 5)) // Keep only latest 5 entries

    // Show confetti and popup
    setShowConfetti(true)
    setTimeout(() => {
      setShowPopup(true)
    }, 300)
    setTimeout(() => {
      setShowConfetti(false)
    }, 2500)
  }

  const handleClosePopup = () => {
    setShowPopup(false)
  }

  return (
    <>
      <Confetti active={showConfetti} />
      <SuccessPopup show={showPopup} onClose={handleClosePopup} amount={offerAmount} />

      <div className="relative flex flex-col min-h-[100dvh] bg-transparent" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }}>
        {/* Header — 로고 좌측, 테마·언어 우측 */}
        <div className="relative z-50 flex items-center justify-between overflow-visible px-4" style={{ minHeight: 'calc(5rem + env(safe-area-inset-top))', paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}>
          <Link href={variant === "black" ? "/black" : "/"} className="block h-10 w-28 sm:h-[72px] sm:w-[225px] shrink-0">
            <Image
              src={logoSrc}
              alt="Krunch Logo"
              width={225}
              height={72}
              className={`h-full w-full object-contain object-left cursor-pointer hover:opacity-80 transition-opacity ${variant !== "black" ? "scale-[1.02] origin-center" : ""}`}
            />
          </Link>
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <ThemeToggle inline />
            <LanguageToggle inline />
          </div>
        </div>

        {/* 비딩 알림 띠 — 로고 아래, LEGEND AUCTION 위. 최소 높이만 잡아서 화면 안 밀림 */}
        <div
          className="min-h-[40px] mb-2 flex items-stretch"
          style={{ marginLeft: 'max(1rem, env(safe-area-inset-left))', marginRight: 'max(1rem, env(safe-area-inset-right))' }}
        >
          {bidRibbon && (
            <div
              className={`mx-4 w-full rounded-lg bg-black/80 backdrop-blur-sm border ${theme.accentBorder} px-4 py-2 flex items-center justify-center animate-in fade-in duration-300 z-40`}
            >
              <p className="text-xs sm:text-sm text-white/90 font-sans">
                <span className={`${theme.accent} font-semibold`}>{bidRibbon.username}</span>
                <span className="text-white/70">{isKo ? "님이 " : " placed a bid of "}</span>
                <span className={`${theme.accent} font-semibold`}>₩\u2009{bidRibbon.amount.toLocaleString()}</span>
                {isKo && <span className="text-white/70">에 입찰했습니다</span>}
              </p>
            </div>
          )}
        </div>

        {/* Main Content - 팝업/상단과 PLACE BID 사이 세로 중앙 배치 */}
        <div className="flex-1 flex flex-col justify-center min-h-0 py-4">
          <div
            className={`relative mx-4 mb-4 rounded-lg overflow-hidden border ${variant === "black" ? "black-mode-card" : "bg-black/30 border-border/50"}`}
            style={{ marginLeft: 'max(1rem, env(safe-area-inset-left))', marginRight: 'max(1rem, env(safe-area-inset-right))' }}
          >
          {/* LEGEND AUCTION + TIME REMAINING (우측, Current Bid 위) */}
          <div className="p-4 pt-5 sm:p-6 sm:pt-6 flex items-start justify-between gap-4">
            <div>
              <h2 className={`font-display text-4xl sm:text-5xl uppercase leading-[0.85] tracking-tight ${variant === "black" ? "black-mode-legend-title" : `${theme.accent} drop-shadow-md`}`}>LEGEND</h2>
              <h2 className={`font-display text-4xl sm:text-5xl uppercase leading-[0.85] tracking-tight ${variant === "black" ? "black-mode-legend-title" : `${theme.accent} drop-shadow-md`}`}>AUCTION</h2>
            </div>
            <div className="flex-shrink-0 bg-black/50 backdrop-blur-sm pl-3 pr-2 py-2 rounded-xl border border-white/15 flex items-center gap-2">
              <div>
                <p className="text-[9px] text-white/60 uppercase tracking-widest font-sans font-bold mb-0.5">{isKo ? "남은 시간" : "Time Remaining"}</p>
                <span
                  className={`font-mono text-lg sm:text-xl font-semibold tracking-tight transition-colors ${timeRemaining >= ONE_HOUR ? "auction-timer-normal" : timeRemaining < TEN_MINUTES ? "auction-timer-urgent" : showRedTime ? "auction-timer-urgent" : "auction-timer-normal"} ${timeRemaining < TEN_MINUTES && timeRemaining > 0 ? "animate-pulse" : ""}`}
                >
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleDemoTimeClick}
                className="p-1 rounded-md text-white/50 hover:text-white/90 hover:bg-white/10 transition-colors shrink-0"
                title="시연: 24h → 1h → 10분"
                aria-label="시연용 남은시간 변경"
              >
                <Clock className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="px-4 sm:px-6 pb-4 flex items-center gap-5 sm:gap-8">
            <div className="relative w-40 h-32 sm:w-56 sm:h-44 flex-shrink-0">
              <video
                src="/cap-spin.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            {/* CURRENT BID + 금액 + 상승률 — 모자 오른쪽, 위치·정렬 다듬기 */}
            <div className="flex-1 flex flex-col justify-center items-end min-w-0 pl-2">
              <p className="text-[10px] text-white/60 uppercase tracking-widest font-sans font-bold mb-1">{isKo ? "현재 입찰가" : "Current Bid"}</p>
              <p
                className={`text-2xl sm:text-3xl font-bold font-sans tabular-nums leading-tight ${bidPulse ? "animate-bid-pulse" : ""} ${variant === "black" ? "black-mode-text-primary" : theme.accent}`}
              >
                ₩{currentBid.toLocaleString()}
              </p>
              <p className={`text-sm font-semibold tabular-nums mt-1.5 flex items-center justify-end gap-1 ${variant === "black" ? "text-[#FF69B4]" : "text-white/90"}`}>
                +{risePercent}%
                <ArrowUp className="w-4 h-4 shrink-0" />
              </p>
            </div>
          </div>

          <div className="px-4 pb-3">
            <p className={`text-xs font-semibold tracking-wide font-sans drop-shadow-md ${variant === "black" ? "black-mode-text-primary" : "text-foreground"}`}>PEACEMINUSONE</p>
            <p className={`text-xs mt-0.5 font-sans ${variant === "black" ? "black-mode-text-secondary" : "text-muted-foreground"}`}>
              {isKo ? "Übermensch 2025 월드 투어 스페셜 머치" : "Übermensch 2025 World Tour Special Merch"}
            </p>
            <p className={`text-xs font-sans ${variant === "black" ? "black-mode-text-secondary" : "text-muted-foreground"}`}>
              {isKo ? "Übermensch 캡 (버건디) 커스텀" : "Übermensch Cap (Burgundy) customized"}
            </p>
          </div>

          {/* 시간별 가격 흐름 차트 — 간략한 선 + 가로 시간 라벨 + 밑에 Historical Data */}
          <div className="mx-4 mt-2 mb-3">
            <div className={`h-16 sm:h-20 rounded-t-lg overflow-hidden border border-b-0 ${variant === "black" ? "bg-[#0a0a0a] border-[#1f1f1f]" : "bg-black/30 border-white/10"}`}>
              <PriceFlowChart data={priceHistory} chartColor={theme.chartColor} useDarkGrayGraph={variant === "black"} />
            </div>
            <div className={`flex justify-between px-2 py-1.5 rounded-b-lg text-[10px] font-sans border border-t-0 ${variant === "black" ? "bg-[#0a0a0a] border-[#1f1f1f] black-mode-text-secondary" : "bg-black/30 border-white/10 text-white/50"}`}>
              <span>{isKo ? "3일 전" : "3D ago"}</span>
              <span>{isKo ? "24시간 전" : "24h ago"}</span>
              <span>{isKo ? "12시간 전" : "12h ago"}</span>
              <span>{isKo ? "6시간 전" : "6h ago"}</span>
              <span>{isKo ? "현재" : "Now"}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className={`rounded-lg px-3 py-2.5 ${variant === "black" ? "bg-[#0a0a0a] border border-[#1f1f1f]" : "bg-white/5 border border-white/10"}`}>
                <p className={`text-[10px] uppercase tracking-wider font-sans ${variant === "black" ? "black-mode-text-secondary" : "text-white/50"}`}>{isKo ? "가격대 · 12M" : "Price Range · 12M"}</p>
                <p className={`text-sm font-semibold mt-0.5 tabular-nums ${variant === "black" ? "black-mode-text-primary" : "text-white/90"}`}>₩\u20092.0M – ₩\u20094.6M</p>
              </div>
              <div className={`rounded-lg px-3 py-2.5 ${variant === "black" ? "bg-[#0a0a0a] border border-[#1f1f1f]" : "bg-white/5 border border-white/10"}`}>
                <p className={`text-[10px] uppercase tracking-wider font-sans ${variant === "black" ? "black-mode-text-secondary" : "text-white/50"}`}>{isKo ? "변동성" : "Volatility"}</p>
                <p className={`text-sm font-semibold mt-0.5 tabular-nums ${variant === "black" ? "black-mode-text-primary" : "text-white/90"}`}>8%</p>
              </div>
              <div className={`rounded-lg px-3 py-2.5 ${variant === "black" ? "bg-[#0a0a0a] border border-[#1f1f1f]" : "bg-white/5 border border-white/10"}`}>
                <p className={`text-[10px] uppercase tracking-wider font-sans ${variant === "black" ? "black-mode-text-secondary" : "text-white/50"}`}>{isKo ? "평균 낙찰가 · 3M" : "Avg. Sale · 3M"}</p>
                <p className={`text-sm font-semibold mt-0.5 tabular-nums ${variant === "black" ? "black-mode-text-primary" : "text-white/90"}`}>₩\u20093.2M</p>
              </div>
              <div className={`rounded-lg px-3 py-2.5 ${variant === "black" ? "bg-[#0a0a0a] border border-[#1f1f1f]" : "bg-white/5 border border-white/10"}`}>
                <p className={`text-[10px] uppercase tracking-wider font-sans ${variant === "black" ? "black-mode-text-secondary" : "text-white/50"}`}>{isKo ? "프리미엄 · 최근" : "Premium · Last"}</p>
                <p className={`text-sm font-semibold mt-0.5 tabular-nums flex items-center gap-1 ${variant === "black" ? "text-[#FF69B4]" : "text-white/90"}`}>
                  +{risePercent}%
                  <ArrowUp className="w-3.5 h-3.5 shrink-0" />
                </p>
              </div>
            </div>
          </div>

          <div className={`mx-4 border-t ${variant === "black" ? "border-[#1f1f1f]" : theme.accentBorder}`} />
        </div>
        </div>

        {/* Bottom Sheet - 입찰 입력 폼만 */}
        {showAuctionCard && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 z-30"
              onClick={() => setShowAuctionCard(false)}
            />
            {/* Input Form Sheet */}
            <div 
              className="fixed bottom-0 left-0 right-0 z-40 bg-black/30 rounded-t-2xl border-t border-l border-r border-border/50 overflow-hidden animate-slide-up-bottom-sheet"
              style={{ 
                marginLeft: 'max(0, env(safe-area-inset-left))', 
                marginRight: 'max(0, env(safe-area-inset-right))',
                paddingBottom: 'calc(100px + env(safe-area-inset-bottom))'
              }}
            >
              {/* Close Button */}
              <div className="flex justify-end p-4 pb-2">
                <button
                  onClick={() => setShowAuctionCard(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                >
                  <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-4 pt-0">
                <p className="text-sm font-medium text-foreground mb-2 font-sans drop-shadow-md">{isKo ? "입찰 금액" : "Your Offer"}</p>

                <div className="flex items-end gap-2 mb-4">
                  <span className="text-xs text-muted-foreground pb-1 font-sans">KRW</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={offerAmount}
                    onChange={handleOfferChange}
                    onKeyDown={(e) => {
                      // Allow: backspace, delete, tab, escape, enter, and arrow keys
                      if (
                        [8, 9, 27, 13, 46, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
                        // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                        (e.keyCode === 65 && e.ctrlKey === true) ||
                        (e.keyCode === 67 && e.ctrlKey === true) ||
                        (e.keyCode === 86 && e.ctrlKey === true) ||
                        (e.keyCode === 88 && e.ctrlKey === true) ||
                        // Allow: home, end, left, right
                        (e.keyCode >= 35 && e.keyCode <= 40)
                      ) {
                        return
                      }
                      // Ensure that it is a number and stop the keypress if not
                      if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                        e.preventDefault()
                      }
                    }}
                    className={`flex-1 bg-transparent border-b text-right text-2xl sm:text-4xl font-bold text-foreground focus:outline-none pb-1 font-sans drop-shadow-md ${theme.accentBorderFocus}`}
                  />
                </div>

                <button
                  onClick={handleSetOffer}
                  className={`w-full py-4 font-display font-medium text-lg uppercase tracking-wide transition-all active:scale-[0.98] ${variant === "black" ? "black-mode-place-bid" : `${theme.accentBg} ${theme.accentForeground} hover:brightness-110`}`}
                >
                  {isKo ? "입찰 하기" : "SET OFFER"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Fixed Footer - Place Bid Button (sticky, 리플 + 그림자 + 호버 리프트) */}
        {!showAuctionCard && (
          <div 
            className="fixed bottom-0 left-0 right-0 z-50 bg-black w-full"
            style={{ 
              height: 'calc(100px + env(safe-area-inset-bottom))',
              paddingLeft: 'max(0, env(safe-area-inset-left))',
              paddingRight: 'max(0, env(safe-area-inset-right))',
              paddingBottom: 'env(safe-area-inset-bottom)'
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top })
                setTimeout(() => setRipple(null), 600)
                setShowAuctionCard(true)
              }}
              className={`relative w-full h-full flex items-center justify-center font-display font-bold text-xl uppercase tracking-wide overflow-hidden transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] ${variant === "black" ? "black-mode-place-bid" : "bg-[#FF6B9D] text-black hover:brightness-110"}`}
              style={{
                boxShadow: variant === "black"
                  ? "0 4px 20px rgba(255, 0, 110, 0.4)"
                  : "0 4px 20px rgba(255, 0, 110, 0.4)",
              }}
            >
              {ripple && (
                <span
                  className="absolute rounded-full bg-white/40 pointer-events-none animate-place-bid-ripple"
                  style={{
                    left: ripple.x,
                    top: ripple.y,
                    width: 20,
                    height: 20,
                    marginLeft: -10,
                    marginTop: -10,
                  }}
                />
              )}
              {isKo ? "입찰하기" : "PLACE BID"}
            </button>
          </div>
        )}

      </div>
    </>
  )
}
