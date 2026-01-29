"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Confetti } from "./confetti"
import { SuccessPopup } from "./success-popup"
import { useSiteTheme } from "./theme-provider"

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
    accentBg: "bg-white",
    accentBorder: "border-white/30",
    accentBorderFocus: "border-white/50 focus:border-white",
    accentForeground: "text-black",
    chartColor: "#ffffff",
  },
} as const

type AuctionVariant = keyof typeof AUCTION_THEMES

// 간략한 가격 흐름 선 (테마별 색상)
function PriceFlowChart({ data, chartColor = "#FF6B9D" }: { data: number[]; chartColor?: string }) {
  if (data.length < 2) return null
  const step = Math.max(1, Math.floor(data.length / 16))
  const sampled = data.filter((_, i) => i % step === 0 || i === data.length - 1)
  const min = Math.min(...sampled)
  const max = Math.max(...sampled)
  const range = max - min || 1
  const padding = { top: 10, right: 10, bottom: 10, left: 10 }
  const w = 400
  const h = 72
  const points = sampled.map((v, i) => {
    const x = padding.left + (i / (sampled.length - 1)) * (w - padding.left - padding.right)
    const y = padding.top + (1 - (v - min) / range) * (h - padding.top - padding.bottom)
    return `${x},${y}`
  })
  const pathD = `M ${points.join(" L ")}`
  const areaD = `${pathD} L ${w - padding.right},${h - padding.bottom} L ${padding.left},${h - padding.bottom} Z`
  const opacity = chartColor === "#ffffff" ? "0.15" : "0.18"

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full">
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={chartColor} stopOpacity={opacity} />
          <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#chartFill)" />
      <path d={pathD} fill="none" stroke={chartColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function AuctionCard({ variant: variantProp }: { variant?: AuctionVariant } = {}) {
  const siteTheme = useSiteTheme()
  const variant: AuctionVariant = variantProp ?? siteTheme
  const theme = AUCTION_THEMES[variant]
  const [offerAmount, setOfferAmount] = useState(formatNumber("1"))
  const [currentBid, setCurrentBid] = useState(2450000)
  const [bidPulse, setBidPulse] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(24 * 60 * 60) // 24 hours in seconds
  const [bidLog, setBidLog] = useState<BidLogEntry[]>([])
  const [showBidLog, setShowBidLog] = useState(false)
  const [showAuctionCard, setShowAuctionCard] = useState(false)
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
        {/* Header - 로고만 */}
        <div className="relative z-50" style={{ minHeight: 'calc(4rem + env(safe-area-inset-top))' }}>
          <Link href="/" className="absolute top-4 left-4" style={{ top: 'calc(1rem + env(safe-area-inset-top))' }}>
            <Image
              src="/logo-pink.png"
              alt="Krunch Logo"
              width={120}
              height={40}
              className="h-auto w-24 sm:w-[120px] cursor-pointer hover:opacity-80 transition-opacity"
            />
          </Link>
        </div>

        {/* 비딩 알림 띠 — 절대 위치로 레이어 밀림 없음 */}
        {bidRibbon && (
          <div
            className={`absolute left-4 right-4 z-40 rounded-lg bg-black/80 backdrop-blur-sm border ${theme.accentBorder} px-4 py-2.5 flex items-center justify-center animate-in fade-in slide-in-from-top-2 duration-300`}
            style={{ top: 'calc(4rem + env(safe-area-inset-top) + 0.5rem)' }}
          >
            <p className="text-xs sm:text-sm text-white/90 font-sans">
              <span className={`${theme.accent} font-semibold`}>{bidRibbon.username}</span>
              <span className="text-white/70">님이 </span>
              <span className={`${theme.accent} font-semibold`}>₩{bidRibbon.amount.toLocaleString()}</span>
              <span className="text-white/70">에 비딩했습니다</span>
            </p>
          </div>
        )}

        {/* Main Content - 팝업/상단과 PLACE BID 사이 세로 중앙 배치 */}
        <div className="flex-1 flex flex-col justify-center min-h-0 py-4">
          <div className="relative bg-black/30 mx-4 mb-4 rounded-lg border border-border/50 overflow-hidden" style={{ marginLeft: 'max(1rem, env(safe-area-inset-left))', marginRight: 'max(1rem, env(safe-area-inset-right))' }}>
          {/* LEGEND AUCTION + TIME REMAINING (우측, Current Bid 위) */}
          <div className="p-4 pt-5 sm:p-6 sm:pt-6 flex items-start justify-between gap-4">
            <div>
              <h2 className={`font-display text-4xl sm:text-5xl ${theme.accent} uppercase leading-[0.85] tracking-tight drop-shadow-md`}>LEGEND</h2>
              <h2 className={`font-display text-4xl sm:text-5xl ${theme.accent} uppercase leading-[0.85] tracking-tight drop-shadow-md`}>AUCTION</h2>
            </div>
            <div className="flex-shrink-0 bg-black/50 backdrop-blur-sm px-3 py-2.5 rounded-xl border border-white/15">
              <p className="text-[9px] text-white/60 uppercase tracking-widest font-sans mb-1">Time Remaining</p>
              <div className="font-mono text-lg sm:text-xl font-semibold text-white tracking-tight">
                {formatTime(timeRemaining)}
              </div>
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
              <p className="text-[10px] text-white/60 uppercase tracking-widest font-sans mb-1">Current Bid</p>
              <p
                className={`text-2xl sm:text-3xl font-bold ${theme.accent} font-sans tabular-nums leading-tight ${bidPulse ? "animate-bid-pulse" : ""}`}
              >
                ₩{currentBid.toLocaleString()}
              </p>
              <p className="text-sm font-semibold text-white/90 tabular-nums mt-1.5">
                +{risePercent}%
              </p>
            </div>
          </div>

          <div className="px-4 pb-3">
            <p className="text-xs font-semibold text-foreground tracking-wide font-sans drop-shadow-md">PEACEMINUSONE</p>
            <p className="text-xs text-muted-foreground mt-0.5 font-sans">Übermensch 2025 World Tour Special Merch</p>
            <p className="text-xs text-muted-foreground font-sans">Übermensch Cap (Burgundy) customized</p>
          </div>

          {/* 시간별 가격 흐름 차트 — 간략한 선 + 가로 시간 라벨 + 밑에 Historical Data */}
          <div className="mx-4 mt-2 mb-3">
            <div className="h-16 sm:h-20 rounded-t-lg bg-black/30 border border-b-0 border-white/10 overflow-hidden">
              <PriceFlowChart data={priceHistory} chartColor={theme.chartColor} />
            </div>
            <div className="flex justify-between px-2 py-1.5 rounded-b-lg bg-black/30 border border-t-0 border-white/10 text-[10px] text-white/50 font-sans">
              <span>3D ago</span>
              <span>24h ago</span>
              <span>12h ago</span>
              <span>6h ago</span>
              <span>Now</span>
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2.5">
                <p className="text-[10px] text-white/50 uppercase tracking-wider font-sans">Price Range · 12M</p>
                <p className="text-sm font-semibold text-white/90 mt-0.5 tabular-nums">₩2.0M – ₩4.6M</p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2.5">
                <p className="text-[10px] text-white/50 uppercase tracking-wider font-sans">Volatility</p>
                <p className="text-sm font-semibold text-white/90 mt-0.5 tabular-nums">8%</p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2.5">
                <p className="text-[10px] text-white/50 uppercase tracking-wider font-sans">Avg. Sale · 3M</p>
                <p className="text-sm font-semibold text-white/90 mt-0.5 tabular-nums">₩3.2M</p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2.5">
                <p className="text-[10px] text-white/50 uppercase tracking-wider font-sans">Premium · Last</p>
                <p className="text-sm font-semibold text-white/90 mt-0.5 tabular-nums">+{risePercent}%</p>
              </div>
            </div>
          </div>

          <div className={`mx-4 border-t ${theme.accentBorder}`} />
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
                <p className="text-sm font-medium text-foreground mb-2 font-sans drop-shadow-md">Your Offer</p>

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
                  className={`w-full py-4 ${theme.accentBg} ${theme.accentForeground} font-display font-medium text-lg uppercase tracking-wide transition-all hover:brightness-110 active:scale-[0.98]`}
                >
                  SET OFFER
                </button>
              </div>
            </div>
          </>
        )}

        {/* Fixed Footer - Place Bid Button */}
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
              onClick={() => setShowAuctionCard(true)}
              className={`w-full h-full flex items-center justify-center ${theme.accentBg} ${theme.accentForeground} font-display font-medium text-xl uppercase tracking-wide transition-all hover:brightness-110 active:scale-[0.98]`}
            >
              PLACE BID
            </button>
          </div>
        )}

      </div>
    </>
  )
}
