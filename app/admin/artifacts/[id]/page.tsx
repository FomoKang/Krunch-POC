"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { AlertTriangle, Camera, FileBadge, Gavel, ShieldEllipsis, Sparkles } from "lucide-react"
import { ArtifactForm } from "@/components/admin/artifact-form"
import { EmptyState } from "@/components/admin/empty-state"
import { PageHeader } from "@/components/admin/page-header"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { artifactDisplayName, formatDate, formatDateTime, formatMoney } from "@/lib/admin/utils"
import {
  getArtifactById,
  listAuthentications,
  listAuctions,
  listDisclosureControls,
  listEvents,
  listMediaAssets,
  listTransactions,
  type ArtifactRecord,
  type AuthenticationRecord,
  type AuctionRecord,
  type DisclosureControlRecord,
  type MediaAssetRecord,
  type ProvenanceEventRecord,
} from "@/lib/supabase/provenance"

type TransactionRow = Record<string, unknown>

function LoadingView() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Artifact"
        title="Loading artifact..."
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
        eyebrow="Artifact"
        title="Artifact record unavailable"
        description={message}
        actions={
          <>
            <Button asChild variant="outline" className="border-white/10 bg-transparent text-white hover:bg-white/[0.04]">
              <Link href="/admin/dashboard">Back to dashboard</Link>
            </Button>
            <Button asChild className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
              <Link href="/admin/artifacts">Back to artifacts</Link>
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

export default function ArtifactDetailPage() {
  const params = useParams<{ id: string }>()
  const artifactId = Array.isArray(params.id) ? params.id[0] : params.id
  const [artifact, setArtifact] = useState<ArtifactRecord | null>(null)
  const [events, setEvents] = useState<ProvenanceEventRecord[]>([])
  const [authentications, setAuthentications] = useState<AuthenticationRecord[]>([])
  const [auctions, setAuctions] = useState<AuctionRecord[]>([])
  const [mediaAssets, setMediaAssets] = useState<MediaAssetRecord[]>([])
  const [disclosureControls, setDisclosureControls] = useState<DisclosureControlRecord[]>([])
  const [transactions, setTransactions] = useState<TransactionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [softWarning, setSoftWarning] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadArtifactDetail() {
      if (!artifactId) {
        setError("Missing artifact id.")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        setSoftWarning(null)

        const nextArtifact = await getArtifactById(artifactId)
        const related = await Promise.allSettled([
          listEvents({ artifactId }),
          listAuthentications({ artifactId }),
          listAuctions({ artifactId }),
          listMediaAssets({ artifactId }),
          listDisclosureControls({ artifactId }),
          listTransactions(artifactId),
        ])

        if (!active) {
          return
        }

        setArtifact(nextArtifact)
        setEvents(related[0].status === "fulfilled" ? related[0].value : [])
        setAuthentications(related[1].status === "fulfilled" ? related[1].value : [])
        setAuctions(related[2].status === "fulfilled" ? related[2].value : [])
        setMediaAssets(related[3].status === "fulfilled" ? related[3].value : [])
        setDisclosureControls(related[4].status === "fulfilled" ? related[4].value : [])
        setTransactions(related[5].status === "fulfilled" ? related[5].value : [])

        if (related.some((result) => result.status === "rejected")) {
          setSoftWarning("Some linked sections could not be loaded, but the artifact overview is still available.")
        }
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load this artifact.")
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadArtifactDetail()

    return () => {
      active = false
    }
  }, [artifactId])

  if (loading) {
    return <LoadingView />
  }

  if (error || !artifact) {
    return <ErrorView message={error ?? "Unable to load this artifact."} />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Artifact"
        title={artifact.artifact_title}
        description={artifactDisplayName(artifact)}
        actions={
          <>
            <Button asChild variant="outline" className="border-white/10 bg-transparent text-white hover:bg-white/[0.04]">
              <Link href="/admin/artifacts">Back to artifacts</Link>
            </Button>
            <StatusBadge value={artifact.usage_tier} />
            <StatusBadge value={artifact.current_status} />
          </>
        }
      />

      {softWarning ? (
        <div className="rounded-lg border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {softWarning}
        </div>
      ) : null}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto border border-white/10 bg-white/[0.03] p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Provenance Events</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="commerce">Auction / Transaction</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="disclosure">Disclosure</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ArtifactForm mode="edit" artifactId={artifact.id} initialValues={artifact} />
        </TabsContent>

        <TabsContent value="events">
          <Card className="border-white/10 bg-white/[0.03] text-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Linked provenance events</CardTitle>
                <p className="mt-1 text-sm text-white/55">
                  Each event links public evidence and operator-only notes back to the canonical artifact.
                </p>
              </div>
              <Button asChild className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
                <Link href={`/admin/events/new?artifactId=${artifact.id}`}>Add event</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {events.length ? (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div key={event.id} className="rounded-lg border border-white/10 bg-black/25 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">{event.event_title}</p>
                          <p className="mt-1 text-sm text-white/55">
                            {event.event_type ?? "event"} - {event.event_location ?? "No location"}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge value={event.source_confidence} />
                          <StatusBadge value={event.visibility_level} />
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-white/65">
                        {event.event_date_start ? formatDate(event.event_date_start) : "No start date"}
                        {event.event_date_end ? ` to ${formatDate(event.event_date_end)}` : ""}
                      </p>
                      {event.evidence_summary ? (
                        <p className="mt-3 text-sm leading-6 text-white/60">{event.evidence_summary}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Sparkles}
                  title="No provenance events yet"
                  description="Start with the first documented usage, fitting, or transfer event to build the artifact timeline."
                  action={
                    <Button asChild className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
                      <Link href={`/admin/events/new?artifactId=${artifact.id}`}>Create event</Link>
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auth">
          <Card className="border-white/10 bg-white/[0.03] text-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Authentication records</CardTitle>
                <p className="mt-1 text-sm text-white/55">
                  Verification history, providers, and certificate references for this artifact.
                </p>
              </div>
              <Button asChild className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
                <Link href={`/admin/authentications/new?artifactId=${artifact.id}`}>Add authentication</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {authentications.length ? (
                <div className="space-y-3">
                  {authentications.map((record) => (
                    <div key={record.id} className="rounded-lg border border-white/10 bg-black/25 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {record.auth_method ?? "Authentication record"}
                          </p>
                          <p className="mt-1 text-sm text-white/55">
                            {record.auth_provider ?? "No provider"}
                            {record.auth_date ? ` - ${formatDate(record.auth_date)}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge value={record.auth_result} />
                          <StatusBadge value={record.visibility_level} />
                        </div>
                      </div>
                      {record.notes ? <p className="mt-3 text-sm leading-6 text-white/60">{record.notes}</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FileBadge}
                  title="No authentication history yet"
                  description="Add the first verification record, then connect supporting certificate references as they are issued."
                  action={
                    <Button asChild className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
                      <Link href={`/admin/authentications/new?artifactId=${artifact.id}`}>Create authentication</Link>
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commerce">
          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="border-white/10 bg-white/[0.03] text-white">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Auctions</CardTitle>
                  <p className="mt-1 text-sm text-white/55">
                    Live and historical auction entries linked to this artifact.
                  </p>
                </div>
                <Button asChild className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
                  <Link href={`/admin/auctions/new?artifactId=${artifact.id}`}>Create auction</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {auctions.length ? (
                  <div className="space-y-3">
                    {auctions.map((auction) => (
                      <Link
                        key={auction.auction_id}
                        href={`/admin/auctions/${auction.auction_id}`}
                        className="block rounded-lg border border-white/10 bg-black/25 p-4 transition-colors hover:bg-black/35"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-white">{auction.auction_title}</p>
                            <p className="mt-1 text-sm text-white/55">
                              {auction.lot_number ? `Lot ${auction.lot_number}` : "No lot number"}
                              {auction.auction_start_time ? ` - ${formatDateTime(auction.auction_start_time)}` : ""}
                            </p>
                          </div>
                          <StatusBadge value={auction.auction_status} />
                        </div>
                        <p className="mt-3 text-sm text-white/65">
                          Opening {formatMoney(auction.opening_bid, auction.currency ?? "USD")}
                          {auction.final_price
                            ? ` - Final ${formatMoney(auction.final_price, auction.currency ?? "USD")}`
                            : ""}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Gavel}
                    title="No auctions yet"
                    description="Create the first auction record when this artifact moves into the sale pipeline."
                    action={
                      <Button asChild className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
                        <Link href={`/admin/auctions/new?artifactId=${artifact.id}`}>Create auction</Link>
                      </Button>
                    }
                  />
                )}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.03] text-white">
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
                <p className="mt-1 text-sm text-white/55">
                  The current table is still lightweight, so this tab shows the live raw records already stored in Supabase.
                </p>
              </CardHeader>
              <CardContent>
                {transactions.length ? (
                  <div className="space-y-3">
                    {transactions.map((transaction, index) => (
                      <div
                        key={`${transaction.transaction_id ?? index}`}
                        className="rounded-lg border border-white/10 bg-black/25 p-4"
                      >
                        <p className="text-sm font-medium text-white">
                          {String(transaction.transaction_type ?? "transaction")}
                        </p>
                        <p className="mt-1 text-sm text-white/55">
                          {String(transaction.transaction_id ?? "No transaction id")}
                          {"created_at" in transaction ? ` - ${formatDateTime(String(transaction.created_at))}` : ""}
                        </p>
                        {"notes" in transaction && transaction.notes ? (
                          <p className="mt-3 text-sm leading-6 text-white/60">{String(transaction.notes)}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={AlertTriangle}
                    title="No transaction records yet"
                    description="As provenance_transactions fills out, this tab will surface the stored records alongside auctions."
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="media">
          <Card className="border-white/10 bg-white/[0.03] text-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Media gallery</CardTitle>
                <p className="mt-1 text-sm text-white/55">
                  Uploaded files saved in Supabase Storage and indexed through media_assets.
                </p>
              </div>
              <Button asChild className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
                <Link href={`/admin/media/upload?artifactId=${artifact.id}`}>Upload media</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {mediaAssets.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {mediaAssets.map((media, index) => (
                    <div
                      key={`${media.file_hash ?? media.file_url}-${index}`}
                      className="overflow-hidden rounded-lg border border-white/10 bg-black/25"
                    >
                      {media.thumbnail_url || media.file_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={media.thumbnail_url ?? media.file_url}
                          alt={media.caption ?? `Media ${index + 1}`}
                          className="aspect-[4/3] w-full object-cover"
                        />
                      ) : null}
                      <div className="space-y-2 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-white">
                            {media.caption ?? media.asset_type ?? "Uploaded asset"}
                          </p>
                          <StatusBadge value={media.visibility_level} />
                        </div>
                        <p className="text-sm text-white/55">{media.asset_type ?? "asset"}</p>
                        <a
                          href={media.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex text-sm text-[#ff9ebe] hover:text-[#ffc1d7]"
                        >
                          Open file
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Camera}
                  title="No media uploaded yet"
                  description="Upload reference photography, scans, or backstage material so operators and collectors have the supporting evidence on hand."
                  action={
                    <Button asChild className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
                      <Link href={`/admin/media/upload?artifactId=${artifact.id}`}>Upload media</Link>
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disclosure">
          <Card className="border-white/10 bg-white/[0.03] text-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Disclosure controls</CardTitle>
                <p className="mt-1 text-sm text-white/55">
                  Visibility overrides that keep sensitive stylist, production, or sourcing details off the public surfaces.
                </p>
              </div>
              <Button asChild className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
                <Link href={`/admin/disclosure?artifactId=${artifact.id}`}>Manage disclosure</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {disclosureControls.length ? (
                <div className="space-y-3">
                  {disclosureControls.map((record, index) => (
                    <div
                      key={`${record.artifact_id}-${record.field_name}-${record.field_value_reference}-${index}`}
                      className="rounded-lg border border-white/10 bg-black/25 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">{record.field_name}</p>
                          <p className="mt-1 text-sm text-white/55">{record.field_value_reference}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge value={record.reason_code} />
                          <StatusBadge value={record.visibility_level} />
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-white/60">
                        Approved by {record.approved_by ?? "unknown"}
                        {record.expires_at ? ` - Expires ${formatDate(record.expires_at)}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={ShieldEllipsis}
                  title="No disclosure controls yet"
                  description="Add a disclosure override when a specific field should stay internal or collector-only."
                  action={
                    <Button asChild className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
                      <Link href={`/admin/disclosure?artifactId=${artifact.id}`}>Create disclosure rule</Link>
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
