import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export type AuctionParticipationStatus = "watching" | "bid_placed" | "leading" | "outbid"
export type OwnedItemSource = "gallery_seed" | "auction" | "draw"

export type AuctionParticipationRecord = {
  id: string
  user_id: string
  item_id: string
  status: AuctionParticipationStatus
  current_bid: number | null
  created_at: string
}

export type OwnedItemRecord = {
  id: string
  user_id: string
  item_id: string
  acquired_at: string
  source: OwnedItemSource
}

export type ViewedItemRecord = {
  id: string
  user_id: string
  item_id: string
  viewed_at: string
}

export type UserItemActivity = {
  participations: AuctionParticipationRecord[]
  ownedItems: OwnedItemRecord[]
  viewedItems: ViewedItemRecord[]
}

function getActivityErrorMessage(error: unknown, tableName: string) {
  const message = error instanceof Error ? error.message : `Unknown ${tableName} error.`

  if (message.includes("Could not find the table") || message.includes("relation") || message.includes(tableName)) {
    return `The ${tableName} table is missing. Run the SQL in supabase/migrations/20260415_expand_service_prototype.sql first.`
  }

  return message
}

export async function getAuctionParticipations(userId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("auction_participations")
    .select("id, user_id, item_id, status, current_bid, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<AuctionParticipationRecord[]>()

  if (error) {
    throw new Error(getActivityErrorMessage(error, "auction_participations"))
  }

  return data ?? []
}

export async function getOwnedItems(userId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("owned_items")
    .select("id, user_id, item_id, acquired_at, source")
    .eq("user_id", userId)
    .order("acquired_at", { ascending: false })
    .returns<OwnedItemRecord[]>()

  if (error) {
    throw new Error(getActivityErrorMessage(error, "owned_items"))
  }

  return data ?? []
}

export async function getViewedItems(userId: string, limit = 5) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("viewed_items")
    .select("id, user_id, item_id, viewed_at")
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false })
    .limit(limit)
    .returns<ViewedItemRecord[]>()

  if (error) {
    throw new Error(getActivityErrorMessage(error, "viewed_items"))
  }

  return data ?? []
}

export async function getUserItemActivity(userId: string): Promise<UserItemActivity> {
  const [participations, ownedItems, viewedItems] = await Promise.all([
    getAuctionParticipations(userId),
    getOwnedItems(userId),
    getViewedItems(userId),
  ])

  return {
    participations,
    ownedItems,
    viewedItems,
  }
}

export async function recordViewedItem(userId: string, itemId: string) {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.from("viewed_items").upsert(
    {
      user_id: userId,
      item_id: itemId,
      viewed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,item_id" },
  )

  if (error) {
    throw new Error(getActivityErrorMessage(error, "viewed_items"))
  }
}

export async function upsertAuctionParticipation({
  userId,
  itemId,
  status,
  currentBid,
}: {
  userId: string
  itemId: string
  status: AuctionParticipationStatus
  currentBid?: number | null
}) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("auction_participations")
    .upsert(
      {
        user_id: userId,
        item_id: itemId,
        status,
        current_bid: currentBid ?? null,
        created_at: new Date().toISOString(),
      },
      { onConflict: "user_id,item_id" },
    )
    .select("id, user_id, item_id, status, current_bid, created_at")
    .single<AuctionParticipationRecord>()

  if (error) {
    throw new Error(getActivityErrorMessage(error, "auction_participations"))
  }

  return data
}
