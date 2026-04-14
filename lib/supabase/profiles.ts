import type { User } from "@supabase/supabase-js"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export type ProfileRecord = {
  id: string
  email: string
  nickname: string
  created_at: string
}

function normalizeNickname(user: User, nickname?: string) {
  const trimmed = nickname?.trim()

  if (trimmed) {
    return trimmed
  }

  const metadataNickname =
    typeof user.user_metadata?.nickname === "string" ? user.user_metadata.nickname.trim() : ""

  if (metadataNickname) {
    return metadataNickname
  }

  return user.email?.split("@")[0] ?? "krunch-user"
}

export function getProfileErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown profile error."

  if (message.includes("Could not find the table") || message.includes("relation") || message.includes("profiles")) {
    return "The profiles table is missing. Run the SQL in supabase/migrations/20260414_create_profiles.sql first."
  }

  return message
}

export async function getProfileById(userId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, nickname, created_at")
    .eq("id", userId)
    .maybeSingle<ProfileRecord>()

  if (error) {
    throw new Error(getProfileErrorMessage(error))
  }

  return data
}

export async function upsertProfileFromUser(user: User, nickname?: string) {
  const email = user.email?.trim()

  if (!email) {
    throw new Error("This account does not have an email address yet.")
  }

  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email,
        nickname: normalizeNickname(user, nickname),
      },
      { onConflict: "id" },
    )
    .select("id, email, nickname, created_at")
    .single<ProfileRecord>()

  if (error) {
    throw new Error(getProfileErrorMessage(error))
  }

  return data
}
