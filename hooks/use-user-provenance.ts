"use client"

import type { User } from "@supabase/supabase-js"
import { useCallback, useEffect, useState } from "react"
import { ensureUserProvenance, type UserProvenanceEnvelope } from "@/lib/supabase/provenance"

type UserProvenanceState = {
  error: string | null
  loading: boolean
  provenance: UserProvenanceEnvelope | null
  refreshProvenance: () => Promise<void>
}

export function useUserProvenance(user: User | null): UserProvenanceState {
  const [provenance, setProvenance] = useState<UserProvenanceEnvelope | null>(null)
  const [loading, setLoading] = useState(Boolean(user))
  const [error, setError] = useState<string | null>(null)

  const refreshProvenance = useCallback(async () => {
    if (!user) {
      setProvenance(null)
      setLoading(false)
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const nextProvenance = await ensureUserProvenance(user)
      setProvenance(nextProvenance)
    } catch (provenanceError) {
      setError(provenanceError instanceof Error ? provenanceError.message : "Failed to load provenance.")
      setProvenance(null)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void refreshProvenance()
  }, [refreshProvenance])

  return {
    error,
    loading,
    provenance,
    refreshProvenance,
  }
}
