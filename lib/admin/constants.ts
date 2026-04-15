export const USAGE_TIER_OPTIONS = ["BLACK", "PINK"] as const

export const ARTIFACT_STATUS_OPTIONS = [
  "archived",
  "in_storage",
  "on_auction",
  "sold",
  "retired",
  "disputed",
] as const

export const PUBLIC_VISIBILITY_OPTIONS = [
  "public",
  "collector_only",
  "internal_only",
] as const

export const EVENT_TYPE_OPTIONS = [
  "created",
  "fitted",
  "stage_used",
  "broadcast_used",
  "tour_used",
  "photographed",
  "authenticated",
  "transferred",
  "auctioned",
  "exhibited",
] as const

export const SOURCE_CONFIDENCE_OPTIONS = [
  "confirmed",
  "probable",
  "internal_only",
] as const

export const AUTH_METHOD_OPTIONS = [
  "dna",
  "ucnp",
  "nfc",
  "visual",
  "document",
  "stylist_confirmation",
  "agency_confirmation",
  "external_expert",
] as const

export const AUTH_RESULT_OPTIONS = [
  "verified",
  "partially_verified",
  "inconclusive",
  "failed",
] as const

export const AUCTION_TYPE_OPTIONS = [
  "premium",
  "hybrid",
  "private",
  "charity",
] as const

export const AUCTION_STATUS_OPTIONS = [
  "draft",
  "scheduled",
  "live",
  "closed",
  "cancelled",
  "settled",
] as const

export const AUCTION_ACTIVE_STATUS_OPTIONS = [
  "draft",
  "scheduled",
  "live",
] as const

export const SETTLEMENT_STATUS_OPTIONS = [
  "pending",
  "completed",
  "failed",
  "refunded",
] as const

export const GUARANTEE_TYPE_OPTIONS = [
  "none",
  "house",
  "third_party",
] as const

export const MEDIA_ASSET_TYPE_OPTIONS = [
  "photo",
  "video",
  "backstage",
  "fitting",
  "invoice",
  "sketch",
  "coa_scan",
] as const

export const DISCLOSURE_FIELD_OPTIONS = [
  "stylist",
  "production_house",
  "source_path",
  "event_detail",
] as const

export const DISCLOSURE_REASON_OPTIONS = [
  "privacy",
  "contractual",
  "risk_management",
  "reuse_sensitive",
] as const

export const STORAGE_BUCKET_FALLBACK = "media-assets"

export type UsageTier = (typeof USAGE_TIER_OPTIONS)[number]
export type ArtifactStatus = (typeof ARTIFACT_STATUS_OPTIONS)[number]
export type PublicVisibility = (typeof PUBLIC_VISIBILITY_OPTIONS)[number]
export type EventType = (typeof EVENT_TYPE_OPTIONS)[number]
export type SourceConfidence = (typeof SOURCE_CONFIDENCE_OPTIONS)[number]
export type AuthMethod = (typeof AUTH_METHOD_OPTIONS)[number]
export type AuthResult = (typeof AUTH_RESULT_OPTIONS)[number]
export type AuctionType = (typeof AUCTION_TYPE_OPTIONS)[number]
export type AuctionStatus = (typeof AUCTION_STATUS_OPTIONS)[number]
export type SettlementStatus = (typeof SETTLEMENT_STATUS_OPTIONS)[number]
export type GuaranteeType = (typeof GUARANTEE_TYPE_OPTIONS)[number]
export type MediaAssetType = (typeof MEDIA_ASSET_TYPE_OPTIONS)[number]
export type DisclosureField = (typeof DISCLOSURE_FIELD_OPTIONS)[number]
export type DisclosureReason = (typeof DISCLOSURE_REASON_OPTIONS)[number]
