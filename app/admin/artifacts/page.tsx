"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Copy, Download, Plus, Search, Shirt } from "lucide-react"
import { ARTIFACT_STATUS_OPTIONS, USAGE_TIER_OPTIONS } from "@/lib/admin/constants"
import { downloadCsv } from "@/lib/admin/utils"
import { listArtifacts, type ArtifactRecord } from "@/lib/supabase/provenance"
import { toast } from "@/hooks/use-toast"
import { EmptyState } from "@/components/admin/empty-state"
import { PageHeader } from "@/components/admin/page-header"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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

export default function AdminArtifactsPage() {
  const router = useRouter()
  const [artifacts, setArtifacts] = useState<ArtifactRecord[]>([])
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [usageTier, setUsageTier] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadArtifacts() {
      try {
        setLoading(true)
        const nextArtifacts = await listArtifacts({ search, status, usageTier })

        if (!active) {
          return
        }

        setArtifacts(nextArtifacts)
        setError(null)
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load artifacts.")
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadArtifacts()

    return () => {
      active = false
    }
  }, [search, status, usageTier])

  const exportRows = useMemo(
    () =>
      artifacts.map((artifact) => ({
        artifact_code: artifact.artifact_code,
        artifact_title: artifact.artifact_title,
        artist_name: artifact.artist_name ?? "",
        usage_tier: artifact.usage_tier ?? "",
        current_status: artifact.current_status ?? "",
        current_holder: artifact.current_holder ?? "",
      })),
    [artifacts],
  )

  function copyArtifactCode(code: string) {
    void navigator.clipboard.writeText(code)
    toast({
      title: "Artifact code copied",
      description: `${code} is now on your clipboard.`,
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Registry"
        title="Artifacts"
        description="Search the live provenance_artifacts table, filter by operational status, and open the canonical record for editing."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              className="border-white/10 bg-transparent text-white hover:bg-white/[0.04]"
              onClick={() => downloadCsv("krunch-artifacts.csv", exportRows)}
              disabled={!artifacts.length}
            >
              <Download className="mr-2 size-4" />
              Export CSV
            </Button>
            <Button asChild className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
              <a href="/admin/artifacts/new">
                <Plus className="mr-2 size-4" />
                Create artifact
              </a>
            </Button>
          </>
        }
      />

      <Card className="border-white/10 bg-white/[0.03] text-white">
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.7fr_0.7fr]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by artifact code, title, or artist..."
                className="border-white/10 bg-black/30 pl-10 text-white"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full border-white/10 bg-black/30 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                <SelectItem value="all">All statuses</SelectItem>
                {ARTIFACT_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={usageTier} onValueChange={setUsageTier}>
              <SelectTrigger className="w-full border-white/10 bg-black/30 text-white">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                <SelectItem value="all">All tiers</SelectItem>
                {USAGE_TIER_OPTIONS.map((option) => (
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
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full bg-white/10" />
              ))}
            </div>
          ) : artifacts.length ? (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-white/55">Artifact code</TableHead>
                  <TableHead className="text-white/55">Title</TableHead>
                  <TableHead className="text-white/55">Artist</TableHead>
                  <TableHead className="text-white/55">Usage tier</TableHead>
                  <TableHead className="text-white/55">Status</TableHead>
                  <TableHead className="text-white/55">Holder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {artifacts.map((artifact) => (
                  <TableRow
                    key={artifact.id}
                    className="cursor-pointer border-white/10 hover:bg-white/[0.03]"
                    onClick={() => router.push(`/admin/artifacts/${artifact.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-white">{artifact.artifact_code}</span>
                        <button
                          type="button"
                          className="rounded border border-white/10 p-1 text-white/55 transition-colors hover:bg-white/[0.05] hover:text-white"
                          onClick={(event) => {
                            event.stopPropagation()
                            copyArtifactCode(artifact.artifact_code)
                          }}
                        >
                          <Copy className="size-3.5" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[320px] truncate text-white">{artifact.artifact_title}</TableCell>
                    <TableCell className="text-white/70">{artifact.artist_name ?? "-"}</TableCell>
                    <TableCell>
                      <StatusBadge value={artifact.usage_tier} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={artifact.current_status} />
                    </TableCell>
                    <TableCell className="text-white/70">{artifact.current_holder ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={Shirt}
              title="No artifacts found"
              description="Try loosening the filters, or create the first provenance artifact record."
              action={
                <Button asChild className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
                  <a href="/admin/artifacts/new">Create artifact</a>
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
