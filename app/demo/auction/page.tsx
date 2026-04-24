"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, Award, Clock3, CreditCard, Gavel, RotateCcw, ShieldCheck, X } from "lucide-react"
import { useLocale } from "@/components/locale-provider"
import { useSiteTheme } from "@/components/theme-provider"
import { useSupabaseSession } from "@/hooks/use-supabase-session"
import { cn } from "@/lib/utils"

const AUCTION_ID = "demo-premium-peaceminusone-cap"
const OPENING_BID = 2_805_000
const MIN_BID_INCREMENT = 180_000
const INTRO_DELAY_MS = 1400
const INITIAL_END_SECOND = 36
const EXTENSION_MS = 20_000

const demoTimeline = [
  { second: 0, type: "start" },
  { second: 3, type: "demo_bid", bidderIndex: 0, amountMultiplier: 1.1 },
  { second: 7, type: "demo_bid", bidderIndex: 1, amountMultiplier: 1.25 },
  { second: 11, type: "demo_bid", bidderIndex: 2, amountMultiplier: 1.45 },
  { second: 15, type: "user_bid_window", duration: 6 },
  { second: 22, type: "demo_bid", bidderIndex: 3, amountMultiplier: 1.75 },
  { second: 28, type: "demo_bid", bidderIndex: 1, amountMultiplier: 2.05, extendIfNearEnd: true },
  { second: 36, type: "demo_bid", bidderIndex: 4, amountMultiplier: 2.4 },
  { second: 45, type: "close_auction" },
  { second: 50, type: "show_result" },
] as const

const colorParts = ["Pink", "Blue", "Silver", "Neon", "Velvet", "Cherry", "Moon", "Coral", "Mint", "Black", "Golden", "Violet"]
const animalParts = ["Elephant", "Penguin", "Fox", "Tiger", "Panda", "Otter", "Rabbit", "Whale", "Falcon", "Swan", "Koala", "Leopard"]

type DemoPhase = "intro" | "live" | "user_window" | "closing" | "sold"
type DemoBidSource = "demo_simulation" | "demo_user_interaction"
type HelperKey = "intro" | "live" | "tryBid" | "closing" | "sold"
type NoticeKey = "auctionExtended" | null

type DemoBidRecord = {
  id: string
  demoRunId: string
  auctionId: string
  bidderName: string
  bidAmount: number
  bidTime: string
  isDemoBid: true
  bidSource: DemoBidSource
}

type DemoRunRecord = {
  id: string
  auctionId: string
  status: "playing" | "closed" | "sold"
  startedAt: string
  endsAt: string
  finalPrice: number | null
  winnerName: string | null
  runnerUpName: string | null
  createdAt: string
}

type DemoState = {
  demoRun: DemoRunRecord
  demoParticipants: string[]
  phase: DemoPhase
  helperKey: HelperKey
  noticeKey: NoticeKey
  bidLog: DemoBidRecord[]
  currentBid: number
  highestBidderName: string | null
  runnerUpName: string | null
  remainingSeconds: number
  canUserBid: boolean
  userBidPlaced: boolean
  pricePulseKey: number
}

const enCopy = {
  backHome: "Back",
  liveNow: "LIVE NOW",
  demoPlayback: "DEMO PLAYBACK",
  premiumAuction: "PREMIUM AUCTION",
  productName: "PEACEMINUSONE Cap",
  productDescription: "Ubermensch 2025 world tour special merch with verified provenance.",
  currentBid: "CURRENT BID",
  timeRemaining: "TIME REMAINING",
  leadingBidder: "HIGHEST BIDDER",
  openingBid: "Opening Bid",
  minIncrement: "Minimum Increment",
  priceFlow: "Price Flow",
  bidLog: "Bid Log",
  noBids: "Waiting for the first bid",
  placeBid: "PLACE BID",
  yourOffer: "Your Offer",
  minimumBid: "Minimum Bid",
  confirmBid: "Confirm Bid",
  closeBidSheet: "Close bid sheet",
  tryBid: "Try placing a bid",
  intro: "Demo auction is preparing",
  live: "Automatic auction playback is running",
  closing: "Auction is closing",
  sold: "Sold",
  finalPrice: "Final Price",
  winner: "Winner",
  runnerUp: "Runner-up",
  totalBids: "Total Bids",
  paymentPending: "Payment Pending",
  certificateReady: "Digital Certificate Ready",
  auctionExtended: "Auction Extended",
  replayDemo: "Replay Demo",
  userFallback: "You",
  demoOnly: "Demo interaction only. No payment, shipment, or user notification is created.",
}

const koCopy: typeof enCopy = {
  backHome: "뒤로",
  liveNow: "라이브 진행 중",
  demoPlayback: "시연 재생",
  premiumAuction: "프리미엄 경매",
  productName: "PEACEMINUSONE 캡",
  productDescription: "검증된 이력이 연결된 Ubermensch 2025 월드 투어 스페셜 머치입니다.",
  currentBid: "현재 입찰가",
  timeRemaining: "남은 시간",
  leadingBidder: "현재 최고 입찰자",
  openingBid: "시작 입찰가",
  minIncrement: "최소 입찰 단위",
  priceFlow: "가격 흐름",
  bidLog: "입찰 로그",
  noBids: "첫 입찰을 기다리는 중",
  placeBid: "입찰하기",
  yourOffer: "내 입찰가",
  minimumBid: "최소 입찰가",
  confirmBid: "입찰 확정",
  closeBidSheet: "입찰창 닫기",
  tryBid: "입찰을 체험해보세요",
  intro: "경매 시연을 준비 중입니다",
  live: "자동 경매 시연이 진행 중입니다",
  closing: "경매가 마감 중입니다",
  sold: "낙찰 완료",
  finalPrice: "최종 낙찰가",
  winner: "낙찰자",
  runnerUp: "차순위 입찰자",
  totalBids: "총 입찰 수",
  paymentPending: "결제 대기",
  certificateReady: "디지털 보증서 준비 완료",
  auctionExtended: "마감 직전 입찰로 경매 시간이 연장되었습니다",
  replayDemo: "다시 재생",
  userFallback: "나",
  demoOnly: "시연용 체험입니다. 실제 결제, 배송, 유저 알림은 생성되지 않습니다.",
}

function generateDemoParticipants() {
  const participantCount = 5 + Math.floor(Math.random() * 2)
  const handles = new Set<string>()

  while (handles.size < participantCount) {
    const color = colorParts[Math.floor(Math.random() * colorParts.length)]
    const animal = animalParts[Math.floor(Math.random() * animalParts.length)]
    const number = Math.floor(Math.random() * 99) + 1
    handles.add(`${color}${animal}${number}`)
  }

  return Array.from(handles)
}

function createDemoState(demoParticipants: string[]): DemoState {
  const now = Date.now()
  const startedAtMs = now + INTRO_DELAY_MS
  const endsAtMs = startedAtMs + INITIAL_END_SECOND * 1000
  const runId = `demo-run-${now}-${Math.random().toString(36).slice(2, 8)}`

  return {
    demoRun: {
      id: runId,
      auctionId: AUCTION_ID,
      status: "playing",
      startedAt: new Date(startedAtMs).toISOString(),
      endsAt: new Date(endsAtMs).toISOString(),
      finalPrice: null,
      winnerName: null,
      runnerUpName: null,
      createdAt: new Date(now).toISOString(),
    },
    demoParticipants,
    phase: "intro",
    helperKey: "intro",
    noticeKey: null,
    bidLog: [],
    currentBid: OPENING_BID,
    highestBidderName: null,
    runnerUpName: null,
    remainingSeconds: INITIAL_END_SECOND,
    canUserBid: false,
    userBidPlaced: false,
    pricePulseKey: 0,
  }
}

function formatWonDigits(amount: number) {
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatTimer(totalSeconds: number) {
  const minutes = Math.floor(Math.max(0, totalSeconds) / 60)
  const seconds = Math.max(0, totalSeconds) % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

function formatInputValue(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 0,
  }).format(value)
}

function parseInputValue(value: string) {
  const parsed = Number(value.replace(/[^\d]/g, ""))
  return Number.isFinite(parsed) ? parsed : 0
}

function timeFromStart(bidTime: string, startedAt: string) {
  const elapsed = Math.max(0, Math.round((new Date(bidTime).getTime() - new Date(startedAt).getTime()) / 1000))
  return `T+${String(elapsed).padStart(2, "0")}s`
}

function nextBidAmount(currentBid: number, amountMultiplier: number) {
  const multiplied = Math.round(OPENING_BID * amountMultiplier)
  const nextAmount = Math.max(multiplied, currentBid + MIN_BID_INCREMENT)
  return Math.ceil(nextAmount / 1000) * 1000
}

export default function DemoAuctionPage() {
  const { locale } = useLocale()
  const { theme } = useSiteTheme()
  const { user } = useSupabaseSession()
  const isKo = locale === "ko"
  const copy = isKo ? koCopy : enCopy
  const [runSerial, setRunSerial] = useState(0)
  const [demoState, setDemoState] = useState<DemoState>(() => createDemoState([]))
  const [bidSheetOpen, setBidSheetOpen] = useState(false)
  const [offerAmount, setOfferAmount] = useState(formatInputValue(OPENING_BID + MIN_BID_INCREMENT))

  const userBidderName = useMemo(() => {
    const metadata = user?.user_metadata as Record<string, unknown> | undefined
    const candidate = metadata?.user_name ?? metadata?.nickname ?? metadata?.full_name
    return typeof candidate === "string" && candidate.trim() ? candidate.trim().split(/\s+/)[0] : copy.userFallback
  }, [copy.userFallback, user])

  useEffect(() => {
    setDemoState(createDemoState(generateDemoParticipants()))
  }, [runSerial])

  const replayDemo = useCallback(() => {
    setBidSheetOpen(false)
    setRunSerial((value) => value + 1)
  }, [])

  const minimumUserBid = demoState.currentBid + MIN_BID_INCREMENT

  useEffect(() => {
    if (demoState.canUserBid) {
      setOfferAmount(formatInputValue(minimumUserBid))
    } else {
      setBidSheetOpen(false)
    }
  }, [demoState.canUserBid, minimumUserBid])

  useEffect(() => {
    if (!demoState.demoParticipants.length) return

    const runId = demoState.demoRun.id
    const timeouts: number[] = []

    const clearNoticeLater = () => {
      timeouts.push(window.setTimeout(() => {
        setDemoState((previous) => previous.demoRun.id === runId ? { ...previous, noticeKey: null } : previous)
      }, 3600))
    }

    const addBid = (
      bidderName: string,
      amountMultiplier: number,
      bidSource: DemoBidSource,
      extendIfNearEnd = false,
      fixedAmount?: number,
    ) => {
      setDemoState((previous) => {
        if (previous.demoRun.id !== runId || previous.phase === "sold" || previous.phase === "closing") {
          return previous
        }

        const bidAmount = fixedAmount ?? nextBidAmount(previous.currentBid, amountMultiplier)
        const nextAmount = Math.max(bidAmount, previous.currentBid + MIN_BID_INCREMENT)
        const roundedAmount = Math.ceil(nextAmount / 1000) * 1000
        const previousLeader = previous.highestBidderName
        const remainingMs = new Date(previous.demoRun.endsAt).getTime() - Date.now()
        const shouldExtend = extendIfNearEnd && remainingMs <= 10_000 && remainingMs > 0
        const nextEndsAt = shouldExtend
          ? new Date(new Date(previous.demoRun.endsAt).getTime() + EXTENSION_MS).toISOString()
          : previous.demoRun.endsAt
        const nextBid: DemoBidRecord = {
          id: `${runId}-bid-${previous.bidLog.length + 1}`,
          demoRunId: runId,
          auctionId: AUCTION_ID,
          bidderName,
          bidAmount: roundedAmount,
          bidTime: new Date().toISOString(),
          isDemoBid: true,
          bidSource,
        }

        return {
          ...previous,
          demoRun: {
            ...previous.demoRun,
            endsAt: nextEndsAt,
          },
          phase: previous.phase === "intro" ? "live" : previous.phase,
          helperKey: previous.phase === "user_window" && bidSource === "demo_user_interaction" ? "live" : previous.helperKey,
          noticeKey: shouldExtend ? "auctionExtended" : previous.noticeKey,
          bidLog: [nextBid, ...previous.bidLog],
          currentBid: roundedAmount,
          highestBidderName: bidderName,
          runnerUpName: previousLeader ?? previous.runnerUpName,
          canUserBid: bidSource === "demo_user_interaction" ? false : previous.canUserBid,
          userBidPlaced: bidSource === "demo_user_interaction" ? true : previous.userBidPlaced,
          pricePulseKey: previous.pricePulseKey + 1,
        }
      })

      if (extendIfNearEnd) {
        clearNoticeLater()
      }
    }

    const schedule = (second: number, action: () => void) => {
      timeouts.push(window.setTimeout(action, INTRO_DELAY_MS + second * 1000))
    }

    const interval = window.setInterval(() => {
      setDemoState((previous) => {
        if (previous.demoRun.id !== runId || previous.phase === "sold") return previous
        const remainingSeconds = Math.max(0, Math.ceil((new Date(previous.demoRun.endsAt).getTime() - Date.now()) / 1000))
        return remainingSeconds === previous.remainingSeconds ? previous : { ...previous, remainingSeconds }
      })
    }, 250)

    for (const event of demoTimeline) {
      schedule(event.second, () => {
        if (event.type === "start") {
          setDemoState((previous) => previous.demoRun.id === runId ? { ...previous, phase: "live", helperKey: "live" } : previous)
          return
        }

        if (event.type === "demo_bid") {
          const bidderName = demoState.demoParticipants[event.bidderIndex] ?? demoState.demoParticipants[0]
          addBid(bidderName, event.amountMultiplier, "demo_simulation", "extendIfNearEnd" in event && Boolean(event.extendIfNearEnd))
          return
        }

        if (event.type === "user_bid_window") {
          setDemoState((previous) => previous.demoRun.id === runId
            ? { ...previous, phase: "user_window", helperKey: "tryBid", canUserBid: !previous.userBidPlaced }
            : previous)
          timeouts.push(window.setTimeout(() => {
            setDemoState((previous) => previous.demoRun.id === runId && previous.phase === "user_window"
              ? { ...previous, phase: "live", helperKey: "live", canUserBid: false }
              : previous)
          }, event.duration * 1000))
          return
        }

        if (event.type === "close_auction") {
          setDemoState((previous) => {
            if (previous.demoRun.id !== runId) return previous
            const runnerUpName = previous.runnerUpName ?? previous.bidLog.find((bid) => bid.bidderName !== previous.highestBidderName)?.bidderName ?? null
            return {
              ...previous,
              phase: "closing",
              helperKey: "closing",
              canUserBid: false,
              remainingSeconds: 0,
              demoRun: {
                ...previous.demoRun,
                status: "closed",
                endsAt: new Date().toISOString(),
                finalPrice: previous.currentBid,
                winnerName: previous.highestBidderName,
                runnerUpName,
              },
            }
          })
          return
        }

        if (event.type === "show_result") {
          setDemoState((previous) => previous.demoRun.id === runId
            ? { ...previous, phase: "sold", helperKey: "sold", demoRun: { ...previous.demoRun, status: "sold" } }
            : previous)
        }
      })
    }

    return () => {
      window.clearInterval(interval)
      timeouts.forEach((timeout) => window.clearTimeout(timeout))
    }
  }, [demoState.demoParticipants, demoState.demoRun.id])

  const handleUserBid = useCallback((requestedAmount?: number) => {
    if (!demoState.canUserBid || demoState.phase !== "user_window") return

    const runId = demoState.demoRun.id
    setDemoState((previous) => {
      if (previous.demoRun.id !== runId || !previous.canUserBid) return previous

      const minimumAmount = previous.currentBid + MIN_BID_INCREMENT
      const amount = Math.ceil(Math.max(requestedAmount ?? nextBidAmount(previous.currentBid, 1.62), minimumAmount) / 1000) * 1000
      const nextBid: DemoBidRecord = {
        id: `${runId}-bid-${previous.bidLog.length + 1}`,
        demoRunId: runId,
        auctionId: AUCTION_ID,
        bidderName: userBidderName,
        bidAmount: amount,
        bidTime: new Date().toISOString(),
        isDemoBid: true,
        bidSource: "demo_user_interaction",
      }

      return {
        ...previous,
        phase: "live",
        helperKey: "live",
        bidLog: [nextBid, ...previous.bidLog],
        currentBid: amount,
        highestBidderName: userBidderName,
        runnerUpName: previous.highestBidderName ?? previous.runnerUpName,
        canUserBid: false,
        userBidPlaced: true,
        pricePulseKey: previous.pricePulseKey + 1,
      }
    })
    setBidSheetOpen(false)
  }, [demoState.canUserBid, demoState.demoRun.id, demoState.phase, userBidderName])

  const homeHref = theme === "black" ? "/black" : "/"
  const statusText = demoState.phase === "sold" ? copy.sold : demoState.phase === "closing" ? copy.closing : copy.liveNow
  const helperText = copy[demoState.helperKey]
  const visibleBidLog = demoState.bidLog.slice(0, 7)
  const priceFlowPoints = useMemo(() => {
    const orderedBids = [...demoState.bidLog].reverse()
    return [
      { label: "Start", amount: OPENING_BID },
      ...orderedBids.map((bid, index) => ({ label: `B${index + 1}`, amount: bid.bidAmount })),
    ]
  }, [demoState.bidLog])

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[580px] flex-col px-4 pb-12 pt-5 sm:px-6">
        <header className="flex items-center justify-between gap-3">
          <Link
            href={homeHref}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 active:scale-95"
            aria-label={copy.backHome}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[#FF6B9D]/35 bg-[#FF6B9D]/12 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#FF9EBC]">
              {copy.demoPlayback}
            </span>
            <button
              type="button"
              onClick={replayDemo}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 active:scale-95"
              aria-label={copy.replayDemo}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </header>

        <section className="mt-5 flex flex-1 flex-col gap-5">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#2b1420] via-[#13060b] to-black shadow-[0_18px_60px_rgba(0,0,0,0.42)]">
            <div className="relative aspect-[4/3] bg-black/45">
              <video
                src="/cap-spin.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-contain"
              />
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-600 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">{statusText}</span>
              </div>
              {demoState.noticeKey ? (
                <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-[#FF6B9D]/30 bg-[#FF6B9D]/14 px-4 py-3 text-sm font-semibold text-[#FFD6E4] shadow-[0_12px_40px_rgba(255,107,157,0.18)] backdrop-blur-md demo-toast-in">
                  {copy[demoState.noticeKey]}
                </div>
              ) : null}
            </div>

            <div className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#FF9EBC]">{copy.premiumAuction}</p>
              <h1 className="mt-2 font-display text-4xl uppercase leading-none tracking-normal text-white sm:text-5xl">
                {copy.productName}
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/62">{copy.productDescription}</p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">{copy.timeRemaining}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Clock3 className={cn("h-4 w-4", demoState.remainingSeconds <= 10 ? "text-red-400" : "text-white/60")} />
                    <p className={cn("font-mono text-2xl font-bold tabular-nums", demoState.remainingSeconds <= 10 ? "text-red-400" : "text-white")}>
                      {formatTimer(demoState.remainingSeconds)}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">{copy.leadingBidder}</p>
                  <p className="mt-2 truncate text-lg font-bold text-white">{demoState.highestBidderName ?? "..."}</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">{copy.priceFlow}</p>
                  <p className="font-mono text-[10px] text-white/35">{priceFlowPoints.length}</p>
                </div>
                <DemoPriceGraph points={priceFlowPoints} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <section className="rounded-2xl border border-white/10 bg-[#0d0d0f] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.32)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">{copy.currentBid}</p>
                  <div
                    key={demoState.pricePulseKey}
                    className="mt-2 demo-price-pop"
                  >
                    <MoneyValue amount={demoState.currentBid} size="hero" />
                  </div>
                </div>
                <Gavel className="mt-1 h-6 w-6 text-[#FF9EBC]" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">{copy.openingBid}</p>
                  <MoneyValue amount={OPENING_BID} size="small" className="mt-1 text-white/88" />
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">{copy.minIncrement}</p>
                  <MoneyValue amount={MIN_BID_INCREMENT} size="small" className="mt-1 text-white/88" />
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-[#FF6B9D]/20 bg-[#FF6B9D]/8 px-4 py-3 text-sm font-semibold text-[#FFD6E4]">
                {helperText}
              </div>

              <button
                type="button"
                disabled={!demoState.canUserBid}
                onClick={() => setBidSheetOpen(true)}
                className={cn(
                  "mt-4 flex h-14 w-full items-center justify-center rounded-xl bg-[#FF6B9D] px-5 text-base font-black uppercase tracking-[0.12em] text-black transition active:scale-[0.98]",
                  demoState.canUserBid
                    ? "shadow-[0_0_0_0_rgba(255,107,157,0.7)] hover:brightness-110 demo-bid-pulse"
                    : "cursor-not-allowed bg-white/10 text-white/35",
                )}
              >
                {copy.placeBid}
              </button>
              <p className="mt-3 text-center text-xs leading-5 text-white/42">{copy.demoOnly}</p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#0d0d0f] p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-white/75">{copy.bidLog}</h2>
                <span className="font-mono text-xs text-white/38">{demoState.bidLog.length}</span>
              </div>

              <div className="mt-4 space-y-2">
                {visibleBidLog.length ? visibleBidLog.map((bid) => (
                  <div key={bid.id} className="demo-feed-in flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{bid.bidderName}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-white/35">{timeFromStart(bid.bidTime, demoState.demoRun.startedAt)}</p>
                    </div>
                    <MoneyValue amount={bid.bidAmount} size="feed" className="shrink-0 text-[#FF9EBC]" />
                  </div>
                )) : (
                  <div className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-5 text-center text-sm text-white/45">
                    {copy.noBids}
                  </div>
                )}
              </div>
            </section>

            {demoState.phase === "sold" ? (
              <ResultPanel
                copy={copy}
                finalPrice={demoState.demoRun.finalPrice ?? demoState.currentBid}
                winnerName={demoState.demoRun.winnerName ?? "..."}
                runnerUpName={demoState.demoRun.runnerUpName ?? "..."}
                totalBids={demoState.bidLog.length}
                onReplay={replayDemo}
              />
            ) : null}
          </div>
        </section>

        {bidSheetOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default bg-black/62 backdrop-blur-sm"
              aria-label={copy.closeBidSheet}
              onClick={() => setBidSheetOpen(false)}
            />
            <section className="fixed bottom-0 left-1/2 z-50 w-full max-w-[580px] -translate-x-1/2 rounded-t-2xl border border-white/10 bg-[#09090a]/98 p-5 shadow-[0_-18px_60px_rgba(0,0,0,0.5)] demo-result-in">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#FF9EBC]">{copy.placeBid}</p>
                  <h2 className="mt-2 text-lg font-bold text-white">{copy.yourOffer}</h2>
                </div>
                <button
                  type="button"
                  aria-label={copy.closeBidSheet}
                  onClick={() => setBidSheetOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/75 transition hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/42">{copy.minimumBid}</p>
                <MoneyValue amount={minimumUserBid} size="small" className="mt-2 text-white/80" />
              </div>

              <label className="mt-4 block rounded-xl border border-[#FF6B9D]/28 bg-[#FF6B9D]/8 p-4">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#FFD6E4]/70">{copy.yourOffer}</span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xl font-bold text-[#FF9EBC]">₩</span>
                  <input
                    value={offerAmount}
                    inputMode="numeric"
                    onChange={(event) => setOfferAmount(formatInputValue(parseInputValue(event.target.value)))}
                    className="min-w-0 flex-1 bg-transparent text-right font-mono text-3xl font-black tabular-nums text-[#FF6B9D] outline-none"
                  />
                </div>
              </label>

              <button
                type="button"
                disabled={parseInputValue(offerAmount) < minimumUserBid}
                onClick={() => handleUserBid(parseInputValue(offerAmount))}
                className={cn(
                  "mt-4 flex h-14 w-full items-center justify-center rounded-xl px-5 text-sm font-black uppercase tracking-[0.14em] transition active:scale-[0.98]",
                  parseInputValue(offerAmount) >= minimumUserBid
                    ? "bg-[#FF6B9D] text-black hover:brightness-110"
                    : "cursor-not-allowed bg-white/10 text-white/35",
                )}
              >
                {copy.confirmBid}
              </button>
              <p className="mt-3 text-center text-xs leading-5 text-white/42">{copy.demoOnly}</p>
            </section>
          </>
        ) : null}
      </div>
    </main>
  )
}

function DemoPriceGraph({ points }: { points: Array<{ label: string; amount: number }> }) {
  const width = 360
  const height = 96
  const paddingX = 10
  const paddingY = 14
  const min = Math.min(...points.map((point) => point.amount))
  const max = Math.max(...points.map((point) => point.amount))
  const range = Math.max(1, max - min)
  const coordinates = points.map((point, index) => {
    const x = points.length === 1 ? width / 2 : paddingX + (index / (points.length - 1)) * (width - paddingX * 2)
    const y = height - paddingY - ((point.amount - min) / range) * (height - paddingY * 2)
    return { ...point, x, y }
  })
  const line = coordinates.map((point) => `${point.x},${point.y}`).join(" ")
  const area = `${paddingX},${height - paddingY} ${line} ${width - paddingX},${height - paddingY}`

  return (
    <div className="h-28 overflow-hidden rounded-lg bg-black/30">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="demo-price-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#FF6B9D" stopOpacity="0.36" />
            <stop offset="100%" stopColor="#FF6B9D" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#demo-price-area)" />
        <polyline points={line} fill="none" stroke="#FF6B9D" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
        {coordinates.map((point, index) => (
          <circle key={`${point.label}-${index}`} cx={point.x} cy={point.y} r={index === coordinates.length - 1 ? 3.4 : 2.4} fill="#FF9EBC" />
        ))}
      </svg>
    </div>
  )
}

function MoneyValue({
  amount,
  size,
  className,
}: {
  amount: number
  size: "hero" | "small" | "feed" | "result"
  className?: string
}) {
  const sizeClass = {
    hero: "text-[2rem] sm:text-[2.45rem] xl:text-[2.65rem] font-black text-[#FF6B9D]",
    small: "text-sm font-semibold",
    feed: "text-xs font-bold sm:text-[13px]",
    result: "text-sm font-bold",
  }[size]
  const symbolClass = {
    hero: "mr-1.5 translate-y-[-0.05em] text-[0.72em] font-semibold opacity-90",
    small: "mr-1 text-[0.82em] font-medium opacity-78",
    feed: "mr-0.5 text-[0.82em] font-medium opacity-80",
    result: "mr-1 text-[0.82em] font-medium opacity-80",
  }[size]

  return (
    <p className={cn("flex min-w-0 items-baseline whitespace-nowrap font-mono leading-none tracking-normal tabular-nums", sizeClass, className)}>
      <span className={cn("font-sans", symbolClass)}>₩</span>
      <span>{formatWonDigits(amount)}</span>
    </p>
  )
}

function ResultPanel({
  copy,
  finalPrice,
  winnerName,
  runnerUpName,
  totalBids,
  onReplay,
}: {
  copy: typeof enCopy
  finalPrice: number
  winnerName: string
  runnerUpName: string
  totalBids: number
  onReplay: () => void
}) {
  return (
    <section className="rounded-2xl border border-[#FF6B9D]/28 bg-[#10060b]/95 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.32)] demo-result-in">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FF6B9D] text-black">
          <Award className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#FF9EBC]">{copy.sold}</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <ResultMetric label={copy.finalPrice}>
              <MoneyValue amount={finalPrice} size="result" />
            </ResultMetric>
            <ResultMetric label={copy.winner} value={winnerName} />
            <ResultMetric label={copy.totalBids} value={String(totalBids)} />
            <ResultMetric label={copy.runnerUp} value={runnerUpName} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3 text-center text-xs font-bold text-white/70">
              <CreditCard className="h-4 w-4 shrink-0 text-[#FF9EBC]" />
              {copy.paymentPending}
            </div>
            <div className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3 text-center text-xs font-bold text-white/70">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#FF9EBC]" />
              {copy.certificateReady}
            </div>
          </div>
          <button
            type="button"
            onClick={onReplay}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#FF6B9D]/35 bg-[#FF6B9D]/12 px-4 py-3 text-sm font-bold text-[#FFD6E4] transition hover:bg-[#FF6B9D]/18 active:scale-[0.98]"
          >
            <RotateCcw className="h-4 w-4" />
            {copy.replayDemo}
          </button>
        </div>
      </div>
    </section>
  )
}

function ResultMetric({ label, value, children }: { label: string; value?: string; children?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.045] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/38">{label}</p>
      {children ?? <p className="mt-1 truncate text-sm font-bold text-white">{value}</p>}
    </div>
  )
}
