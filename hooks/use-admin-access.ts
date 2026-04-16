"use client"

import { useEffect, useMemo, useState } from "react"
import { INTERNAL_KRUNCH_ROLE_OPTIONS, type InternalKrunchRole, type KrunchRole } from "@/lib/admin/constants"
import { listUserRoles } from "@/lib/supabase/roles"
import { useSupabaseSession } from "@/hooks/use-supabase-session"

type AdminAccessState = ReturnType<typeof useSupabaseSession> & {
  roles: KrunchRole[]
  rolesLoading: boolean
  rolesError: string | null
  accessLoading: boolean
  isInternalOperator: boolean
  isSuperAdmin: boolean
}

export function useAdminAccess(): AdminAccessState {
  const sessionState = useSupabaseSession()
  const userId = sessionState.user?.id ?? null
  const [roles, setRoles] = useState<KrunchRole[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const [rolesError, setRolesError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionState.isConfigured) {
      setRoles([])
      setRolesLoading(false)
      setRolesError(null)
      return
    }

    if (sessionState.loading) {
      return
    }

    if (!userId) {
      setRoles([])
      setRolesLoading(false)
      setRolesError(null)
      return
    }

    let active = true
    setRolesLoading(true)
    setRolesError(null)

    void listUserRoles(userId)
      .then((records) => {
        if (!active) {
          return
        }

        setRoles(Array.from(new Set(records.map((record) => record.role))))
      })
      .catch((error: Error) => {
        if (!active) {
          return
        }

        setRoles([])
        setRolesError(error.message)
      })
      .finally(() => {
        if (active) {
          setRolesLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [sessionState.isConfigured, sessionState.loading, userId])

  const isInternalOperator = useMemo(
    () =>
      roles.some((role) =>
        INTERNAL_KRUNCH_ROLE_OPTIONS.includes(role as InternalKrunchRole),
      ),
    [roles],
  )

  return {
    ...sessionState,
    roles,
    rolesLoading,
    rolesError,
    accessLoading: sessionState.loading || rolesLoading,
    isInternalOperator,
    isSuperAdmin: roles.includes("super_admin"),
  }
}
