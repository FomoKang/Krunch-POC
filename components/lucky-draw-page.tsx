"use client"

import React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import { useLocale } from "@/components/locale-provider"
import { useSiteTheme } from "@/components/theme-provider"

type IconComponent = React.ComponentType<{ className?: string; style?: React.CSSProperties }>

/* ====================================================
   INLINE SVG ICONS (no lucide-react dependency)
   ==================================================== */

function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function IconCrown({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
      <path d="M5 21h14" />
    </svg>
  )
}

function IconGem({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="M6 3h12l4 6-10 13L2 9Z" />
      <path d="M11 3 8 9l4 13 4-13-3-6" />
      <path d="M2 9h20" />
    </svg>
  )
}

function IconShield({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  )
}

function IconTrendingUp({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  )
}

function IconZap({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </svg>
  )
}

/* ====================================================
   LIVE FEED SECTION
   ==================================================== */

const feedUsers = [
  "SneakerKing99", "HypeBeast_JK", "KrunchFan42", "StreetVibes",
  "NeonRunner", "DragonFly88", "Fashionista", "VelvetKick",
  "UrbanLegend", "MidnightDrop",
]
const feedActionsEn = [
  "just entered the draw", "boosted with K-Points", "joined from Seoul",
  "entered with x2 boost", "just joined the raffle",
]
const feedActionsKo = [
  "추첨에 참여했어요", "K-Points로 부스트했어요", "서울에서 참여했어요",
  "x2 부스트로 참여했어요", "래플에 참여했어요",
]

function LiveFeed() {
  const { locale } = useLocale()
  const isKo = locale === "ko"
  const feedActions = isKo ? feedActionsKo : feedActionsEn
  const [entry, setEntry] = useState({ user: feedUsers[0], action: feedActions[0] })
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setEntry({
          user: feedUsers[Math.floor(Math.random() * feedUsers.length)],
          action: feedActions[Math.floor(Math.random() * feedActions.length)],
        })
        setVisible(true)
      }, 300)
    }, 4000)
    return () => clearInterval(interval)
  }, [feedActions])

  const { theme } = useSiteTheme()
  const isBlack = theme === "black"
  return (
    <div className="mx-5">
      <div
        className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 transition-all duration-300 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        }`}
        style={isBlack ? { background: "var(--bg-card)", boxShadow: "0 0 0 1px rgba(255,255,255,0.15), 0 4px 12px rgba(0,0,0,0.5)" } : { background: "rgba(26,26,26,0.8)", borderColor: "rgba(255,107,157,0.5)", boxShadow: "0 0 12px rgba(255,107,157,0.3), inset 0 0 8px rgba(255,107,157,0.1)" }}
      >
        <span className={`text-xs font-semibold ${isBlack ? "text-[#F5F5F5]" : "text-white"}`} style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>{entry.user}</span>
        <span className={`text-xs ${isBlack ? "text-[#A0A0A0]" : "text-white/80"}`} style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>{isKo ? "님이 " : " "}{entry.action}</span>
      </div>
    </div>
  )
}

/* ====================================================
   COUNTDOWN TIMER SECTION
   ==================================================== */

function formatTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return {
    hours: String(h).padStart(2, "0"),
    minutes: String(m).padStart(2, "0"),
    seconds: String(s).padStart(2, "0"),
  }
}

function CountdownTimer() {
  const { locale } = useLocale()
  const { theme } = useSiteTheme()
  const isBlack = theme === "black"
  const isKo = locale === "ko"
  const [totalSeconds, setTotalSeconds] = useState(2 * 3600 + 14 * 60 + 55)
  const [participantCount, setParticipantCount] = useState(14203)

  useEffect(() => {
    const timer = setInterval(() => setTotalSeconds((p) => (p > 0 ? p - 1 : 0)), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setParticipantCount((p) => p + Math.floor(Math.random() * 3) + 1), 3000)
    return () => clearInterval(interval)
  }, [])

  const t = formatTime(totalSeconds)
  const timeString = `${t.hours}:${t.minutes}:${t.seconds}`

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Label */}
      <div className="flex items-center gap-2">
        <div className="h-[1px] w-8" style={{ background: isBlack ? "linear-gradient(to right, transparent, rgba(255,255,255,0.2))" : "linear-gradient(to right, transparent, rgba(255,107,157,0.5))" }} />
        <span className={`text-[10px] uppercase tracking-[0.3em] ${isBlack ? "text-[#A0A0A0]" : "text-[#8c8c8c]"}`} style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>{isKo ? "추첨 마감까지" : "Draw Closes In"}</span>
        <div className="h-[1px] w-8" style={{ background: isBlack ? "linear-gradient(to left, transparent, rgba(255,255,255,0.2))" : "linear-gradient(to left, transparent, rgba(255,107,157,0.5))" }} />
      </div>

      {/* Timer with glitch */}
      <div className="relative">
        <div className={`glitch-text text-6xl md:text-7xl tracking-tighter italic ${isBlack ? "text-[#F5F5F5]" : "text-[#fafafa]"}`} data-text={timeString} style={{ fontFamily: "var(--font-anton), Anton, sans-serif" }}>
          {timeString}
        </div>
      </div>

      {/* Unit labels */}
      <div className="flex items-center gap-8 -mt-2">
        {(isKo ? ["시간", "분", "초"] : ["Hours", "Min", "Sec"]).map((label) => (
          <span key={label} className={`text-[9px] uppercase tracking-widest ${isBlack ? "text-[#A0A0A0]" : "text-[#8c8c8c]"}`} style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>{label}</span>
        ))}
      </div>

      {/* Live participants */}
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isBlack ? "border-[#1f1f1f]" : "border-[hsl(0,0%,14.9%)]"}`} style={{ background: isBlack ? "var(--bg-card)" : "rgba(26,26,26,0.8)" }}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
        </span>
        <span className={`text-xs ${isBlack ? "text-[#A0A0A0]" : "text-[#8c8c8c]"}`} style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
          <span className={`font-medium ${isBlack ? "text-[#F5F5F5]" : "text-[#fafafa]"}`}>{participantCount.toLocaleString()}</span>{" "}{isKo ? "명 참여" : "People Joined"}
        </span>
      </div>
    </div>
  )
}

/* ====================================================
   WINNER MODAL — 당첨 축하 팝업
   ==================================================== */

const GACHA_FAIL_IMAGE = "/jennie-tshirts.png"

function ResultModal({ show, onClose, isWin }: { show: boolean; onClose: () => void; isWin: boolean }) {
  const { locale } = useLocale()
  const { theme } = useSiteTheme()
  const isBlack = theme === "black"
  const isKo = locale === "ko"
  if (!show) return null
  const title = isWin ? (isKo ? "당첨!" : "CONGRATULATIONS!") : (isKo ? "가챠 실패" : "GACHA FAIL")
  const subtitle = isWin ? "GENTLE MONSTER" : "Kkabuljimara T-shirts"
  const message = isWin ? (isKo ? "당첨을 축하드려요!" : "Congratulations!") : (isKo ? "다음 기회에!" : "Better luck next time!")
  const confirmLabel = isKo ? "확인" : "Confirm"
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" aria-hidden />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%]" style={{ background: isWin ? "radial-gradient(ellipse at center, rgba(255,107,157,0.2) 0%, rgba(255,0,255,0.08) 30%, transparent 60%)" : "radial-gradient(ellipse at center, rgba(100,100,100,0.15) 0%, transparent 50%)" }} />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={`p-${i}`} className="absolute w-2 h-2 rounded-full animate-pulse" style={{ left: `${20 + i * 10}%`, top: `${15 + (i % 4) * 20}%`, animationDelay: `${i * 0.2}s`, background: isWin ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)" }} />
        ))}
      </div>
      <div className="relative z-10 w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl sm:text-3xl font-display uppercase tracking-[0.2em] italic mb-6 animate-in fade-in zoom-in-95 duration-500" style={{ fontFamily: isKo ? "var(--font-black-han-sans), Black Han Sans, sans-serif" : "var(--font-anton), Anton, sans-serif", color: isWin ? "#FFE5F0" : "#b0b0b0", textShadow: isWin ? "0 0 20px rgba(255,107,157,0.8)" : "0 0 15px rgba(255,255,255,0.3)" }}>
          {title}
        </h2>
        {/* 이미지 — 30% 축소 (scale 0.7) */}
        <div className="relative inline-block mx-auto mb-6 w-[70%] max-w-[220px]">
          <div className="absolute -inset-3 rounded-2xl opacity-60" style={{ background: isWin ? "radial-gradient(ellipse at center, rgba(255,107,157,0.6) 0%, rgba(255,0,255,0.3) 50%, transparent 70%)" : "radial-gradient(ellipse at center, rgba(100,100,100,0.4) 0%, transparent 70%)", filter: "blur(16px)" }} />
          <div className="relative rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl animate-in fade-in zoom-in-95 duration-700 delay-200" style={{ boxShadow: isWin ? "0 0 40px rgba(255,107,157,0.5)" : "0 0 30px rgba(255,255,255,0.2)" }}>
            {isWin ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src="/karina-gentlemonster.png" alt="GENTLE MONSTER x Karina - Won Item" className="w-full aspect-[3/4] object-cover" />
            ) : (
              <div className="relative aspect-[3/4] bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={GACHA_FAIL_IMAGE} alt="Gacha Fail Product" className="relative z-10 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
              </div>
            )}
          </div>
        </div>
        <p className="text-sm uppercase tracking-widest text-white/70 mb-2" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>{subtitle}</p>
        <p className="text-white/90 font-medium mb-8" style={{ fontFamily: isKo ? "var(--font-noto-kr), Noto Sans KR, sans-serif" : "var(--font-inter), Inter, sans-serif" }}>{message}</p>
        <button
          onClick={onClose}
          className="px-8 py-3 rounded-xl font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
          style={isBlack ? { background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", boxShadow: "none" } : { background: "linear-gradient(135deg, #FF6B9D, #FF4D94)", color: "#fff", boxShadow: "0 0 30px rgba(255,107,157,0.5)" }}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  )
}

/* ====================================================
   SLOT MACHINE HERO SECTION — gentlemonster.mp4 + DRAW 버튼
   ==================================================== */

const SPIN_DURATION_MS = 3000

function SlotMachineHero({ isSpinning, onDrawTrigger, slideResetKey }: { isSpinning: boolean; onDrawTrigger: () => void; slideResetKey: number }) {
  const { locale } = useLocale()
  const { theme } = useSiteTheme()
  const isBlack = theme === "black"
  const isKo = locale === "ko"
  return (
    <div className="relative w-full">
      {/* LEGEND DROP badge — 메인과 통일 (한국어도 LEGEND DROP 표기) */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30">
        <div
          className="relative px-5 py-2.5 rounded-full flex items-center justify-center"
          style={isBlack ? {
            background: "linear-gradient(135deg, #1a1a1a, #0a0a0a)",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.25), 0 4px 20px rgba(255,255,255,0.08)",
            animation: "glow-pulse 2s ease-in-out infinite",
          } : {
            background: "linear-gradient(135deg, #FF6B9D, #FF4D94)",
            boxShadow: "0 0 15px rgba(255,107,157,0.5), 0 0 30px rgba(255,107,157,0.2)",
            animation: "glow-pulse 2s ease-in-out infinite",
          }}
        >
          <span className="text-[11px] uppercase tracking-[0.15em] italic whitespace-nowrap leading-none text-white font-display">
            LEGEND DROP
          </span>
        </div>
      </div>

      {/* Machine Frame */}
      <div
        className="relative mx-auto max-w-sm rounded-2xl overflow-hidden"
        style={isBlack ? { background: "var(--bg-card)", boxShadow: "0 0 0 1px rgba(255,255,255,0.12), 0 4px 16px rgba(0,0,0,0.5)" } : { background: "#0a0a0a", boxShadow: "0 0 0 1px rgba(255,107,157,0.4)" }}
      >
        <div className="relative rounded-2xl overflow-hidden" style={{ background: "#0a0a0a" }}>
          {/* TOP CHROME BAR */}
          <div className="relative flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: isBlack ? "rgba(255,255,255,0.1)" : "rgba(255,0,255,0.2)", background: isBlack ? "linear-gradient(180deg, #111 0%, #0a0a0a 100%)" : "linear-gradient(180deg, #1a1a1a 0%, #111 100%)" }}>
            <div className="flex items-center gap-1.5">
              {[0,1,2,3].map((i) => (
                <div key={`ll-${i}`} className="w-1.5 h-1.5 rounded-full" style={{ background: isBlack ? "rgba(255,255,255,0.6)" : "#FF6B9D", boxShadow: isBlack ? "0 0 4px rgba(255,255,255,0.4)" : "0 0 4px #FF6B9D", animation: isSpinning ? `pulse 0.5s ease-in-out ${i * 0.1}s infinite` : "none" }} />
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              {[0,1,2,3].map((i) => (
                <div key={`lr-${i}`} className="w-1.5 h-1.5 rounded-full" style={{ background: isBlack ? "rgba(255,255,255,0.6)" : "#FF6B9D", boxShadow: isBlack ? "0 0 4px rgba(255,255,255,0.4)" : "0 0 4px #FF6B9D", animation: isSpinning ? `pulse 0.5s ease-in-out ${i * 0.1 + 0.2}s infinite` : "none" }} />
              ))}
            </div>
          </div>

          {/* REEL WINDOW — 처음부터 안경 영상 */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 z-10 pointer-events-none">
              {[25, 50, 75].map((pos) => (
                <div key={`s-${pos}`} className="absolute top-0 bottom-0 w-[1px]" style={{ left: `${pos}%`, background: isBlack ? "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.4) 100%)" : "linear-gradient(180deg, rgba(255,0,255,0.5) 0%, rgba(255,0,255,0.2) 20%, rgba(255,0,255,0.08) 50%, rgba(255,0,255,0.2) 80%, rgba(255,0,255,0.5) 100%)" }} />
              ))}
            </div>
            <div className="absolute inset-0 z-20 pointer-events-none" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.6), transparent 18%, transparent 82%, rgba(0,0,0,0.6))" }} />

            {/* 슬롯 영역 — 항상 gentlemonster.mp4 */}
            <div className="relative w-full" style={{ aspectRatio: "4/3" }}>
              <div className="absolute inset-0" style={{ maskImage: "linear-gradient(to bottom, black 0%, white 15%, white 85%, black 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 0%, white 15%, white 85%, black 100%)" }}>
                <video
                  src="/gentlemonster.mp4"
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{ objectFit: "cover" }}
                />
              </div>
            </div>

            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 z-30 pointer-events-none">
              <div className="h-[2px] w-full" style={{ background: isBlack ? "linear-gradient(90deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.5) 100%)" : "linear-gradient(90deg, #FF6B9D 0%, rgba(255,107,157,0.5) 15%, rgba(255,107,157,0.15) 60%, rgba(255,107,157,0.5) 85%, #FF6B9D 100%)" }} />
            </div>
            <div className="absolute top-0 bottom-0 left-0 w-[2px] z-20" style={{ background: isBlack ? "linear-gradient(180deg, transparent, rgba(255,255,255,0.4) 20%, rgba(255,255,255,0.4) 80%, transparent)" : "linear-gradient(180deg, transparent, #FF6B9D 20%, #FF6B9D 80%, transparent)" }} />
            <div className="absolute top-0 bottom-0 right-0 w-[2px] z-20" style={{ background: isBlack ? "linear-gradient(180deg, transparent, rgba(255,255,255,0.4) 20%, rgba(255,255,255,0.4) 80%, transparent)" : "linear-gradient(180deg, transparent, #FF6B9D 20%, #FF6B9D 80%, transparent)" }} />
          </div>

          {/* BOTTOM CHROME BAR + 슬라이드로 DRAW (YOU'RE IN 시스템) */}
          <div className="flex flex-col border-t" style={{ borderColor: isBlack ? "rgba(255,255,255,0.1)" : "rgba(255,0,255,0.2)", background: isBlack ? "linear-gradient(180deg, #0a0a0a 0%, #111 100%)" : "linear-gradient(180deg, #111 0%, #1a1a1a 100%)" }}>
            <div className="flex items-center justify-between px-4 py-2">
              <span className={`text-[10px] uppercase tracking-wider ${isBlack ? "text-[#A0A0A0]" : "text-[#8c8c8c]"}`} style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>GENTLE MONSTER</span>
              <span className={`text-sm italic ${isBlack ? "text-white" : "text-[#FF6B9D]"}`} style={{ fontFamily: "var(--font-anton), Anton, sans-serif" }}>#001</span>
            </div>
            <DrawSlideTrigger key={slideResetKey} onDrawTrigger={onDrawTrigger} disabled={isSpinning} isKo={isKo} isBlack={isBlack} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ====================================================
   STATS CARD SECTION
   ==================================================== */

function StatsCard() {
  const { locale } = useLocale()
  const { theme } = useSiteTheme()
  const isBlack = theme === "black"
  const isKo = locale === "ko"
  return (
    <div className="mx-5 rounded-2xl p-4" style={isBlack ? { background: "var(--bg-card)", boxShadow: "0 0 0 1px rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.5)" } : { background: "rgba(26,26,26,0.6)", boxShadow: "0 0 0 1px rgba(255,107,157,0.2), 0 0 20px rgba(255,107,157,0.1)" }}>
      <div className="flex items-center justify-between">
        {/* Win Rate */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl border" style={isBlack ? { background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.15)" } : { background: "rgba(255,107,157,0.1)", borderColor: "rgba(255,107,157,0.3)" }}>
            <IconTrendingUp className={`w-4 h-4 ${isBlack ? "text-white/70" : "text-[#FF6B9D]"}`} />
          </div>
          <div>
            <p className={`text-[10px] uppercase tracking-wider ${isBlack ? "text-[#A0A0A0]" : "text-[#8c8c8c]"}`} style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>{isKo ? "현재 당첨률" : "Current Win Rate"}</p>
            <p className={`text-xl italic tracking-tight ${isBlack ? "text-[#F5F5F5]" : "text-[#fafafa]"}`} style={{ fontFamily: "var(--font-anton), Anton, sans-serif" }}>0.01%</p>
          </div>
        </div>
        {/* Divider */}
        <div className={`h-10 w-[1px] ${isBlack ? "bg-[#1f1f1f]" : "bg-[hsl(0,0%,14.9%)]"}`} />
        {/* Boost */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl border" style={isBlack ? { background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.15)" } : { background: "rgba(255,107,157,0.1)", borderColor: "rgba(255,107,157,0.3)" }}>
            <IconZap className={`w-4 h-4 ${isBlack ? "text-white/70" : "text-[#FF6B9D]"}`} />
          </div>
          <div>
            <p className={`text-[10px] uppercase tracking-wider ${isBlack ? "text-[#A0A0A0]" : "text-[#8c8c8c]"}`} style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>{isKo ? "K-Point 부스트" : "K-Point Boost"}</p>
            <p className={`text-xl italic tracking-tight ${isBlack ? "text-[#F5F5F5]" : ""}`} style={{ fontFamily: "var(--font-anton), Anton, sans-serif" }}>
              <span className={isBlack ? "text-white" : "text-[#FF6B9D]"}>x2</span>{" "}
              <span className={`text-sm ${isBlack ? "text-[#F5F5F5]" : "text-[#fafafa]"}`}>{isKo ? "지급" : "Given"}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ====================================================
   PRIZE INFO SECTION
   ==================================================== */

type PrizeTier = {
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  label: string
  prize: string
  color: string
  bgAlpha: string
  borderAlpha: string
  glowColor: string
}

const prizeTiersEn: PrizeTier[] = [
  { Icon: IconCrown, label: "Legendary", prize: "Artist Collection", color: "#FF6B9D", bgAlpha: "0.1", borderAlpha: "0.4", glowColor: "rgba(255,107,157,0.2)" },
  { Icon: IconGem, label: "Unique", prize: "Signed Merch Pack", color: "#facc15", bgAlpha: "0.1", borderAlpha: "0.2", glowColor: "rgba(250,204,21,0.1)" },
  { Icon: IconShield, label: "Rare", prize: "500 K-Points", color: "#22d3ee", bgAlpha: "0.1", borderAlpha: "0.2", glowColor: "rgba(34,211,238,0.1)" },
]
const prizeTiersKo: PrizeTier[] = [
  { Icon: IconCrown, label: "레전드", prize: "아티스트 콜렉션", color: "#FF6B9D", bgAlpha: "0.1", borderAlpha: "0.4", glowColor: "rgba(255,107,157,0.2)" },
  { Icon: IconGem, label: "유니크", prize: "사인 굿즈 팩", color: "#facc15", bgAlpha: "0.1", borderAlpha: "0.2", glowColor: "rgba(250,204,21,0.1)" },
  { Icon: IconShield, label: "레어", prize: "500 K-Points", color: "#22d3ee", bgAlpha: "0.1", borderAlpha: "0.2", glowColor: "rgba(34,211,238,0.1)" },
]

function PrizeInfo() {
  const { locale } = useLocale()
  const { theme } = useSiteTheme()
  const isBlack = theme === "black"
  const isKo = locale === "ko"
  const prizeTiers = isKo ? prizeTiersKo : prizeTiersEn
  return (
    <div className="mx-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-[1px] flex-1" style={{ background: isBlack ? "linear-gradient(to right, transparent, rgba(255,255,255,0.15))" : "linear-gradient(to right, transparent, hsl(0,0%,14.9%))" }} />
        <span className={`text-xs uppercase tracking-[0.3em] italic ${isBlack ? "text-[#A0A0A0]" : "text-[#8c8c8c]"}`} style={{ fontFamily: "var(--font-anton), Anton, sans-serif" }}>{isKo ? "상품 등급" : "Prize Tiers"}</span>
        <div className="h-[1px] flex-1" style={{ background: isBlack ? "linear-gradient(to left, transparent, rgba(255,255,255,0.15))" : "linear-gradient(to left, transparent, hsl(0,0%,14.9%))" }} />
      </div>

      <div className="flex gap-2">
        {prizeTiers.map((tier) => (
          <div
            key={tier.label}
            className="flex-1 flex flex-col items-center gap-2 py-3 px-2 rounded-xl"
            style={isBlack ? {
              background: "var(--bg-card)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.15), 0 4px 12px rgba(0,0,0,0.5)",
            } : {
              background: `rgba(${tier.color === "#FF6B9D" ? "255,107,157" : tier.color === "#FF00FF" ? "255,0,255" : tier.color === "#facc15" ? "250,204,21" : "34,211,238"},${tier.bgAlpha})`,
              boxShadow: `0 0 0 1px rgba(${tier.color === "#FF6B9D" ? "255,107,157" : tier.color === "#FF00FF" ? "255,0,255" : tier.color === "#facc15" ? "250,204,21" : "34,211,238"},${tier.borderAlpha}), 0 0 12px ${tier.glowColor}`,
            }}
          >
            <tier.Icon className="w-5 h-5" style={{ color: isBlack ? "rgba(255,255,255,0.7)" : tier.color }} />
            <span className="text-xs italic uppercase" style={{ fontFamily: "var(--font-anton), Anton, sans-serif", color: isBlack ? "rgba(255,255,255,0.9)" : tier.color }}>{tier.label}</span>
            <span className={`text-[10px] text-center leading-tight ${isBlack ? "text-[#A0A0A0]" : "text-[#8c8c8c]"}`} style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>{tier.prize}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ====================================================
   DRAW SLIDE TRIGGER — 땡겨서 끝에서 놓으면 빛 + draw 트리거
   ==================================================== */

function DrawSlideTrigger({ onDrawTrigger, disabled, isKo, isBlack }: { onDrawTrigger: () => void; disabled: boolean; isKo: boolean; isBlack?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)
  const [showBurst, setShowBurst] = useState(false)
  const [trackWidth, setTrackWidth] = useState(0)
  const handleSize = 48

  useEffect(() => {
    if (trackRef.current) setTrackWidth(trackRef.current.offsetWidth)
    const onResize = () => { if (trackRef.current) setTrackWidth(trackRef.current.offsetWidth) }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const maxDrag = trackWidth - handleSize - 8

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || hasTriggered) return
      e.preventDefault()
      setIsDragging(true)
      trackRef.current?.setPointerCapture(e.pointerId)
    },
    [disabled, hasTriggered],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !trackRef.current || disabled || hasTriggered) return
      const rect = trackRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left - handleSize / 2
      setDragX(Math.max(0, Math.min(x, maxDrag)))
    },
    [isDragging, disabled, hasTriggered, maxDrag],
  )

  const handlePointerUp = useCallback(() => {
    if (disabled || hasTriggered) return
    setIsDragging(false)
    if (dragX >= maxDrag * 0.85) {
      setDragX(maxDrag)
      setHasTriggered(true)
      setShowBurst(true)
      onDrawTrigger()
      setTimeout(() => setShowBurst(false), 1800)
    } else {
      setDragX(0)
    }
  }, [dragX, maxDrag, hasTriggered, disabled, onDrawTrigger])

  const handlePointerCancel = useCallback(() => {
    setIsDragging(false)
    if (!hasTriggered) setDragX(0)
  }, [hasTriggered])

  const progress = maxDrag > 0 ? dragX / maxDrag : 0

  return (
    <div className="relative w-full px-4 pb-4">
      {showBurst && (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden" style={{ animation: "burst-fade 2.2s ease-out forwards" }}>
          {isBlack ? (
            <>
              <div className="absolute left-1/2 -translate-x-1/2 w-[min(140vw,600px)] h-[min(90vh,500px)] rounded-full opacity-0" style={{ bottom: "50%", transform: "translate(-50%, 30%)", background: "radial-gradient(ellipse 80% 100% at 50% 100%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.25) 25%, rgba(255,255,255,0.1) 45%, transparent 80%)", boxShadow: "0 0 80px rgba(255,255,255,0.25)", animation: "soft-bloom 1.4s ease-out 0.05s forwards" }} />
              <div className="absolute left-1/2 -translate-x-1/2 w-[min(100vw,450px)] h-[min(60vh,350px)] rounded-full opacity-0" style={{ bottom: "50%", transform: "translate(-50%, 35%)", background: "radial-gradient(ellipse 70% 90% at 50% 100%, rgba(255,255,255,0.2) 0%, transparent 70%)", animation: "soft-bloom 1.2s ease-out 0.15s forwards" }} />
              {[...Array(12)].map((_, i) => (
                <div key={`dot-${i}`} className="absolute rounded-full opacity-0" style={{ left: `${38 + (i % 5) * 6}%`, bottom: "40%", width: `${8 + (i % 3) * 4}px`, height: `${8 + (i % 3) * 4}px`, background: "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 40%, transparent 70%)", boxShadow: `0 0 ${20 + i * 3}px rgba(255,255,255,0.5)`, animation: `soft-sparkle 1.3s ease-out ${i * 0.05}s forwards` }} />
              ))}
            </>
          ) : (
            <>
              <div className="absolute left-1/2 -translate-x-1/2 w-[min(140vw,600px)] h-[min(90vh,500px)] rounded-full opacity-0" style={{ bottom: "50%", transform: "translate(-50%, 30%)", background: "radial-gradient(ellipse 80% 100% at 50% 100%, rgba(255,107,157,0.7) 0%, rgba(255,107,157,0.4) 25%, rgba(255,0,255,0.25) 45%, transparent 80%)", boxShadow: "0 0 80px rgba(255,107,157,0.4)", animation: "soft-bloom 1.4s ease-out 0.05s forwards" }} />
              <div className="absolute left-1/2 -translate-x-1/2 w-[min(100vw,450px)] h-[min(60vh,350px)] rounded-full opacity-0" style={{ bottom: "50%", transform: "translate(-50%, 35%)", background: "radial-gradient(ellipse 70% 90% at 50% 100%, rgba(255,215,0,0.35) 0%, transparent 70%)", animation: "soft-bloom 1.2s ease-out 0.15s forwards" }} />
              {[...Array(12)].map((_, i) => (
                <div key={`dot-${i}`} className="absolute rounded-full opacity-0" style={{ left: `${38 + (i % 5) * 6}%`, bottom: "40%", width: `${8 + (i % 3) * 4}px`, height: `${8 + (i % 3) * 4}px`, background: i % 3 === 0 ? "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,215,0,0.6) 40%, transparent 70%)" : "radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,107,157,0.6) 50%, transparent 70%)", boxShadow: `0 0 ${20 + i * 3}px rgba(255,107,157,0.8)`, animation: `soft-sparkle 1.3s ease-out ${i * 0.05}s forwards` }} />
              ))}
            </>
          )}
        </div>
      )}
      <div
        ref={trackRef}
        className="relative h-12 rounded-full border overflow-hidden select-none touch-none"
        style={{
          ...(isBlack ? {
            cursor: disabled ? "not-allowed" : hasTriggered ? "default" : "pointer",
            opacity: disabled ? 0.6 : 1,
            pointerEvents: disabled ? "none" : "auto",
            borderColor: hasTriggered ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)",
            background: hasTriggered
              ? "linear-gradient(90deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.12) 100%)"
              : `linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,${0.08 + progress * 0.15}) ${progress * 100}%, var(--bg-card) ${progress * 100}%, var(--bg-card) 100%)`,
            boxShadow: hasTriggered ? "0 0 20px rgba(255,255,255,0.15)" : `0 0 ${10 + progress * 10}px rgba(255,255,255,${0.08 + progress * 0.12})`,
          } : {
            cursor: disabled ? "not-allowed" : hasTriggered ? "default" : "pointer",
            opacity: disabled ? 0.6 : 1,
            pointerEvents: disabled ? "none" : "auto",
            borderColor: hasTriggered ? "rgba(138,43,226,0.6)" : "rgba(255,0,255,0.4)",
            background: hasTriggered
              ? "linear-gradient(90deg, rgba(138,43,226,0.2) 0%, rgba(255,0,255,0.15) 50%, rgba(138,43,226,0.2) 100%)"
              : `linear-gradient(90deg, rgba(255,0,255,0.08) 0%, rgba(255,0,255,${0.08 + progress * 0.15}) ${progress * 100}%, rgba(26,26,26,0.8) ${progress * 100}%, rgba(26,26,26,0.8) 100%)`,
            boxShadow: hasTriggered ? "0 0 25px rgba(138,43,226,0.4)" : `0 0 ${15 + progress * 25}px rgba(255,0,255,${0.15 + progress * 0.3})`,
          }),
          touchAction: "none" as const,
          transition: isDragging ? "none" : "all 0.3s ease-out",
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {!hasTriggered && !isDragging && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className={`text-xs uppercase tracking-[0.2em] italic animate-pulse ${isBlack ? "text-white/80" : "text-[rgba(255,0,255,0.7)]"}`} style={{ fontFamily: isKo ? "var(--font-noto-kr), Noto Sans KR, sans-serif" : "var(--font-anton), Anton, sans-serif" }}>{isKo ? "당겨서 참여" : "Pull to DRAW"}</span>
          </div>
        )}
        {hasTriggered && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm uppercase tracking-[0.2em] italic" style={{ fontFamily: isKo ? "var(--font-noto-kr), Noto Sans KR, sans-serif" : "var(--font-anton), Anton, sans-serif", color: isBlack ? "white" : "#FFE5F0", textShadow: isBlack ? "0 0 8px rgba(255,255,255,0.3)" : "0 0 10px rgba(255,107,157,0.8)" }}>{disabled ? (isKo ? "추첨 중..." : "Drawing...") : (isKo ? "참여 완료!" : "DRAW!")}</span>
          </div>
        )}
        {!hasTriggered && (
          <div className="absolute top-1/2 left-3 -translate-y-1/2 h-[2px] rounded-full transition-all" style={{ width: `${dragX}px`, background: isBlack ? "rgba(255,255,255,0.4)" : "rgba(255,0,255,0.5)" }} />
        )}
        <div
          className="absolute top-1 left-1 flex items-center justify-center rounded-full"
          style={{
            width: handleSize,
            height: handleSize - 8,
            transform: `translateX(${dragX}px)`,
            transition: isDragging ? "none" : "transform 0.3s ease-out",
            background: isBlack ? (hasTriggered ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.85)") : (hasTriggered ? "linear-gradient(135deg, #8A2BE2, #FF00FF)" : "#FF00FF"),
            boxShadow: isBlack ? (hasTriggered ? "0 0 20px rgba(255,255,255,0.3)" : "0 0 15px rgba(255,255,255,0.25)") : (hasTriggered ? "0 0 20px rgba(138,43,226,0.7)" : "0 0 15px rgba(255,0,255,0.4)"),
          }}
          onPointerDown={handlePointerDown}
        >
          {hasTriggered ? (
            <IconCheck className={`w-4 h-4 ${isBlack ? "text-black" : "text-white"}`} />
          ) : (
            <div className="flex items-center" style={{ animation: "slide-hint 1.5s ease-in-out infinite" }}>
              <IconChevronRight className={`w-4 h-4 ${isBlack ? "text-black" : "text-white"}`} />
            </div>
          )}
        </div>
        {!hasTriggered && !isDragging && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none opacity-30">
            <IconChevronRight className={`w-2.5 h-2.5 ${isBlack ? "text-white/60" : "text-[#FF00FF]"}`} />
            <IconChevronRight className={`w-2.5 h-2.5 ${isBlack ? "text-white/60" : "text-[#FF00FF]"}`} />
          </div>
        )}
      </div>
      <style jsx>{`
        @keyframes burst-fade {
          0% { opacity: 1; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes soft-bloom {
          0% { transform: translate(-50%, 0) scale(0.3); opacity: 0; }
          20% { opacity: 1; }
          60% { opacity: 0.8; }
          100% { transform: translate(-50%, 0) scale(1.4); opacity: 0; }
        }
        @keyframes soft-sparkle {
          0% { transform: scale(0); opacity: 0; }
          30% { opacity: 1; transform: scale(1.3); }
          80% { opacity: 0.7; }
          100% { opacity: 0; transform: scale(2); }
        }
        @keyframes text-glow-pulse {
          0%, 100% { text-shadow: 0 0 10px rgba(255,107,157,0.8), 0 0 20px rgba(255,107,157,0.5), 0 0 40px rgba(255,0,255,0.4), 0 0 60px rgba(255,107,157,0.3); }
          50% { text-shadow: 0 0 15px rgba(255,107,157,1), 0 0 30px rgba(255,107,157,0.7), 0 0 50px rgba(255,0,255,0.6), 0 0 80px rgba(255,107,157,0.5); }
        }
        @keyframes slide-hint {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(8px); }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(255,0,255,0.3), 0 0 40px rgba(255,0,255,0.1); }
          50% { box-shadow: 0 0 30px rgba(255,0,255,0.5), 0 0 60px rgba(255,0,255,0.2); }
        }
      `}</style>
    </div>
  )
}

/* ====================================================
   MAIN PAGE - DRAW CONTENT ONLY
   ==================================================== */

const WIN_RATE = 0.2 // 20% 당첨, 80% 실패

export default function LuckyDrawPage() {
  const { theme } = useSiteTheme()
  const isBlack = theme === "black"
  const [isSpinning, setIsSpinning] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [isWin, setIsWin] = useState(false)
  const [slideResetKey, setSlideResetKey] = useState(0)

  const handleDrawTrigger = useCallback(() => {
    setIsSpinning(true)
    setTimeout(() => {
      setIsSpinning(false)
      setIsWin(Math.random() < WIN_RATE)
      setShowResultModal(true)
    }, SPIN_DURATION_MS)
  }, [])

  const handleCloseModal = useCallback(() => {
    setShowResultModal(false)
    setSlideResetKey((k) => k + 1)
  }, [])

  return (
    <main className="relative min-h-0 overflow-hidden" style={{ background: isBlack ? "var(--bg-primary, #000)" : "#000" }}>
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px]" style={{ background: isBlack ? "rgba(255,105,180,0.02)" : "rgba(255,0,255,0.03)" }} />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: isBlack ? "rgba(255,105,180,0.01)" : "rgba(255,0,255,0.02)" }} />
      </div>

      {/* Scrollable content — layout의 pb-for-nav로 하단 여백 충분 */}
      <div className="relative z-10 pb-4 flex flex-col gap-6">
        <div className="pt-4"><LiveFeed /></div>
        <section className="pt-2"><CountdownTimer /></section>
        <section className="px-5 pt-2">
          <SlotMachineHero isSpinning={isSpinning} onDrawTrigger={handleDrawTrigger} slideResetKey={slideResetKey} />
        </section>
        <section><StatsCard /></section>
        <section><PrizeInfo /></section>
      </div>

      {/* 당첨/실패 팝업 */}
      <ResultModal show={showResultModal} onClose={handleCloseModal} isWin={isWin} />
    </main>
  )
}
