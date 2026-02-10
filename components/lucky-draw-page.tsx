"use client"

import React from "react"
import { useEffect, useState, useRef, useCallback } from "react"

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
const feedActions = [
  "just entered the draw", "boosted with K-Points", "joined from Seoul",
  "entered with x2 boost", "just joined the raffle",
]

function LiveFeed() {
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
  }, [])

  return (
    <div className="mx-5">
      <div
        className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 transition-all duration-300 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        }`}
        style={{ 
          background: "rgba(26,26,26,0.8)",
          borderColor: "rgba(255,107,157,0.5)",
          boxShadow: "0 0 12px rgba(255,107,157,0.3), inset 0 0 8px rgba(255,107,157,0.1)",
        }}
      >
        <span className="text-white text-xs font-semibold" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>{entry.user}</span>
        <span className="text-white/80 text-xs" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>{entry.action}</span>
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
        <div className="h-[1px] w-8" style={{ background: "linear-gradient(to right, transparent, rgba(255,107,157,0.5))" }} />
        <span className="text-[10px] uppercase tracking-[0.3em] text-[#8c8c8c]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>Draw Closes In</span>
        <div className="h-[1px] w-8" style={{ background: "linear-gradient(to left, transparent, rgba(255,107,157,0.5))" }} />
      </div>

      {/* Timer with glitch */}
      <div className="relative">
        <div className="glitch-text text-6xl md:text-7xl tracking-tighter italic text-[#fafafa]" data-text={timeString} style={{ fontFamily: "var(--font-anton), Anton, sans-serif" }}>
          {timeString}
        </div>
      </div>

      {/* Unit labels */}
      <div className="flex items-center gap-8 -mt-2">
        {["Hours", "Min", "Sec"].map((label) => (
          <span key={label} className="text-[9px] uppercase tracking-widest text-[#8c8c8c]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>{label}</span>
        ))}
      </div>

      {/* Live participants */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[hsl(0,0%,14.9%)]" style={{ background: "rgba(26,26,26,0.8)" }}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
        </span>
        <span className="text-xs text-[#8c8c8c]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
          <span className="text-[#fafafa] font-medium">{participantCount.toLocaleString()}</span>{" "}People Joined
        </span>
      </div>
    </div>
  )
}

/* ====================================================
   SLOT MACHINE HERO SECTION
   ==================================================== */

function SlotMachineHero() {
  const [isSpinning, setIsSpinning] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsSpinning(true)
      setTimeout(() => setIsSpinning(false), 700)
    }, 7000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full">
      {/* LEGENDARY DROP badge */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30">
        <div
          className="relative px-5 py-1.5 rounded-full"
          style={{
            background: "linear-gradient(135deg, #FF6B9D, #FF4D94)",
            boxShadow: "0 0 15px rgba(255,107,157,0.5), 0 0 30px rgba(255,107,157,0.2)",
            animation: "glow-pulse 2s ease-in-out infinite",
          }}
        >
          <span className="text-[11px] uppercase tracking-[0.15em] text-white italic whitespace-nowrap" style={{ fontFamily: "var(--font-anton), Anton, sans-serif" }}>
            Legendary Drop
          </span>
        </div>
      </div>

      {/* Outer Machine Frame */}
      <div
        className="relative mx-auto max-w-sm rounded-2xl p-[2px]"
        style={{ background: "#FF6B9D" }}
      >
        {/* Inner border for depth */}
        <div className="rounded-2xl p-[1px]" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.1) 100%)" }}>
          {/* Machine Body */}
          <div className="relative rounded-2xl overflow-hidden" style={{ background: "#0a0a0a" }}>

            {/* TOP CHROME BAR */}
            <div className="relative flex items-center justify-between px-4 py-2.5 border-b border-[rgba(255,0,255,0.2)]" style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #111 100%)" }}>
              <div className="flex items-center gap-1.5">
                {[0,1,2,3].map((i) => (
                  <div key={`ll-${i}`} className="w-1.5 h-1.5 rounded-full" style={{ background: "#FF6B9D", boxShadow: "0 0 4px #FF6B9D, 0 0 8px #FF6B9D", animation: `pulse 1.5s ease-in-out ${i * 0.15}s infinite` }} />
                ))}
              </div>
              <span className="text-[11px] uppercase tracking-[0.35em] italic text-[#FF6B9D]" style={{ fontFamily: "var(--font-anton), Anton, sans-serif" }}>Lucky Reel</span>
              <div className="flex items-center gap-1.5">
                {[0,1,2,3].map((i) => (
                  <div key={`lr-${i}`} className="w-1.5 h-1.5 rounded-full" style={{ background: "#FF6B9D", boxShadow: "0 0 4px #FF6B9D, 0 0 8px #FF6B9D", animation: `pulse 1.5s ease-in-out ${i * 0.15 + 0.3}s infinite` }} />
                ))}
              </div>
            </div>

            {/* REEL WINDOW */}
            <div className="relative overflow-hidden">

              {/* Vertical reel stripe lines */}
              <div className="absolute inset-0 z-10 pointer-events-none">
                {[25, 50, 75].map((pos) => (
                  <div key={`s-${pos}`} className="absolute top-0 bottom-0 w-[1px]" style={{ left: `${pos}%`, background: "linear-gradient(180deg, rgba(255,0,255,0.5) 0%, rgba(255,0,255,0.2) 20%, rgba(255,0,255,0.08) 50%, rgba(255,0,255,0.2) 80%, rgba(255,0,255,0.5) 100%)", boxShadow: "0 0 6px rgba(255,0,255,0.15), 0 0 2px rgba(255,0,255,0.3)" }} />
                ))}
                {[12.5, 37.5, 62.5, 87.5].map((pos) => (
                  <div key={`ss-${pos}`} className="absolute top-0 bottom-0 w-[1px]" style={{ left: `${pos}%`, background: "linear-gradient(180deg, transparent 5%, rgba(255,0,255,0.04) 30%, rgba(255,0,255,0.06) 50%, rgba(255,0,255,0.04) 70%, transparent 95%)" }} />
                ))}
              </div>

              {/* Side vignette */}
              <div className="absolute inset-0 z-20 pointer-events-none" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.8), transparent 20%, transparent 80%, rgba(0,0,0,0.8))" }} />

              {/* Scan lines */}
              <div className="absolute inset-0 z-20 pointer-events-none opacity-[0.03]" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 4px)" }} />

              {/* 3 REEL ITEMS */}
              <div
                className="relative flex flex-col"
                style={{ transition: isSpinning ? "transform 0.7s cubic-bezier(0.23, 1, 0.32, 1)" : "none", transform: isSpinning ? "translateY(-8px)" : "translateY(0)" }}
              >
                {/* TOP ITEM - blurred */}
                <div className="relative h-28 w-full overflow-hidden opacity-30 bg-black/50">
                  {/* Image placeholder - will be replaced with video */}
                </div>

                {/* Top payline */}
                <div className="relative h-[1px] w-full z-20" style={{ background: "linear-gradient(90deg, transparent 5%, rgba(255,0,255,0.15) 30%, rgba(255,0,255,0.15) 70%, transparent 95%)" }} />

                {/* CENTER ITEM - sharp, THE prize */}
                <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4/3" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/sneaker-hero.jpg" alt="Air Max Obsidian - Legendary sneaker drop" className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(255,107,157,0.1), transparent 30%, transparent 70%, rgba(255,107,157,0.1))", mixBlendMode: "screen" }} />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-40 h-40 rounded-full" style={{ background: "radial-gradient(circle, transparent 50%, rgba(255,107,157,0.08) 70%, transparent 90%)", boxShadow: "0 0 40px rgba(255,107,157,0.1), inset 0 0 40px rgba(255,107,157,0.05)" }} />
                  </div>
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(255,107,157,0.1), transparent)" }} />
                </div>

                {/* Bottom payline */}
                <div className="relative h-[1px] w-full z-20" style={{ background: "linear-gradient(90deg, transparent 5%, rgba(255,0,255,0.15) 30%, rgba(255,0,255,0.15) 70%, transparent 95%)" }} />

                {/* BOTTOM ITEM - blurred */}
                <div className="relative h-28 w-full overflow-hidden opacity-30 bg-black/50">
                  {/* Image placeholder - will be replaced with video */}
                </div>
              </div>

              {/* CENTER PAYLINE WITH ARROWS */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 z-30 pointer-events-none">
                <div className="h-[2px] w-full" style={{ background: "linear-gradient(90deg, #FF6B9D 0%, rgba(255,107,157,0.5) 15%, rgba(255,107,157,0.15) 40%, rgba(255,107,157,0.15) 60%, rgba(255,107,157,0.5) 85%, #FF6B9D 100%)", boxShadow: "0 0 8px rgba(255,107,157,0.4), 0 0 16px rgba(255,107,157,0.15)" }} />
                <div className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-4 h-6" style={{ clipPath: "polygon(0 0, 100% 30%, 100% 70%, 0 100%)", background: "linear-gradient(90deg, #FF6B9D, rgba(255,107,157,0.6))", boxShadow: "0 0 10px #FF6B9D" }} />
                <div className="absolute -right-[1px] top-1/2 -translate-y-1/2 w-4 h-6" style={{ clipPath: "polygon(0 30%, 100% 0, 100% 100%, 0 70%)", background: "linear-gradient(270deg, #FF6B9D, rgba(255,107,157,0.6))", boxShadow: "0 0 10px #FF6B9D" }} />
              </div>

              {/* Neon side rails */}
              <div className="absolute top-0 bottom-0 left-0 w-[2px] z-20" style={{ background: "linear-gradient(180deg, transparent, #FF6B9D 20%, #FF6B9D 80%, transparent)", boxShadow: "0 0 8px #FF6B9D, 0 0 16px rgba(255,107,157,0.3)" }} />
              <div className="absolute top-0 bottom-0 right-0 w-[2px] z-20" style={{ background: "linear-gradient(180deg, transparent, #FF6B9D 20%, #FF6B9D 80%, transparent)", boxShadow: "0 0 8px #FF6B9D, 0 0 16px rgba(255,107,157,0.3)" }} />
            </div>

            {/* BOTTOM CHROME BAR */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-[rgba(255,0,255,0.2)]" style={{ background: "linear-gradient(180deg, #111 0%, #1a1a1a 100%)" }}>
              <span className="text-[10px] text-[#8c8c8c] uppercase tracking-wider" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
                Air Max &ldquo;Obsidian&rdquo;
              </span>
              <span className="text-sm italic text-[#FF6B9D]" style={{ fontFamily: "var(--font-anton), Anton, sans-serif" }}>
                {"#0042"}
              </span>
            </div>
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
  return (
    <div className="mx-5 glass rounded-2xl p-4">
      <div className="flex items-center justify-between">
        {/* Win Rate */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl border" style={{ background: "rgba(255,107,157,0.1)", borderColor: "rgba(255,107,157,0.3)" }}>
            <IconTrendingUp className="w-4 h-4 text-[#FF6B9D]" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#8c8c8c]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>Current Win Rate</p>
            <p className="text-xl italic text-[#fafafa] tracking-tight" style={{ fontFamily: "var(--font-anton), Anton, sans-serif" }}>0.01%</p>
          </div>
        </div>
        {/* Divider */}
        <div className="h-10 w-[1px] bg-[hsl(0,0%,14.9%)]" />
        {/* Boost */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl border" style={{ background: "rgba(255,107,157,0.1)", borderColor: "rgba(255,107,157,0.3)" }}>
            <IconZap className="w-4 h-4 text-[#FF6B9D]" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#8c8c8c]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>K-Point Boost</p>
            <p className="text-xl italic tracking-tight" style={{ fontFamily: "var(--font-anton), Anton, sans-serif" }}>
              <span className="text-[#FF6B9D]">x2</span>{" "}
              <span className="text-[#fafafa] text-sm">Chance</span>
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

const prizeTiers: PrizeTier[] = [
  { Icon: IconCrown, label: "Legendary", prize: "1 of 1 Sneaker", color: "#FF6B9D", bgAlpha: "0.1", borderAlpha: "0.4", glowColor: "rgba(255,107,157,0.2)" },
  { Icon: IconGem, label: "Unique", prize: "Signed Merch Pack", color: "#facc15", bgAlpha: "0.1", borderAlpha: "0.2", glowColor: "rgba(250,204,21,0.1)" },
  { Icon: IconShield, label: "Rare", prize: "500 K-Points", color: "#22d3ee", bgAlpha: "0.1", borderAlpha: "0.2", glowColor: "rgba(34,211,238,0.1)" },
]

function PrizeInfo() {
  return (
    <div className="mx-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-[1px] flex-1" style={{ background: "linear-gradient(to right, transparent, hsl(0,0%,14.9%))" }} />
        <span className="text-xs uppercase tracking-[0.3em] italic text-[#8c8c8c]" style={{ fontFamily: "var(--font-anton), Anton, sans-serif" }}>Prize Tiers</span>
        <div className="h-[1px] flex-1" style={{ background: "linear-gradient(to left, transparent, hsl(0,0%,14.9%))" }} />
      </div>

      <div className="flex gap-2">
        {prizeTiers.map((tier) => (
          <div
            key={tier.label}
            className="flex-1 flex flex-col items-center gap-2 py-3 px-2 rounded-xl border"
            style={{
              background: `rgba(${tier.color === "#FF6B9D" ? "255,107,157" : tier.color === "#FF00FF" ? "255,0,255" : tier.color === "#facc15" ? "250,204,21" : "34,211,238"},${tier.bgAlpha})`,
              borderColor: `rgba(${tier.color === "#FF6B9D" ? "255,107,157" : tier.color === "#FF00FF" ? "255,0,255" : tier.color === "#facc15" ? "250,204,21" : "34,211,238"},${tier.borderAlpha})`,
              boxShadow: `0 0 12px ${tier.glowColor}`,
            }}
          >
            <tier.Icon className="w-5 h-5" style={{ color: tier.color }} />
            <span className="text-xs italic uppercase" style={{ fontFamily: "var(--font-anton), Anton, sans-serif", color: tier.color }}>{tier.label}</span>
            <span className="text-[10px] text-[#8c8c8c] text-center leading-tight" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>{tier.prize}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ====================================================
   SLIDE TO ENTER SECTION
   ==================================================== */

function SlideToEnter() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [showBurst, setShowBurst] = useState(false)
  const [trackWidth, setTrackWidth] = useState(0)
  const handleSize = 56

  useEffect(() => {
    if (trackRef.current) setTrackWidth(trackRef.current.offsetWidth)
    const onResize = () => { if (trackRef.current) setTrackWidth(trackRef.current.offsetWidth) }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const maxDrag = trackWidth - handleSize - 8

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isCompleted) return
      setIsDragging(true)
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [isCompleted],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !trackRef.current || isCompleted) return
      const rect = trackRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left - handleSize / 2
      setDragX(Math.max(0, Math.min(x, maxDrag)))
    },
    [isDragging, isCompleted, maxDrag],
  )

  const handlePointerUp = useCallback(() => {
    if (isCompleted) return
    setIsDragging(false)
    if (dragX >= maxDrag * 0.85) {
      setDragX(maxDrag)
      setIsCompleted(true)
      setShowBurst(true)
      setTimeout(() => setShowBurst(false), 1500)
    } else {
      setDragX(0)
    }
  }, [dragX, maxDrag, isCompleted])

  const progress = maxDrag > 0 ? dragX / maxDrag : 0

  return (
    <div className="relative w-full px-5">
      {/* JACKPOT BURST */}
      {showBurst && (
        <>
          <div className="fixed inset-0 z-50 pointer-events-none" style={{ animation: "burst-fade 1.5s ease-out forwards" }}>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200vw] h-[200vh]" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(255,107,157,0.5) 0%, rgba(255,0,255,0.3) 20%, rgba(255,107,157,0.15) 40%, transparent 70%)", animation: "burst-expand 1s ease-out forwards" }} />
          </div>
          <div className="fixed bottom-20 left-0 right-0 z-50 pointer-events-none flex items-center justify-center" style={{ animation: "burst-fade 1.2s ease-out forwards" }}>
            {[...Array(12)].map((_, i) => (
              <div key={`ray-${i}`} className="absolute" style={{ width: "2px", height: `${80 + Math.random() * 60}px`, background: `linear-gradient(to top, ${i % 2 === 0 ? "#FF6B9D" : "#FF00FF"}, transparent)`, transform: `rotate(${i * 30}deg)`, transformOrigin: "bottom center", animation: `ray-shoot 0.8s ease-out ${i * 0.03}s forwards`, opacity: 0 }} />
            ))}
          </div>
          <div className="absolute -inset-x-10 -bottom-10 h-40 z-40 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 80%, rgba(255,107,157,0.6) 0%, rgba(255,0,255,0.3) 30%, transparent 70%)", animation: "glow-burst 1s ease-out forwards" }} />
        </>
      )}

      {/* SLIDER TRACK */}
      <div
        ref={trackRef}
        className="relative h-14 rounded-full border overflow-hidden cursor-pointer select-none transition-all duration-500"
        style={{
          borderColor: isCompleted ? "rgba(138,43,226,0.6)" : "rgba(255,0,255,0.4)",
          background: isCompleted
            ? "linear-gradient(90deg, rgba(138,43,226,0.2) 0%, rgba(255,0,255,0.15) 50%, rgba(138,43,226,0.2) 100%)"
            : `linear-gradient(90deg, rgba(255,0,255,0.08) 0%, rgba(255,0,255,${0.08 + progress * 0.15}) ${progress * 100}%, rgba(26,26,26,0.8) ${progress * 100}%, rgba(26,26,26,0.8) 100%)`,
          boxShadow: isCompleted
            ? "0 0 30px rgba(138,43,226,0.4), 0 0 60px rgba(255,0,255,0.2), inset 0 0 20px rgba(138,43,226,0.15)"
            : `0 0 ${15 + progress * 25}px rgba(255,0,255,${0.15 + progress * 0.3}), inset 0 0 ${10 + progress * 15}px rgba(255,0,255,${0.05 + progress * 0.1})`,
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Idle text */}
        {!isCompleted && !isDragging && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm uppercase tracking-[0.2em] italic text-[rgba(255,0,255,0.7)] animate-pulse" style={{ fontFamily: "var(--font-anton), Anton, sans-serif" }}>Pull to Spin</span>
          </div>
        )}

        {/* Completed text */}
        {isCompleted && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-base uppercase tracking-[0.25em] italic" style={{ fontFamily: "var(--font-anton), Anton, sans-serif", color: "#FFE5F0", textShadow: "0 0 10px rgba(255,107,157,0.8), 0 0 20px rgba(255,107,157,0.5), 0 0 40px rgba(255,0,255,0.4), 0 0 60px rgba(255,107,157,0.3)", animation: "text-glow-pulse 2s ease-in-out infinite" }}>
              {"You're In"}
            </span>
          </div>
        )}

        {/* Progress line */}
        {!isCompleted && (
          <div className="absolute top-1/2 left-4 -translate-y-1/2 h-[2px] rounded-full transition-all" style={{ width: `${dragX}px`, background: "rgba(255,0,255,0.5)" }} />
        )}

        {/* Handle */}
        <div
          className="absolute top-1 left-1 flex items-center justify-center rounded-full"
          style={{
            width: handleSize,
            height: handleSize - 8,
            transform: `translateX(${dragX}px)`,
            transition: isDragging ? "none" : "transform 0.3s ease-out",
            background: isCompleted ? "linear-gradient(135deg, #8A2BE2, #FF00FF)" : "#FF00FF",
            boxShadow: isCompleted
              ? "0 0 25px rgba(138,43,226,0.7), 0 0 50px rgba(255,0,255,0.3)"
              : "0 0 15px rgba(255,0,255,0.4)",
          }}
          onPointerDown={handlePointerDown}
        >
          {isCompleted ? (
            <IconCheck className="w-5 h-5 text-white" />
          ) : (
            <div className="flex items-center" style={{ animation: "slide-hint 1.5s ease-in-out infinite" }}>
              <IconChevronRight className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* Arrow hints */}
        {!isCompleted && !isDragging && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none opacity-30">
            <IconChevronRight className="w-3 h-3 text-[#FF00FF]" />
            <IconChevronRight className="w-3 h-3 text-[#FF00FF]" />
            <IconChevronRight className="w-3 h-3 text-[#FF00FF]" />
          </div>
        )}
      </div>

      {/* Inline keyframes for burst */}
      <style jsx>{`
        @keyframes burst-expand {
          0% { transform: translate(-50%, 0) scale(0.3); opacity: 1; }
          100% { transform: translate(-50%, 0) scale(1); opacity: 0; }
        }
        @keyframes burst-fade {
          0% { opacity: 1; }
          60% { opacity: 0.8; }
          100% { opacity: 0; }
        }
        @keyframes ray-shoot {
          0% { opacity: 0; height: 0; }
          30% { opacity: 1; }
          100% { opacity: 0; height: 120px; }
        }
        @keyframes glow-burst {
          0% { opacity: 1; transform: scale(0.8); }
          50% { opacity: 0.7; transform: scale(1.2); }
          100% { opacity: 0; transform: scale(1.5); }
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

export default function LuckyDrawPage() {
  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: "#000" }}>
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px]" style={{ background: "rgba(255,0,255,0.03)" }} />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: "rgba(255,0,255,0.02)" }} />
      </div>

      {/* Scrollable content */}
      <div className="relative z-10 pb-28 flex flex-col gap-6">
        <div className="pt-4"><LiveFeed /></div>
        <section className="pt-2"><CountdownTimer /></section>
        <section className="px-5 pt-2"><SlotMachineHero /></section>
        <section><StatsCard /></section>
        <section><PrizeInfo /></section>
        <div className="h-4" />
      </div>

      {/* Fixed slider at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 pb-5 pt-4" style={{ background: "linear-gradient(to top, #000, rgba(0,0,0,0.95) 70%, transparent)" }}>
        <SlideToEnter />
      </div>
    </main>
  )
}
