import { buyNowAuctionShowcase, getAuctionShowcaseState } from "@/lib/auction-showcase"
import type { PurchaseSettlementQuoteRecord, SettlementShippingInput } from "@/lib/supabase/settlements"

const STORAGE_KEY = "krunch-settlement-showcase"

type StoredSettlementState = {
  quotes: PurchaseSettlementQuoteRecord[]
}

function readState(): StoredSettlementState {
  if (typeof window === "undefined") {
    return { quotes: [] }
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { quotes: [] }
    }

    const parsed = JSON.parse(raw) as StoredSettlementState
    return {
      quotes: Array.isArray(parsed?.quotes) ? parsed.quotes : [],
    }
  } catch {
    return { quotes: [] }
  }
}

function writeState(state: StoredSettlementState) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function nowIso() {
  return new Date().toISOString()
}

function plusHours(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
}

function findQuote(quoteId: string) {
  const state = readState()
  return {
    state,
    quote: state.quotes.find((item) => item.quote_id === quoteId) ?? null,
  }
}

function upsertQuote(nextQuote: PurchaseSettlementQuoteRecord) {
  const state = readState()
  const nextQuotes = state.quotes.filter((item) => item.quote_id !== nextQuote.quote_id)
  nextQuotes.unshift(nextQuote)
  writeState({ quotes: nextQuotes })
  return nextQuote
}

function getActiveQuote(showcaseId: string) {
  const auctionId = `showcase:${showcaseId}`
  const state = readState()

  return (
    state.quotes.find(
      (quote) =>
        quote.auction_id === auctionId &&
        !["cancelled", "expired"].includes(quote.quote_status),
    ) ?? null
  )
}

function calculateShowcaseQuote(nextQuote: PurchaseSettlementQuoteRecord) {
  const currencyIsKrw = (nextQuote.currency ?? "USD").toUpperCase() === "KRW"
  const weight = Math.max(nextQuote.estimated_package_weight_grams ?? 900, 100)
  const packageType = nextQuote.package_type ?? "premium_box"
  const carrier = nextQuote.carrier_preference ?? (nextQuote.destination_country === "KR" ? "local" : "ems")
  const country = nextQuote.destination_country ?? "US"
  const itemType = (nextQuote.customs_product_type ?? "").toLowerCase()

  const zoneBase =
    country === "KR"
      ? currencyIsKrw
        ? 18000
        : 18
      : ["JP", "CN", "TW", "HK"].includes(country)
        ? currencyIsKrw
          ? 46000
          : 46
        : ["SG", "TH", "VN", "MY", "ID", "PH"].includes(country)
          ? currencyIsKrw
            ? 52000
            : 52
          : ["US", "CA"].includes(country)
            ? currencyIsKrw
              ? 88000
              : 88
            : ["GB", "FR", "DE", "IT", "ES", "NL", "AU", "NZ"].includes(country)
              ? currencyIsKrw
                ? 92000
                : 92
              : currencyIsKrw
                ? 108000
                : 108

  const packageMultiplier =
    packageType === "soft"
      ? 1
      : packageType === "box"
        ? 1.1
        : packageType === "premium_box"
          ? 1.28
          : packageType === "framed"
            ? 1.45
            : packageType === "electronics"
              ? 1.33
              : 1.58

  const carrierMultiplier =
    carrier === "local"
      ? 0.92
      : carrier === "ems"
        ? 1
        : carrier === "ups"
          ? 1.14
          : carrier === "fedex"
            ? 1.18
            : carrier === "dhl"
              ? 1.22
              : 1.4

  const weightStep = currencyIsKrw ? 7000 : 7
  const handlingBase = currencyIsKrw ? 12000 : 12
  const shippingAmount =
    Math.round(
      (zoneBase + (Math.max(weight - 250, 0) / 250) * weightStep) * packageMultiplier * carrierMultiplier,
    ) + handlingBase
  const insuranceAmount = nextQuote.insurance_required
    ? Math.max(Math.round(nextQuote.base_item_amount * 0.012), currencyIsKrw ? 15000 : 15)
    : 0

  const taxableBase = nextQuote.base_item_amount + shippingAmount + insuranceAmount
  const dutyRate =
    country === "KR"
      ? nextQuote.country_of_origin === "KR"
        ? 0
        : 0.06
      : country === "US"
        ? itemType.includes("apparel")
          ? 0.08
          : 0.04
        : ["GB", "FR", "DE", "IT", "ES", "NL"].includes(country)
          ? itemType.includes("apparel")
            ? 0.12
            : 0.06
          : country === "JP"
            ? itemType.includes("apparel")
              ? 0.07
              : 0.04
            : 0.06

  const vatRate =
    country === "US"
      ? 0
      : ["SG", "HK"].includes(country)
        ? 0
        : ["GB", "FR", "DE", "IT", "ES", "NL"].includes(country)
          ? 0.2
          : country === "CA"
            ? 0.13
            : 0.1

  const estimatedDutyAmount = Math.round(taxableBase * dutyRate)
  const estimatedVatAmount = Math.round((taxableBase + estimatedDutyAmount) * vatRate)
  const extraHandlingAmount =
    (nextQuote.special_handling_required ? (currencyIsKrw ? 18000 : 18) : 0) +
    (nextQuote.customs_risk_tier === "high" ? (currencyIsKrw ? 22000 : 22) : nextQuote.customs_risk_tier === "medium" ? (currencyIsKrw ? 8000 : 8) : 0)

  return {
    shippingAmount,
    insuranceAmount,
    estimatedDutyAmount,
    estimatedVatAmount,
    extraHandlingAmount,
    totalPayableAmount:
      nextQuote.base_item_amount +
      nextQuote.buyer_premium_amount +
      shippingAmount +
      insuranceAmount +
      estimatedDutyAmount +
      estimatedVatAmount +
      extraHandlingAmount,
  }
}

export function getLatestShowcaseSettlementQuote(showcaseId: string) {
  return getActiveQuote(showcaseId)
}

export function createSettlementQuoteFromBuyNowShowcase(input: {
  showcaseId: string
  bidderDisplayName?: string | null
  recipientEmail?: string | null
}) {
  const existing = getActiveQuote(input.showcaseId)

  if (existing) {
    return existing
  }

  const display = getAuctionShowcaseState(input.showcaseId)
  const auction = display.auction

  if (auction.auction_type !== "hybrid" || !auction.buy_now_price) {
    throw new Error("Buy Now is not available on this showcase auction.")
  }

  if (auction.auction_status !== "live") {
    throw new Error("This showcase auction is not currently live.")
  }

  const reservedBid = buyNowAuctionShowcase({
    showcaseId: input.showcaseId,
    bidderDisplayName: input.bidderDisplayName,
  })

  const quote: PurchaseSettlementQuoteRecord = {
    quote_id: crypto.randomUUID(),
    auction_id: auction.auction_id,
    artifact_id: auction.artifact_id,
    user_id: `showcase:${input.bidderDisplayName?.trim() || "guest"}`,
    source_type: "auction_buy_now",
    source_reference_id: reservedBid.bid_id,
    quote_status: "awaiting_shipping_info",
    destination_country: null,
    recipient_name: null,
    recipient_phone: null,
    recipient_email: input.recipientEmail?.trim() || null,
    address_line_1: null,
    address_line_2: null,
    city: null,
    state_region: null,
    postal_code: null,
    customs_id_type: null,
    customs_id_value: null,
    personal_customs_clearance_number: null,
    delivery_note: null,
    shipping_profile_code: "showcase_hybrid_default",
    shipping_profile_name: "Hybrid Demo Signature",
    package_type: "premium_box",
    carrier_preference: "fedex",
    estimated_package_weight_grams: 1200,
    estimated_package_length_cm: 42,
    estimated_package_width_cm: 32,
    estimated_package_height_cm: 10,
    ddp_supported: true,
    ddp_mode: "available",
    insurance_required: true,
    special_handling_required: true,
    customs_risk_tier: "medium",
    brokerage_fee_policy: "manual",
    customs_product_name_en: display.artifact.artifact_title,
    customs_product_type: "collectible apparel",
    hs_code_global_6: "621143",
    hs_code_local: null,
    country_of_origin: "KR",
    commercial_invoice_description: `${display.artifact.artifact_title} with provenance documentation`,
    material_composition: "Mixed fabric / display-safe collector packaging",
    contains_battery: false,
    contains_electronics: false,
    contains_leather: false,
    contains_fur: false,
    preferential_origin_eligible: false,
    declared_value_override: null,
    declared_currency: auction.currency ?? "KRW",
    base_item_amount: reservedBid.bid_amount,
    buyer_premium_amount: 0,
    shipping_amount: 0,
    insurance_amount: 0,
    estimated_duty_amount: 0,
    estimated_vat_amount: 0,
    extra_handling_amount: 0,
    total_payable_amount: reservedBid.bid_amount,
    currency: auction.currency ?? "KRW",
    is_demo: true,
    manual_review_required: false,
    review_reason: null,
    quote_generated_at: null,
    payment_requested_at: null,
    paid_at: null,
    expires_at: plusHours(72),
    created_at: nowIso(),
    updated_at: nowIso(),
  }

  return upsertQuote(quote)
}

export function saveShowcaseSettlementQuoteShippingInfo(input: SettlementShippingInput) {
  const { state, quote } = findQuote(input.quoteId)

  if (!quote) {
    throw new Error("Settlement quote not found.")
  }

  const nextQuote: PurchaseSettlementQuoteRecord = {
    ...quote,
    destination_country: input.destinationCountry.toUpperCase(),
    recipient_name: input.recipientName.trim(),
    recipient_phone: input.recipientPhone.trim(),
    recipient_email: input.recipientEmail?.trim() || quote.recipient_email,
    address_line_1: input.addressLine1.trim(),
    address_line_2: input.addressLine2?.trim() || null,
    city: input.city.trim(),
    state_region: input.stateRegion?.trim() || null,
    postal_code: input.postalCode.trim(),
    customs_id_type: input.customsIdType?.trim() || null,
    customs_id_value: input.customsIdValue?.trim() || null,
    personal_customs_clearance_number: input.personalCustomsClearanceNumber?.trim() || null,
    delivery_note: input.deliveryNote?.trim() || null,
    quote_status: "quote_preparing",
    updated_at: nowIso(),
  }

  writeState({
    quotes: state.quotes.map((item) => (item.quote_id === nextQuote.quote_id ? nextQuote : item)),
  })

  return nextQuote
}

export function generateShowcaseSettlementQuote(quoteId: string) {
  const { quote } = findQuote(quoteId)

  if (!quote) {
    throw new Error("Settlement quote not found.")
  }

  const country = quote.destination_country ?? "US"
  const reviewReason =
    country === "RU" || country === "BR"
      ? "This destination requires operations review before payment."
      : quote.manual_review_required
        ? quote.review_reason ?? "Manual review is required for this shipment."
        : null
  const amounts = calculateShowcaseQuote(quote)

  return upsertQuote({
    ...quote,
    shipping_amount: amounts.shippingAmount,
    insurance_amount: amounts.insuranceAmount,
    estimated_duty_amount: amounts.estimatedDutyAmount,
    estimated_vat_amount: amounts.estimatedVatAmount,
    extra_handling_amount: amounts.extraHandlingAmount,
    total_payable_amount: amounts.totalPayableAmount,
    manual_review_required: Boolean(reviewReason),
    review_reason: reviewReason,
    quote_status: reviewReason ? "review_required" : "payment_requested",
    quote_generated_at: nowIso(),
    payment_requested_at: reviewReason ? null : nowIso(),
    updated_at: nowIso(),
  })
}

export function markShowcaseSettlementQuotePaid(quoteId: string) {
  const { quote } = findQuote(quoteId)

  if (!quote) {
    throw new Error("Settlement quote not found.")
  }

  if (quote.quote_status !== "payment_requested" && quote.quote_status !== "paid") {
    throw new Error("Settlement quote is not ready for payment.")
  }

  return upsertQuote({
    ...quote,
    quote_status: "paid",
    paid_at: nowIso(),
    updated_at: nowIso(),
  })
}
