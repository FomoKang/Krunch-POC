"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Download, Eye, EyeOff, Gavel, Plus, Rocket, Trash2 } from "lucide-react"
import { AUCTION_STATUS_OPTIONS } from "@/lib/admin/constants"
import { downloadCsv, formatDateTime, formatMoney } from "@/lib/admin/utils"
import {
  listArtifactOptions,
  listAuctions,
  removeDemoAuction,
  updateAuctionStorefrontState,
  type ArtifactOption,
  type AuctionRecord,
} from "@/lib/supabase/provenance"
import {
  canDeleteDemoAuction,
  getStorefrontVisibilityLabel,
  isAuctionVisibleOnStorefront,
} from "@/lib/auction-storefront"
import { toast } from "@/hooks/use-toast"
import { EmptyState } from "@/components/admin/empty-state"
import { PageHeader } from "@/components/admin/page-header"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function AdminAuctionsPage() {
  const [artifacts, setArtifacts] = useState<ArtifactOption[]>([])
  const [auctions, setAuctions] = useState<AuctionRecord[]>([])
  const [status, setStatus] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyAuctionId, setBusyAuctionId] = useState<string | null>(null)

  const loadAuctions = useCallback(async (active = true) => {
    try {
      setLoading(true)
      const [nextAuctions, nextArtifacts] = await Promise.all([
        listAuctions({ status }),
        listArtifactOptions(),
      ])

      if (!active) {
        return
      }

      setAuctions(nextAuctions)
      setArtifacts(nextArtifacts)
      setError(null)
    } catch (loadError) {
      if (!active) {
        return
      }

      setError(loadError instanceof Error ? loadError.message : "Unable to load auctions.")
    } finally {
      if (active) {
        setLoading(false)
      }
    }
  }, [status])

  useEffect(() => {
    let active = true

    void loadAuctions()

    return () => {
      active = false
    }
  }, [loadAuctions])

  const artifactMap = useMemo(
    () => new Map(artifacts.map((artifact) => [artifact.id, artifact])),
    [artifacts],
  )

  const exportRows = useMemo(
    () =>
      auctions.map((auction) => ({
        auction_title: auction.auction_title,
        artifact_code: artifactMap.get(auction.artifact_id)?.artifact_code ?? "",
        auction_type: auction.auction_type ?? "",
        auction_status: auction.auction_status ?? "",
        opening_bid: auction.opening_bid ?? "",
        reserve_price: auction.reserve_price ?? "",
        hammer_price: auction.hammer_price ?? "",
        final_price: auction.final_price ?? "",
        winner_bidder_id: auction.winner_bidder_id ?? "",
      })),
    [artifactMap, auctions],
  )

  async function publishAuction(auction: AuctionRecord) {
    setBusyAuctionId(auction.auction_id)

    try {
      await updateAuctionStorefrontState(auction.auction_id, {
        auction_status: "scheduled",
        storefront_visible: true,
      })
      toast({ title: "Auction published to storefront" })
      await loadAuctions()
    } catch (actionError) {
      toast({
        title: "Publish failed",
        description: actionError instanceof Error ? actionError.message : "Unable to publish auction.",
        variant: "destructive",
      })
    } finally {
      setBusyAuctionId(null)
    }
  }

  async function setStorefrontVisibility(auction: AuctionRecord, visible: boolean) {
    setBusyAuctionId(auction.auction_id)

    try {
      await updateAuctionStorefrontState(auction.auction_id, {
        storefront_visible: visible,
      })
      toast({ title: visible ? "Auction shown on storefront" : "Auction hidden from storefront" })
      await loadAuctions()
    } catch (actionError) {
      toast({
        title: visible ? "Show failed" : "Hide failed",
        description: actionError instanceof Error ? actionError.message : "Unable to update storefront visibility.",
        variant: "destructive",
      })
    } finally {
      setBusyAuctionId(null)
    }
  }

  async function deleteDemoAuction(auction: AuctionRecord) {
    setBusyAuctionId(auction.auction_id)

    try {
      await removeDemoAuction(auction)
      toast({ title: "Demo auction removed" })
      await loadAuctions()
    } catch (actionError) {
      toast({
        title: "Delete failed",
        description: actionError instanceof Error ? actionError.message : "Unable to delete demo auction.",
        variant: "destructive",
      })
    } finally {
      setBusyAuctionId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Commerce"
        title="Auctions"
        description="Monitor the live auctions table, filter by operational status, and review lot-level pricing before handoff."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              className="border-white/10 bg-transparent text-white hover:bg-white/[0.04]"
              onClick={() => downloadCsv("krunch-auctions.csv", exportRows)}
              disabled={!auctions.length}
            >
              <Download className="mr-2 size-4" />
              Export CSV
            </Button>
            <Button asChild className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
              <Link href="/admin/auctions/new">
                <Plus className="mr-2 size-4" />
                Create auction
              </Link>
            </Button>
          </>
        }
      />

      <Card className="border-white/10 bg-white/[0.03] text-white">
        <CardContent className="space-y-4 p-4">
          <div className="max-w-sm">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full border-white/10 bg-black/30 text-white">
                <SelectValue placeholder="Filter by auction status" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                <SelectItem value="all">All statuses</SelectItem>
                {AUCTION_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error ? (
            <div className="rounded-md border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full bg-white/10" />
              ))}
            </div>
          ) : auctions.length ? (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-white/55">Auction</TableHead>
                  <TableHead className="text-white/55">Artifact code</TableHead>
                  <TableHead className="text-white/55">Type</TableHead>
                  <TableHead className="text-white/55">Mode</TableHead>
                  <TableHead className="text-white/55">Status</TableHead>
                  <TableHead className="text-white/55">Storefront</TableHead>
                  <TableHead className="text-white/55">Opening</TableHead>
                  <TableHead className="text-white/55">Reserve</TableHead>
                  <TableHead className="text-white/55">Final</TableHead>
                  <TableHead className="text-white/55">Winner</TableHead>
                  <TableHead className="text-right text-white/55">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auctions.map((auction) => {
                  const visible = isAuctionVisibleOnStorefront(auction, true)
                  const visibilityLabel = getStorefrontVisibilityLabel(auction)
                  const visibilityBadge =
                    visibilityLabel === "Visible live"
                      ? "storefront_live_visible"
                      : visibilityLabel === "Visible in demo storefront"
                        ? "storefront_demo_visible"
                        : "storefront_hidden"
                  const canDeleteDemo = canDeleteDemoAuction(auction)
                  const isBusy = busyAuctionId === auction.auction_id

                  return (
                    <TableRow key={auction.auction_id} className="border-white/10">
                      <TableCell>
                        <Link href={`/admin/auctions/${auction.auction_id}`} className="block">
                          <p className="text-sm font-medium text-white">{auction.auction_title}</p>
                          <p className="text-sm text-white/55">
                            {auction.auction_start_time ? formatDateTime(auction.auction_start_time) : "No start time"}
                          </p>
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-white/70">
                        {artifactMap.get(auction.artifact_id)?.artifact_code ?? "-"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge value={auction.auction_type} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge value={auction.demo_mode ? "demo_mode" : "live_mode"} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge value={auction.auction_status} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge value={visibilityBadge} />
                      </TableCell>
                      <TableCell className="text-white/70">{formatMoney(auction.opening_bid, auction.currency ?? "USD")}</TableCell>
                      <TableCell className="text-white/70">{formatMoney(auction.reserve_price, auction.currency ?? "USD")}</TableCell>
                      <TableCell className="text-white/70">{formatMoney(auction.final_price, auction.currency ?? "USD")}</TableCell>
                      <TableCell className="text-white/70">{auction.winner_bidder_id ?? "-"}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]"
                            disabled={isBusy}
                            onClick={() => publishAuction(auction)}
                          >
                            <Rocket className="mr-1 size-3.5" />
                            Publish
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-white/10 bg-transparent text-white hover:bg-white/[0.04]"
                            disabled={isBusy}
                            onClick={() => setStorefrontVisibility(auction, !visible)}
                          >
                            {visible ? <EyeOff className="mr-1 size-3.5" /> : <Eye className="mr-1 size-3.5" />}
                            {visible ? "Hide" : "Show"}
                          </Button>
                          {canDeleteDemo ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button type="button" size="sm" variant="destructive" disabled={isBusy}>
                                  <Trash2 className="mr-1 size-3.5" />
                                  Delete Demo
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="border-white/10 bg-[#0f1117] text-white">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove demo auction?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-white/60">
                                    This demo auction will be removed from the admin and storefront. Continue?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/[0.04]">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-rose-600 text-white hover:bg-rose-500"
                                    onClick={() => deleteDemoAuction(auction)}
                                  >
                                    Delete Demo
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={Gavel}
              title="No auctions found"
              description="Create the first auction record or switch to a different status filter."
              action={
                <Button asChild className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
                  <Link href="/admin/auctions/new">Create auction</Link>
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
