import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export type FavoriteItemRecord = {
  user_id: string
  item_id: string
  created_at: string
}

function getFavoriteErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown favorite error."

  if (message.includes("Could not find the table") || message.includes("relation") || message.includes("favorite_items")) {
    return "The favorite_items table is missing. Run the SQL in supabase/migrations/20260415_create_favorite_items.sql first."
  }

  return message
}

export async function getFavoriteItemIds(userId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("favorite_items")
    .select("item_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(getFavoriteErrorMessage(error))
  }

  return (data ?? []).map((item) => item.item_id)
}

export async function addFavoriteItem(userId: string, itemId: string) {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.from("favorite_items").upsert(
    {
      user_id: userId,
      item_id: itemId,
    },
    { onConflict: "user_id,item_id" },
  )

  if (error) {
    throw new Error(getFavoriteErrorMessage(error))
  }
}

export async function removeFavoriteItem(userId: string, itemId: string) {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.from("favorite_items").delete().eq("user_id", userId).eq("item_id", itemId)

  if (error) {
    throw new Error(getFavoriteErrorMessage(error))
  }
}
