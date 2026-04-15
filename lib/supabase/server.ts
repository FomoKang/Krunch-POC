import "server-only"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

export function getSupabaseServerClient(options: { useServiceRole?: boolean } = {}): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.")
  }

  const key = options.useServiceRole ? supabaseServiceRoleKey ?? supabaseAnonKey : supabaseAnonKey

  if (!key) {
    throw new Error("Missing Supabase server credentials.")
  }

  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
