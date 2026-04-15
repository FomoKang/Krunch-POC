export type HybridAuctionStatus = "date" | "Coming Soon" | "Live Now" | "Sold Out"

export type HybridAuctionItem = {
  id: string
  name: string
  subtitle: string
  nameKo: string
  subtitleKo: string
  artist: string
  image: string
  status: HybridAuctionStatus
  dateIso?: string
  currentBid: string
}

export type ParticipatingAuctionItem = {
  id: string
  name: string
  artist: string
  image: string
  videoSrc?: string
  status: "LIVE NOW" | "ENDING SOON" | "BID PLACED"
  currentInfo: string
  note: string
}

export const LEGACY_GALLERY_EMAIL = "jeniusokg@gmail.com"

export const HYBRID_AUCTION_ITEMS: HybridAuctionItem[] = [
  {
    id: "hybrid-burberry-trench",
    name: "Burberry Trench Jacket",
    subtitle: "worn by SON HEUNG MIN",
    nameKo: "Burberry Trench Jacket",
    subtitleKo: "worn by SON HEUNG MIN",
    artist: "SON HEUNG MIN",
    image: "/son-burberry.png",
    status: "date",
    dateIso: "2026-01-28",
    currentBid: "3,240,000 KRW",
  },
  {
    id: "hybrid-squid-mask",
    name: "Squid Game 2 Guard Mask",
    subtitle: "worn by PARK GYU YOUNG",
    nameKo: "Squid Game 2 Guard Mask",
    subtitleKo: "worn by PARK GYU YOUNG",
    artist: "PARK GYU YOUNG",
    image: "/squid-mask.png",
    status: "Coming Soon",
    currentBid: "Preview",
  },
  {
    id: "hybrid-recruiter-suit",
    name: "The Recruiter Suit",
    subtitle: "worn by GONG YOO",
    nameKo: "The Recruiter Suit",
    subtitleKo: "worn by GONG YOO",
    artist: "GONG YOO",
    image: "/gongyoo-suit.png",
    status: "Live Now",
    currentBid: "8,880,000 KRW",
  },
  {
    id: "hybrid-human-made-tee",
    name: "Human Made Heart Tee",
    subtitle: "worn by FELIX",
    nameKo: "Human Made Heart Tee",
    subtitleKo: "worn by FELIX",
    artist: "FELIX",
    image: "/felix-human.png",
    status: "Sold Out",
    currentBid: "Sold Out",
  },
]

const LEGACY_PARTICIPATING_AUCTIONS: ParticipatingAuctionItem[] = [
  {
    id: "auction-peaceminusone-cap",
    name: "PEACEMINUSONE1988-CAP",
    artist: "G-DRAGON",
    image: "/cap2.png",
    videoSrc: "/cap2-spin.mp4",
    status: "LIVE NOW",
    currentInfo: "Current bid 52,000,000 KRW",
    note: "Top bid watchlist",
  },
  {
    id: "auction-recruiter-suit",
    name: "The Recruiter Suit",
    artist: "GONG YOO",
    image: "/gongyoo-suit.png",
    status: "BID PLACED",
    currentInfo: "Your bid 8,400,000 KRW",
    note: "Outbid by 480,000 KRW",
  },
]

export function isLegacyGalleryUser(email?: string | null) {
  return email?.trim().toLowerCase() === LEGACY_GALLERY_EMAIL
}

export function formatDropDate(isoDate: string, isKo: boolean) {
  const d = new Date(isoDate)
  if (isKo) {
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} OPEN`
  }
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `Opens ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

export function getParticipatingAuctionsForUser(email?: string | null): ParticipatingAuctionItem[] {
  if (isLegacyGalleryUser(email)) {
    return LEGACY_PARTICIPATING_AUCTIONS
  }

  return []
}
