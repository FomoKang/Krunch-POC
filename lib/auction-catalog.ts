export type AuctionStatus = "live_now" | "coming_soon" | "sold_out"
export type HybridAuctionStatus = "date" | "Coming Soon" | "Live Now" | "Sold Out"

export type CatalogItem = {
  id: string
  title: string
  titleKo: string
  subtitle: string
  subtitleKo: string
  artistName: string
  category: "premium_auction" | "hybrid_auction"
  auctionStatus: AuctionStatus
  currentPrice: number | null
  imageUrl: string
}

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
  category: "hybrid_auction"
  auctionStatus: AuctionStatus
  currentPrice: number | null
}

export type ParticipatingAuctionItem = {
  id: string
  name: string
  artist: string
  image: string
  status: "LIVE NOW" | "ENDING SOON" | "BID PLACED"
  currentInfo: string
  note: string
}

export const LEGACY_GALLERY_EMAIL = "jeniusokg@gmail.com"

export const PREMIUM_AUCTION_ITEM: CatalogItem = {
  id: "premium-peaceminusone-cap",
  title: "PEACEMINUSONE1988-CAP",
  titleKo: "PEACEMINUSONE1988-CAP",
  subtitle: "Ubermensch 2025 World Tour Special Merch",
  subtitleKo: "Ubermensch 2025 World Tour Special Merch",
  artistName: "G-DRAGON",
  category: "premium_auction",
  auctionStatus: "live_now",
  currentPrice: 52000000,
  imageUrl: "/cap2.png",
}

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
    category: "hybrid_auction",
    auctionStatus: "coming_soon",
    currentPrice: 3240000,
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
    category: "hybrid_auction",
    auctionStatus: "coming_soon",
    currentPrice: null,
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
    category: "hybrid_auction",
    auctionStatus: "live_now",
    currentPrice: 8880000,
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
    category: "hybrid_auction",
    auctionStatus: "sold_out",
    currentPrice: null,
  },
]

export const AUCTION_CATALOG_ITEMS: CatalogItem[] = [
  PREMIUM_AUCTION_ITEM,
  ...HYBRID_AUCTION_ITEMS.map((item) => ({
    id: item.id,
    title: item.name,
    titleKo: item.nameKo,
    subtitle: item.subtitle,
    subtitleKo: item.subtitleKo,
    artistName: item.artist,
    category: item.category,
    auctionStatus: item.auctionStatus,
    currentPrice: item.currentPrice,
    imageUrl: item.image,
  })),
]

const LEGACY_PARTICIPATING_AUCTIONS: ParticipatingAuctionItem[] = [
  {
    id: "premium-peaceminusone-cap",
    name: "PEACEMINUSONE1988-CAP",
    artist: "G-DRAGON",
    image: "/cap2.png",
    status: "LIVE NOW",
    currentInfo: "Current bid 52,000,000 KRW",
    note: "Top bid watchlist",
  },
  {
    id: "hybrid-recruiter-suit",
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

export function getCatalogItemById(itemId: string) {
  return AUCTION_CATALOG_ITEMS.find((item) => item.id === itemId) ?? null
}

export function getHybridAuctionItemById(itemId: string) {
  return HYBRID_AUCTION_ITEMS.find((item) => item.id === itemId) ?? null
}

export function getCatalogTitle(item: CatalogItem, isKo: boolean) {
  return isKo ? item.titleKo : item.title
}

export function getCatalogSubtitle(item: CatalogItem, isKo: boolean) {
  return isKo ? item.subtitleKo : item.subtitle
}

export function formatKrwAmount(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null
  }

  return `${value.toLocaleString("ko-KR")} KRW`
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
