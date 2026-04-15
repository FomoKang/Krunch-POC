"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { History } from "lucide-react"
import { EmptyState } from "@/components/admin/empty-state"
import { PageHeader } from "@/components/admin/page-header"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateTime, formatMoney } from "@/lib/admin/utils"
import { getAuctionById, listArtifactOptions, listBidHistory, type ArtifactOption, type AuctionRecord } from "@/lib/supabase/provenance"

type BidHistoryRow = Record<string, unknown>

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

export default function AuctionDetailPage() {
  const params = useParams<{ id: string }>()
  const auctionId = Array.isArray(params.id) ? params.id[0] : params.id
  const [auction, setAuction] = useState<AuctionRecord | null>(null)
  const [artifacts, setArtifacts] = useState<ArtifactOption[]>([])
  const [bidHistory, setBidHistory] = useState<BidHistoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [softWarning, setSoftWarning] = useState<string | null>(null)

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
          listBidHistory(auctionId),
        ])

        if (!active) {
          return
        }

        setAuction(nextAuction)
        setArtifacts(related[0].status === "fulfilled" ? related[0].value : [])
        setBidHistory(related[1].status === "fulfilled" ? related[1].value : [])

        if (related.some((result) => result.status === "rejected")) {
          setSoftWarning("Some linked sections could not be loaded, but the auction overview is still available.")
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

  if (loading) {
    return <LoadingView />
  }

  if (error || !auction) {
    return <ErrorView message={error ?? "Unable to load this auction."} />
  }

  const artifact = artifacts.find((item) => item.id === auction.artifact_id)

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
            <StatusBadge value={auction.auction_status} />
            <StatusBadge value={auction.settlement_status} />
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
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">Type</p>
              <p className="mt-2 text-sm text-white">{auction.auction_type ?? "-"}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">Opening bid</p>
              <p className="mt-2 text-sm text-white">{formatMoney(auction.opening_bid, auction.currency ?? "USD")}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">Reserve price</p>
              <p className="mt-2 text-sm text-white">{formatMoney(auction.reserve_price, auction.currency ?? "USD")}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">Hammer price</p>
              <p className="mt-2 text-sm text-white">{formatMoney(auction.hammer_price, auction.currency ?? "USD")}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">Final price</p>
              <p className="mt-2 text-sm text-white">{formatMoney(auction.final_price, auction.currency ?? "USD")}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">Guarantee</p>
              <p className="mt-2 text-sm text-white">
                {auction.guarantee_type ?? "none"}
                {auction.guarantee_amount
                  ? ` - ${formatMoney(auction.guarantee_amount, auction.currency ?? "USD")}`
                  : ""}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">Winner bidder ID</p>
              <p className="mt-2 text-sm text-white">{auction.winner_bidder_id ?? "-"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03] text-white">
          <CardHeader>
            <CardTitle>Bid history</CardTitle>
            <p className="mt-1 text-sm text-white/55">
              This section reads the live bid_history table. It is empty right now, but the page is already wired to it.
            </p>
          </CardHeader>
          <CardContent>
            {bidHistory.length ? (
              <div className="space-y-3">
                {bidHistory.map((entry, index) => (
                  <div key={`${entry.bid_id ?? index}`} className="rounded-lg border border-white/10 bg-black/25 p-4">
                    <p className="text-sm font-medium text-white">{String(entry.bid_amount ?? entry.amount ?? "Bid")}</p>
                    <p className="mt-1 text-sm text-white/55">
                      {String(entry.bidder_id ?? entry.user_id ?? "Unknown bidder")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={History}
                title="No bid history yet"
                description="As soon as bid_history receives records, they will appear here without extra schema changes."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
