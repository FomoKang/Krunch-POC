"use client"

import type { User } from "@supabase/supabase-js"
import { useCallback, useEffect, useState } from "react"
import {
  getUserItemActivity,
  recordViewedItem,
  upsertAuctionParticipation,
  type AuctionParticipationRecord,
  type AuctionParticipationStatus,
  type OwnedItemRecord,
  type UserItemActivity,
  type ViewedItemRecord,
} from "@/lib/supabase/item-activity"

const VIEWED_LIMIT = 5

function getActivityStorageKey(userId: string) {
  return `krunch:item-activity:${userId}`
}

function emptyActivity(): UserItemActivity {
  return {
    participations: [],
    ownedItems: [],
    viewedItems: [],
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isParticipationRecord(value: unknown): value is AuctionParticipationRecord {
  return isObject(value) && typeof value.item_id === "string" && typeof value.user_id === "string"
}

function isOwnedItemRecord(value: unknown): value is OwnedItemRecord {
  return isObject(value) && typeof value.item_id === "string" && typeof value.user_id === "string"
}

function isViewedItemRecord(value: unknown): value is ViewedItemRecord {
  return isObject(value) && typeof value.item_id === "string" && typeof value.user_id === "string"
}

function readStoredActivity(userId: string): UserItemActivity {
  if (typeof window === "undefined") {
    return emptyActivity()
  }

  try {
    const raw = window.localStorage.getItem(getActivityStorageKey(userId))
    const parsed = raw ? JSON.parse(raw) : null

    return {
      participations: Array.isArray(parsed?.participations)
        ? parsed.participations.filter(isParticipationRecord)
        : [],
      ownedItems: Array.isArray(parsed?.ownedItems)
        ? parsed.ownedItems.filter(isOwnedItemRecord)
        : [],
      viewedItems: Array.isArray(parsed?.viewedItems)
        ? parsed.viewedItems.filter(isViewedItemRecord).slice(0, VIEWED_LIMIT)
        : [],
    }
  } catch {
    return emptyActivity()
  }
}

function writeStoredActivity(userId: string, activity: UserItemActivity) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(getActivityStorageKey(userId), JSON.stringify(activity))
}

function localId(prefix: string, itemId: string) {
  return `${prefix}-${itemId}`
}

function upsertViewedRecord(records: ViewedItemRecord[], userId: string, itemId: string) {
  const existing = records.find((record) => record.item_id === itemId)
  const nextRecord: ViewedItemRecord = {
    id: existing?.id ?? localId("local-viewed", itemId),
    user_id: userId,
    item_id: itemId,
    viewed_at: new Date().toISOString(),
  }

  return [nextRecord, ...records.filter((record) => record.item_id !== itemId)].slice(0, VIEWED_LIMIT)
}

function upsertParticipationRecord({
  records,
  userId,
  itemId,
  status,
  currentBid,
}: {
  records: AuctionParticipationRecord[]
  userId: string
  itemId: string
  status: AuctionParticipationStatus
  currentBid?: number | null
}) {
  const existing = records.find((record) => record.item_id === itemId)
  const nextRecord: AuctionParticipationRecord = {
    id: existing?.id ?? localId("local-participation", itemId),
    user_id: userId,
    item_id: itemId,
    status,
    current_bid: currentBid ?? existing?.current_bid ?? null,
    created_at: new Date().toISOString(),
  }

  return [nextRecord, ...records.filter((record) => record.item_id !== itemId)]
}

export function useUserItemActivity(user: User | null) {
  const [participations, setParticipations] = useState<AuctionParticipationRecord[]>([])
  const [ownedItems, setOwnedItems] = useState<OwnedItemRecord[]>([])
  const [viewedItems, setViewedItems] = useState<ViewedItemRecord[]>([])
  const [loading, setLoading] = useState(Boolean(user))
  const [error, setError] = useState<string | null>(null)
  const [usingLocalFallback, setUsingLocalFallback] = useState(false)

  const refreshActivity = useCallback(async () => {
    if (!user) {
      setParticipations([])
      setOwnedItems([])
      setViewedItems([])
      setLoading(false)
      setError(null)
      setUsingLocalFallback(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const remoteActivity = await getUserItemActivity(user.id)
      setParticipations(remoteActivity.participations)
      setOwnedItems(remoteActivity.ownedItems)
      setViewedItems(remoteActivity.viewedItems)
      setUsingLocalFallback(false)
      writeStoredActivity(user.id, remoteActivity)
    } catch (activityError) {
      const localActivity = readStoredActivity(user.id)
      setParticipations(localActivity.participations)
      setOwnedItems(localActivity.ownedItems)
      setViewedItems(localActivity.viewedItems)
      setUsingLocalFallback(true)
      setError(activityError instanceof Error ? activityError.message : "Failed to load item activity.")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void refreshActivity()
  }, [refreshActivity])

  const recordViewed = useCallback(
    async (itemId: string) => {
      if (!user) {
        return false
      }

      const nextViewedItems = upsertViewedRecord(viewedItems, user.id, itemId)
      setViewedItems(nextViewedItems)
      writeStoredActivity(user.id, {
        participations,
        ownedItems,
        viewedItems: nextViewedItems,
      })

      if (usingLocalFallback) {
        return true
      }

      try {
        await recordViewedItem(user.id, itemId)
        setError(null)
      } catch (activityError) {
        setUsingLocalFallback(true)
        setError(activityError instanceof Error ? activityError.message : "Failed to save viewed item.")
      }

      return true
    },
    [ownedItems, participations, user, usingLocalFallback, viewedItems],
  )

  const watchAuction = useCallback(
    async (itemId: string, currentBid?: number | null) => {
      if (!user) {
        return false
      }

      const nextParticipations = upsertParticipationRecord({
        records: participations,
        userId: user.id,
        itemId,
        status: "watching",
        currentBid,
      })

      setParticipations(nextParticipations)
      writeStoredActivity(user.id, {
        participations: nextParticipations,
        ownedItems,
        viewedItems,
      })

      if (usingLocalFallback) {
        return true
      }

      try {
        const savedParticipation = await upsertAuctionParticipation({
          userId: user.id,
          itemId,
          status: "watching",
          currentBid,
        })
        const savedParticipations = [
          savedParticipation,
          ...nextParticipations.filter((record) => record.item_id !== savedParticipation.item_id),
        ]
        setParticipations(savedParticipations)
        writeStoredActivity(user.id, {
          participations: savedParticipations,
          ownedItems,
          viewedItems,
        })
        setError(null)
      } catch (activityError) {
        setUsingLocalFallback(true)
        setError(activityError instanceof Error ? activityError.message : "Failed to save auction activity.")
      }

      return true
    },
    [ownedItems, participations, user, usingLocalFallback, viewedItems],
  )

  return {
    error,
    loading,
    ownedItems,
    participations,
    recordViewed,
    refreshActivity,
    usingLocalFallback,
    viewedItems,
    watchAuction,
  }
}
