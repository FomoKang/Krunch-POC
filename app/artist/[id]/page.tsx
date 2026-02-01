import { ArtistComingSoonPage } from "@/components/artist-coming-soon-page"
import { getArtistByRank } from "@/lib/artist-rank-data"
import { notFound } from "next/navigation"

type Props = { params: Promise<{ id: string }> }

export default async function ArtistPage({ params }: Props) {
  const { id } = await params
  const rank = parseInt(id, 10)
  const artist = getArtistByRank(rank)
  if (!artist) notFound()
  return <ArtistComingSoonPage artistId={id} artist={artist} />
}
