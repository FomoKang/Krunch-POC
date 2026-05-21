export type StorefrontAuctionRecord = {
  auction_id: string
  auction_type: string | null
  auction_status: string | null
  auction_start_time: string | null
  demo_mode: boolean | null
  storefront_visible?: boolean | null
  deleted_at?: string | null
  winner_bidder_id?: string | null
  winner_bid_id?: string | null
  created_at: string | null
}

const LIVE_STOREFRONT_STATUSES = new Set(["live", "open", "scheduled", "published"])

export function normalizeAuctionStatus(auction: Pick<StorefrontAuctionRecord, "auction_status">) {
  return (auction.auction_status ?? "draft").toLowerCase()
}

export function isHybridAuction(auction: Pick<StorefrontAuctionRecord, "auction_type">) {
  return (auction.auction_type ?? "").toLowerCase() === "hybrid"
}

export function isDemoAuction(auction: Pick<StorefrontAuctionRecord, "demo_mode">) {
  return auction.demo_mode === true
}

export function isDeletedAuction(auction: Pick<StorefrontAuctionRecord, "auction_status" | "deleted_at">) {
  return Boolean(auction.deleted_at) || normalizeAuctionStatus(auction) === "deleted"
}

export function isAuctionVisibleOnStorefront(auction: StorefrontAuctionRecord, demoStorefront = true) {
  if (auction.storefront_visible === false || isDeletedAuction(auction)) {
    return false
  }

  const status = normalizeAuctionStatus(auction)
  if (LIVE_STOREFRONT_STATUSES.has(status)) {
    return true
  }

  return demoStorefront && isHybridAuction(auction) && isDemoAuction(auction) && status === "draft"
}

export function getStorefrontVisibilityLabel(auction: StorefrontAuctionRecord) {
  if (!isAuctionVisibleOnStorefront(auction, true)) {
    return "Hidden from storefront"
  }

  if (isHybridAuction(auction) && isDemoAuction(auction) && normalizeAuctionStatus(auction) === "draft") {
    return "Visible in demo storefront"
  }

  return "Visible live"
}

export function canDeleteDemoAuction(auction: StorefrontAuctionRecord) {
  const status = normalizeAuctionStatus(auction)
  return isDemoAuction(auction) && status !== "live" && status !== "settled" && !auction.winner_bidder_id && !auction.winner_bid_id
}

export function sortAuctionsForStorefront<T extends StorefrontAuctionRecord>(auctions: T[]) {
  return [...auctions].sort((left, right) => {
    const createdDiff = dateScore(right.created_at) - dateScore(left.created_at)
    if (createdDiff !== 0) return createdDiff

    const startDiff = dateScore(right.auction_start_time) - dateScore(left.auction_start_time)
    if (startDiff !== 0) return startDiff

    return right.auction_id.localeCompare(left.auction_id)
  })
}

function dateScore(value: string | null | undefined) {
  if (!value) return 0

  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : 0
}
