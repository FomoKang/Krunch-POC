import type {
  AuctionBidRecord,
  AuctionOutcomeRecord,
  AuctionShowcaseRecord,
  MediaAssetRecord,
} from "@/lib/supabase/provenance"

export const PREMIUM_SHOWCASE_ID = "premium-peaceminusone-cap"

type ShowcaseStatus = "live" | "scheduled" | "ended"
type ShowcaseType = "premium" | "hybrid"

type ShowcaseDefinition = {
  id: string
  artifactId: string
  artifactCode: string
  artifactTitle: string
  artistName: string
  groupName?: string | null
  eraName: string
  auctionTitle: string
  auctionType: ShowcaseType
  openingBid: number
  minimumIncrement: number
  currency: string
  initialStatus: ShowcaseStatus
  startOffsetSeconds: number
  endOffsetSeconds: number
  media: MediaAssetRecord
  initialBids: Array<{
    bidderDisplayName: string
    bidAmount: number
    minutesAgo: number
  }>
}

type StoredShowcaseState = {
  auctionStatus: ShowcaseStatus
  auctionStartTime: string | null
  auctionEndTime: string | null
  bids: AuctionBidRecord[]
  outcome: AuctionOutcomeRecord | null
}

const STORAGE_PREFIX = "krunch-auction-showcase"

const SHOWCASE_DEFINITIONS: Record<string, ShowcaseDefinition> = {
  [PREMIUM_SHOWCASE_ID]: {
    id: PREMIUM_SHOWCASE_ID,
    artifactId: "showcase-artifact-premium-cap",
    artifactCode: "KR-SHOW-PRM-0001",
    artifactTitle: "PEACEMINUSONE Cap",
    artistName: "G-DRAGON",
    groupName: "PEACEMINUSONE",
    eraName: "Ubermensch World Tour",
    auctionTitle: "PEACEMINUSONE Premium Auction",
    auctionType: "premium",
    openingBid: 5200000,
    minimumIncrement: 180000,
    currency: "KRW",
    initialStatus: "live",
    startOffsetSeconds: -21600,
    endOffsetSeconds: 86400,
    media: {
      artifact_id: "showcase-artifact-premium-cap",
      provenance_event_id: null,
      asset_type: "video",
      caption: "PEACEMINUSONE cap",
      source: "showcase",
      copyright_status: null,
      visibility_level: "public",
      taken_at: null,
      file_url: "/cap-spin.mp4",
      thumbnail_url: null,
      file_type: "video/mp4",
      file_hash: null,
      uploaded_at: null,
    },
    initialBids: [
      { bidderDisplayName: "Collector A", bidAmount: 5850000, minutesAgo: 52 },
      { bidderDisplayName: "Archive Buyer", bidAmount: 6210000, minutesAgo: 34 },
      { bidderDisplayName: "VIP Fan", bidAmount: 6733184, minutesAgo: 11 },
    ],
  },
  "hybrid-burberry-trench": {
    id: "hybrid-burberry-trench",
    artifactId: "showcase-artifact-burberry-trench",
    artifactCode: "KR-SHOW-HYB-0001",
    artifactTitle: "Burberry Trench Jacket",
    artistName: "SON HEUNG MIN",
    groupName: null,
    eraName: "Matchday Archive Drop",
    auctionTitle: "Burberry Trench Jacket Hybrid Auction",
    auctionType: "hybrid",
    openingBid: 3000000,
    minimumIncrement: 150000,
    currency: "KRW",
    initialStatus: "scheduled",
    startOffsetSeconds: 86400 * 10,
    endOffsetSeconds: 86400 * 12,
    media: {
      artifact_id: "showcase-artifact-burberry-trench",
      provenance_event_id: null,
      asset_type: "photo",
      caption: "Burberry Trench Jacket",
      source: "showcase",
      copyright_status: null,
      visibility_level: "public",
      taken_at: null,
      file_url: "/son-burberry.png",
      thumbnail_url: "/son-burberry.png",
      file_type: "image/png",
      file_hash: null,
      uploaded_at: null,
    },
    initialBids: [],
  },
  "hybrid-squid-mask": {
    id: "hybrid-squid-mask",
    artifactId: "showcase-artifact-squid-mask",
    artifactCode: "KR-SHOW-HYB-0002",
    artifactTitle: "Squid Game 2 Guard Mask",
    artistName: "PARK GYU YOUNG",
    groupName: null,
    eraName: "Screen Archive Edit",
    auctionTitle: "Squid Game 2 Guard Mask Hybrid Auction",
    auctionType: "hybrid",
    openingBid: 1800000,
    minimumIncrement: 100000,
    currency: "KRW",
    initialStatus: "scheduled",
    startOffsetSeconds: 86400 * 4,
    endOffsetSeconds: 86400 * 6,
    media: {
      artifact_id: "showcase-artifact-squid-mask",
      provenance_event_id: null,
      asset_type: "photo",
      caption: "Squid Game 2 Guard Mask",
      source: "showcase",
      copyright_status: null,
      visibility_level: "public",
      taken_at: null,
      file_url: "/squid-mask.png",
      thumbnail_url: "/squid-mask.png",
      file_type: "image/png",
      file_hash: null,
      uploaded_at: null,
    },
    initialBids: [],
  },
  "hybrid-recruiter-suit": {
    id: "hybrid-recruiter-suit",
    artifactId: "showcase-artifact-recruiter-suit",
    artifactCode: "KR-SHOW-HYB-0003",
    artifactTitle: "The Recruiter Suit",
    artistName: "GONG YOO",
    groupName: null,
    eraName: "Screen Archive Live",
    auctionTitle: "The Recruiter Suit Hybrid Auction",
    auctionType: "hybrid",
    openingBid: 7200000,
    minimumIncrement: 240000,
    currency: "KRW",
    initialStatus: "live",
    startOffsetSeconds: -14400,
    endOffsetSeconds: 43200,
    media: {
      artifact_id: "showcase-artifact-recruiter-suit",
      provenance_event_id: null,
      asset_type: "photo",
      caption: "The Recruiter Suit",
      source: "showcase",
      copyright_status: null,
      visibility_level: "public",
      taken_at: null,
      file_url: "/gongyoo-suit.png",
      thumbnail_url: "/gongyoo-suit.png",
      file_type: "image/png",
      file_hash: null,
      uploaded_at: null,
    },
    initialBids: [
      { bidderDisplayName: "Collector B", bidAmount: 7920000, minutesAgo: 48 },
      { bidderDisplayName: "Premium Bidder", bidAmount: 8400000, minutesAgo: 23 },
      { bidderDisplayName: "Collector A", bidAmount: 8880000, minutesAgo: 7 },
    ],
  },
  "hybrid-human-made-tee": {
    id: "hybrid-human-made-tee",
    artifactId: "showcase-artifact-human-made-tee",
    artifactCode: "KR-SHOW-HYB-0004",
    artifactTitle: "Human Made Heart Tee",
    artistName: "FELIX",
    groupName: null,
    eraName: "Collector Capsule",
    auctionTitle: "Human Made Heart Tee Hybrid Auction",
    auctionType: "hybrid",
    openingBid: 2600000,
    minimumIncrement: 120000,
    currency: "KRW",
    initialStatus: "ended",
    startOffsetSeconds: -172800,
    endOffsetSeconds: -86400,
    media: {
      artifact_id: "showcase-artifact-human-made-tee",
      provenance_event_id: null,
      asset_type: "photo",
      caption: "Human Made Heart Tee",
      source: "showcase",
      copyright_status: null,
      visibility_level: "public",
      taken_at: null,
      file_url: "/felix-human.png",
      thumbnail_url: "/felix-human.png",
      file_type: "image/png",
      file_hash: null,
      uploaded_at: null,
    },
    initialBids: [
      { bidderDisplayName: "Archive Buyer", bidAmount: 3080000, minutesAgo: 2400 },
      { bidderDisplayName: "VIP Fan", bidAmount: 3540000, minutesAgo: 2320 },
      { bidderDisplayName: "Collector B", bidAmount: 3900000, minutesAgo: 2260 },
    ],
  },
}

function getStorageKey(showcaseId: string) {
  return `${STORAGE_PREFIX}:${showcaseId}`
}

function getDefinition(showcaseId?: string | null) {
  if (showcaseId && showcaseId in SHOWCASE_DEFINITIONS) {
    return SHOWCASE_DEFINITIONS[showcaseId]
  }

  return SHOWCASE_DEFINITIONS[PREMIUM_SHOWCASE_ID]
}

function calculateBuyNowPrice(openingBid: number, auctionType: ShowcaseType) {
  if (auctionType !== "hybrid") {
    return null
  }

  return Math.round(openingBid * 1.5)
}

function sortBidsDescending(bids: AuctionBidRecord[]) {
  return [...bids].sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  )
}

function highestBid(bids: AuctionBidRecord[]) {
  return bids.reduce<AuctionBidRecord | null>((current, bid) => {
    if (!current || bid.bid_amount > current.bid_amount) {
      return bid
    }

    return current
  }, null)
}

function buildOutcome(
  showcaseId: string,
  winningBid: AuctionBidRecord | null,
  reassignedFromBidId: string | null = null,
): AuctionOutcomeRecord | null {
  if (!winningBid) {
    return null
  }

  return {
    outcome_id: `${showcaseId}:outcome`,
    auction_id: `showcase:${showcaseId}`,
    winner_user_id: null,
    winner_display_name: winningBid.bidder_display_name,
    winning_bid_id: winningBid.bid_id,
    outcome_status: "pending_payment",
    payment_due_at: null,
    paid_at: null,
    reassigned_from_bid_id: reassignedFromBidId,
    is_demo: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function createDefaultState(definition: ShowcaseDefinition): StoredShowcaseState {
  const now = Date.now()
  const auctionStartTime = new Date(now + definition.startOffsetSeconds * 1000).toISOString()
  const auctionEndTime = new Date(now + definition.endOffsetSeconds * 1000).toISOString()
  const bids = definition.initialBids.map((seed, index, seeds) => ({
    bid_id: `${definition.id}:seed:${index + 1}`,
    auction_id: `showcase:${definition.id}`,
    bidder_user_id: null,
    bidder_display_name: seed.bidderDisplayName,
    bid_amount: seed.bidAmount,
    bid_source: "manual",
    is_demo: false,
    created_at: new Date(now - seed.minutesAgo * 60 * 1000).toISOString(),
    is_valid: true,
    is_winning_bid: index === seeds.length - 1,
  }))
  const winningBid = highestBid(bids)

  return {
    auctionStatus: definition.initialStatus,
    auctionStartTime,
    auctionEndTime,
    bids: sortBidsDescending(bids),
    outcome: definition.initialStatus === "ended" ? buildOutcome(definition.id, winningBid) : null,
  }
}

function readStoredState(definition: ShowcaseDefinition) {
  if (typeof window === "undefined") {
    return createDefaultState(definition)
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(definition.id))

    if (!raw) {
      const initialState = createDefaultState(definition)
      window.localStorage.setItem(getStorageKey(definition.id), JSON.stringify(initialState))
      return initialState
    }

    return JSON.parse(raw) as StoredShowcaseState
  } catch {
    return createDefaultState(definition)
  }
}

function writeStoredState(definition: ShowcaseDefinition, state: StoredShowcaseState) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(getStorageKey(definition.id), JSON.stringify(state))
}

function syncState(definition: ShowcaseDefinition, state: StoredShowcaseState) {
  const now = Date.now()
  const next = {
    ...state,
    bids: sortBidsDescending(
      state.bids.map((bid) => ({
        ...bid,
        is_winning_bid: false,
      })),
    ),
  }
  const winningBid = highestBid(next.bids)

  if (winningBid) {
    next.bids = next.bids.map((bid) => ({
      ...bid,
      is_winning_bid: bid.bid_id === winningBid.bid_id,
    }))
  }

  if (next.auctionStatus !== "ended") {
    const startTime = next.auctionStartTime ? new Date(next.auctionStartTime).getTime() : null
    const endTime = next.auctionEndTime ? new Date(next.auctionEndTime).getTime() : null

    if (startTime && now < startTime) {
      next.auctionStatus = "scheduled"
    } else if (endTime && now >= endTime) {
      next.auctionStatus = "ended"
    } else {
      next.auctionStatus = "live"
    }
  }

  if (next.auctionStatus === "ended") {
    next.outcome = buildOutcome(definition.id, winningBid, next.outcome?.reassigned_from_bid_id ?? null)
  } else {
    next.outcome = null
  }

  return next
}

function buildShowcaseRecord(definition: ShowcaseDefinition, state: StoredShowcaseState): AuctionShowcaseRecord {
  const syncedState = syncState(definition, state)
  const buyNowPrice = calculateBuyNowPrice(definition.openingBid, definition.auctionType)
  const currentHighestBid = highestBid(syncedState.bids)?.bid_amount ?? definition.openingBid
  const minimumNextBid =
    syncedState.bids.length > 0 ? currentHighestBid + definition.minimumIncrement : definition.openingBid

  return {
    auction: {
      auction_id: `showcase:${definition.id}`,
      artifact_id: definition.artifactId,
      auction_title: definition.auctionTitle,
      auction_type: definition.auctionType,
      auction_status: syncedState.auctionStatus,
      lot_number: null,
      estimate_low: null,
      estimate_high: null,
      reserve_price: null,
      opening_bid: definition.openingBid,
      minimum_increment: definition.minimumIncrement,
      buy_now_price: buyNowPrice,
      hammer_price: syncedState.auctionStatus === "ended" ? currentHighestBid : null,
      final_price: syncedState.auctionStatus === "ended" ? currentHighestBid : null,
      currency: definition.currency,
      buyer_premium_rate: null,
      seller_fee_rate: null,
      auction_start_time: syncedState.auctionStartTime,
      auction_end_time: syncedState.auctionEndTime,
      settlement_status: syncedState.auctionStatus === "ended" ? "pending" : null,
      closing_reason: syncedState.auctionStatus === "ended" ? "completed" : null,
      guarantee_type: null,
      guarantee_amount: null,
      winner_bidder_id: null,
      winner_bid_id: syncedState.outcome?.winning_bid_id ?? highestBid(syncedState.bids)?.bid_id ?? null,
      extension_rule_enabled: true,
      extension_seconds: 30,
      demo_mode: false,
      created_at: null,
      updated_at: new Date().toISOString(),
    },
    artifact: {
      id: definition.artifactId,
      artifact_code: definition.artifactCode,
      artifact_title: definition.artifactTitle,
      artist_name: definition.artistName,
      group_name: definition.groupName ?? null,
      era_name: definition.eraName,
      public_visibility: "public",
    },
    media: definition.media,
    bids: syncedState.bids,
    outcome: syncedState.outcome,
    currentHighestBid,
    minimumNextBid,
  }
}

export function getAuctionShowcaseState(showcaseId?: string | null) {
  const definition = getDefinition(showcaseId)
  const state = syncState(definition, readStoredState(definition))
  writeStoredState(definition, state)
  return buildShowcaseRecord(definition, state)
}

export function placeAuctionShowcaseBid(input: {
  showcaseId?: string | null
  bidAmount: number
  bidderDisplayName?: string | null
}) {
  const definition = getDefinition(input.showcaseId)
  const state = syncState(definition, readStoredState(definition))
  const currentHighestBid = highestBid(state.bids)?.bid_amount ?? definition.openingBid
  const minimumNextBid =
    state.bids.length > 0 ? currentHighestBid + definition.minimumIncrement : definition.openingBid

  if (state.auctionStatus !== "live") {
    throw new Error("This showcase auction is not accepting bids right now.")
  }

  if (input.bidAmount < minimumNextBid) {
    throw new Error(`Enter at least ${definition.currency} ${minimumNextBid.toLocaleString("en-US")}.`)
  }

  const nextBid: AuctionBidRecord = {
    bid_id: `${definition.id}:bid:${Date.now()}`,
    auction_id: `showcase:${definition.id}`,
    bidder_user_id: null,
    bidder_display_name: input.bidderDisplayName?.trim() || "Guest Bidder",
    bid_amount: input.bidAmount,
    bid_source: "manual",
    is_demo: false,
    created_at: new Date().toISOString(),
    is_valid: true,
    is_winning_bid: true,
  }

  const nextState = {
    ...state,
    bids: sortBidsDescending(
      state.bids
        .map((bid) => ({
          ...bid,
          is_winning_bid: false,
        }))
        .concat(nextBid),
    ),
  }

  writeStoredState(definition, nextState)
  return nextBid
}

export function buyNowAuctionShowcase(input: {
  showcaseId?: string | null
  bidderDisplayName?: string | null
}) {
  const definition = getDefinition(input.showcaseId)
  const state = syncState(definition, readStoredState(definition))
  const buyNowPrice = calculateBuyNowPrice(definition.openingBid, definition.auctionType)

  if (definition.auctionType !== "hybrid" || !buyNowPrice) {
    throw new Error("Buy Now is not available on this showcase auction.")
  }

  if (state.auctionStatus !== "live") {
    throw new Error("This showcase auction is not currently live.")
  }

  const nextBid: AuctionBidRecord = {
    bid_id: `${definition.id}:buy-now:${Date.now()}`,
    auction_id: `showcase:${definition.id}`,
    bidder_user_id: null,
    bidder_display_name: input.bidderDisplayName?.trim() || "Guest Bidder",
    bid_amount: buyNowPrice,
    bid_source: "manual",
    is_demo: false,
    created_at: new Date().toISOString(),
    is_valid: true,
    is_winning_bid: true,
  }

  const nextState = {
    ...state,
    auctionStatus: "ended" as ShowcaseStatus,
    auctionEndTime: new Date().toISOString(),
    bids: sortBidsDescending(
      state.bids
        .map((bid) => ({
          ...bid,
          is_winning_bid: false,
        }))
        .concat(nextBid),
    ),
    outcome: buildOutcome(definition.id, nextBid),
  }

  writeStoredState(definition, nextState)
  return nextBid
}
