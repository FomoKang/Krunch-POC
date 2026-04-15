"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Camera, Plus } from "lucide-react"
import { EmptyState } from "@/components/admin/empty-state"
import { PageHeader } from "@/components/admin/page-header"
import { StatusBadge } from "@/components/admin/status-badge"
import {
  buildMediaRowKey,
  formatDateTime,
} from "@/lib/admin/utils"
import {
  listArtifactOptions,
  listMediaAssets,
  type ArtifactOption,
  type MediaAssetRecord,
} from "@/lib/supabase/provenance"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminMediaPage() {
  const [artifacts, setArtifacts] = useState<ArtifactOption[]>([])
  const [mediaAssets, setMediaAssets] = useState<MediaAssetRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadMedia() {
      try {
        const [nextMedia, nextArtifacts] = await Promise.all([
          listMediaAssets(),
          listArtifactOptions(),
        ])

        if (!active) {
          return
        }

        setMediaAssets(nextMedia)
        setArtifacts(nextArtifacts)
        setError(null)
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load media assets.")
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadMedia()

    return () => {
      active = false
    }
  }, [])

  const artifactMap = useMemo(
    () => new Map(artifacts.map((artifact) => [artifact.id, artifact])),
    [artifacts],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assets"
        title="Media assets"
        description="Review the files already uploaded into Supabase Storage and indexed through media_assets."
        actions={
          <Button asChild className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
            <Link href="/admin/media/upload">
              <Plus className="mr-2 size-4" />
              Upload media
            </Link>
          </Button>
        }
      />

      {error ? (
        <div className="rounded-md border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-72 w-full bg-white/10" />
          ))}
        </div>
      ) : mediaAssets.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mediaAssets.map((media, index) => {
            const artifact = artifactMap.get(media.artifact_id)

            return (
              <Card key={buildMediaRowKey(media)} className="overflow-hidden border-white/10 bg-white/[0.03] text-white">
                <div className="aspect-[4/3] bg-black/30">
                  {media.thumbnail_url || media.file_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={media.thumbnail_url ?? media.file_url}
                      alt={media.caption ?? `Media ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-white">{media.caption ?? media.asset_type ?? "Uploaded asset"}</p>
                    <StatusBadge value={media.visibility_level} />
                  </div>
                  <p className="text-sm text-white/55">
                    {artifact ? `${artifact.artifact_code} - ${artifact.artifact_title}` : media.artifact_id}
                  </p>
                  <p className="text-sm text-white/55">
                    {media.asset_type ?? "asset"} - {formatDateTime(media.uploaded_at)}
                  </p>
                  <a href={media.file_url} target="_blank" rel="noreferrer" className="inline-flex text-sm text-[#ff9ebe] hover:text-[#ffc1d7]">
                    Open file
                  </a>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={Camera}
          title="No media assets yet"
          description="Upload the first reference image or supporting file and it will appear here."
          action={
            <Button asChild className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
              <Link href="/admin/media/upload">Upload media</Link>
            </Button>
          }
        />
      )}
    </div>
  )
}
