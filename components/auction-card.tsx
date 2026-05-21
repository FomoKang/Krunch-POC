"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowUp, Clock, History, Loader2 } from "lucide-react"
import { useSupabaseSession } from "@/hooks/use-supabase-session"
import { useUserProfile } from "@/hooks/use-user-profile"
import {
  getAuctionShowcaseState,
  placeAuctionShowcaseBid,
  PREMIUM_SHOWCASE_ID,
} from "@/lib/auction-showcase"
import {
  createSettlementQuoteFromBuyNowShowcase,
  generateShowcaseSettlementQuote,
  getLatestShowcaseSettlementQuote,
  markShowcaseSettlementQuotePaid,
  saveShowcaseSettlementQuoteShippingInfo,
} from "@/lib/settlement-showcase"
import {
  createSettlementQuoteFromBuyNow,
  generateSettlementQuote,
  getLatestUserSettlementQuoteForAuction,
  markSettlementQuotePaid,
  saveSettlementQuoteShippingInfo,
  type PurchaseSettlementQuoteRecord,
} from "@/lib/supabase/settlements"
import { getAuctionShowcase, placeAuctionBid, type AuctionBidRecord, type AuctionShowcaseRecord, type MediaAssetRecord } from "@/lib/supabase/provenance"
import { AuctionSettlementFlow } from "./auction-settlement-flow"
import { Confetti } from "./confetti"
import { LanguageToggle } from "./language-toggle"
import { SuccessPopup } from "./success-popup"
import { ThemeToggle } from "./theme-toggle"
import { useSiteTheme } from "./theme-provider"

const ONE_HOUR = 3600
const TEN_MINUTES = 600
const DAY = 86400
const BOTTOM_NAV_OFFSET = "calc(76px + env(safe-area-inset-bottom, 0px))"

const AUCTION_THEMES = {
  default: { accent: "text-primary", accentBg: "bg-primary", accentBorder: "border-primary/30", accentBorderFocus: "border-primary/50 focus:border-primary", accentForeground: "text-primary-foreground", chartColor: "#FF6B9D" },
  black: { accent: "text-white", accentBg: "bg-[#FF006E]", accentBorder: "border-[#1f1f1f]", accentBorderFocus: "border-[rgba(255,105,180,0.4)] focus:border-[rgba(255,105,180,0.5)]", accentForeground: "text-white", chartColor: "#FF6B9D" },
} as const

type AuctionVariant = keyof typeof AUCTION_THEMES

const FALLBACK_BIDS: AuctionBidRecord[] = [
  { bid_id: "fb-1", auction_id: "fb", bidder_user_id: null, bidder_display_name: "StyleHunter", bid_amount: 2120000, bid_source: "simulated", is_demo: true, created_at: new Date(Date.now() - 1000 * 60 * 44).toISOString(), is_valid: true, is_winning_bid: false },
  { bid_id: "fb-2", auction_id: "fb", bidder_user_id: null, bidder_display_name: "ArchiveRoom", bid_amount: 2250000, bid_source: "simulated", is_demo: true, created_at: new Date(Date.now() - 1000 * 60 * 28).toISOString(), is_valid: true, is_winning_bid: false },
  { bid_id: "fb-3", auction_id: "fb", bidder_user_id: null, bidder_display_name: "VelvetBidder", bid_amount: 2450000, bid_source: "simulated", is_demo: true, created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(), is_valid: true, is_winning_bid: true },
]

const FALLBACK_MEDIA = { artifact_id: "fb-artifact", provenance_event_id: null, asset_type: "video", caption: "PEACEMINUSONE cap", source: "mock", copyright_status: null, visibility_level: "public", taken_at: null, file_url: "/cap-spin.mp4", thumbnail_url: null, file_type: "video/mp4", file_hash: null, uploaded_at: new Date().toISOString() } as MediaAssetRecord

const FALLBACK_SHOWCASE = {
  auction: { auction_id: "fb", artifact_id: "fb-artifact", auction_title: "PEACEMINUSONE Cap", auction_type: "premium", auction_status: "live", opening_bid: 2000000, minimum_increment: 100000, buy_now_price: null, auction_start_time: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), auction_end_time: new Date(Date.now() + DAY * 1000).toISOString(), currency: "KRW", demo_mode: false },
  artifact: { id: "fb-artifact", artifact_code: "KR-AUC-DEMO-0001", artifact_title: "PEACEMINUSONE Cap", artist_name: "G-DRAGON", group_name: null, era_name: "Ubermensch Tour", public_visibility: "public" },
  media: FALLBACK_MEDIA,
  bids: FALLBACK_BIDS,
  outcome: null,
  currentHighestBid: 2450000,
  minimumNextBid: 2550000,
} as AuctionShowcaseRecord

function formatInput(value: string) {
  const digits = value.replace(/\D/g, "")
  return digits ? Number.parseInt(digits, 10).toLocaleString("en-US") : ""
}

function parseInput(value: string) {
  const parsed = Number.parseInt(value.replace(/,/g, ""), 10)
  return Number.isNaN(parsed) ? 0 : parsed
}

function money(amount: number | null | undefined, currency = "KRW") {
  if (amount === null || amount === undefined) return "-"
  const formatted = Math.round(amount).toLocaleString("en-US")
  return `${currency} ${formatted}`
}

function timer(seconds: number) {
  const safe = Math.max(0, seconds)
  return [Math.floor(safe / 3600), Math.floor((safe % 3600) / 60), safe % 60].map((unit) => unit.toString().padStart(2, "0")).join(":")
}

function bidTime(value: string) {
  return new Date(value).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
}

function settlementStatusLabel(status: PurchaseSettlementQuoteRecord["quote_status"] | null | undefined) {
  switch (status) {
    case "awaiting_shipping_info":
      return "Awaiting shipping information"
    case "quote_preparing":
      return "Preparing quote"
    case "payment_requested":
      return "Payment requested"
    case "review_required":
      return "Under manual review"
    case "paid":
      return "Paid"
    case "cancelled":
      return "Cancelled"
    case "expired":
      return "Expired"
    default:
      return "Settlement in progress"
  }
}

function isVideo(media: MediaAssetRecord | null) {
  if (!media?.file_url) return false
  const type = media.file_type?.toLowerCase() ?? ""
  return type.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(media.file_url)
}

function isImage(media: MediaAssetRecord | null) {
  if (!media?.file_url) return false
  const type = media.file_type?.toLowerCase() ?? ""
  return type.startsWith("image/") || /\.(png|jpg|jpeg|webp|gif|avif)$/i.test(media.file_url)
}

function buildHistory(openingBid: number, bids: AuctionBidRecord[], currentHighestBid: number) {
  if (bids.length >= 2) return [...bids].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((bid) => bid.bid_amount)
  return Array.from({ length: 8 }, (_, index) => Math.round(openingBid + (currentHighestBid - openingBid) * (index / 7)))
}

function PriceFlowChart({ color, data, muted }: { color: string; data: number[]; muted: boolean }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const width = 400
  const height = 72
  const points = data.map((value, index) => {
    const x = 10 + (index / (data.length - 1)) * 380
    const y = 10 + (1 - (value - min) / range) * 52
    return `${x},${y}`
  })
  const path = `M ${points.join(" L ")}`
  const area = `${path} L 390,62 L 10,62 Z`
  const stroke = muted ? "#6B7280" : color
  const fill = muted ? "#374151" : color
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="block h-full w-full">
      <defs>
        <linearGradient id="auction-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.4" />
          <stop offset="100%" stopColor={fill} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#auction-fill)" />
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function AuctionCard({ variant: variantProp }: { variant?: AuctionVariant } = {}) {
  const { theme: siteTheme } = useSiteTheme()
  const { user } = useSupabaseSession()
  const { profile } = useUserProfile(user)
  const searchParams = useSearchParams()
  const variant = variantProp ?? siteTheme
  const theme = AUCTION_THEMES[variant]
  const isBlack = variant === "black"
  const mountedRef = useRef(true)
  const lastBidRef = useRef<string | null>(null)
  const previousBidRef = useRef(FALLBACK_SHOWCASE.currentHighestBid)

  const [showcase, setShowcase] = useState<AuctionShowcaseRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionState, setActionState] = useState<"bid" | "buy_now" | null>(null)
  const [offerAmount, setOfferAmount] = useState("2,550,000")
  const [showSheet, setShowSheet] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [settlementFlowOpen, setSettlementFlowOpen] = useState(false)
  const [settlementQuote, setSettlementQuote] = useState<PurchaseSettlementQuoteRecord | null>(null)
  const [successAmount, setSuccessAmount] = useState("2,450,000")
  const [timeRemaining, setTimeRemaining] = useState(DAY)
  const [showRedTime, setShowRedTime] = useState(false)
  const [bidPulse, setBidPulse] = useState(false)
  const [bidRibbon, setBidRibbon] = useState<{ username: string; amount: number } | null>(null)
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null)
  const selectedAuctionId = searchParams.get("auctionId") ?? searchParams.get("auction")
  const selectedShowcaseId = searchParams.get("showcaseId")
  const selectedAuctionTypeParam = searchParams.get("auctionType")
  const selectedAuctionType =
    selectedAuctionTypeParam === "premium" || selectedAuctionTypeParam === "hybrid"
      ? selectedAuctionTypeParam
      : null
  const usesLocalShowcase = Boolean(selectedShowcaseId) || (!selectedAuctionId && !selectedAuctionType)
  const activeShowcaseId = selectedShowcaseId ?? PREMIUM_SHOWCASE_ID

  const display = showcase ?? FALLBACK_SHOWCASE
  const auction = display.auction
  const artifact = display.artifact
  const bids = showcase?.bids ?? FALLBACK_SHOWCASE.bids
  const media = showcase ? showcase.media : FALLBACK_SHOWCASE.media
  const openingBid = auction.opening_bid ?? 2000000
  const minimumIncrement = auction.minimum_increment ?? 100000
  const currentHighestBid = display.currentHighestBid
  const minimumNextBid = display.minimumNextBid
  const currency = auction.currency ?? "KRW"
  const auctionType = auction.auction_type ?? "premium"
  const auctionStatus = auction.auction_status ?? "draft"
  const hasActualAuction = showcase !== null
  const isLiveAuction = hasActualAuction && auctionStatus === "live"
  const canBuyNow = isLiveAuction && auctionType === "hybrid" && Boolean(auction.buy_now_price)
  const priceHistory = useMemo(() => buildHistory(openingBid, bids, currentHighestBid), [bids, currentHighestBid, openingBid])
  const artifactSubtitle = artifact.artist_name ?? artifact.group_name ?? "KRUNCH Archive"
  const risePercent = openingBid > 0 ? Math.max(0, Math.round(((currentHighestBid - openingBid) / openingBid) * 100)) : 0
  const displayName = profile?.nickname ?? user?.user_metadata?.nickname ?? user?.email?.split("@")[0] ?? "Guest Bidder"

  const loadShowcase = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const next = usesLocalShowcase
        ? getAuctionShowcaseState(activeShowcaseId)
        : await getAuctionShowcase({
            auctionId: selectedAuctionId,
            auctionType: selectedAuctionType,
          })
      if (!mountedRef.current) return null
      setShowcase(next)
      setRefreshError(null)
      return next
    } catch (error) {
      if (!mountedRef.current) return null
      setRefreshError(error instanceof Error ? error.message : "Unable to load the auction feed.")
      return null
    } finally {
      if (mountedRef.current && !silent) setLoading(false)
    }
  }, [activeShowcaseId, selectedAuctionId, selectedAuctionType, usesLocalShowcase])

  useEffect(() => {
    mountedRef.current = true
    void loadShowcase()
    const intervalId = window.setInterval(() => void loadShowcase(true), 5000)
    return () => {
      mountedRef.current = false
      window.clearInterval(intervalId)
    }
  }, [loadShowcase])

  useEffect(() => {
    let active = true

    async function loadSettlementQuote() {
      if (usesLocalShowcase) {
        const nextQuote = getLatestShowcaseSettlementQuote(activeShowcaseId)
        if (active) {
          setSettlementQuote(nextQuote)
        }
        return
      }

      if (!user || !showcase?.auction?.auction_id) {
        if (active) {
          setSettlementQuote(null)
        }
        return
      }

      try {
        const nextQuote = await getLatestUserSettlementQuoteForAuction(showcase.auction.auction_id)
        if (active) {
          setSettlementQuote(nextQuote)
        }
      } catch {
        if (active) {
          setSettlementQuote(null)
        }
      }
    }

    void loadSettlementQuote()

    return () => {
      active = false
    }
  }, [activeShowcaseId, showcase?.auction?.auction_id, showcase?.auction?.updated_at, user, usesLocalShowcase])

  useEffect(() => {
    setOfferAmount(Math.round(minimumNextBid).toLocaleString("en-US"))
  }, [auction.auction_id, minimumNextBid])

  useEffect(() => {
    if (previousBidRef.current !== currentHighestBid) {
      setBidPulse(true)
      previousBidRef.current = currentHighestBid
      const timeoutId = window.setTimeout(() => setBidPulse(false), 320)
      return () => window.clearTimeout(timeoutId)
    }
    return undefined
  }, [currentHighestBid])

  useEffect(() => {
    const latestBid = showcase?.bids[0]
    if (!latestBid) return
    const marker = `${latestBid.bid_id}:${latestBid.bid_amount}`
    if (lastBidRef.current && lastBidRef.current !== marker) {
      setBidRibbon({ username: latestBid.bidder_display_name, amount: latestBid.bid_amount })
      const timeoutId = window.setTimeout(() => setBidRibbon(null), 2600)
      lastBidRef.current = marker
      return () => window.clearTimeout(timeoutId)
    }
    lastBidRef.current = marker
    return undefined
  }, [showcase?.bids])

  useEffect(() => {
    const syncTimer = () => {
      if (auctionStatus === "ended") {
        setTimeRemaining(0)
        return
      }
      const target = auctionStatus === "scheduled" && auction.auction_start_time ? new Date(auction.auction_start_time).getTime() : auction.auction_end_time ? new Date(auction.auction_end_time).getTime() : Date.now() + DAY * 1000
      setTimeRemaining(Math.max(0, Math.floor((target - Date.now()) / 1000)))
    }
    syncTimer()
    const timerId = window.setInterval(syncTimer, 1000)
    return () => window.clearInterval(timerId)
  }, [auction.auction_end_time, auction.auction_start_time, auctionStatus])

  useEffect(() => {
    const toggleId = window.setInterval(() => setShowRedTime((previous) => (timeRemaining > 0 && timeRemaining < ONE_HOUR ? !previous : false)), 2000)
    return () => window.clearInterval(toggleId)
  }, [timeRemaining])

  const handleBid = async () => {
    if (!isLiveAuction) return setActionError("This auction is not accepting bids right now.")
    const amount = parseInput(offerAmount)
    if (amount < minimumNextBid) return setActionError(`Enter at least ${money(minimumNextBid, currency)}.`)
    try {
      setActionState("bid")
      setActionError(null)
      const placedBid = usesLocalShowcase
        ? placeAuctionShowcaseBid({
            showcaseId: activeShowcaseId,
            bidAmount: amount,
            bidderDisplayName: displayName,
          })
        : showcase
          ? await placeAuctionBid({
              auctionId: auction.auction_id,
              bidAmount: amount,
              bidderDisplayName: displayName,
              bidSource: "manual",
            })
          : (() => {
              throw new Error("Connect the auction migration before placing live bids.")
            })()
      const next = await loadShowcase(true)
      setOfferAmount(Math.round(next?.minimumNextBid ?? placedBid.bid_amount + minimumIncrement).toLocaleString("en-US"))
      setShowSheet(false)
      setSuccessAmount(Math.round(placedBid.bid_amount).toLocaleString("en-US"))
      setShowConfetti(true)
      setShowPopup(true)
      window.setTimeout(() => setShowConfetti(false), 2500)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to place bid.")
    } finally {
      setActionState(null)
    }
  }

  const handleBuyNow = async () => {
    const resumableSettlement =
      settlementQuote &&
      settlementQuote.quote_status !== "cancelled" &&
      settlementQuote.quote_status !== "expired"

    if (resumableSettlement) {
      setActionError(null)
      setShowSheet(false)
      setSettlementFlowOpen(true)
      return
    }

    if (!canBuyNow) return setActionError("Buy Now is only available on live hybrid auctions.")
    if (!usesLocalShowcase && !user) {
      return setActionError("Log in to continue with shipping, customs, and payment.")
    }

    try {
      setActionState("buy_now")
      setActionError(null)
      const nextQuote = usesLocalShowcase
        ? createSettlementQuoteFromBuyNowShowcase({
            showcaseId: activeShowcaseId,
            bidderDisplayName: displayName,
            recipientEmail: user?.email ?? null,
          })
        : showcase
          ? await createSettlementQuoteFromBuyNow({
              auctionId: auction.auction_id,
              bidderDisplayName: displayName,
            })
          : (() => {
            throw new Error("Connect the auction migration before using Buy Now.")
            })()
      if (!usesLocalShowcase) {
        await loadShowcase(true)
      }
      setSettlementQuote(nextQuote)
      setShowSheet(false)
      setSettlementFlowOpen(true)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to start the settlement flow.")
    } finally {
      setActionState(null)
    }
  }

  const hasSettlementFlow =
    settlementQuote &&
    settlementQuote.quote_status !== "cancelled" &&
    settlementQuote.quote_status !== "expired"
  const settlementActionLabel = settlementQuote?.quote_status === "paid" ? "VIEW PAYMENT" : "RESUME CHECKOUT"
  const isEndedAuction = hasActualAuction && auctionStatus === "ended"
  const settlementButtonDisabled = !hasSettlementFlow && (!canBuyNow || actionState !== null)
  const settlementDisplayAmount =
    settlementQuote?.quote_status === "payment_requested" ||
    settlementQuote?.quote_status === "review_required" ||
    settlementQuote?.quote_status === "paid"
      ? settlementQuote.total_payable_amount
      : settlementQuote?.base_item_amount ?? auction.buy_now_price ?? 0
  const settlementDescription =
    settlementQuote?.quote_status === "paid"
      ? "Payment completed and settlement records have been written."
      : settlementQuote?.quote_status === "review_required"
        ? settlementQuote.review_reason ?? "Operations review is required before payment can be completed."
        : settlementQuote?.quote_status === "payment_requested"
          ? "Shipping, insurance, and estimated import charges are ready for payment review."
          : settlementQuote?.quote_status === "quote_preparing"
            ? "The shipping and customs quote is being prepared."
            : "Buy Now reserves the lot first, then collects shipping details before payment."
  const footerLabel = !hasActualAuction ? "PLACE BID" : auctionStatus === "scheduled" ? "STARTS SOON" : auctionStatus === "ended" ? "AUCTION CLOSED" : "PLACE BID"
  const logoSrc = isBlack ? "/logo-white.png" : "/logo-pink.png"

  async function handleSettlementPaid(paidQuote: PurchaseSettlementQuoteRecord) {
    setSettlementQuote(paidQuote)
    if (!usesLocalShowcase) {
      await loadShowcase(true)
    }
    setShowConfetti(true)
    window.setTimeout(() => setShowConfetti(false), 2500)
  }

  return (
    <>
      <Confetti active={showConfetti} />
      <SuccessPopup amount={successAmount} onClose={() => setShowPopup(false)} show={showPopup} />
      <div className="relative flex min-h-[100dvh] flex-col bg-transparent" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "calc(176px + env(safe-area-inset-bottom, 0px))" }}>
        <div className="relative z-50 flex min-h-[calc(5rem+env(safe-area-inset-top))] items-center justify-between gap-1.5 overflow-visible px-2.5 sm:gap-2 sm:px-4" style={{ paddingTop: "calc(1rem + env(safe-area-inset-top))" }}>
          <Link href={isBlack ? "/black" : "/"} className="block h-16 w-32 min-w-0 shrink-0 sm:h-[72px] sm:w-[225px]">
            <Image src={logoSrc} alt="Krunch Logo" width={225} height={72} className={`h-full w-full cursor-pointer object-contain object-left transition-opacity hover:opacity-80 ${!isBlack ? "origin-center scale-[1.02]" : ""}`} />
          </Link>
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <ThemeToggle inline />
            <LanguageToggle inline />
          </div>
        </div>
        <div className="mb-2 flex min-h-[40px] items-stretch" style={{ marginLeft: "max(1rem, env(safe-area-inset-left))", marginRight: "max(1rem, env(safe-area-inset-right))" }}>
          {bidRibbon ? <div className={`z-40 mx-4 flex w-full items-center justify-center rounded-lg border bg-black/80 px-4 py-2 backdrop-blur-sm animate-in fade-in duration-300 ${theme.accentBorder}`}><p className="text-center text-xs text-white/90 sm:text-sm"><span className={`${theme.accent} font-semibold`}>{bidRibbon.username}</span><span className="text-white/70"> placed a bid of </span><span className={`${theme.accent} font-semibold tabular-nums`}>{money(bidRibbon.amount, currency)}</span></p></div> : null}
        </div>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-4">
          <div className={`relative mb-4 w-full max-w-[720px] overflow-hidden rounded-lg border ${isBlack ? "black-mode-card" : "border-border/50 bg-black/30"}`}>
            <div className="flex items-start justify-between gap-4 p-6 pb-5 pt-7 sm:p-8 sm:pb-6 sm:pt-8">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/70">{auctionType}</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/70">{auctionStatus}</span>
                </div>
                <h2 className={`font-display text-4xl uppercase leading-[0.85] tracking-tight sm:text-5xl ${isBlack ? "black-mode-legend-title" : `${theme.accent} drop-shadow-md`}`}>{auctionType === "hybrid" ? "HYBRID" : "PREMIUM"}</h2>
                <h2 className={`font-display text-4xl uppercase leading-[0.85] tracking-tight sm:text-5xl ${isBlack ? "black-mode-legend-title" : `${theme.accent} drop-shadow-md`}`}>AUCTION</h2>
              </div>
              <div className="flex shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-black/50 py-3 pl-4 pr-3 backdrop-blur-sm">
                <div>
                  <p className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-white/60">{auctionStatus === "scheduled" ? "Starts In" : auctionStatus === "ended" ? "Auction Ended" : "Time Remaining"}</p>
                  <span className={`font-mono text-lg font-semibold tracking-tight tabular-nums transition-colors sm:text-xl ${timeRemaining >= ONE_HOUR ? "auction-timer-normal" : timeRemaining < TEN_MINUTES ? "auction-timer-urgent" : showRedTime ? "auction-timer-urgent" : "auction-timer-normal"} ${timeRemaining < TEN_MINUTES && timeRemaining > 0 ? "animate-pulse" : ""}`}>{timer(timeRemaining)}</span>
                </div>
                <Clock className="size-4 shrink-0 text-white/55" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-4 px-4 pb-4 sm:px-6">
              <div className="relative h-36 w-full max-w-[240px] shrink-0 sm:h-44 sm:max-w-[280px]">
                {isVideo(media) ? <video key={media?.file_url ?? "cap-spin"} src={media?.file_url ?? "/cap-spin.mp4"} autoPlay className="h-full w-full rounded-xl object-contain" loop muted playsInline /> : isImage(media) ? <img alt={media?.caption ?? artifact.artifact_title} className="h-full w-full rounded-xl object-contain" src={media?.thumbnail_url ?? media?.file_url ?? "/placeholder.jpg"} /> : <img alt={artifact.artifact_title} className="h-full w-full rounded-xl object-contain" src="/placeholder.jpg" />}
              </div>
              <div className="flex min-w-0 flex-1 flex-col items-center justify-center">
                <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-widest text-white/60">Current Highest Bid</p>
                <p className={`text-center text-2xl font-bold leading-tight tabular-nums sm:text-3xl ${bidPulse ? "animate-bid-pulse" : ""} ${isBlack ? "black-mode-text-primary" : theme.accent}`}>{money(currentHighestBid, currency)}</p>
                <p className={`mt-1.5 flex items-center justify-center gap-1 text-sm font-semibold tabular-nums ${isBlack ? "text-[#FF69B4]" : "text-white/90"}`}>+{risePercent}%<ArrowUp className="size-4 shrink-0" /></p>
              </div>
            </div>
            <div className="px-4 pb-3 sm:px-6">
              <p className={`text-xs font-semibold tracking-wide ${isBlack ? "black-mode-text-primary" : "text-foreground drop-shadow-md"}`}>{artifactSubtitle.toUpperCase()}</p>
              <p className={`mt-0.5 text-xs ${isBlack ? "black-mode-text-secondary" : "text-muted-foreground"}`}>{artifact.artifact_title}</p>
              <p className={`text-xs ${isBlack ? "black-mode-text-secondary" : "text-muted-foreground"}`}>{artifact.era_name ?? "Auction-connected provenance lot"}</p>
            </div>
            <div className="mx-4 mb-3 mt-2 sm:mx-6">
              <div className={`h-16 overflow-hidden rounded-t-lg border border-b-0 sm:h-20 ${isBlack ? "border-[#1f1f1f] bg-[#0a0a0a]" : "border-white/10 bg-black/30"}`}><PriceFlowChart color={theme.chartColor} data={priceHistory} muted={isBlack} /></div>
              <div className={`flex justify-between rounded-b-lg border border-t-0 px-2 py-1.5 text-[10px] ${isBlack ? "border-[#1f1f1f] bg-[#0a0a0a] black-mode-text-secondary" : "border-white/10 bg-black/30 text-white/50"}`}><span>Start</span><span>Early</span><span>Mid</span><span>Late</span><span>Now</span></div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["Auction Type", auctionType],
                  ["Starting Bid", money(openingBid, currency)],
                  ["Minimum Next Bid", money(minimumNextBid, currency)],
                  ["Buy Now", auctionType === "hybrid" ? money(auction.buy_now_price, currency) : "Not available"],
                ].map(([label, value]) => (
                  <div key={label} className={`rounded-lg px-3 py-2.5 ${isBlack ? "border border-[#1f1f1f] bg-[#0a0a0a]" : "border border-white/10 bg-white/5"}`}>
                    <p className={`text-[10px] uppercase tracking-wider ${isBlack ? "black-mode-text-secondary" : "text-white/50"}`}>{label}</p>
                    <p className={`mt-0.5 text-sm font-semibold ${label === "Buy Now" && auctionType === "hybrid" ? "text-[#FF69B4]" : isBlack ? "black-mode-text-primary" : "text-white/90"}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
            {hasSettlementFlow ? (
              <div className={`mx-4 mb-3 rounded-xl border p-3 sm:mx-6 ${isBlack ? "border-[#1f1f1f] bg-[#0a0a0a]" : "border-[#FF6B9D]/30 bg-[#140810]"}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">Settlement Status</p>
                    <p className={`text-sm font-semibold ${isBlack ? "text-white" : "text-[#FF9DBE]"}`}>{settlementStatusLabel(settlementQuote?.quote_status)}</p>
                    <p className="max-w-2xl text-xs leading-5 text-white/60">{settlementDescription}</p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">Current Due</p>
                      <p className={`mt-1 text-sm font-semibold tabular-nums ${isBlack ? "text-white" : "text-[#FF9DBE]"}`}>{money(settlementDisplayAmount, currency)}</p>
                    </div>
                    <button className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors ${isBlack ? "border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08]" : "border-[#FF6B9D]/35 bg-[#FF6B9D]/10 text-white hover:bg-[#FF6B9D]/20"}`} onClick={() => setSettlementFlowOpen(true)} type="button">
                      {settlementActionLabel}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
            <div className={`mx-4 mb-3 rounded-xl border p-3 sm:mx-6 ${isBlack ? "border-[#1f1f1f] bg-[#0a0a0a]" : "border-white/10 bg-black/30"}`}>
              <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><History className="size-4 text-white/70" /><p className="text-sm font-semibold text-white">Bid History</p></div><p className="text-[11px] uppercase tracking-[0.2em] text-white/45">{bids.slice(0, 5).length} entries</p></div>
              <div className="space-y-2">
                {bids.slice(0, 5).map((bid) => (
                  <div key={bid.bid_id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                    <div className="min-w-0"><p className="truncate text-sm font-medium text-white">{bid.bidder_display_name}</p><p className="text-[11px] uppercase tracking-[0.2em] text-white/45">{bidTime(bid.created_at)}</p></div>
                    <div className="text-right"><p className="text-sm font-semibold tabular-nums text-white">{money(bid.bid_amount, currency)}</p><p className="text-[11px] uppercase tracking-[0.2em] text-white/45">{bid.bid_source}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mx-4 mb-4 space-y-2 sm:mx-6">
              <p className="text-xs text-white/55">Bids cannot be cancelled.</p>
              <p className="text-xs text-white/55">Last-minute bids may extend the auction.</p>
              {loading ? <div className="flex items-center gap-2 text-xs text-white/45"><Loader2 className="size-3.5 animate-spin" />Syncing auction data</div> : null}
              {refreshError ? <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">{refreshError}</div> : null}
              {actionError && !showSheet ? <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">{actionError}</div> : null}
            </div>
            <div className={`mx-4 border-t sm:mx-6 ${isBlack ? "border-[#1f1f1f]" : theme.accentBorder}`} />
          </div>
        </div>
        {showSheet ? (
          <>
            <div className="fixed inset-0 z-30 bg-black/50" onClick={() => setShowSheet(false)} />
            <div className="fixed left-1/2 z-40 w-[calc(100%-2rem)] max-w-[720px] -translate-x-1/2 overflow-hidden rounded-t-2xl border-l border-r border-t border-border/50 animate-slide-up-bottom-sheet" style={{ bottom: BOTTOM_NAV_OFFSET, paddingBottom: "calc(100px + env(safe-area-inset-bottom, 0px))", background: isBlack ? "rgba(10,10,10,0.98)" : "rgba(0,0,0,0.98)", backdropFilter: "blur(12px)" }}>
              <div className="flex justify-end p-4 pb-0"><button aria-label="Close bidding panel" className="flex size-8 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/15" onClick={() => setShowSheet(false)}><svg className="size-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /></svg></button></div>
              <div className="space-y-4 px-4 pb-4 pt-2">
                <div className="space-y-1"><p className="text-sm font-medium text-foreground">Your Offer</p><p className="text-xs text-muted-foreground">Enter at least {money(minimumNextBid, currency)}.</p></div>
                <div className="flex min-w-0 max-w-full items-end gap-2 overflow-hidden"><span className="shrink-0 pb-1 text-xs text-muted-foreground">{currency}</span><input className={`block w-0 min-w-0 max-w-full flex-1 overflow-hidden border-b bg-transparent pb-1 text-right font-sans text-2xl font-bold text-foreground focus:outline-none sm:text-4xl ${theme.accentBorderFocus}`} inputMode="numeric" onChange={(event) => { setOfferAmount(formatInput(event.target.value)); setActionError(null) }} type="text" value={offerAmount} /></div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Starting bid {money(openingBid, currency)}</p>
                  <p className="text-xs text-muted-foreground">Minimum increment {money(minimumIncrement, currency)}</p>
                  {auctionType === "hybrid" ? <p className="text-xs text-[#FF8FB4]">{hasSettlementFlow ? "Buy Now is already reserved. Resume shipping, customs, and payment review from this checkout." : `Buy Now reserves the lot, collects shipping details, and prepares a final payment quote from ${money(auction.buy_now_price, currency)}.`}</p> : null}
                  {actionError ? <p className="text-xs text-[#FF8FAB]">{actionError}</p> : null}
                </div>
                <div className={`grid gap-3 ${auctionType === "hybrid" && !isEndedAuction ? "grid-cols-2" : "grid-cols-1"}`}>
                  {isEndedAuction ? (
                    <button className="w-full cursor-not-allowed rounded-lg border border-white/10 bg-white/10 py-4 text-lg font-semibold uppercase text-white/50" disabled type="button">
                      AUCTION CLOSED
                    </button>
                  ) : (
                    <button className={`w-full py-4 text-lg uppercase transition-all active:scale-[0.98] place-bid-btn ${!isLiveAuction || actionState !== null || parseInput(offerAmount) < minimumNextBid ? "cursor-not-allowed border border-white/10 bg-white/10 text-white/50" : isBlack ? "black-mode-place-bid" : `${theme.accentBg} ${theme.accentForeground} hover:brightness-110`}`} disabled={!isLiveAuction || actionState !== null || parseInput(offerAmount) < minimumNextBid} onClick={handleBid}>{actionState === "bid" ? "PLACING..." : "SET OFFER"}</button>
                  )}
                  {auctionType === "hybrid" && !isEndedAuction ? <button className={`w-full rounded-lg border py-4 text-lg font-semibold uppercase transition-all active:scale-[0.98] ${settlementButtonDisabled ? "cursor-not-allowed border-white/10 bg-white/10 text-white/50" : "border-[#FF6B9D]/40 bg-black text-white hover:border-[#FF6B9D]/70 hover:bg-[#12070d]"}`} disabled={settlementButtonDisabled} onClick={handleBuyNow}>{actionState === "buy_now" ? "STARTING..." : hasSettlementFlow ? settlementActionLabel : "BUY NOW"}</button> : null}
                </div>
              </div>
            </div>
          </>
        ) : null}
        {!showSheet ? (
          <div className="fixed left-0 right-0 z-50 flex w-full justify-center bg-black px-4" style={{ bottom: BOTTOM_NAV_OFFSET, height: "calc(100px + env(safe-area-inset-bottom, 0px))", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
            <div className={`grid h-full w-full max-w-[720px] gap-2 ${auctionType === "hybrid" && !isEndedAuction ? "grid-cols-2" : "grid-cols-1"}`}>
              <button className={`relative flex h-full w-full items-center justify-center overflow-hidden text-xl uppercase transition-all duration-200 active:scale-[0.98] place-bid-btn ${isLiveAuction ? isBlack ? "black-mode-place-bid hover:-translate-y-0.5" : "bg-[#FF6B9D] text-black hover:-translate-y-0.5 hover:brightness-110" : "cursor-not-allowed bg-white/10 text-white/45"}`} disabled={isEndedAuction} onClick={(event) => { if (!isLiveAuction) { setActionError(hasActualAuction ? auctionStatus === "scheduled" ? "This auction has not started yet." : "This auction is no longer accepting bids." : usesLocalShowcase ? "This showcase auction is not accepting bids right now." : "Connect the database migration to enable live bidding."); if (!isEndedAuction) setShowSheet(true); return } const rect = event.currentTarget.getBoundingClientRect(); setRipple({ x: event.clientX - rect.left, y: event.clientY - rect.top }); window.setTimeout(() => setRipple(null), 600); setShowSheet(true) }} style={isLiveAuction ? { boxShadow: "0 4px 20px rgba(255, 0, 110, 0.4)" } : undefined} type="button">
                {ripple ? <span className="pointer-events-none absolute rounded-full bg-white/40 animate-place-bid-ripple" style={{ left: ripple.x, top: ripple.y, width: 20, height: 20, marginLeft: -10, marginTop: -10 }} /> : null}
                {footerLabel}
              </button>
              {auctionType === "hybrid" && !isEndedAuction ? <button className={`h-full w-full rounded-none border px-4 text-lg font-semibold uppercase transition-all duration-200 active:scale-[0.98] ${settlementButtonDisabled ? "cursor-not-allowed border-white/10 bg-white/10 text-white/45" : "border-[#FF6B9D]/45 bg-[#0a0a0a] text-white hover:-translate-y-0.5 hover:border-[#FF6B9D]/70 hover:bg-[#12070d]"}`} disabled={settlementButtonDisabled} onClick={handleBuyNow} type="button">{actionState === "buy_now" ? "STARTING..." : hasSettlementFlow ? settlementActionLabel : "BUY NOW"}</button> : null}
            </div>
          </div>
        ) : null}
        <AuctionSettlementFlow
          adapter={{
            generateQuote: async (quoteId) => usesLocalShowcase ? generateShowcaseSettlementQuote(quoteId) : generateSettlementQuote(quoteId),
            proceedToPay: async (quoteId) => usesLocalShowcase ? markShowcaseSettlementQuotePaid(quoteId) : markSettlementQuotePaid({ quoteId, paymentProvider: "demo_mock" }),
            saveShippingInfo: async (input) => usesLocalShowcase ? saveShowcaseSettlementQuoteShippingInfo(input) : saveSettlementQuoteShippingInfo(input),
          }}
          artifactTitle={artifact.artifact_title}
          isBlack={isBlack}
          onOpenChange={setSettlementFlowOpen}
          onPaid={(paidQuote) => void handleSettlementPaid(paidQuote)}
          onQuoteChange={setSettlementQuote}
          open={settlementFlowOpen}
          quote={settlementQuote}
          recipientEmail={user?.email ?? null}
          recipientName={displayName}
        />
      </div>
    </>
  )
}

