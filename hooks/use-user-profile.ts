"use client"

import type { User } from "@supabase/supabase-js"
import { useCallback, useEffect, useState } from "react"
import { getProfileById, type ProfileRecord, upsertProfileFromUser } from "@/lib/supabase/profiles"

type UserProfileState = {
  error: string | null
  loading: boolean
  profile: ProfileRecord | null
  refreshProfile: () => Promise<void>
}

export function useUserProfile(user: User | null): UserProfileState {
  const [profile, setProfile] = useState<ProfileRecord | null>(null)
  const [loading, setLoading] = useState(Boolean(user))
  const [error, setError] = useState<string | null>(null)

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const existingProfile = await getProfileById(user.id)
      const nextProfile = existingProfile ?? (await upsertProfileFromUser(user))

      setProfile(nextProfile)
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : "Failed to load profile.")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void refreshProfile()
  }, [refreshProfile])

  return {
    error,
    loading,
    profile,
    refreshProfile,
  }
}
