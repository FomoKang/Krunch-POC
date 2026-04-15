import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

const PUBLIC_ARTIFACT_COLUMNS = [
  "id",
  "artifact_code",
  "artifact_title",
  "artist_name",
  "era_name",
  "usage_tier",
  "current_status",
  "created_at",
].join(", ")

const PUBLIC_MEDIA_COLUMNS = [
  "artifact_id",
  "file_url",
  "thumbnail_url",
  "uploaded_at",
].join(", ")

type PublicArtifactRow = {
  id: string
  artifact_code: string
  artifact_title: string
  artist_name: string | null
  era_name: string | null
  usage_tier: string | null
  current_status: string | null
  created_at: string | null
}

type PublicMediaRow = {
  artifact_id: string
  file_url: string | null
  thumbnail_url: string | null
  uploaded_at: string | null
}

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search")?.trim()
  const supabase = getSupabaseServerClient({ useServiceRole: true })

  let artifactQuery = supabase
    .from("provenance_artifacts")
    .select(PUBLIC_ARTIFACT_COLUMNS)
    .eq("public_visibility", "public")
    .order("created_at", { ascending: false })
    .limit(6)

  if (search) {
    artifactQuery = artifactQuery.or(
      `artifact_code.ilike.%${search}%,artifact_title.ilike.%${search}%,artist_name.ilike.%${search}%`,
    )
  }

  const { data: artifactRows, error: artifactError } = await artifactQuery

  if (artifactError) {
    return NextResponse.json({ error: artifactError.message, listings: [] }, { status: 500 })
  }

  const artifacts = (artifactRows ?? []) as PublicArtifactRow[]
  const artifactIds = artifacts.map((artifact) => artifact.id).filter(Boolean)
  const mediaMap = new Map<string, string>()

  if (artifactIds.length > 0) {
    const { data: mediaRows, error: mediaError } = await supabase
      .from("media_assets")
      .select(PUBLIC_MEDIA_COLUMNS)
      .eq("visibility_level", "public")
      .in("artifact_id", artifactIds)
      .order("uploaded_at", { ascending: false })

    if (mediaError) {
      return NextResponse.json({ error: mediaError.message, listings: [] }, { status: 500 })
    }

    for (const media of (mediaRows ?? []) as PublicMediaRow[]) {
      if (!media.artifact_id || mediaMap.has(media.artifact_id)) {
        continue
      }

      const imageUrl = media.thumbnail_url ?? media.file_url

      if (imageUrl) {
        mediaMap.set(media.artifact_id, imageUrl)
      }
    }
  }

  const listings = artifacts.map((artifact) => ({
    ...artifact,
    image_url: mediaMap.get(artifact.id) ?? null,
  }))

  return NextResponse.json({ listings })
}
