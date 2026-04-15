import type { User } from "@supabase/supabase-js"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export type ProvenanceArtifactRecord = {
  id: string
  owner_user_id: string
  artifact_code: string
  artifact_title: string
  artifact_type: string
  artist_name: string | null
  group_name: string | null
  artist_group: string | null
  agency_name: string | null
  era_name: string | null
  estimated_year: number | null
  event_year: number | null
  first_documented_usage: string | null
  primary_event: string | null
  primary_provenance_event_id: string | null
  description: string | null
  physical_description: string | null
  material: string | null
  color: string | null
  usage_tier: string | null
  rarity_tier: string | null
  is_custom_made: boolean | null
  is_stage_used: boolean | null
  is_screen_used: boolean | null
  material_summary: string | null
  size_info: string | null
  colorway: string | null
  current_status: string | null
  current_holder: string | null
  current_owner_name: string | null
  storage_location: string | null
  public_visibility: string | null
  created_at: string | null
  internal_notes: string | null
  updated_at: string | null
}

export type ProvenanceEventRecord = {
  id: string
  owner_user_id: string
  event_id: string
  artifact_code: string
  artifact_id: string | null
  event_sequence: number | null
  event_type: string | null
  event_title: string | null
  event_date_start: string | null
  event_date_end: string | null
  event_location: string | null
  location: string | null
  artist_name: string | null
  agency_name: string | null
  stylist_name: string | null
  stylist_id: string | null
  production_entity: string | null
  production_entity_id: string | null
  source_confidence: string | null
  description: string | null
  evidence_summary: string | null
  media_link: string | null
  media_reference: string | null
  linked_auth_id: string | null
  is_primary_event: boolean | null
  visibility_level: string | null
  internal_notes: string | null
  created_at: string | null
  updated_at: string | null
}

export type ProvenanceAuthenticationRecord = {
  id: string
  owner_user_id: string
  auth_id: string
  artifact_code: string
  artifact_id: string | null
  auth_method: string | null
  auth_result: string | null
  auth_status: string | null
  auth_date: string | null
  sample_collected_at: string | null
  sample_location: string | null
  auth_provider: string | null
  forensic_ref: string | null
  forensic_reference: string | null
  certificate_id: string | null
  certificate_code: string | null
  certificate_public_url: string | null
  expiry_date: string | null
  visibility_level: string | null
  notes: string | null
  verified_by_user: string | null
  created_at: string | null
  updated_at: string | null
}

export type ProvenanceTransactionRecord = {
  id: string
  owner_user_id: string
  transaction_id: string
  artifact_code: string
  artifact_id: string | null
  auction_id: string | null
  transaction_type: string | null
  sale_title: string | null
  listing_date: string | null
  close_date: string | null
  opening_bid: number | null
  reserve_price: number | null
  hammer_price: number | null
  final_price: number | null
  buyer_fee_rate: string | null
  seller_fee_rate: string | null
  currency: string | null
  winner_name: string | null
  settlement_status: string | null
  visibility_level: string | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
}

export type ProvenanceCertificateRecord = {
  id: string
  owner_user_id: string
  certificate_id: string
  artifact_id: string
  auth_id: string | null
  certificate_code: string
  certificate_type: string | null
  issued_at: string | null
  revoked_at: string | null
  status: string
  public_url: string | null
  qr_payload: string | null
  created_at: string
}

export type UserProvenanceEnvelope = {
  main: ProvenanceArtifactRecord | null
  event: ProvenanceEventRecord[]
  authentication: ProvenanceAuthenticationRecord[]
  transaction: ProvenanceTransactionRecord[]
  certificate: ProvenanceCertificateRecord[]
  certificate_image_src: string
  certificate_video_src: string
  certificate_title_ko: string
  certificate_title_en: string
  certificate_subtitle_ko: string
  certificate_subtitle_en: string
}

const DEFAULT_MEDIA = {
  certificate_image_src: "/cap2.png",
  certificate_video_src: "/cap2-spin.mp4",
  certificate_title_ko: "디지털 인증서",
  certificate_title_en: "Digital Certificate",
  certificate_subtitle_ko: "KRUNCH가 검증한 아티스트 착용 아이템",
  certificate_subtitle_en: "Artist-worn item verified by KRUNCH",
}

const PROVENANCE_SCHEMA_TOKENS = [
  "provenance_",
  "certificates",
  "stylists",
  "ownership_chain",
  "auctions",
  "bid_history",
  "media_assets",
  "disclosure_controls",
]

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message?: unknown }).message ?? "Unknown provenance error.")
  }

  return String(error ?? "Unknown provenance error.")
}

function isMissingProvenanceSchemaError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase()

  return (
    message.includes("could not find the table") ||
    message.includes("does not exist") ||
    PROVENANCE_SCHEMA_TOKENS.some((token) => message.includes(token))
  )
}

function getUserTag(userId: string) {
  return userId.replace(/-/g, "").slice(0, 8).toUpperCase()
}

function buildDefaultSeed(user: User) {
  const userTag = getUserTag(user.id)
  const artifactCode = `KR-${userTag}-CAP-001`
  const eventId = `EVT-${userTag}-0001`
  const authId = `AUTH-${userTag}-0001`
  const transactionId = `TRX-${userTag}-0001`
  const certificateId = `CERT-${userTag}-0001`
  const certificateCode = `KCERT-${userTag}-0001`

  return {
    artifact: {
      owner_user_id: user.id,
      artifact_code: artifactCode,
      artifact_title: "PEACEMINUSONE1988-CAP",
      artifact_type: "stage_outfit",
      artist_name: "G-DRAGON",
      group_name: "BIGBANG",
      artist_group: "BIGBANG",
      agency_name: "Galaxy Corporation",
      era_name: "Ubermensch Seoul Opening Stage",
      estimated_year: 2026,
      event_year: 2026,
      first_documented_usage: "Ubermensch / TOO BAD stage",
      primary_event: "Ubermensch / TOO BAD stage",
      primary_provenance_event_id: null,
      description: "Artist-worn cap documented from the Ubermensch / TOO BAD stage.",
      physical_description: "Red burgundy cap with metal trim and stage wear marks.",
      material: "cotton / metal trim",
      color: "red burgundy",
      usage_tier: "BLACK",
      rarity_tier: "unique",
      is_custom_made: true,
      is_stage_used: true,
      is_screen_used: true,
      material_summary: "cotton / metal trim",
      size_info: "Free",
      colorway: "red burgundy",
      current_status: "in_storage",
      current_holder: "Krunch",
      current_owner_name: "Krunch",
      storage_location: "Vault A-03",
      public_visibility: "collector_only",
      created_at: "2026-04-13",
      internal_notes: "Additional photos needed",
      updated_at: "2026-04-13T00:00:00Z",
    },
    event: {
      owner_user_id: user.id,
      event_id: eventId,
      artifact_code: artifactCode,
      artifact_id: null,
      event_sequence: 1,
      event_type: "stage_used",
      event_title: "Ubermensch Seoul Opening Stage Used",
      event_date_start: "2026-01-12",
      event_date_end: "2026-01-12",
      event_location: "Seoul",
      location: "Seoul",
      artist_name: "G-DRAGON",
      agency_name: "Galaxy Corporation",
      stylist_name: "Mara Kim",
      stylist_id: null,
      production_entity: "PEACEMINUSONE",
      production_entity_id: null,
      source_confidence: "confirmed",
      description: "Primary stage-use event for the cap.",
      evidence_summary: "performance video, backstage photos, stylist confirmation",
      media_link: DEFAULT_MEDIA.certificate_video_src,
      media_reference: DEFAULT_MEDIA.certificate_video_src,
      linked_auth_id: null,
      is_primary_event: true,
      visibility_level: "public",
      internal_notes: "Sleeve detail capture needed",
      created_at: "2026-04-13T00:00:00Z",
      updated_at: "2026-04-13T00:00:00Z",
    },
    authentication: {
      owner_user_id: user.id,
      auth_id: authId,
      artifact_code: artifactCode,
      artifact_id: null,
      auth_method: "dna",
      auth_result: "verified",
      auth_status: "active",
      auth_date: "2026-04-13",
      sample_collected_at: "2026-04-13T00:00:00Z",
      sample_location: "Vault A-03",
      auth_provider: "Agency",
      forensic_ref: `DNA-2026-0413-${userTag}`,
      forensic_reference: `DNA-2026-0413-${userTag}`,
      certificate_id: certificateId,
      certificate_code: certificateCode,
      certificate_public_url: null,
      expiry_date: "-",
      visibility_level: "collector_only",
      notes: "DNA verification completed",
      verified_by_user: user.id,
      created_at: "2026-04-13T00:00:00Z",
      updated_at: "2026-04-13T00:00:00Z",
    },
    transaction: {
      owner_user_id: user.id,
      transaction_id: transactionId,
      artifact_code: artifactCode,
      artifact_id: null,
      auction_id: null,
      transaction_type: "primary_auction",
      sale_title: "Krunch Premium Auction Vol.1",
      listing_date: "2026-05-01",
      close_date: "2026-05-07",
      opening_bid: 10000000,
      reserve_price: 80000000,
      hammer_price: 52000000,
      final_price: 52000000,
      buyer_fee_rate: "0%",
      seller_fee_rate: "0%",
      currency: "KRW",
      winner_name: "Collector A",
      settlement_status: "settled",
      visibility_level: "public",
      notes: "No unpaid balance",
      created_at: "2026-04-13T00:00:00Z",
      updated_at: "2026-04-13T00:00:00Z",
    },
    certificate: {
      certificate_id: certificateId,
      certificate_code: certificateCode,
      certificate_type: "dna_verified",
      issued_at: "2026-04-13T00:00:00Z",
      revoked_at: null,
      status: "active",
      public_url: null,
      qr_payload: `krunch://certificate/${certificateCode}`,
    },
  }
}

export function getProvenanceErrorMessage(error: unknown) {
  const message = getErrorMessage(error)

  if (isMissingProvenanceSchemaError(error)) {
    return "The provenance tables are missing. Run supabase/migrations/20260415_create_provenance_tables.sql, supabase/migrations/20260415_2_create_certificate_table.sql, and supabase/migrations/20260415_3_align_policy_schema_and_add_support_tables.sql first."
  }

  return message
}

async function getCertificatesForArtifact(userId: string, artifactId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("owner_user_id", userId)
    .eq("artifact_id", artifactId)
    .order("issued_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false, nullsFirst: false })

  if (error) {
    throw new Error(getProvenanceErrorMessage(error))
  }

  return (data as ProvenanceCertificateRecord[] | null) ?? []
}

export async function getUserProvenance(userId: string): Promise<UserProvenanceEnvelope | null> {
  const supabase = getSupabaseBrowserClient()
  const { data: artifacts, error: artifactError } = await supabase
    .from("provenance_artifacts")
    .select("*")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: false, nullsFirst: false })
    .order("artifact_code", { ascending: true })

  if (artifactError) {
    throw new Error(getProvenanceErrorMessage(artifactError))
  }

  const main = (artifacts?.[0] as ProvenanceArtifactRecord | undefined) ?? null

  if (!main) {
    return null
  }

  const [eventsResponse, authenticationsResponse, transactionsResponse, certificates] = await Promise.all([
    supabase
      .from("provenance_events")
      .select("*")
      .eq("owner_user_id", userId)
      .eq("artifact_code", main.artifact_code)
      .order("event_date_start", { ascending: true, nullsFirst: false }),
    supabase
      .from("provenance_authentications")
      .select("*")
      .eq("owner_user_id", userId)
      .eq("artifact_code", main.artifact_code)
      .order("auth_date", { ascending: false, nullsFirst: false }),
    supabase
      .from("provenance_transactions")
      .select("*")
      .eq("owner_user_id", userId)
      .eq("artifact_code", main.artifact_code)
      .order("listing_date", { ascending: false, nullsFirst: false }),
    getCertificatesForArtifact(userId, main.id),
  ])

  if (eventsResponse.error) {
    throw new Error(getProvenanceErrorMessage(eventsResponse.error))
  }

  if (authenticationsResponse.error) {
    throw new Error(getProvenanceErrorMessage(authenticationsResponse.error))
  }

  if (transactionsResponse.error) {
    throw new Error(getProvenanceErrorMessage(transactionsResponse.error))
  }

  return {
    ...DEFAULT_MEDIA,
    main,
    event: (eventsResponse.data as ProvenanceEventRecord[] | null) ?? [],
    authentication: (authenticationsResponse.data as ProvenanceAuthenticationRecord[] | null) ?? [],
    transaction: (transactionsResponse.data as ProvenanceTransactionRecord[] | null) ?? [],
    certificate: certificates,
  }
}

async function ensureDefaultCertificateForUser(user: User, provenance: UserProvenanceEnvelope | null) {
  if (!provenance?.main || provenance.certificate.length > 0) {
    return provenance
  }

  const supabase = getSupabaseBrowserClient()
  const seed = buildDefaultSeed(user)
  const primaryAuthentication = provenance.authentication[0] ?? null
  const { error } = await supabase.from("certificates").upsert(
    {
      owner_user_id: user.id,
      certificate_id: seed.certificate.certificate_id,
      artifact_id: provenance.main.id,
      auth_id: primaryAuthentication?.id ?? null,
      certificate_code: seed.certificate.certificate_code,
      certificate_type: seed.certificate.certificate_type,
      issued_at: seed.certificate.issued_at,
      revoked_at: seed.certificate.revoked_at,
      status: seed.certificate.status,
      public_url: seed.certificate.public_url,
      qr_payload: seed.certificate.qr_payload,
    },
    { onConflict: "owner_user_id,certificate_id" },
  )

  if (error) {
    throw new Error(getProvenanceErrorMessage(error))
  }

  return getUserProvenance(user.id)
}

async function ensurePolicySupportTablesForUser(user: User, provenance: UserProvenanceEnvelope | null) {
  if (!provenance?.main) {
    return provenance
  }

  const supabase = getSupabaseBrowserClient()
  const seed = buildDefaultSeed(user)
  const main = provenance.main
  const primaryEvent = provenance.event[0] ?? null
  const primaryAuthentication = provenance.authentication[0] ?? null
  const primaryTransaction = provenance.transaction[0] ?? null
  let didMutate = false

  try {
    let stylistId = primaryEvent?.stylist_id ?? null
    const stylistName = (primaryEvent?.stylist_name ?? seed.event.stylist_name ?? "").trim()

    if (stylistName) {
      const { data: existingStylist, error: stylistLookupError } = await supabase
        .from("stylists")
        .select("stylist_id")
        .eq("stylist_name", stylistName)
        .order("created_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle()

      if (stylistLookupError) {
        throw stylistLookupError
      }

      if (existingStylist?.stylist_id) {
        stylistId = existingStylist.stylist_id
      } else {
        const { data: insertedStylist, error: stylistInsertError } = await supabase
          .from("stylists")
          .insert({
            stylist_name: stylistName,
            public_name: stylistName,
            public_credit_name: stylistName,
            agency_or_studio: primaryEvent?.agency_name ?? seed.event.agency_name,
            is_public_credit_allowed: true,
            visibility_default: primaryEvent?.visibility_level ?? "collector_only",
            risk_flag: "normal",
            notes: "Auto-seeded from provenance event.",
          })
          .select("stylist_id")
          .single()

        if (stylistInsertError) {
          throw stylistInsertError
        }

        stylistId = insertedStylist.stylist_id
        didMutate = true
      }
    }

    if (primaryEvent) {
      const nextEventUpdate: Record<string, unknown> = {}

      if (!primaryEvent.artifact_id) {
        nextEventUpdate.artifact_id = main.id
      }

      if (!primaryEvent.linked_auth_id && primaryAuthentication?.id) {
        nextEventUpdate.linked_auth_id = primaryAuthentication.id
      }

      if (stylistId && primaryEvent.stylist_id !== stylistId) {
        nextEventUpdate.stylist_id = stylistId
      }

      if (primaryEvent.is_primary_event == null) {
        nextEventUpdate.is_primary_event = true
      }

      if (Object.keys(nextEventUpdate).length > 0) {
        const { error: eventUpdateError } = await supabase
          .from("provenance_events")
          .update(nextEventUpdate)
          .eq("id", primaryEvent.id)

        if (eventUpdateError) {
          throw eventUpdateError
        }

        didMutate = true
      }
    }

    if (primaryEvent?.id && (!main.primary_provenance_event_id || !main.primary_event)) {
      const { error: artifactUpdateError } = await supabase
        .from("provenance_artifacts")
        .update({
          primary_provenance_event_id: main.primary_provenance_event_id ?? primaryEvent.id,
          primary_event: main.primary_event ?? primaryEvent.event_title ?? seed.event.event_title,
        })
        .eq("id", main.id)

      if (artifactUpdateError) {
        throw artifactUpdateError
      }

      didMutate = true
    }

    if (primaryAuthentication && !primaryAuthentication.artifact_id) {
      const { error: authenticationUpdateError } = await supabase
        .from("provenance_authentications")
        .update({ artifact_id: main.id })
        .eq("id", primaryAuthentication.id)

      if (authenticationUpdateError) {
        throw authenticationUpdateError
      }

      didMutate = true
    }

    const { data: ownershipRows, error: ownershipLookupError } = await supabase
      .from("ownership_chain")
      .select("ownership_id")
      .eq("artifact_id", main.id)
      .limit(1)

    if (ownershipLookupError) {
      throw ownershipLookupError
    }

    if (!ownershipRows?.length) {
      const { error: ownershipInsertError } = await supabase.from("ownership_chain").insert({
        artifact_id: main.id,
        owner_type: "krunch",
        owner_name: main.current_owner_name ?? main.current_holder ?? seed.artifact.current_owner_name,
        ownership_start_date: primaryEvent?.event_date_start ?? seed.event.event_date_start,
        ownership_end_date: null,
        is_current_owner: true,
        acquisition_method: "consignment",
        acquisition_price: primaryTransaction?.final_price ?? primaryTransaction?.hammer_price ?? null,
        currency: primaryTransaction?.currency ?? seed.transaction.currency,
        transfer_reference: primaryTransaction?.transaction_id ?? seed.transaction.transaction_id,
        settlement_reference: primaryTransaction?.transaction_id ?? seed.transaction.transaction_id,
        visibility_level: main.public_visibility ?? "collector_only",
        notes: "Auto-seeded from artifact master.",
      })

      if (ownershipInsertError) {
        throw ownershipInsertError
      }

      didMutate = true
    }

    let auctionId = primaryTransaction?.auction_id ?? null

    if (primaryTransaction) {
      const { data: existingAuction, error: auctionLookupError } = await supabase
        .from("auctions")
        .select("auction_id")
        .eq("artifact_id", main.id)
        .order("created_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle()

      if (auctionLookupError) {
        throw auctionLookupError
      }

      if (existingAuction?.auction_id) {
        auctionId = auctionId ?? existingAuction.auction_id
      }

      if (!auctionId) {
        const { data: insertedAuction, error: auctionInsertError } = await supabase
          .from("auctions")
          .insert({
            artifact_id: main.id,
            lot_number: primaryTransaction.transaction_id,
            auction_title: primaryTransaction.sale_title ?? seed.transaction.sale_title,
            auction_type: "premium",
            estimate_low: primaryTransaction.opening_bid,
            estimate_high: primaryTransaction.reserve_price,
            reserve_price: primaryTransaction.reserve_price,
            opening_bid: primaryTransaction.opening_bid,
            currency: primaryTransaction.currency ?? seed.transaction.currency,
            buyer_premium_rate: primaryTransaction.buyer_fee_rate,
            seller_fee_rate: primaryTransaction.seller_fee_rate,
            auction_start_time: primaryTransaction.listing_date ? `${primaryTransaction.listing_date}T00:00:00Z` : null,
            auction_end_time: primaryTransaction.close_date ? `${primaryTransaction.close_date}T00:00:00Z` : null,
            auction_status: "closed",
            settlement_status: primaryTransaction.settlement_status === "settled" ? "completed" : primaryTransaction.settlement_status,
            closing_reason: "completed_sale",
            guarantee_type: "none",
            guarantee_amount: null,
            hammer_price: primaryTransaction.hammer_price,
            final_price: primaryTransaction.final_price,
            winner_bidder_id: null,
          })
          .select("auction_id")
          .single()

        if (auctionInsertError) {
          throw auctionInsertError
        }

        auctionId = insertedAuction.auction_id
        didMutate = true
      }

      const nextTransactionUpdate: Record<string, unknown> = {}

      if (!primaryTransaction.artifact_id) {
        nextTransactionUpdate.artifact_id = main.id
      }

      if (auctionId && primaryTransaction.auction_id !== auctionId) {
        nextTransactionUpdate.auction_id = auctionId
      }

      if (!primaryTransaction.currency) {
        nextTransactionUpdate.currency = seed.transaction.currency
      }

      if (!primaryTransaction.created_at) {
        nextTransactionUpdate.created_at = seed.transaction.created_at
      }

      if (!primaryTransaction.updated_at) {
        nextTransactionUpdate.updated_at = seed.transaction.updated_at
      }

      if (Object.keys(nextTransactionUpdate).length > 0) {
        const { error: transactionUpdateError } = await supabase
          .from("provenance_transactions")
          .update(nextTransactionUpdate)
          .eq("id", primaryTransaction.id)

        if (transactionUpdateError) {
          throw transactionUpdateError
        }

        didMutate = true
      }
    }

    if (auctionId) {
      const { data: bidRows, error: bidLookupError } = await supabase
        .from("bid_history")
        .select("bid_id")
        .eq("auction_id", auctionId)
        .limit(1)

      if (bidLookupError) {
        throw bidLookupError
      }

      if (!bidRows?.length) {
        const { error: bidInsertError } = await supabase.from("bid_history").insert({
          auction_id: auctionId,
          bidder_id: null,
          bid_amount:
            primaryTransaction?.final_price ??
            primaryTransaction?.hammer_price ??
            primaryTransaction?.opening_bid ??
            0,
          currency: primaryTransaction?.currency ?? seed.transaction.currency,
          bid_time: primaryTransaction?.close_date ? `${primaryTransaction.close_date}T00:00:00Z` : seed.transaction.updated_at,
          bid_type: "live",
          bid_source_channel: "admin",
          auto_bid_max: null,
          is_anchor_bid: false,
          is_winning_bid: true,
          is_valid: true,
          notes: "Auto-seeded winning bid from provenance transaction.",
        })

        if (bidInsertError) {
          throw bidInsertError
        }

        didMutate = true
      }
    }

    const { data: mediaRows, error: mediaLookupError } = await supabase
      .from("media_assets")
      .select("media_id")
      .eq("artifact_id", main.id)
      .limit(1)

    if (mediaLookupError) {
      throw mediaLookupError
    }

    if (!mediaRows?.length) {
      const mediaUrl =
        primaryEvent?.media_reference ??
        primaryEvent?.media_link ??
        DEFAULT_MEDIA.certificate_image_src
      const isVideo = mediaUrl.toLowerCase().endsWith(".mp4")

      const { error: mediaInsertError } = await supabase.from("media_assets").insert({
        artifact_id: main.id,
        provenance_event_id: primaryEvent?.id ?? null,
        asset_type: isVideo ? "video" : "photo",
        file_url: mediaUrl,
        thumbnail_url: isVideo ? DEFAULT_MEDIA.certificate_image_src : mediaUrl,
        file_type: isVideo ? "video/mp4" : "image/png",
        file_hash: null,
        caption: `${main.artifact_title} supporting media`,
        source: "Krunch archive",
        copyright_status: "internal_review",
        visibility_level: primaryEvent?.visibility_level ?? main.public_visibility ?? "collector_only",
        sort_order: 1,
        is_primary: true,
        taken_at: primaryEvent?.event_date_start ? `${primaryEvent.event_date_start}T00:00:00Z` : null,
        uploaded_by: user.id,
      })

      if (mediaInsertError) {
        throw mediaInsertError
      }

      didMutate = true
    }

    const disclosureValue = primaryEvent?.stylist_name ?? stylistName

    if (disclosureValue) {
      const { data: disclosureRows, error: disclosureLookupError } = await supabase
        .from("disclosure_controls")
        .select("disclosure_id")
        .eq("artifact_id", main.id)
        .eq("field_name", "stylist")
        .limit(1)

      if (disclosureLookupError) {
        throw disclosureLookupError
      }

      if (!disclosureRows?.length) {
        const { error: disclosureInsertError } = await supabase.from("disclosure_controls").insert({
          artifact_id: main.id,
          field_name: "stylist",
          field_value_reference: disclosureValue,
          visibility_level: "collector_only",
          reason_code: "privacy",
          status: "active",
          approved_by: user.id,
          expires_at: null,
        })

        if (disclosureInsertError) {
          throw disclosureInsertError
        }

        didMutate = true
      }
    }
  } catch (error) {
    if (isMissingProvenanceSchemaError(error)) {
      return provenance
    }

    throw new Error(getProvenanceErrorMessage(error))
  }

  if (!didMutate) {
    return provenance
  }

  return getUserProvenance(user.id)
}

async function ensureAlignedProvenanceForUser(user: User, provenance: UserProvenanceEnvelope | null) {
  const withCertificate = await ensureDefaultCertificateForUser(user, provenance)
  return ensurePolicySupportTablesForUser(user, withCertificate)
}

export async function seedDefaultProvenanceForUser(user: User) {
  const supabase = getSupabaseBrowserClient()
  const seed = buildDefaultSeed(user)

  const { error: artifactError } = await supabase
    .from("provenance_artifacts")
    .upsert(seed.artifact, { onConflict: "owner_user_id,artifact_code" })

  if (artifactError) {
    throw new Error(getProvenanceErrorMessage(artifactError))
  }

  const { error: eventError } = await supabase
    .from("provenance_events")
    .upsert(seed.event, { onConflict: "owner_user_id,event_id" })

  if (eventError) {
    throw new Error(getProvenanceErrorMessage(eventError))
  }

  const { error: authenticationError } = await supabase
    .from("provenance_authentications")
    .upsert(seed.authentication, { onConflict: "owner_user_id,auth_id" })

  if (authenticationError) {
    throw new Error(getProvenanceErrorMessage(authenticationError))
  }

  const { error: transactionError } = await supabase
    .from("provenance_transactions")
    .upsert(seed.transaction, { onConflict: "owner_user_id,transaction_id" })

  if (transactionError) {
    throw new Error(getProvenanceErrorMessage(transactionError))
  }

  const provenance = await getUserProvenance(user.id)
  return ensureAlignedProvenanceForUser(user, provenance)
}

export async function ensureUserProvenance(user: User) {
  const existing = await getUserProvenance(user.id)

  if (existing) {
    return ensureAlignedProvenanceForUser(user, existing)
  }

  return seedDefaultProvenanceForUser(user)
}
