import Link from "next/link"
import { EmptyState } from "@/components/admin/empty-state"
import { PageHeader } from "@/components/admin/page-header"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateTime, formatMoney } from "@/lib/admin/utils"
import {
  getAuctionById,
  listArtifactOptions,
  listBidHistory,
} from "@/lib/supabase/provenance"
import { Gavel, History } from "lucide-react"

async function AuctionDetailContent({ auctionId }: { auctionId: string }) {
  const [auction, artifacts, bidHistory] = await Promise.all([
    getAuctionById(auctionId),
    listArtifactOptions(),
    listBidHistory(auctionId),
  ])

  const artifact = artifacts.find((item) => item.id === auction.artifact_id)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Commerce"
        title={auction.auction_title}
        description={artifact ? `${artifact.artifact_code} · ${artifact.artifact_title}` : auction.artifact_id}
        actions={
          <>
            <StatusBadge value={auction.auction_status} />
            <StatusBadge value={auction.settlement_status} />
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-white/10 bg-white/[0.03] text-white">
          <CardHeader>
            <CardTitle>Basic info</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">Artifact</p>
              <p className="mt-2 text-sm text-white">{artifact ? `${artifact.artifact_code} · ${artifact.artifact_title}` : auction.artifact_id}</p>
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
                {auction.auction_end_time ? ` → ${formatDateTime(auction.auction_end_time)}` : ""}
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
                {auction.guarantee_amount ? ` · ${formatMoney(auction.guarantee_amount, auction.currency ?? "USD")}` : ""}
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
            <p className="mt-1 text-sm text-white/55">This section reads the live bid_history table. It is empty right now, but the page is already wired to it.</p>
          </CardHeader>
          <CardContent>
            {bidHistory.length ? (
              <div className="space-y-3">
                {bidHistory.map((entry, index) => (
                  <div key={`${entry.bid_id ?? index}`} className="rounded-lg border border-white/10 bg-black/25 p-4">
                    <p className="text-sm font-medium text-white">
                      {String(entry.bid_amount ?? entry.amount ?? "Bid")}
                    </p>
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

export default async function AuctionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <AuctionDetailContent auctionId={id} />
}
