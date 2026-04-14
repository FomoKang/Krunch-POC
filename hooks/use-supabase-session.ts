"use client"

import { useEffect, useState } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client"

type SupabaseSessionState = {
  session: Session | null
  user: User | null
  loading: boolean
  error: string | null
  isConfigured: boolean
}

export function useSupabaseSession(): SupabaseSessionState {
  const configured = isSupabaseConfigured()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(configured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!configured) {
      setLoading(false)
      setError("Supabase is not configured yet.")
      return
    }

    let active = true
    const supabase = getSupabaseBrowserClient()

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!active) {
          return
        }

        if (sessionError) {
          setError(sessionError.message)
        }

        setSession(data.session)
        setLoading(false)
      })
      .catch((sessionError: Error) => {
        if (!active) {
          return
        }

        setError(sessionError.message)
        setLoading(false)
      })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) {
        return
      }

      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [configured])

  return {
    session,
    user: session?.user ?? null,
    loading,
    error,
    isConfigured: configured,
  }
}
