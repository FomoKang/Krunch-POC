import type { PostgrestError } from "@supabase/supabase-js"
import {
  AUCTION_ACTIVE_STATUS_OPTIONS,
  BROKERAGE_FEE_POLICY_OPTIONS,
  CARRIER_PREFERENCE_OPTIONS,
  CUSTOMS_RISK_TIER_OPTIONS,
  DDP_MODE_OPTIONS,
  INTERNATIONAL_SALE_STATUS_OPTIONS,
  PACKAGE_TYPE_OPTIONS,
  type ArtifactStatus,
  type AuthMethod,
  type AuthResult,
  type AuctionBidSource,
  type AuctionOutcomeStatus,
  type AuctionStatus,
  type AuctionType,
  type BrokerageFeePolicy,
  type CarrierPreference,
  type CustomsInfoStatus,
  type CustomsRiskTier,
  type DdpMode,
  type DisclosureField,
  type DisclosureReason,
  type EventType,
  type GuaranteeType,
  type InternationalSaleStatus,
  type MediaAssetType,
  type PackageType,
  type PublicVisibility,
  type SettlementStatus,
  type ShippingInfoStatus,
  type SourceConfidence,
  type UsageTier,
} from "@/lib/admin/constants"
import {
  artifactDisplayName,
  buildStoragePath,
  getMediaBucketName,
  hashFile,
  normalizeOptionalNumber,
  normalizeOptionalString,
} from "@/lib/admin/utils"
import {
  canDeleteDemoAuction,
  isAuctionVisibleOnStorefront,
  isDeletedAuction,
  sortAuctionsForStorefront,
} from "@/lib/auction-storefront"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const ARTIFACT_COLUMNS = [
  "id",
  "artifact_code",
  "artifact_title",
  "artifact_type",
  "artist_name",
  "group_name",
  "agency_name",
  "era_name",
  "estimated_year",
  "first_documented_usage",
  "usage_tier",
  "is_custom_made",
  "is_stage_used",
  "is_screen_used",
  "material_summary",
  "size_info",
  "colorway",
  "current_status",
  "current_holder",
  "storage_location",
  "public_visibility",
  "internal_notes",
  "created_at",
  "updated_at",
].join(", ")

const EVENT_COLUMNS = [
  "id",
  "artifact_id",
  "artifact_code",
  "event_type",
  "event_title",
  "event_date_start",
  "event_date_end",
  "event_location",
  "artist_name",
  "stylist_name",
  "production_entity",
  "source_confidence",
  "evidence_summary",
  "media_link",
  "visibility_level",
  "internal_notes",
  "created_at",
  "updated_at",
].join(", ")

const AUTH_COLUMNS = [
  "id",
  "artifact_id",
  "artifact_code",
  "auth_method",
  "auth_result",
  "auth_date",
  "auth_provider",
  "forensic_ref",
  "certificate_code",
  "expiry_date",
  "visibility_level",
  "notes",
  "created_at",
  "updated_at",
].join(", ")

const AUCTION_COLUMNS = [
  "auction_id",
  "artifact_id",
  "auction_title",
  "auction_type",
  "auction_status",
  "lot_number",
  "estimate_low",
  "estimate_high",
  "reserve_price",
  "opening_bid",
  "minimum_increment",
  "buy_now_price",
  "hammer_price",
  "final_price",
  "currency",
  "buyer_premium_rate",
  "seller_fee_rate",
  "auction_start_time",
  "auction_end_time",
  "settlement_status",
  "closing_reason",
  "guarantee_type",
  "guarantee_amount",
  "winner_bidder_id",
  "winner_bid_id",
  "extension_rule_enabled",
  "extension_seconds",
  "demo_mode",
  "storefront_visible",
  "deleted_at",
  "created_at",
  "updated_at",
].join(", ")

const AUCTION_BID_COLUMNS = [
  "bid_id",
  "auction_id",
  "bidder_user_id",
  "bidder_display_name",
  "bid_amount",
  "bid_source",
  "is_demo",
  "created_at",
  "is_valid",
  "is_winning_bid",
].join(", ")

const AUCTION_OUTCOME_COLUMNS = [
  "outcome_id",
  "auction_id",
  "winner_user_id",
  "winner_display_name",
  "winning_bid_id",
  "outcome_status",
  "payment_due_at",
  "paid_at",
  "reassigned_from_bid_id",
  "is_demo",
  "created_at",
  "updated_at",
].join(", ")

const MEDIA_COLUMNS = [
  "artifact_id",
  "provenance_event_id",
  "asset_type",
  "caption",
  "source",
  "copyright_status",
  "visibility_level",
  "taken_at",
  "file_url",
  "thumbnail_url",
  "file_type",
  "file_hash",
  "uploaded_at",
].join(", ")

const DISCLOSURE_COLUMNS = [
  "artifact_id",
  "field_name",
  "field_value_reference",
  "visibility_level",
  "reason_code",
  "approved_by",
  "expires_at",
  "created_at",
  "updated_at",
].join(", ")

const SHIPPING_PROFILE_COLUMNS = [
  "shipping_profile_code",
  "shipping_profile_name",
  "estimated_package_weight_grams",
  "estimated_package_length_cm",
  "estimated_package_width_cm",
  "estimated_package_height_cm",
  "package_type",
  "carrier_preference",
  "ddp_supported",
  "insurance_required",
  "special_handling_required",
  "is_active",
  "created_at",
  "updated_at",
].join(", ")

const SHIPPING_INFO_COLUMNS = [
  "artifact_id",
  "shipping_info_status",
  "international_sale_status",
  "manual_review_required",
  "shipping_profile_code",
  "shipping_profile_name",
  "estimated_package_weight_grams",
  "estimated_package_length_cm",
  "estimated_package_width_cm",
  "estimated_package_height_cm",
  "package_type",
  "carrier_preference",
  "ddp_supported",
  "insurance_required",
  "special_handling_required",
  "allowed_destination_countries",
  "restricted_destination_countries",
  "restricted_reason",
  "brokerage_fee_policy",
  "ddp_mode",
  "customs_risk_tier",
  "created_at",
  "updated_at",
].join(", ")

const CUSTOMS_INFO_COLUMNS = [
  "artifact_id",
  "customs_info_status",
  "customs_product_name_en",
  "customs_product_type",
  "hs_code_global_6",
  "hs_code_local",
  "country_of_origin",
  "commercial_invoice_description",
  "material_composition",
  "contains_battery",
  "contains_electronics",
  "contains_leather",
  "contains_fur",
  "preferential_origin_eligible",
  "declared_value_override",
  "declared_currency",
  "customs_notes_internal",
  "created_at",
  "updated_at",
].join(", ")

export type ArtifactRecord = {
  id: string
  artifact_code: string
  artifact_title: string
  artifact_type: string | null
  artist_name: string | null
  group_name: string | null
  agency_name: string | null
  era_name: string | null
  estimated_year: number | null
  first_documented_usage: string | null
  usage_tier: UsageTier | null
  is_custom_made: boolean | null
  is_stage_used: boolean | null
  is_screen_used: boolean | null
  material_summary: string | null
  size_info: string | null
  colorway: string | null
  current_status: ArtifactStatus | null
  current_holder: string | null
  storage_location: string | null
  public_visibility: PublicVisibility | null
  internal_notes: string | null
  created_at: string | null
  updated_at: string | null
}

export type ArtifactOption = Pick<
  ArtifactRecord,
  "id" | "artifact_code" | "artifact_title" | "artist_name" | "current_status"
>

export type ProvenanceEventRecord = {
  id: string
  artifact_id: string
  artifact_code: string | null
  event_type: EventType | null
  event_title: string
  event_date_start: string | null
  event_date_end: string | null
  event_location: string | null
  artist_name: string | null
  stylist_name: string | null
  production_entity: string | null
  source_confidence: SourceConfidence | null
  evidence_summary: string | null
  media_link: string | null
  visibility_level: PublicVisibility | null
  internal_notes: string | null
  created_at: string | null
  updated_at: string | null
}

export type AuthenticationRecord = {
  id: string
  artifact_id: string
  artifact_code: string | null
  auth_method: AuthMethod | null
  auth_result: AuthResult | null
  auth_date: string | null
  auth_provider: string | null
  forensic_ref: string | null
  certificate_code: string | null
  expiry_date: string | null
  visibility_level: PublicVisibility | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
}

export type AuctionRecord = {
  auction_id: string
  artifact_id: string
  auction_title: string
  auction_type: AuctionType | null
  auction_status: AuctionStatus | null
  lot_number: string | null
  estimate_low: number | null
  estimate_high: number | null
  reserve_price: number | null
  opening_bid: number | null
  minimum_increment: number | null
  buy_now_price: number | null
  hammer_price: number | null
  final_price: number | null
  currency: string | null
  buyer_premium_rate: string | null
  seller_fee_rate: string | null
  auction_start_time: string | null
  auction_end_time: string | null
  settlement_status: SettlementStatus | null
  closing_reason: string | null
  guarantee_type: GuaranteeType | null
  guarantee_amount: number | null
  winner_bidder_id: string | null
  winner_bid_id: string | null
  extension_rule_enabled: boolean | null
  extension_seconds: number | null
  demo_mode: boolean | null
  storefront_visible?: boolean | null
  deleted_at?: string | null
  created_at: string | null
  updated_at: string | null
}

export type AuctionBidRecord = {
  bid_id: string
  auction_id: string
  bidder_user_id: string | null
  bidder_display_name: string
  bid_amount: number
  bid_source: AuctionBidSource
  is_demo: boolean
  created_at: string
  is_valid: boolean
  is_winning_bid: boolean
}

export type AuctionOutcomeRecord = {
  outcome_id: string
  auction_id: string
  winner_user_id: string | null
  winner_display_name: string | null
  winning_bid_id: string | null
  outcome_status: AuctionOutcomeStatus
  payment_due_at: string | null
  paid_at: string | null
  reassigned_from_bid_id: string | null
  is_demo: boolean
  created_at: string
  updated_at: string
}

export type AuctionShowcaseRecord = {
  auction: AuctionRecord
  artifact: Pick<ArtifactRecord, "id" | "artifact_code" | "artifact_title" | "artist_name" | "group_name" | "era_name" | "public_visibility">
  media: MediaAssetRecord | null
  bids: AuctionBidRecord[]
  outcome: AuctionOutcomeRecord | null
  currentHighestBid: number
  minimumNextBid: number
}

export type AuctionHomeHighlightRecord = {
  auction: AuctionRecord
  artifact: Pick<ArtifactRecord, "id" | "artifact_code" | "artifact_title" | "artist_name" | "group_name" | "era_name" | "public_visibility">
  media: MediaAssetRecord | null
  currentHighestBid: number
}

export type MediaAssetRecord = {
  artifact_id: string
  provenance_event_id: string | null
  asset_type: MediaAssetType | null
  caption: string | null
  source: string | null
  copyright_status: string | null
  visibility_level: PublicVisibility | null
  taken_at: string | null
  file_url: string
  thumbnail_url: string | null
  file_type: string | null
  file_hash: string | null
  uploaded_at: string | null
}

export type DisclosureControlRecord = {
  artifact_id: string
  field_name: DisclosureField
  field_value_reference: string
  visibility_level: PublicVisibility | null
  reason_code: DisclosureReason | null
  approved_by: string | null
  expires_at: string | null
  created_at: string | null
  updated_at: string | null
}

export type ProductShippingProfileRecord = {
  shipping_profile_code: string
  shipping_profile_name: string
  estimated_package_weight_grams: number | null
  estimated_package_length_cm: number | null
  estimated_package_width_cm: number | null
  estimated_package_height_cm: number | null
  package_type: PackageType | null
  carrier_preference: CarrierPreference | null
  ddp_supported: boolean
  insurance_required: boolean
  special_handling_required: boolean
  is_active: boolean
  created_at: string | null
  updated_at: string | null
}

export type ProductShippingInfoRecord = {
  artifact_id: string
  shipping_info_status: ShippingInfoStatus
  international_sale_status: InternationalSaleStatus
  manual_review_required: boolean
  shipping_profile_code: string | null
  shipping_profile_name: string | null
  estimated_package_weight_grams: number | null
  estimated_package_length_cm: number | null
  estimated_package_width_cm: number | null
  estimated_package_height_cm: number | null
  package_type: PackageType | null
  carrier_preference: CarrierPreference | null
  ddp_supported: boolean
  insurance_required: boolean
  special_handling_required: boolean
  allowed_destination_countries: string[] | null
  restricted_destination_countries: string[] | null
  restricted_reason: string | null
  brokerage_fee_policy: BrokerageFeePolicy | null
  ddp_mode: DdpMode | null
  customs_risk_tier: CustomsRiskTier | null
  created_at: string | null
  updated_at: string | null
}

export type ProductCustomsInfoRecord = {
  artifact_id: string
  customs_info_status: CustomsInfoStatus
  customs_product_name_en: string | null
  customs_product_type: string | null
  hs_code_global_6: string | null
  hs_code_local: string | null
  country_of_origin: string | null
  commercial_invoice_description: string | null
  material_composition: string | null
  contains_battery: boolean
  contains_electronics: boolean
  contains_leather: boolean
  contains_fur: boolean
  preferential_origin_eligible: boolean
  declared_value_override: number | null
  declared_currency: string | null
  customs_notes_internal: string | null
  created_at: string | null
  updated_at: string | null
}

export type InternationalReadiness = {
  shippingStatus: ShippingInfoStatus
  customsStatus: CustomsInfoStatus
  shippingReady: boolean
  customsReady: boolean
  internationalReady: boolean
  missingFields: string[]
}

export type ProductLogisticsRecord = {
  shipping: ProductShippingInfoRecord | null
  customs: ProductCustomsInfoRecord | null
  profile: ProductShippingProfileRecord | null
  readiness: InternationalReadiness
}

export type RecentActivityItem = {
  id: string
  type: string
  title: string
  subtitle: string
  timestamp: string | null
  href: string
}

type ArtifactFilters = {
  search?: string
  status?: string
  usageTier?: string
  limit?: number
}

type EventFilters = {
  artifactId?: string
  limit?: number
}

type AuthenticationFilters = {
  artifactId?: string
  limit?: number
}

type AuctionFilters = {
  artifactId?: string
  status?: string
  limit?: number
}

type AuctionBidFilters = {
  auctionId?: string
  limit?: number
}

export type AuctionSimulationAction =
  | "simulate_bid"
  | "simulate_last_minute_bid"
  | "simulate_extension"
  | "end_auction_now"
  | "mark_payment_pending"
  | "mark_payment_failed"
  | "reassign_to_underbidder"

type MediaFilters = {
  artifactId?: string
  provenanceEventId?: string
  limit?: number
}

type DisclosureFilters = {
  artifactId?: string
}

type DisclosureLookup = Pick<
  DisclosureControlRecord,
  "artifact_id" | "field_name" | "field_value_reference"
>

type CountResult = {
  totalArtifacts: number
  totalActiveAuctions: number
  totalAuthentications: number
  totalMediaAssets: number
}

function castRows<T>(data: unknown): T[] {
  return (data ?? []) as unknown as T[]
}

function castRow<T>(data: unknown): T {
  return data as unknown as T
}

function castMaybeRow<T>(data: unknown): T | null {
  return data as unknown as T | null
}

export function calculateAuctionBuyNowPrice(
  auctionType: AuctionType | null | undefined,
  openingBid: number | null | undefined,
) {
  if (auctionType !== "hybrid" || openingBid === null || openingBid === undefined || Number.isNaN(openingBid)) {
    return null
  }

  return Math.round(openingBid * 1.5)
}

export function getAuctionCurrentHighestBid(
  auction: Pick<AuctionRecord, "opening_bid">,
  bids: AuctionBidRecord[],
) {
  if (!bids.length) {
    return auction.opening_bid ?? 0
  }

  return bids.reduce((highest, bid) => (bid.bid_amount > highest ? bid.bid_amount : highest), 0)
}

export function getAuctionMinimumNextBid(
  auction: Pick<AuctionRecord, "opening_bid" | "minimum_increment">,
  bids: AuctionBidRecord[],
) {
  const currentHighestBid = getAuctionCurrentHighestBid(auction, bids)

  if (!bids.length) {
    return auction.opening_bid ?? 0
  }

  return currentHighestBid + (auction.minimum_increment ?? 0)
}

function getAdminErrorMessage(tableName: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown Supabase error."

  if (message.includes("Could not find the table") || message.includes("relation")) {
    return `The ${tableName} table is missing in Supabase.`
  }

  if (message.includes("duplicate key value") && tableName === "provenance_artifacts") {
    return "artifact_code must be unique."
  }

  if (message.includes("violates foreign key constraint") && tableName === "provenance_artifacts") {
    return "This artifact still has linked records. Remove linked events, authentications, auctions, media, disclosure rules, or transactions first."
  }

  return message
}

function wrapError(tableName: string, error: PostgrestError | Error) {
  return new Error(getAdminErrorMessage(tableName, error))
}

function hasTextValue(value: string | null | undefined) {
  return Boolean(value?.trim())
}

function isMissingRelationError(error: PostgrestError | Error) {
  const message = error.message.toLowerCase()

  return (
    message.includes("could not find the table") ||
    message.includes("schema cache") ||
    message.includes("does not exist")
  )
}

function normalizeCountryCodes(codes: string[] | null | undefined) {
  return Array.from(
    new Set(
      (codes ?? [])
        .map((code) => code.trim().toUpperCase())
        .filter(Boolean),
    ),
  )
}

function isKnownOption<T extends string>(value: string | null | undefined, options: readonly T[]): value is T {
  return Boolean(value && options.includes(value as T))
}

function defaultShippingInfo(artifactId: string): ProductShippingInfoRecord {
  return {
    artifact_id: artifactId,
    shipping_info_status: "empty",
    international_sale_status: "draft",
    manual_review_required: false,
    shipping_profile_code: null,
    shipping_profile_name: null,
    estimated_package_weight_grams: null,
    estimated_package_length_cm: null,
    estimated_package_width_cm: null,
    estimated_package_height_cm: null,
    package_type: null,
    carrier_preference: null,
    ddp_supported: false,
    insurance_required: false,
    special_handling_required: false,
    allowed_destination_countries: [],
    restricted_destination_countries: [],
    restricted_reason: null,
    brokerage_fee_policy: null,
    ddp_mode: null,
    customs_risk_tier: null,
    created_at: null,
    updated_at: null,
  }
}

function defaultCustomsInfo(artifactId: string): ProductCustomsInfoRecord {
  return {
    artifact_id: artifactId,
    customs_info_status: "empty",
    customs_product_name_en: null,
    customs_product_type: null,
    hs_code_global_6: null,
    hs_code_local: null,
    country_of_origin: null,
    commercial_invoice_description: null,
    material_composition: null,
    contains_battery: false,
    contains_electronics: false,
    contains_leather: false,
    contains_fur: false,
    preferential_origin_eligible: false,
    declared_value_override: null,
    declared_currency: null,
    customs_notes_internal: null,
    created_at: null,
    updated_at: null,
  }
}

function hasShippingData(
  shipping: Partial<ProductShippingInfoRecord> | null | undefined,
  profile?: ProductShippingProfileRecord | null,
) {
  return Boolean(
    hasTextValue(shipping?.shipping_profile_code) ||
      hasTextValue(shipping?.shipping_profile_name) ||
      hasTextValue(shipping?.package_type) ||
      hasTextValue(shipping?.carrier_preference) ||
      shipping?.estimated_package_weight_grams !== null && shipping?.estimated_package_weight_grams !== undefined ||
      shipping?.estimated_package_length_cm !== null && shipping?.estimated_package_length_cm !== undefined ||
      shipping?.estimated_package_width_cm !== null && shipping?.estimated_package_width_cm !== undefined ||
      shipping?.estimated_package_height_cm !== null && shipping?.estimated_package_height_cm !== undefined ||
      shipping?.ddp_supported ||
      shipping?.insurance_required ||
      shipping?.special_handling_required ||
      Boolean(shipping?.allowed_destination_countries?.length) ||
      Boolean(shipping?.restricted_destination_countries?.length) ||
      hasTextValue(shipping?.restricted_reason) ||
      hasTextValue(shipping?.brokerage_fee_policy) ||
      hasTextValue(shipping?.ddp_mode) ||
      hasTextValue(shipping?.customs_risk_tier) ||
      profile
  )
}

function hasCustomsData(customs: Partial<ProductCustomsInfoRecord> | null | undefined) {
  return Boolean(
    hasTextValue(customs?.customs_product_name_en) ||
      hasTextValue(customs?.customs_product_type) ||
      hasTextValue(customs?.hs_code_global_6) ||
      hasTextValue(customs?.hs_code_local) ||
      hasTextValue(customs?.country_of_origin) ||
      hasTextValue(customs?.commercial_invoice_description) ||
      hasTextValue(customs?.material_composition) ||
      customs?.contains_battery ||
      customs?.contains_electronics ||
      customs?.contains_leather ||
      customs?.contains_fur ||
      customs?.preferential_origin_eligible ||
      customs?.declared_value_override !== null && customs?.declared_value_override !== undefined ||
      hasTextValue(customs?.declared_currency) ||
      hasTextValue(customs?.customs_notes_internal)
  )
}

export function isShippingReady(
  shipping: Partial<ProductShippingInfoRecord> | null | undefined,
  profile?: ProductShippingProfileRecord | null,
) {
  const hasProfileOrPackage = hasTextValue(shipping?.shipping_profile_code) || hasTextValue(shipping?.package_type) || Boolean(profile?.package_type)
  const hasWeight =
    shipping?.estimated_package_weight_grams !== null && shipping?.estimated_package_weight_grams !== undefined
      ? shipping.estimated_package_weight_grams > 0
      : Boolean(profile?.estimated_package_weight_grams && profile.estimated_package_weight_grams > 0)
  const hasDdpMode = hasTextValue(shipping?.ddp_mode)

  return hasProfileOrPackage && hasWeight && hasDdpMode
}

export function isCustomsReady(customs: Partial<ProductCustomsInfoRecord> | null | undefined) {
  return Boolean(
    hasTextValue(customs?.customs_product_name_en) &&
      (hasTextValue(customs?.hs_code_global_6) || hasTextValue(customs?.hs_code_local)) &&
      hasTextValue(customs?.country_of_origin),
  )
}

export function computeShippingInfoStatus(
  shipping: Partial<ProductShippingInfoRecord> | null | undefined,
  profile?: ProductShippingProfileRecord | null,
): ShippingInfoStatus {
  if (!hasShippingData(shipping, profile)) {
    return "empty"
  }

  return isShippingReady(shipping, profile) ? "complete" : "partial"
}

export function computeCustomsInfoStatus(
  customs: Partial<ProductCustomsInfoRecord> | null | undefined,
): CustomsInfoStatus {
  if (!hasCustomsData(customs)) {
    return "empty"
  }

  return isCustomsReady(customs) ? "complete" : "partial"
}

export function getInternationalReadiness(
  shipping: Partial<ProductShippingInfoRecord> | null | undefined,
  customs: Partial<ProductCustomsInfoRecord> | null | undefined,
  profile?: ProductShippingProfileRecord | null,
): InternationalReadiness {
  const missingFields: string[] = []
  const shippingReady = isShippingReady(shipping, profile)
  const customsReady = isCustomsReady(customs)

  if (!hasTextValue(customs?.customs_product_name_en)) {
    missingFields.push("Customs product name (EN)")
  }

  if (!hasTextValue(customs?.hs_code_global_6) && !hasTextValue(customs?.hs_code_local)) {
    missingFields.push("HS code")
  }

  if (!hasTextValue(customs?.country_of_origin)) {
    missingFields.push("Country of origin")
  }

  if (!hasTextValue(shipping?.shipping_profile_code) && !hasTextValue(shipping?.package_type) && !profile?.package_type) {
    missingFields.push("Shipping profile or package type")
  }

  const hasWeight =
    shipping?.estimated_package_weight_grams !== null && shipping?.estimated_package_weight_grams !== undefined
      ? shipping.estimated_package_weight_grams > 0
      : Boolean(profile?.estimated_package_weight_grams && profile.estimated_package_weight_grams > 0)

  if (!hasWeight) {
    missingFields.push("Estimated package weight")
  }

  if (!hasTextValue(shipping?.ddp_mode)) {
    missingFields.push("DDP mode")
  }

  if (shipping?.manual_review_required) {
    missingFields.push("Manual review clearance")
  }

  const shippingStatus = computeShippingInfoStatus(shipping, profile)
  const customsStatus = computeCustomsInfoStatus(customs)

  return {
    shippingStatus,
    customsStatus,
    shippingReady,
    customsReady,
    internationalReady: shippingReady && customsReady && !shipping?.manual_review_required,
    missingFields,
  }
}

async function getAuthenticatedUserId() {
  const supabase = getSupabaseBrowserClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  if (!user) {
    throw new Error("Please log in before using the admin dashboard.")
  }

  return user.id
}

async function getArtifactOwnership(artifactId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("provenance_artifacts")
    .select("id, artifact_code, owner_user_id")
    .eq("id", artifactId)
    .single()

  if (error) {
    throw wrapError("provenance_artifacts", error)
  }

  return castRow<{ id: string; artifact_code: string; owner_user_id: string }>(data)
}

async function getShippingProfileByCode(shippingProfileCode: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("product_shipping_profiles")
    .select(SHIPPING_PROFILE_COLUMNS)
    .eq("shipping_profile_code", shippingProfileCode)
    .maybeSingle()

  if (error) {
    throw wrapError("product_shipping_profiles", error)
  }

  return castMaybeRow<ProductShippingProfileRecord>(data)
}

async function getShippingInfoRow(artifactId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("product_shipping_info")
    .select(SHIPPING_INFO_COLUMNS)
    .eq("artifact_id", artifactId)
    .maybeSingle()

  if (error) {
    throw wrapError("product_shipping_info", error)
  }

  return castMaybeRow<ProductShippingInfoRecord>(data)
}

async function getCustomsInfoRow(artifactId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("product_customs_info")
    .select(CUSTOMS_INFO_COLUMNS)
    .eq("artifact_id", artifactId)
    .maybeSingle()

  if (error) {
    throw wrapError("product_customs_info", error)
  }

  return castMaybeRow<ProductCustomsInfoRecord>(data)
}

function buildShippingInfoRecord(
  artifactId: string,
  current: ProductShippingInfoRecord | null,
  payload: Partial<ProductShippingInfoRecord>,
  profile: ProductShippingProfileRecord | null,
): ProductShippingInfoRecord {
  const packageType = normalizeOptionalString(payload.package_type ?? current?.package_type)
  const carrierPreference = normalizeOptionalString(
    payload.carrier_preference ?? current?.carrier_preference,
  )
  const brokerageFeePolicy = normalizeOptionalString(
    payload.brokerage_fee_policy ?? current?.brokerage_fee_policy,
  )
  const ddpMode = normalizeOptionalString(payload.ddp_mode ?? current?.ddp_mode)
  const customsRiskTier = normalizeOptionalString(
    payload.customs_risk_tier ?? current?.customs_risk_tier,
  )
  const internationalSaleStatus = normalizeOptionalString(
    payload.international_sale_status ?? current?.international_sale_status,
  )

  const next = {
    ...defaultShippingInfo(artifactId),
    ...(current ?? {}),
    ...payload,
    artifact_id: artifactId,
    shipping_profile_code: normalizeOptionalString(payload.shipping_profile_code ?? current?.shipping_profile_code),
    shipping_profile_name: normalizeOptionalString(
      payload.shipping_profile_name ?? current?.shipping_profile_name ?? profile?.shipping_profile_name,
    ),
    estimated_package_weight_grams: normalizeOptionalNumber(
      payload.estimated_package_weight_grams ?? current?.estimated_package_weight_grams,
    ),
    estimated_package_length_cm: normalizeOptionalNumber(
      payload.estimated_package_length_cm ?? current?.estimated_package_length_cm,
    ),
    estimated_package_width_cm: normalizeOptionalNumber(
      payload.estimated_package_width_cm ?? current?.estimated_package_width_cm,
    ),
    estimated_package_height_cm: normalizeOptionalNumber(
      payload.estimated_package_height_cm ?? current?.estimated_package_height_cm,
    ),
    package_type: isKnownOption(packageType, PACKAGE_TYPE_OPTIONS) ? packageType : null,
    carrier_preference: isKnownOption(carrierPreference, CARRIER_PREFERENCE_OPTIONS)
      ? carrierPreference
      : null,
    ddp_supported: payload.ddp_supported ?? current?.ddp_supported ?? false,
    insurance_required: payload.insurance_required ?? current?.insurance_required ?? false,
    special_handling_required:
      payload.special_handling_required ?? current?.special_handling_required ?? false,
    allowed_destination_countries: normalizeCountryCodes(
      payload.allowed_destination_countries ?? current?.allowed_destination_countries,
    ),
    restricted_destination_countries: normalizeCountryCodes(
      payload.restricted_destination_countries ?? current?.restricted_destination_countries,
    ),
    restricted_reason: normalizeOptionalString(payload.restricted_reason ?? current?.restricted_reason),
    brokerage_fee_policy: isKnownOption(brokerageFeePolicy, BROKERAGE_FEE_POLICY_OPTIONS)
      ? brokerageFeePolicy
      : null,
    ddp_mode: isKnownOption(ddpMode, DDP_MODE_OPTIONS) ? ddpMode : null,
    customs_risk_tier: isKnownOption(customsRiskTier, CUSTOMS_RISK_TIER_OPTIONS)
      ? customsRiskTier
      : null,
    manual_review_required: payload.manual_review_required ?? current?.manual_review_required ?? false,
    international_sale_status: isKnownOption(
      internationalSaleStatus,
      INTERNATIONAL_SALE_STATUS_OPTIONS,
    )
      ? internationalSaleStatus
      : "draft",
    created_at: current?.created_at ?? null,
    updated_at: new Date().toISOString(),
  } satisfies ProductShippingInfoRecord

  return {
    ...next,
    shipping_info_status: computeShippingInfoStatus(next, profile),
  }
}

function buildCustomsInfoRecord(
  artifactId: string,
  current: ProductCustomsInfoRecord | null,
  payload: Partial<ProductCustomsInfoRecord>,
): ProductCustomsInfoRecord {
  const next = {
    ...defaultCustomsInfo(artifactId),
    ...(current ?? {}),
    ...payload,
    artifact_id: artifactId,
    customs_product_name_en: normalizeOptionalString(
      payload.customs_product_name_en ?? current?.customs_product_name_en,
    ),
    customs_product_type: normalizeOptionalString(payload.customs_product_type ?? current?.customs_product_type),
    hs_code_global_6: normalizeOptionalString(payload.hs_code_global_6 ?? current?.hs_code_global_6),
    hs_code_local: normalizeOptionalString(payload.hs_code_local ?? current?.hs_code_local),
    country_of_origin: normalizeOptionalString(payload.country_of_origin ?? current?.country_of_origin),
    commercial_invoice_description: normalizeOptionalString(
      payload.commercial_invoice_description ?? current?.commercial_invoice_description,
    ),
    material_composition: normalizeOptionalString(payload.material_composition ?? current?.material_composition),
    contains_battery: payload.contains_battery ?? current?.contains_battery ?? false,
    contains_electronics: payload.contains_electronics ?? current?.contains_electronics ?? false,
    contains_leather: payload.contains_leather ?? current?.contains_leather ?? false,
    contains_fur: payload.contains_fur ?? current?.contains_fur ?? false,
    preferential_origin_eligible:
      payload.preferential_origin_eligible ?? current?.preferential_origin_eligible ?? false,
    declared_value_override: normalizeOptionalNumber(
      payload.declared_value_override ?? current?.declared_value_override,
    ),
    declared_currency: normalizeOptionalString(payload.declared_currency ?? current?.declared_currency),
    customs_notes_internal: normalizeOptionalString(
      payload.customs_notes_internal ?? current?.customs_notes_internal,
    ),
    created_at: current?.created_at ?? null,
    updated_at: new Date().toISOString(),
  } satisfies ProductCustomsInfoRecord

  return {
    ...next,
    customs_info_status: computeCustomsInfoStatus(next),
  }
}

export async function listShippingProfiles() {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("product_shipping_profiles")
    .select(SHIPPING_PROFILE_COLUMNS)
    .eq("is_active", true)
    .order("shipping_profile_name", { ascending: true })

  if (error) {
    throw wrapError("product_shipping_profiles", error)
  }

  return castRows<ProductShippingProfileRecord>(data)
}

export async function getArtifactLogistics(artifactId: string): Promise<ProductLogisticsRecord> {
  const [shipping, customs] = await Promise.all([getShippingInfoRow(artifactId), getCustomsInfoRow(artifactId)])
  const profile = shipping?.shipping_profile_code ? await getShippingProfileByCode(shipping.shipping_profile_code) : null
  const readiness = getInternationalReadiness(shipping, customs, profile)

  return {
    shipping,
    customs,
    profile,
    readiness,
  }
}

export async function upsertProductShippingInfo(
  artifactId: string,
  payload: Partial<ProductShippingInfoRecord>,
) {
  await getArtifactOwnership(artifactId)

  const supabase = getSupabaseBrowserClient()
  const current = await getShippingInfoRow(artifactId)
  const profileCode = normalizeOptionalString(payload.shipping_profile_code ?? current?.shipping_profile_code)
  const profile = profileCode ? await getShippingProfileByCode(profileCode) : null
  const next = buildShippingInfoRecord(artifactId, current, payload, profile)

  const { data, error } = await supabase
    .from("product_shipping_info")
    .upsert(next, { onConflict: "artifact_id" })
    .select(SHIPPING_INFO_COLUMNS)
    .single()

  if (error) {
    throw wrapError("product_shipping_info", error)
  }

  return castRow<ProductShippingInfoRecord>(data)
}

export async function upsertProductCustomsInfo(
  artifactId: string,
  payload: Partial<ProductCustomsInfoRecord>,
) {
  await getArtifactOwnership(artifactId)

  const supabase = getSupabaseBrowserClient()
  const current = await getCustomsInfoRow(artifactId)
  const next = buildCustomsInfoRecord(artifactId, current, payload)

  const { data, error } = await supabase
    .from("product_customs_info")
    .upsert(next, { onConflict: "artifact_id" })
    .select(CUSTOMS_INFO_COLUMNS)
    .single()

  if (error) {
    throw wrapError("product_customs_info", error)
  }

  return castRow<ProductCustomsInfoRecord>(data)
}

export async function saveArtifactLogistics(
  artifactId: string,
  payload: {
    shipping?: Partial<ProductShippingInfoRecord>
    customs?: Partial<ProductCustomsInfoRecord>
  },
) {
  const [shipping, customs] = await Promise.all([
    upsertProductShippingInfo(artifactId, payload.shipping ?? {}),
    upsertProductCustomsInfo(artifactId, payload.customs ?? {}),
  ])
  const profile = shipping.shipping_profile_code
    ? await getShippingProfileByCode(shipping.shipping_profile_code)
    : null

  return {
    shipping,
    customs,
    profile,
    readiness: getInternationalReadiness(shipping, customs, profile),
  }
}

export async function markArtifactInternationalReady(artifactId: string) {
  const logistics = await getArtifactLogistics(artifactId)

  if (!logistics.readiness.internationalReady) {
    throw new Error(
      `International readiness requirements missing: ${logistics.readiness.missingFields.join(", ")}.`,
    )
  }

  const shipping = await upsertProductShippingInfo(artifactId, {
    ...(logistics.shipping ?? defaultShippingInfo(artifactId)),
    international_sale_status: "international_ready",
    manual_review_required: false,
  })

  const profile = shipping.shipping_profile_code
    ? await getShippingProfileByCode(shipping.shipping_profile_code)
    : null
  const readiness = getInternationalReadiness(shipping, logistics.customs, profile)

  return {
    shipping,
    customs: logistics.customs,
    profile,
    readiness: {
      ...readiness,
      internationalReady: true,
      missingFields: [],
    },
  }
}

export async function listArtifactOptions() {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("provenance_artifacts")
    .select("id, artifact_code, artifact_title, artist_name, current_status")
    .order("created_at", { ascending: false })

  if (error) {
    throw wrapError("provenance_artifacts", error)
  }

  return castRows<ArtifactOption>(data)
}

export async function listArtifacts(filters: ArtifactFilters = {}) {
  const supabase = getSupabaseBrowserClient()
  let query = supabase
    .from("provenance_artifacts")
    .select(ARTIFACT_COLUMNS)
    .order("created_at", { ascending: false })

  if (filters.search?.trim()) {
    const value = filters.search.trim()
    query = query.or(`artifact_code.ilike.%${value}%,artifact_title.ilike.%${value}%,artist_name.ilike.%${value}%`)
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("current_status", filters.status)
  }

  if (filters.usageTier && filters.usageTier !== "all") {
    query = query.eq("usage_tier", filters.usageTier)
  }

  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query

  if (error) {
    throw wrapError("provenance_artifacts", error)
  }

  return castRows<ArtifactRecord>(data)
}

export async function getArtifactById(artifactId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("provenance_artifacts")
    .select(ARTIFACT_COLUMNS)
    .eq("id", artifactId)
    .single()

  if (error) {
    throw wrapError("provenance_artifacts", error)
  }

  return castRow<ArtifactRecord>(data)
}

export async function getArtifactByCode(artifactCode: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("provenance_artifacts")
    .select("id, artifact_code, artifact_title")
    .eq("artifact_code", artifactCode)
    .maybeSingle()

  if (error) {
    throw wrapError("provenance_artifacts", error)
  }

  return castMaybeRow<Pick<ArtifactRecord, "id" | "artifact_code" | "artifact_title">>(data)
}

export async function createArtifact(payload: Partial<ArtifactRecord>) {
  const supabase = getSupabaseBrowserClient()
  const ownerUserId = await getAuthenticatedUserId()
  const { data, error } = await supabase
    .from("provenance_artifacts")
    .insert({
      ...payload,
      owner_user_id: ownerUserId,
      artifact_type: payload.artifact_type?.trim() || "artifact",
      public_visibility: payload.public_visibility ?? "public",
      created_at: payload.created_at ?? new Date().toISOString().slice(0, 10),
    })
    .select(ARTIFACT_COLUMNS)
    .single()

  if (error) {
    throw wrapError("provenance_artifacts", error)
  }

  return castRow<ArtifactRecord>(data)
}

export async function updateArtifact(artifactId: string, payload: Partial<ArtifactRecord>) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("provenance_artifacts")
    .update(payload)
    .eq("id", artifactId)
    .select(ARTIFACT_COLUMNS)
    .single()

  if (error) {
    throw wrapError("provenance_artifacts", error)
  }

  return castRow<ArtifactRecord>(data)
}

export async function deleteArtifact(artifactId: string) {
  const supabase = getSupabaseBrowserClient()
  await getAuthenticatedUserId()

  const { data, error } = await supabase
    .from("provenance_artifacts")
    .delete()
    .eq("id", artifactId)
    .select("id, artifact_code")
    .maybeSingle()

  if (error) {
    throw wrapError("provenance_artifacts", error)
  }

  if (!data) {
    throw new Error("Artifact record was not deleted. It may already be gone or you may not have access.")
  }

  return castRow<Pick<ArtifactRecord, "id" | "artifact_code">>(data)
}

export async function listEvents(filters: EventFilters = {}) {
  const supabase = getSupabaseBrowserClient()
  let query = supabase
    .from("provenance_events")
    .select(EVENT_COLUMNS)
    .order("created_at", { ascending: false })

  if (filters.artifactId) {
    query = query.eq("artifact_id", filters.artifactId)
  }

  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query

  if (error) {
    throw wrapError("provenance_events", error)
  }

  return castRows<ProvenanceEventRecord>(data)
}

export async function createEvent(payload: Partial<ProvenanceEventRecord>) {
  const supabase = getSupabaseBrowserClient()
  if (!payload.artifact_id) {
    throw new Error("artifact_id is required.")
  }

  const artifact = await getArtifactOwnership(payload.artifact_id)
  const { data, error } = await supabase
    .from("provenance_events")
    .insert({
      ...payload,
      owner_user_id: artifact.owner_user_id,
      artifact_code: payload.artifact_code ?? artifact.artifact_code,
      event_id: `evt_${crypto.randomUUID()}`,
    })
    .select(EVENT_COLUMNS)
    .single()

  if (error) {
    throw wrapError("provenance_events", error)
  }

  return castRow<ProvenanceEventRecord>(data)
}

export async function listAuthentications(filters: AuthenticationFilters = {}) {
  const supabase = getSupabaseBrowserClient()
  let query = supabase
    .from("provenance_authentications")
    .select(AUTH_COLUMNS)
    .order("created_at", { ascending: false })

  if (filters.artifactId) {
    query = query.eq("artifact_id", filters.artifactId)
  }

  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query

  if (error) {
    throw wrapError("provenance_authentications", error)
  }

  return castRows<AuthenticationRecord>(data)
}

export async function createAuthentication(payload: Partial<AuthenticationRecord>) {
  const supabase = getSupabaseBrowserClient()
  if (!payload.artifact_id) {
    throw new Error("artifact_id is required.")
  }

  const artifact = await getArtifactOwnership(payload.artifact_id)
  const { data, error } = await supabase
    .from("provenance_authentications")
    .insert({
      ...payload,
      owner_user_id: artifact.owner_user_id,
      artifact_code: payload.artifact_code ?? artifact.artifact_code,
      auth_id: `auth_${crypto.randomUUID()}`,
    })
    .select(AUTH_COLUMNS)
    .single()

  if (error) {
    throw wrapError("provenance_authentications", error)
  }

  return castRow<AuthenticationRecord>(data)
}

export async function listAuctions(filters: AuctionFilters = {}) {
  const supabase = getSupabaseBrowserClient()
  let query = supabase
    .from("auctions")
    .select(AUCTION_COLUMNS)
    .is("deleted_at", null)
    .neq("auction_status", "deleted")
    .order("created_at", { ascending: false })

  if (filters.artifactId) {
    query = query.eq("artifact_id", filters.artifactId)
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("auction_status", filters.status)
  }

  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query

  if (error) {
    throw wrapError("auctions", error)
  }

  return castRows<AuctionRecord>(data)
}

export async function getAuctionById(auctionId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("auctions")
    .select(AUCTION_COLUMNS)
    .eq("auction_id", auctionId)
    .single()

  if (error) {
    throw wrapError("auctions", error)
  }

  return castRow<AuctionRecord>(data)
}

export async function createAuction(payload: Partial<AuctionRecord>) {
  const supabase = getSupabaseBrowserClient()
  const normalizedPayload = {
    ...payload,
    buy_now_price: calculateAuctionBuyNowPrice(payload.auction_type, payload.opening_bid),
    extension_rule_enabled: payload.extension_rule_enabled ?? true,
    extension_seconds: payload.extension_seconds ?? 30,
    demo_mode: payload.demo_mode ?? false,
    storefront_visible: payload.storefront_visible ?? true,
  }
  const { data, error } = await supabase
    .from("auctions")
    .insert(normalizedPayload)
    .select(AUCTION_COLUMNS)
    .single()

  if (error) {
    throw wrapError("auctions", error)
  }

  const createdAuction = castRow<AuctionRecord>(data)

  if (createdAuction.demo_mode && createdAuction.auction_status && createdAuction.auction_status !== "draft") {
    try {
      await seedDemoAuctionHistory(createdAuction.auction_id)
    } catch {
      // Demo seeding is best-effort so the auction still saves even if the RPC migration is not applied yet.
    }
  }

  return createdAuction
}

export async function updateAuctionStorefrontState(
  auctionId: string,
  payload: Partial<Pick<AuctionRecord, "auction_status" | "storefront_visible" | "deleted_at">>,
) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("auctions")
    .update(payload)
    .eq("auction_id", auctionId)
    .select(AUCTION_COLUMNS)
    .single()

  if (error) {
    throw wrapError("auctions", error)
  }

  return castRow<AuctionRecord>(data)
}

export async function removeDemoAuction(auction: AuctionRecord) {
  if (!canDeleteDemoAuction(auction)) {
    throw new Error("Only demo auctions without live/settled status or winners can be deleted.")
  }

  const supabase = getSupabaseBrowserClient()
  const hardDelete = await supabase
    .from("auctions")
    .delete()
    .eq("auction_id", auction.auction_id)

  if (!hardDelete.error) {
    return
  }

  const softDelete = await supabase
    .from("auctions")
    .update({
      auction_status: "deleted",
      storefront_visible: false,
      deleted_at: new Date().toISOString(),
    })
    .eq("auction_id", auction.auction_id)

  if (softDelete.error) {
    throw wrapError("auctions", softDelete.error)
  }
}

export async function listMediaAssets(filters: MediaFilters = {}) {
  const supabase = getSupabaseBrowserClient()
  let query = supabase
    .from("media_assets")
    .select(MEDIA_COLUMNS)
    .order("uploaded_at", { ascending: false })

  if (filters.artifactId) {
    query = query.eq("artifact_id", filters.artifactId)
  }

  if (filters.provenanceEventId) {
    query = query.eq("provenance_event_id", filters.provenanceEventId)
  }

  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query

  if (error) {
    throw wrapError("media_assets", error)
  }

  return castRows<MediaAssetRecord>(data)
}

export async function uploadMediaFile(file: File, artifactId: string, provenanceEventId?: string | null) {
  const supabase = getSupabaseBrowserClient()
  const bucket = getMediaBucketName()
  const fileHash = await hashFile(file)
  const path = buildStoragePath(artifactId, file, provenanceEventId)

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  })

  if (error) {
    throw new Error(error.message)
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)

  return {
    fileHash,
    fileType: file.type || null,
    fileUrl: data.publicUrl,
    path,
    thumbnailUrl: file.type.startsWith("image/") ? data.publicUrl : null,
  }
}

export async function createMediaAsset(payload: Partial<MediaAssetRecord>) {
  const supabase = getSupabaseBrowserClient()
  const uploadedBy = await getAuthenticatedUserId()
  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      ...payload,
      uploaded_by: uploadedBy,
    })
    .select(MEDIA_COLUMNS)

  if (error) {
    throw wrapError("media_assets", error)
  }

  return castMaybeRow<MediaAssetRecord>((data ?? [])[0] ?? null)
}

export async function listDisclosureControls(filters: DisclosureFilters = {}) {
  const supabase = getSupabaseBrowserClient()
  let query = supabase
    .from("disclosure_controls")
    .select(DISCLOSURE_COLUMNS)
    .order("updated_at", { ascending: false })

  if (filters.artifactId) {
    query = query.eq("artifact_id", filters.artifactId)
  }

  const { data, error } = await query

  if (error) {
    throw wrapError("disclosure_controls", error)
  }

  return castRows<DisclosureControlRecord>(data)
}

export async function createDisclosureControl(payload: Partial<DisclosureControlRecord>) {
  const supabase = getSupabaseBrowserClient()
  const approvedBy = (payload.approved_by as string | null | undefined) ?? (await getAuthenticatedUserId())
  const { data, error } = await supabase
    .from("disclosure_controls")
    .insert({
      ...payload,
      approved_by: approvedBy,
    })
    .select(DISCLOSURE_COLUMNS)

  if (error) {
    throw wrapError("disclosure_controls", error)
  }

  return castMaybeRow<DisclosureControlRecord>((data ?? [])[0] ?? null)
}

export async function updateDisclosureControl(
  lookup: DisclosureLookup,
  payload: Partial<DisclosureControlRecord>,
) {
  const supabase = getSupabaseBrowserClient()
  const approvedBy = (payload.approved_by as string | null | undefined) ?? (await getAuthenticatedUserId())
  const { data, error } = await supabase
    .from("disclosure_controls")
    .update({
      ...payload,
      approved_by: approvedBy,
    })
    .eq("artifact_id", lookup.artifact_id)
    .eq("field_name", lookup.field_name)
    .eq("field_value_reference", lookup.field_value_reference)
    .select(DISCLOSURE_COLUMNS)

  if (error) {
    throw wrapError("disclosure_controls", error)
  }

  return castMaybeRow<DisclosureControlRecord>((data ?? [])[0] ?? null)
}

export async function listTransactions(artifactId?: string) {
  const supabase = getSupabaseBrowserClient()
  let query = supabase.from("provenance_transactions").select("*")

  if (artifactId) {
    query = query.eq("artifact_id", artifactId)
  }

  const { data, error } = await query

  if (error) {
    throw wrapError("provenance_transactions", error)
  }

  return castRows<Record<string, unknown>>(data)
}

export async function listAuctionBids(filters: AuctionBidFilters = {}) {
  const supabase = getSupabaseBrowserClient()
  let query = supabase
    .from("auction_bids")
    .select(AUCTION_BID_COLUMNS)
    .order("created_at", { ascending: false })

  if (filters.auctionId) {
    query = query.eq("auction_id", filters.auctionId)
  }

  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query

  if (error) {
    if (isMissingRelationError(error)) {
      return []
    }

    throw wrapError("auction_bids", error)
  }

  return castRows<AuctionBidRecord>(data)
}

export async function listBidHistory(auctionId?: string) {
  return listAuctionBids({ auctionId })
}

export async function getAuctionOutcome(auctionId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("auction_outcomes")
    .select(AUCTION_OUTCOME_COLUMNS)
    .eq("auction_id", auctionId)
    .maybeSingle()

  if (error) {
    if (isMissingRelationError(error)) {
      return null
    }

    throw wrapError("auction_outcomes", error)
  }

  return castMaybeRow<AuctionOutcomeRecord>(data)
}

export async function placeAuctionBid(input: {
  auctionId: string
  bidAmount: number
  bidderDisplayName?: string | null
  bidSource?: AuctionBidSource
}) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("krunch_place_auction_bid", {
    p_auction_id: input.auctionId,
    p_bid_amount: input.bidAmount,
    p_bidder_display_name: normalizeOptionalString(input.bidderDisplayName),
    p_bid_source: input.bidSource ?? "manual",
  })

  if (error) {
    throw wrapError("auction_bids", error)
  }

  return castRow<AuctionBidRecord>(data)
}

export async function buyNowAuction(input: {
  auctionId: string
  bidderDisplayName?: string | null
}) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("krunch_buy_now_auction", {
    p_auction_id: input.auctionId,
    p_bidder_display_name: normalizeOptionalString(input.bidderDisplayName),
  })

  if (error) {
    throw wrapError("auction_bids", error)
  }

  return castRow<AuctionBidRecord>(data)
}

export async function seedDemoAuctionHistory(auctionId: string, count = 5) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("krunch_seed_demo_auction_history", {
    p_auction_id: auctionId,
    p_seed_count: count,
  })

  if (error) {
    throw wrapError("auction_bids", error)
  }

  return Number(data ?? 0)
}

export async function simulateAuctionAction(auctionId: string, action: AuctionSimulationAction) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("krunch_admin_simulate_auction_action", {
    p_auction_id: auctionId,
    p_action: action,
  })

  if (error) {
    throw wrapError("auction_bids", error)
  }

  return (data ?? null) as Record<string, unknown> | null
}

export async function getAuctionShowcase(input: {
  auctionId?: string | null
  auctionType?: AuctionType | null
} = {}) {
  const supabase = getSupabaseBrowserClient()
  const requestedAuctionType =
    input.auctionType === "premium" || input.auctionType === "hybrid"
      ? input.auctionType
      : null

  let query = supabase
    .from("auctions")
    .select(AUCTION_COLUMNS)
    .in("auction_status", ["live", "open", "scheduled", "published", "ended", "draft"])
    .is("deleted_at", null)

  if (input.auctionId) {
    query = query.eq("auction_id", input.auctionId)
  } else {
    query = query.in("auction_type", requestedAuctionType ? [requestedAuctionType] : ["premium", "hybrid"])
  }

  const { data, error } = await query.limit(12)

  if (error) {
    throw wrapError("auctions", error)
  }

  const auctions = castRows<AuctionRecord>(data).sort((left, right) => {
    const leftStatusPriority = left.auction_status === "live" || left.auction_status === "open" ? 0 : left.auction_status === "scheduled" || left.auction_status === "published" ? 1 : 2
    const rightStatusPriority = right.auction_status === "live" || right.auction_status === "open" ? 0 : right.auction_status === "scheduled" || right.auction_status === "published" ? 1 : 2

    if (leftStatusPriority !== rightStatusPriority) {
      return leftStatusPriority - rightStatusPriority
    }

    const leftTime = left.auction_start_time ? new Date(left.auction_start_time).getTime() : 0
    const rightTime = right.auction_start_time ? new Date(right.auction_start_time).getTime() : 0
    return rightTime - leftTime
  }).filter((auction) => isAuctionVisibleOnStorefront(auction, true) || auction.auction_status === "ended")

  const selectedAuction = auctions[0]

  if (!selectedAuction) {
    return null
  }

  const [{ data: artifactData, error: artifactError }, bids, outcome, mediaAssets] = await Promise.all([
    supabase
      .from("provenance_artifacts")
      .select("id, artifact_code, artifact_title, artist_name, group_name, era_name, public_visibility")
      .eq("id", selectedAuction.artifact_id)
      .maybeSingle(),
    listAuctionBids({ auctionId: selectedAuction.auction_id, limit: 12 }),
    getAuctionOutcome(selectedAuction.auction_id),
    listMediaAssets({ artifactId: selectedAuction.artifact_id, limit: 8 }),
  ])

  if (artifactError) {
    throw wrapError("provenance_artifacts", artifactError)
  }

  const artifact = castMaybeRow<AuctionShowcaseRecord["artifact"]>(artifactData)

  if (!artifact) {
    return null
  }

  return {
    auction: selectedAuction,
    artifact,
    media: mediaAssets[0] ?? null,
    bids,
    outcome,
    currentHighestBid: getAuctionCurrentHighestBid(selectedAuction, bids),
    minimumNextBid: getAuctionMinimumNextBid(selectedAuction, bids),
  } satisfies AuctionShowcaseRecord
}

export async function listPublicAuctionHighlights(input: {
  auctionType?: AuctionType
  limit?: number
} = {}) {
  const supabase = getSupabaseBrowserClient()
  const limit = Math.max(1, Math.min(input.limit ?? 4, 12))
  let query = supabase
    .from("auctions")
    .select(AUCTION_COLUMNS)
    .in("auction_status", ["live", "open", "scheduled", "published", "draft"])
    .is("deleted_at", null)
    .in("auction_type", input.auctionType ? [input.auctionType] : ["premium", "hybrid"])
    .limit(limit * 3)

  const { data, error } = await query

  if (error) {
    throw wrapError("auctions", error)
  }

  const auctions = sortAuctionsForStorefront(
    castRows<AuctionRecord>(data).filter((auction) => isAuctionVisibleOnStorefront(auction, true)),
  )

  if (!auctions.length) {
    return [] as AuctionHomeHighlightRecord[]
  }

  const artifactIds = Array.from(new Set(auctions.map((auction) => auction.artifact_id)))
  const auctionIds = auctions.map((auction) => auction.auction_id)

  const artifactPromise = supabase
    .from("provenance_artifacts")
    .select("id, artifact_code, artifact_title, artist_name, group_name, era_name, public_visibility")
    .in("id", artifactIds)
    .eq("public_visibility", "public")

  const mediaPromise = supabase
    .from("media_assets")
    .select(MEDIA_COLUMNS)
    .in("artifact_id", artifactIds)
    .order("uploaded_at", { ascending: false })

  const bidsPromise = supabase
    .from("auction_bids")
    .select(AUCTION_BID_COLUMNS)
    .in("auction_id", auctionIds)
    .order("created_at", { ascending: false })

  const [{ data: artifactData, error: artifactError }, { data: mediaData, error: mediaError }, { data: bidData, error: bidError }] = await Promise.all([
    artifactPromise,
    mediaPromise,
    bidsPromise,
  ])

  if (artifactError) {
    throw wrapError("provenance_artifacts", artifactError)
  }

  if (mediaError) {
    throw wrapError("media_assets", mediaError)
  }

  const artifactMap = new Map(
    castRows<AuctionHomeHighlightRecord["artifact"]>(artifactData).map((artifact) => [artifact.id, artifact]),
  )

  const mediaMap = new Map<string, MediaAssetRecord>()
  for (const media of castRows<MediaAssetRecord>(mediaData)) {
    if (!mediaMap.has(media.artifact_id)) {
      mediaMap.set(media.artifact_id, media)
    }
  }

  const bidsByAuction = new Map<string, AuctionBidRecord[]>()
  if (bidError) {
    if (!isMissingRelationError(bidError)) {
      throw wrapError("auction_bids", bidError)
    }
  } else {
    for (const bid of castRows<AuctionBidRecord>(bidData)) {
      const existing = bidsByAuction.get(bid.auction_id) ?? []
      existing.push(bid)
      bidsByAuction.set(bid.auction_id, existing)
    }
  }

  return auctions
    .map((auction) => {
      const artifact = artifactMap.get(auction.artifact_id)

      if (!artifact) {
        return null
      }

      const bids = bidsByAuction.get(auction.auction_id) ?? []

      return {
        auction,
        artifact,
        media: mediaMap.get(auction.artifact_id) ?? null,
        currentHighestBid: getAuctionCurrentHighestBid(auction, bids),
      } satisfies AuctionHomeHighlightRecord
    })
    .filter((highlight): highlight is AuctionHomeHighlightRecord => Boolean(highlight))
    .slice(0, limit)
}

export async function getDashboardCounts(): Promise<CountResult> {
  const supabase = getSupabaseBrowserClient()

  const [
    { count: totalArtifacts, error: artifactsError },
    { count: totalActiveAuctions, error: auctionsError },
    { count: totalAuthentications, error: authenticationsError },
    { count: totalMediaAssets, error: mediaError },
  ] = await Promise.all([
    supabase.from("provenance_artifacts").select("*", { count: "exact", head: true }),
    supabase
      .from("auctions")
      .select("*", { count: "exact", head: true })
      .in("auction_status", [...AUCTION_ACTIVE_STATUS_OPTIONS]),
    supabase.from("provenance_authentications").select("*", { count: "exact", head: true }),
    supabase.from("media_assets").select("*", { count: "exact", head: true }),
  ])

  if (artifactsError) {
    throw wrapError("provenance_artifacts", artifactsError)
  }

  if (auctionsError) {
    throw wrapError("auctions", auctionsError)
  }

  if (authenticationsError) {
    throw wrapError("provenance_authentications", authenticationsError)
  }

  if (mediaError) {
    throw wrapError("media_assets", mediaError)
  }

  return {
    totalArtifacts: totalArtifacts ?? 0,
    totalActiveAuctions: totalActiveAuctions ?? 0,
    totalAuthentications: totalAuthentications ?? 0,
    totalMediaAssets: totalMediaAssets ?? 0,
  }
}

export async function getRecentActivity() {
  const [artifacts, events, authentications, auctions] = await Promise.all([
    listArtifacts({ limit: 4 }),
    listEvents({ limit: 4 }),
    listAuthentications({ limit: 4 }),
    listAuctions({ limit: 4 }),
  ])

  const activity: RecentActivityItem[] = [
    ...artifacts.map((artifact) => ({
      id: `artifact:${artifact.id}`,
      type: "Artifact",
      title: artifact.artifact_title,
      subtitle: artifactDisplayName(artifact),
      timestamp: artifact.created_at,
      href: `/admin/artifacts/${artifact.id}`,
    })),
    ...events.map((event) => ({
      id: `event:${event.id}`,
      type: "Event",
      title: event.event_title,
      subtitle: `${event.event_type ?? "event"} · ${event.artifact_code ?? "No code"}`,
      timestamp: event.created_at,
      href: event.artifact_id ? `/admin/artifacts/${event.artifact_id}` : "/admin/events",
    })),
    ...authentications.map((authentication) => ({
      id: `auth:${authentication.id}`,
      type: "Authentication",
      title: authentication.auth_method ?? "Authentication record",
      subtitle: `${authentication.auth_result ?? "pending"} · ${authentication.artifact_code ?? "No code"}`,
      timestamp: authentication.created_at,
      href: authentication.artifact_id ? `/admin/artifacts/${authentication.artifact_id}` : "/admin/authentications",
    })),
    ...auctions.map((auction) => ({
      id: `auction:${auction.auction_id}`,
      type: "Auction",
      title: auction.auction_title,
      subtitle: `${auction.auction_status ?? "draft"} · ${auction.auction_type ?? "auction"}`,
      timestamp: auction.created_at,
      href: `/admin/auctions/${auction.auction_id}`,
    })),
  ]

  return activity
    .sort((left, right) => {
      const leftTime = left.timestamp ? new Date(left.timestamp).getTime() : 0
      const rightTime = right.timestamp ? new Date(right.timestamp).getTime() : 0
      return rightTime - leftTime
    })
    .slice(0, 8)
}
