"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { History, Sparkles, WalletCards } from "lucide-react"
import { EmptyState } from "@/components/admin/empty-state"
import { PageHeader } from "@/components/admin/page-header"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateTime, formatMoney } from "@/lib/admin/utils"
import { listSettlementQuotes, type PurchaseSettlementQuoteRecord } from "@/lib/supabase/settlements"
import {
  getAuctionById,
  getAuctionCurrentHighestBid,
  getAuctionMinimumNextBid,
  getAuctionOutcome,
  listArtifactOptions,
  listAuctionBids,
  seedDemoAuctionHistory,
  simulateAuctionAction,
  type ArtifactOption,
  type AuctionBidRecord,
  type AuctionOutcomeRecord,
  type AuctionRecord,
  type AuctionSimulationAction,
} from "@/lib/supabase/provenance"
import { toast } from "@/hooks/use-toast"

function LoadingView() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Commerce"
        title="Loading auction..."
        description="Fetching the live record from Supabase."
      />
      <Card className="border-white/10 bg-white/[0.03] text-white">
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-10 w-64 bg-white/10" />
          <Skeleton className="h-80 w-full bg-white/10" />
        </CardContent>
      </Card>
    </div>
  )
}

function ErrorView({ message }: { message: string }) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Commerce"
        title="Auction record unavailable"
        description={message}
        actions={
          <>
            <Button asChild variant="outline" className="border-white/10 bg-transparent text-white hover:bg-white/[0.04]">
              <Link href="/admin/dashboard">Back to dashboard</Link>
            </Button>
            <Button asChild className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
              <Link href="/admin/auctions">Back to auctions</Link>
            </Button>
          </>
        }
      />
      <Card className="border-white/10 bg-white/[0.03] text-white">
        <CardContent className="p-6">
          <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-200">
            {message}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const SIMULATION_ACTIONS: Array<{ action: AuctionSimulationAction; label: string }> = [
  { action: "simulate_bid", label: "Simulate Bid" },
  { action: "simulate_last_minute_bid", label: "Simulate Last-Minute Bid" },
  { action: "simulate_extension", label: "Simulate Extension" },
  { action: "end_auction_now", label: "End Auction Now" },
  { action: "mark_payment_pending", label: "Payment Pending" },
  { action: "mark_payment_failed", label: "Payment Failed" },
  { action: "reassign_to_underbidder", label: "Reassign to Underbidder" },
]

const DANGEROUS_ACTIONS = new Set<AuctionSimulationAction>([
  "end_auction_now",
  "mark_payment_failed",
  "reassign_to_underbidder",
])

export default function AuctionDetailPage() {
  const params = useParams<{ id: string }>()
  const auctionId = Array.isArray(params.id) ? params.id[0] : params.id
  const [auction, setAuction] = useState<AuctionRecord | null>(null)
  const [artifacts, setArtifacts] = useState<ArtifactOption[]>([])
  const [bids, setBids] = useState<AuctionBidRecord[]>([])
  const [outcome, setOutcome] = useState<AuctionOutcomeRecord | null>(null)
  const [settlementQuotes, setSettlementQuotes] = useState<PurchaseSettlementQuoteRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [softWarning, setSoftWarning] = useState<string | null>(null)
  const [runningAction, setRunningAction] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadAuctionDetail() {
      if (!auctionId) {
        setError("Missing auction id.")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        setSoftWarning(null)

        const nextAuction = await getAuctionById(auctionId)
        const related = await Promise.allSettled([
          listArtifactOptions(),
          listAuctionBids({ auctionId, limit: 30 }),
          getAuctionOutcome(auctionId),
          listSettlementQuotes({ auctionId, limit: 12 }),
        ])

        if (!active) {
          return
        }

        setAuction(nextAuction)
        setArtifacts(related[0].status === "fulfilled" ? related[0].value : [])
        setBids(related[1].status === "fulfilled" ? related[1].value : [])
        setOutcome(related[2].status === "fulfilled" ? related[2].value : null)
        setSettlementQuotes(related[3].status === "fulfilled" ? related[3].value : [])

        if (related.some((result) => result.status === "rejected")) {
          setSoftWarning("Some linked auction sections could not be loaded, but the auction overview is still available.")
        }
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load this auction.")
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadAuctionDetail()

    return () => {
      active = false
    }
  }, [auctionId])

  async function refreshAuctionDetail() {
    if (!auctionId) {
      return
    }

    const [nextAuction, nextArtifacts, nextBids, nextOutcome, nextSettlementQuotes] = await Promise.all([
      getAuctionById(auctionId),
      listArtifactOptions(),
      listAuctionBids({ auctionId, limit: 30 }),
      getAuctionOutcome(auctionId),
      listSettlementQuotes({ auctionId, limit: 12 }),
    ])

    setAuction(nextAuction)
    setArtifacts(nextArtifacts)
    setBids(nextBids)
    setOutcome(nextOutcome)
    setSettlementQuotes(nextSettlementQuotes)
  }

  async function handleSimulationAction(action: AuctionSimulationAction) {
    if (!auctionId) {
      return
    }

    if (DANGEROUS_ACTIONS.has(action)) {
      const confirmed = window.confirm(`Run ${action.replaceAll("_", " ")} on this demo auction?`)

      if (!confirmed) {
        return
      }
    }

    setRunningAction(action)

    try {
      await simulateAuctionAction(auctionId, action)
      await refreshAuctionDetail()

      toast({
        title: "Simulation applied",
        description: `${action} has been recorded in the demo auction ledger.`,
      })
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : "Unable to run the simulation."
      toast({
        title: "Simulation failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setRunningAction(null)
    }
  }

  async function handleSeedHistory() {
    if (!auctionId) {
      return
    }

    setRunningAction("seed")

    try {
      await seedDemoAuctionHistory(auctionId)
      await refreshAuctionDetail()

      toast({
        title: "Sample bid history seeded",
        description: "Demo bid history has been written to auction_bids.",
      })
    } catch (seedError) {
      const message = seedError instanceof Error ? seedError.message : "Unable to seed demo bid history."
      toast({
        title: "Seed failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setRunningAction(null)
    }
  }

  if (loading) {
    return <LoadingView />
  }

  if (error || !auction) {
    return <ErrorView message={error ?? "Unable to load this auction."} />
  }

  const artifact = artifacts.find((item) => item.id === auction.artifact_id)
  const currentHighestBid = getAuctionCurrentHighestBid(auction, bids)
  const minimumNextBid = getAuctionMinimumNextBid(auction, bids)
  const bidActionDisabled = auction.auction_status !== "live"
  const extensionDisabled =
    auction.auction_status === "ended" ||
    auction.auction_status === "cancelled" ||
    auction.auction_status === "settled"
  const closeAuctionDisabled =
    auction.auction_status === "ended" ||
    auction.auction_status === "cancelled" ||
    auction.auction_status === "settled"
  const paymentActionDisabled =
    auction.auction_status === "cancelled" ||
    auction.auction_status === "settled" ||
    bids.length === 0
  const reassignDisabled = bids.length < 2

  function isSimulationButtonDisabled(action: AuctionSimulationAction) {
    if (runningAction !== null) {
      return true
    }

    switch (action) {
      case "simulate_bid":
      case "simulate_last_minute_bid":
        return bidActionDisabled
      case "simulate_extension":
        return extensionDisabled
      case "end_auction_now":
        return closeAuctionDisabled
      case "mark_payment_pending":
      case "mark_payment_failed":
        return paymentActionDisabled
      case "reassign_to_underbidder":
        return reassignDisabled
      default:
        return false
    }
  }

  function getSimulationButtonHint(action: AuctionSimulationAction) {
    switch (action) {
      case "simulate_bid":
      case "simulate_last_minute_bid":
        return bidActionDisabled ? "Available only while the demo auction is live." : null
      case "simulate_extension":
        return extensionDisabled ? "Extension is only available before the auction is finalized." : null
      case "end_auction_now":
        return closeAuctionDisabled ? "The auction is already finalized." : null
      case "mark_payment_pending":
      case "mark_payment_failed":
        return paymentActionDisabled ? "Create at least one bid before changing payment state." : null
      case "reassign_to_underbidder":
        return reassignDisabled ? "At least two bids are required to reassign the winner." : null
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Commerce"
        title={auction.auction_title}
        description={artifact ? `${artifact.artifact_code} - ${artifact.artifact_title}` : auction.artifact_id}
        actions={
          <>
            <Button asChild variant="outline" className="border-white/10 bg-transparent text-white hover:bg-white/[0.04]">
              <Link href="/admin/auctions">Back to auctions</Link>
            </Button>
            <StatusBadge value={auction.auction_type} />
            {auction.demo_mode ? <StatusBadge value="demo_mode" /> : null}
            <StatusBadge value={auction.auction_status} />
          </>
        }
      />

      {softWarning ? (
        <div className="rounded-lg border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {softWarning}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-white/10 bg-white/[0.03] text-white">
          <CardHeader>
            <CardTitle>Basic info</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">Artifact</p>
              <p className="mt-2 text-sm text-white">
                {artifact ? `${artifact.artifact_code} - ${artifact.artifact_title}` : auction.artifact_id}
              </p>
              {artifact ? (
                <Button asChild variant="link" className="mt-2 h-auto p-0 text-[#ff9ebe] hover:text-[#ffc1d7]">
                  <Link href={`/admin/artifacts/${artifact.id}`}>Open artifact</Link>
                </Button>
              ) : null}
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">Lot number</p>
              <p className="mt-2 text-sm text-white">{auction.lot_number ?? "-"}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">Schedule</p>
              <p className="mt-2 text-sm text-white">
                {auction.auction_start_time ? formatDateTime(auction.auction_start_time) : "No start time"}
                {auction.auction_end_time ? ` to ${formatDateTime(auction.auction_end_time)}` : ""}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">Auction type</p>
              <p className="mt-2 text-sm text-white">{auction.auction_type ?? "-"}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">Opening bid</p>
              <p className="mt-2 text-sm text-white">{formatMoney(auction.opening_bid, auction.currency ?? "KRW")}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">Minimum increment</p>
              <p className="mt-2 text-sm text-white">{formatMoney(auction.minimum_increment, auction.currency ?? "KRW")}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">Current highest bid</p>
              <p className="mt-2 text-sm text-white">{formatMoney(currentHighestBid, auction.currency ?? "KRW")}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">Minimum next bid</p>
              <p className="mt-2 text-sm text-white">{formatMoney(minimumNextBid, auction.currency ?? "KRW")}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">Buy Now Price</p>
              <p className="mt-2 text-sm text-white">
                {auction.auction_type === "hybrid"
                  ? formatMoney(auction.buy_now_price, auction.currency ?? "KRW")
                  : "Hidden on Premium Auction"}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">Outcome</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge value={outcome?.outcome_status ?? "pending"} />
                {auction.demo_mode ? <StatusBadge value="demo_mode" /> : null}
              </div>
              <p className="mt-2 text-sm text-white/70">
                {outcome?.winner_display_name ?? outcome?.winner_user_id ?? auction.winner_bidder_id ?? "No winner yet"}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-white/10 bg-white/[0.03] text-white">
            <CardHeader>
              <CardTitle>Settlement quotes</CardTitle>
              <p className="mt-1 text-sm text-white/55">
                Hybrid Buy Now now creates a per-transaction recipient capture and payment-ready quote before payment is completed.
              </p>
            </CardHeader>
            <CardContent>
              {settlementQuotes.length ? (
                <div className="space-y-3">
                  {settlementQuotes.map((quote) => (
                    <div key={quote.quote_id} className="rounded-lg border border-white/10 bg-black/25 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {quote.recipient_name ?? "Awaiting shipping information"}
                          </p>
                          <p className="mt-1 text-xs text-white/45">
                            {quote.destination_country ?? "Destination pending"} · {formatDateTime(quote.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-white">
                            {formatMoney(quote.total_payable_amount, quote.currency)}
                          </p>
                          <div className="mt-2 flex flex-wrap justify-end gap-2">
                            <StatusBadge value={quote.quote_status} />
                            {quote.is_demo ? <StatusBadge value="demo_mode" /> : null}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-white/60 sm:grid-cols-3">
                        <p>Item {formatMoney(quote.base_item_amount, quote.currency)}</p>
                        <p>Shipping {formatMoney(quote.shipping_amount, quote.currency)}</p>
                        <p>Estimated tax {formatMoney((quote.estimated_duty_amount ?? 0) + (quote.estimated_vat_amount ?? 0), quote.currency)}</p>
                      </div>
                      {quote.review_reason ? (
                        <p className="mt-3 rounded-md border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
                          {quote.review_reason}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={WalletCards}
                  title="No settlement quotes yet"
                  description="When a user starts Buy Now on this hybrid lot, recipient capture and quote states will appear here."
                />
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.03] text-white">
            <CardHeader>
              <CardTitle>Bid history</CardTitle>
              <p className="mt-1 text-sm text-white/55">
                Live demo and manual bids both land in the same auction_bids ledger, but demo rows stay isolated with `is_demo`.
              </p>
            </CardHeader>
            <CardContent>
              {bids.length ? (
                <div className="space-y-3">
                  {bids.map((entry) => (
                    <div key={entry.bid_id} className="rounded-lg border border-white/10 bg-black/25 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">{entry.bidder_display_name}</p>
                          <p className="mt-1 text-xs text-white/45">{formatDateTime(entry.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-white">{formatMoney(entry.bid_amount, auction.currency ?? "KRW")}</p>
                          <div className="mt-2 flex flex-wrap justify-end gap-2">
                            <StatusBadge value={entry.bid_source} />
                            {entry.is_winning_bid ? <StatusBadge value="active" /> : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={History}
                  title="No bid history yet"
                  description="Seed sample demo bids or place the first live/manual offer to start the auction narrative."
                />
              )}
            </CardContent>
          </Card>

          {auction.demo_mode ? (
            <Card className="border-white/10 bg-white/[0.03] text-white">
              <CardHeader>
                <CardTitle>Demo controls</CardTitle>
                <p className="mt-1 text-sm text-white/55">
                  Demo Mode only. These actions write real rows into the database, but they stay tagged as demo so they never blend into live auctions.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-white/10 bg-black/25 text-white hover:bg-black/35"
                  onClick={() => void handleSeedHistory()}
                  disabled={runningAction !== null}
                >
                  <Sparkles className="mr-2 size-4" />
                  Generate Sample Bid History
                </Button>

                <div className="grid gap-2 sm:grid-cols-2">
                  {SIMULATION_ACTIONS.map((item) => (
                    <div key={item.action} className="space-y-1">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start border-white/10 bg-black/25 text-white hover:bg-black/35 disabled:opacity-50"
                        onClick={() => void handleSimulationAction(item.action)}
                        disabled={isSimulationButtonDisabled(item.action)}
                      >
                        {runningAction === item.action ? "Running..." : item.label}
                      </Button>
                      {getSimulationButtonHint(item.action) ? (
                        <p className="text-xs text-white/40">{getSimulationButtonHint(item.action)}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}
