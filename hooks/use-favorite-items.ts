"use client"

import type { User } from "@supabase/supabase-js"
import { useCallback, useEffect, useMemo, useState } from "react"
import { addFavoriteItem, getFavoriteItemIds, removeFavoriteItem } from "@/lib/supabase/favorites"

const GUEST_FAVORITES_KEY = "krunch:favorites:guest"

function getUserFavoritesKey(userId: string) {
  return `krunch:favorites:${userId}`
}

function readStoredFavorites(key: string) {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const raw = window.localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []
  } catch {
    return []
  }
}

function writeStoredFavorites(key: string, itemIds: string[]) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(itemIds))
}

function uniqueFavorites(itemIds: string[]) {
  return Array.from(new Set(itemIds))
}

export function useFavoriteItems(user: User | null) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [loading, setLoading] = useState(Boolean(user))
  const [error, setError] = useState<string | null>(null)
  const [usingLocalFallback, setUsingLocalFallback] = useState(false)

  const storageKey = useMemo(() => (user ? getUserFavoritesKey(user.id) : GUEST_FAVORITES_KEY), [user])

  useEffect(() => {
    let active = true

    async function loadFavorites() {
      if (!user) {
        setFavoriteIds(readStoredFavorites(GUEST_FAVORITES_KEY))
        setLoading(false)
        setError(null)
        setUsingLocalFallback(true)
        return
      }

      try {
        setLoading(true)
        setError(null)
        setUsingLocalFallback(false)

        const guestFavorites = readStoredFavorites(GUEST_FAVORITES_KEY)
        const remoteFavorites = await getFavoriteItemIds(user.id)
        const mergedFavorites = uniqueFavorites([...remoteFavorites, ...guestFavorites])

        if (guestFavorites.length > 0) {
          await Promise.all(guestFavorites.map((itemId) => addFavoriteItem(user.id, itemId)))
          writeStoredFavorites(GUEST_FAVORITES_KEY, [])
        }

        if (!active) {
          return
        }

        setFavoriteIds(mergedFavorites)
        writeStoredFavorites(getUserFavoritesKey(user.id), mergedFavorites)
      } catch (favoriteError) {
        if (!active) {
          return
        }

        const localFavorites = uniqueFavorites([
          ...readStoredFavorites(getUserFavoritesKey(user.id)),
          ...readStoredFavorites(GUEST_FAVORITES_KEY),
        ])
        setFavoriteIds(localFavorites)
        writeStoredFavorites(getUserFavoritesKey(user.id), localFavorites)
        setError(favoriteError instanceof Error ? favoriteError.message : "Failed to load favorite items.")
        setUsingLocalFallback(true)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadFavorites()

    return () => {
      active = false
    }
  }, [user])

  const toggleFavorite = useCallback(
    async (itemId: string) => {
      const wasFavorite = favoriteIds.includes(itemId)
      const nextFavorites = wasFavorite ? favoriteIds.filter((id) => id !== itemId) : [itemId, ...favoriteIds]

      setFavoriteIds(nextFavorites)
      writeStoredFavorites(storageKey, nextFavorites)

      if (!user || usingLocalFallback) {
        return
      }

      try {
        if (wasFavorite) {
          await removeFavoriteItem(user.id, itemId)
        } else {
          await addFavoriteItem(user.id, itemId)
        }
        setError(null)
      } catch (favoriteError) {
        setFavoriteIds(favoriteIds)
        writeStoredFavorites(storageKey, favoriteIds)
        setError(favoriteError instanceof Error ? favoriteError.message : "Failed to update favorite item.")
      }
    },
    [favoriteIds, storageKey, user, usingLocalFallback],
  )

  return {
    error,
    favoriteIds,
    isFavorite: useCallback((itemId: string) => favoriteIds.includes(itemId), [favoriteIds]),
    loading,
    toggleFavorite,
    usingLocalFallback,
  }
}
