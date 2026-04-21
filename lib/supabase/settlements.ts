import type { PostgrestError } from "@supabase/supabase-js"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const SETTLEMENT_QUOTE_COLUMNS = [
  "quote_id",
  "auction_id",
  "artifact_id",
  "user_id",
  "source_type",
  "source_reference_id",
  "quote_status",
  "destination_country",
  "recipient_name",
  "recipient_phone",
  "recipient_email",
  "address_line_1",
  "address_line_2",
  "city",
  "state_region",
  "postal_code",
  "customs_id_type",
  "customs_id_value",
  "personal_customs_clearance_number",
  "delivery_note",
  "shipping_profile_code",
  "shipping_profile_name",
  "package_type",
  "carrier_preference",
  "estimated_package_weight_grams",
  "estimated_package_length_cm",
  "estimated_package_width_cm",
  "estimated_package_height_cm",
  "ddp_supported",
  "ddp_mode",
  "insurance_required",
  "special_handling_required",
  "customs_risk_tier",
  "brokerage_fee_policy",
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
  "base_item_amount",
  "buyer_premium_amount",
  "shipping_amount",
  "insurance_amount",
  "estimated_duty_amount",
  "estimated_vat_amount",
  "extra_handling_amount",
  "total_payable_amount",
  "currency",
  "is_demo",
  "manual_review_required",
  "review_reason",
  "quote_generated_at",
  "payment_requested_at",
  "paid_at",
  "expires_at",
  "created_at",
  "updated_at",
].join(", ")

const SETTLEMENT_PAYMENT_ATTEMPT_COLUMNS = [
  "id",
  "quote_id",
  "payment_provider",
  "payment_status",
  "amount",
  "currency",
  "is_demo",
  "created_at",
  "response_payload",
].join(", ")

export type SettlementQuoteStatus =
  | "awaiting_shipping_info"
  | "quote_preparing"
  | "payment_requested"
  | "paid"
  | "review_required"
  | "cancelled"
  | "expired"

export type SettlementSourceType =
  | "auction_buy_now"
  | "auction_win"
  | "private_sale"
  | "admin_demo"

export type PurchaseSettlementQuoteRecord = {
  quote_id: string
  auction_id: string | null
  artifact_id: string
  user_id: string
  source_type: SettlementSourceType
  source_reference_id: string | null
  quote_status: SettlementQuoteStatus
  destination_country: string | null
  recipient_name: string | null
  recipient_phone: string | null
  recipient_email: string | null
  address_line_1: string | null
  address_line_2: string | null
  city: string | null
  state_region: string | null
  postal_code: string | null
  customs_id_type: string | null
  customs_id_value: string | null
  personal_customs_clearance_number: string | null
  delivery_note: string | null
  shipping_profile_code: string | null
  shipping_profile_name: string | null
  package_type: string | null
  carrier_preference: string | null
  estimated_package_weight_grams: number | null
  estimated_package_length_cm: number | null
  estimated_package_width_cm: number | null
  estimated_package_height_cm: number | null
  ddp_supported: boolean
  ddp_mode: string | null
  insurance_required: boolean
  special_handling_required: boolean
  customs_risk_tier: string | null
  brokerage_fee_policy: string | null
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
  base_item_amount: number
  buyer_premium_amount: number
  shipping_amount: number
  insurance_amount: number
  estimated_duty_amount: number
  estimated_vat_amount: number
  extra_handling_amount: number
  total_payable_amount: number
  currency: string
  is_demo: boolean
  manual_review_required: boolean
  review_reason: string | null
  quote_generated_at: string | null
  payment_requested_at: string | null
  paid_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export type SettlementPaymentAttemptRecord = {
  id: string
  quote_id: string
  payment_provider: string
  payment_status: "requested" | "succeeded" | "failed"
  amount: number
  currency: string
  is_demo: boolean
  created_at: string
  response_payload: Record<string, unknown>
}

export type SettlementShippingInput = {
  quoteId: string
  destinationCountry: string
  recipientName: string
  recipientPhone: string
  recipientEmail?: string | null
  addressLine1: string
  addressLine2?: string | null
  city: string
  stateRegion?: string | null
  postalCode: string
  customsIdType?: string | null
  customsIdValue?: string | null
  personalCustomsClearanceNumber?: string | null
  deliveryNote?: string | null
}

type SettlementQuoteFilters = {
  artifactId?: string
  auctionId?: string
  limit?: number
  statuses?: SettlementQuoteStatus[]
  userId?: string
}

function getSettlementErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown settlement error."

  if (message.includes("Could not find the table") || message.includes("relation")) {
    return "The settlement quote tables are missing. Run the latest Supabase migration first."
  }

  return message
}

function isMissingRelationError(error: PostgrestError | Error) {
  const message = error.message.toLowerCase()

  return (
    message.includes("could not find the table") ||
    message.includes("schema cache") ||
    message.includes("does not exist")
  )
}

function castMaybeRow<T>(value: unknown) {
  return (value ?? null) as T | null
}

function castRow<T>(value: unknown) {
  return value as T
}

function castRows<T>(value: unknown) {
  return (value ?? []) as T[]
}

export async function listSettlementQuotes(filters: SettlementQuoteFilters = {}) {
  const supabase = getSupabaseBrowserClient()
  let query = supabase
    .from("purchase_settlement_quotes")
    .select(SETTLEMENT_QUOTE_COLUMNS)
    .order("created_at", { ascending: false })

  if (filters.artifactId) {
    query = query.eq("artifact_id", filters.artifactId)
  }

  if (filters.auctionId) {
    query = query.eq("auction_id", filters.auctionId)
  }

  if (filters.userId) {
    query = query.eq("user_id", filters.userId)
  }

  if (filters.statuses?.length) {
    query = query.in("quote_status", filters.statuses)
  }

  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query

  if (error) {
    if (isMissingRelationError(error)) {
      return []
    }

    throw new Error(getSettlementErrorMessage(error))
  }

  return castRows<PurchaseSettlementQuoteRecord>(data)
}

export async function getSettlementQuoteById(quoteId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("purchase_settlement_quotes")
    .select(SETTLEMENT_QUOTE_COLUMNS)
    .eq("quote_id", quoteId)
    .maybeSingle()

  if (error) {
    if (isMissingRelationError(error)) {
      return null
    }

    throw new Error(getSettlementErrorMessage(error))
  }

  return castMaybeRow<PurchaseSettlementQuoteRecord>(data)
}

export async function getLatestUserSettlementQuoteForAuction(auctionId: string) {
  const quotes = await listSettlementQuotes({
    auctionId,
    limit: 1,
  })

  return quotes[0] ?? null
}

export async function listSettlementPaymentAttempts(quoteId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("settlement_payment_attempts")
    .select(SETTLEMENT_PAYMENT_ATTEMPT_COLUMNS)
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: false })

  if (error) {
    if (isMissingRelationError(error)) {
      return []
    }

    throw new Error(getSettlementErrorMessage(error))
  }

  return castRows<SettlementPaymentAttemptRecord>(data)
}

export async function createSettlementQuoteFromBuyNow(input: {
  auctionId: string
  bidderDisplayName?: string | null
}) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("krunch_create_settlement_quote_from_buy_now", {
    p_auction_id: input.auctionId,
    p_bidder_display_name: input.bidderDisplayName?.trim() || null,
  })

  if (error) {
    throw new Error(getSettlementErrorMessage(error))
  }

  return castRow<PurchaseSettlementQuoteRecord>(data)
}

export async function saveSettlementQuoteShippingInfo(input: SettlementShippingInput) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("krunch_save_settlement_quote_shipping_info", {
    p_quote_id: input.quoteId,
    p_destination_country: input.destinationCountry,
    p_recipient_name: input.recipientName,
    p_recipient_phone: input.recipientPhone,
    p_recipient_email: input.recipientEmail?.trim() || null,
    p_address_line_1: input.addressLine1,
    p_address_line_2: input.addressLine2?.trim() || null,
    p_city: input.city,
    p_state_region: input.stateRegion?.trim() || null,
    p_postal_code: input.postalCode,
    p_customs_id_type: input.customsIdType?.trim() || null,
    p_customs_id_value: input.customsIdValue?.trim() || null,
    p_personal_customs_clearance_number: input.personalCustomsClearanceNumber?.trim() || null,
    p_delivery_note: input.deliveryNote?.trim() || null,
  })

  if (error) {
    throw new Error(getSettlementErrorMessage(error))
  }

  return castRow<PurchaseSettlementQuoteRecord>(data)
}

export async function generateSettlementQuote(quoteId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("krunch_generate_settlement_quote", {
    p_quote_id: quoteId,
  })

  if (error) {
    throw new Error(getSettlementErrorMessage(error))
  }

  return castRow<PurchaseSettlementQuoteRecord>(data)
}

export async function markSettlementQuotePaid(input: {
  quoteId: string
  paymentProvider?: string | null
}) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("krunch_mark_settlement_quote_paid", {
    p_quote_id: input.quoteId,
    p_payment_provider: input.paymentProvider?.trim() || "demo_mock",
  })

  if (error) {
    throw new Error(getSettlementErrorMessage(error))
  }

  return castRow<PurchaseSettlementQuoteRecord>(data)
}
