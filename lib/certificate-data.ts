export type CertificateField = {
  labelKo: string
  labelEn: string
  valueKo: string
  valueEn: string
}

export type CertificateSheet = {
  id: string
  labelKo: string
  labelEn: string
  fields: CertificateField[]
}

export type GalleryCertificate = {
  titleKo: string
  titleEn: string
  subtitleKo: string
  subtitleEn: string
  serialNumber: string
  lastPriceKo: string
  lastPriceEn: string
  dnaVerified: boolean
  tierLabelKo: string
  tierLabelEn: string
  verificationBadgeKo: string
  verificationBadgeEn: string
  videoSrc: string
  sheets: CertificateSheet[]
}

export type GalleryItem = {
  id: number
  image: string | null
  name: string
  certificate?: GalleryCertificate
}

type ProfileSource = Record<string, unknown> | null | undefined
type SourceRow = Record<string, unknown>
type LocalizedValue = { ko: string; en: string }
type SheetId = "main" | "event" | "authentication" | "transaction" | "certificate"
type SheetFieldDefinition = {
  key: string
  labelKo: string
  labelEn: string
  aliases?: string[]
}
type SheetDefinition = {
  id: SheetId
  labelKo: string
  labelEn: string
  aliases: string[]
  fields: SheetFieldDefinition[]
  repeatable?: boolean
}

const DEFAULT_MEDIA = {
  certificate_image_src: "/cap2.png",
  certificate_video_src: "/cap2-spin.mp4",
  certificate_title_ko: "디지털 인증서",
  certificate_title_en: "Digital Certificate",
  certificate_subtitle_ko: "KRUNCH가 검증한 아티스트 착용 아이템",
  certificate_subtitle_en: "Artist-worn item verified by KRUNCH",
}

const SHEETS: SheetDefinition[] = [
  {
    id: "main",
    labelKo: "메인 시트",
    labelEn: "Main Sheet",
    aliases: ["artifact", "artifact_master", "master"],
    fields: [
      { key: "artifact_code", labelKo: "아티팩트 코드", labelEn: "Artifact Code" },
      { key: "artifact_title", labelKo: "아티팩트명", labelEn: "Artifact Title" },
      { key: "artifact_type", labelKo: "아티팩트 유형", labelEn: "Artifact Type" },
      { key: "artist_name", labelKo: "아티스트", labelEn: "Artist Name" },
      { key: "group_name", labelKo: "그룹명", labelEn: "Group Name", aliases: ["artist_group"] },
      { key: "agency_name", labelKo: "소속사", labelEn: "Agency Name" },
      { key: "era_name", labelKo: "시대 / 활동명", labelEn: "Era Name" },
      { key: "estimated_year", labelKo: "대표 연도", labelEn: "Estimated Year", aliases: ["event_year"] },
      { key: "first_documented_usage", labelKo: "최초 확인 사용", labelEn: "First Documented Usage", aliases: ["primary_event"] },
      { key: "usage_tier", labelKo: "사용 티어", labelEn: "Usage Tier", aliases: ["rarity_tier"] },
      { key: "is_custom_made", labelKo: "커스텀 제작", labelEn: "Custom Made" },
      { key: "is_stage_used", labelKo: "무대 사용", labelEn: "Stage Used" },
      { key: "is_screen_used", labelKo: "방송 사용", labelEn: "Screen Used" },
      { key: "material_summary", labelKo: "소재", labelEn: "Material Summary", aliases: ["material"] },
      { key: "size_info", labelKo: "사이즈", labelEn: "Size Info" },
      { key: "colorway", labelKo: "컬러웨이", labelEn: "Colorway", aliases: ["color"] },
      { key: "current_status", labelKo: "현재 상태", labelEn: "Current Status" },
      { key: "current_holder", labelKo: "현재 보유자", labelEn: "Current Holder", aliases: ["current_owner_name"] },
      { key: "storage_location", labelKo: "보관 위치", labelEn: "Storage Location" },
      { key: "public_visibility", labelKo: "공개 범위", labelEn: "Public Visibility" },
      { key: "created_at", labelKo: "등록일", labelEn: "Created At" },
      { key: "internal_notes", labelKo: "내부 메모", labelEn: "Internal Notes", aliases: ["description", "physical_description"] },
    ],
  },
  {
    id: "event",
    labelKo: "이벤트 시트",
    labelEn: "Event Sheet",
    aliases: ["events", "provenance_event", "provenance_events"],
    repeatable: true,
    fields: [
      { key: "event_id", labelKo: "이벤트 ID", labelEn: "Event ID" },
      { key: "artifact_code", labelKo: "연결 아티팩트 코드", labelEn: "Artifact Code" },
      { key: "event_type", labelKo: "이벤트 유형", labelEn: "Event Type" },
      { key: "event_title", labelKo: "이벤트명", labelEn: "Event Title" },
      { key: "event_date_start", labelKo: "시작일", labelEn: "Start Date" },
      { key: "event_date_end", labelKo: "종료일", labelEn: "End Date" },
      { key: "event_location", labelKo: "장소", labelEn: "Location", aliases: ["location"] },
      { key: "artist_name", labelKo: "아티스트", labelEn: "Artist Name" },
      { key: "stylist_name", labelKo: "스타일리스트", labelEn: "Stylist Name" },
      { key: "production_entity", labelKo: "제작 주체", labelEn: "Production Entity" },
      { key: "source_confidence", labelKo: "출처 신뢰도", labelEn: "Source Confidence" },
      { key: "evidence_summary", labelKo: "근거 요약", labelEn: "Evidence Summary" },
      { key: "media_reference", labelKo: "미디어 레퍼런스", labelEn: "Media Reference", aliases: ["media_link"] },
      { key: "visibility_level", labelKo: "공개 범위", labelEn: "Visibility Level" },
      { key: "internal_notes", labelKo: "내부 메모", labelEn: "Internal Notes", aliases: ["description"] },
    ],
  },
  {
    id: "authentication",
    labelKo: "인증 시트",
    labelEn: "Authentication Sheet",
    aliases: ["auth", "authentications", "provenance_authentication", "provenance_authentications"],
    repeatable: true,
    fields: [
      { key: "auth_id", labelKo: "인증 ID", labelEn: "Authentication ID" },
      { key: "artifact_code", labelKo: "연결 아티팩트 코드", labelEn: "Artifact Code" },
      { key: "auth_method", labelKo: "인증 방식", labelEn: "Authentication Method" },
      { key: "auth_result", labelKo: "인증 결과", labelEn: "Authentication Result" },
      { key: "auth_status", labelKo: "인증 상태", labelEn: "Authentication Status" },
      { key: "auth_date", labelKo: "인증일", labelEn: "Authentication Date" },
      { key: "auth_provider", labelKo: "인증 기관", labelEn: "Authentication Provider" },
      { key: "forensic_reference", labelKo: "포렌식 참조", labelEn: "Forensic Reference", aliases: ["forensic_ref"] },
      { key: "certificate_code", labelKo: "인증서 코드", labelEn: "Certificate Code" },
      { key: "expiry_date", labelKo: "만료일", labelEn: "Expiry Date" },
      { key: "visibility_level", labelKo: "공개 범위", labelEn: "Visibility Level" },
      { key: "notes", labelKo: "상세 메모", labelEn: "Notes" },
    ],
  },
  {
    id: "transaction",
    labelKo: "거래 시트",
    labelEn: "Auction / Transaction Sheet",
    aliases: ["auction", "transactions", "provenance_transaction", "provenance_transactions", "auction_transaction"],
    repeatable: true,
    fields: [
      { key: "transaction_id", labelKo: "거래 ID", labelEn: "Transaction ID" },
      { key: "artifact_code", labelKo: "연결 아티팩트 코드", labelEn: "Artifact Code" },
      { key: "transaction_type", labelKo: "거래 유형", labelEn: "Transaction Type" },
      { key: "sale_title", labelKo: "세일 / 경매명", labelEn: "Sale Title" },
      { key: "listing_date", labelKo: "등록일", labelEn: "Listing Date" },
      { key: "close_date", labelKo: "마감일", labelEn: "Close Date" },
      { key: "opening_bid", labelKo: "시작가", labelEn: "Opening Bid" },
      { key: "reserve_price", labelKo: "리저브가", labelEn: "Reserve Price" },
      { key: "hammer_price", labelKo: "낙찰가", labelEn: "Hammer Price" },
      { key: "final_price", labelKo: "최종가", labelEn: "Final Price" },
      { key: "buyer_fee_rate", labelKo: "구매자 수수료", labelEn: "Buyer Fee Rate" },
      { key: "seller_fee_rate", labelKo: "판매자 수수료", labelEn: "Seller Fee Rate" },
      { key: "winner_name", labelKo: "낙찰자", labelEn: "Winner Name" },
      { key: "settlement_status", labelKo: "정산 상태", labelEn: "Settlement Status" },
      { key: "visibility_level", labelKo: "공개 범위", labelEn: "Visibility Level" },
      { key: "notes", labelKo: "메모", labelEn: "Notes" },
    ],
  },
  {
    id: "certificate",
    labelKo: "인증서 시트",
    labelEn: "Certificate Sheet",
    aliases: ["certificates", "provenance_certificate", "provenance_certificates"],
    repeatable: true,
    fields: [
      { key: "certificate_id", labelKo: "인증서 ID", labelEn: "Certificate ID" },
      { key: "artifact_id", labelKo: "아티팩트 ID", labelEn: "Artifact ID" },
      { key: "auth_id", labelKo: "인증 ID", labelEn: "Authentication ID" },
      { key: "certificate_code", labelKo: "인증서 코드", labelEn: "Certificate Code" },
      { key: "certificate_type", labelKo: "인증서 유형", labelEn: "Certificate Type" },
      { key: "issued_at", labelKo: "발급일", labelEn: "Issued At" },
      { key: "revoked_at", labelKo: "폐기일", labelEn: "Revoked At" },
      { key: "status", labelKo: "상태", labelEn: "Status" },
      { key: "public_url", labelKo: "공개 URL", labelEn: "Public URL" },
      { key: "qr_payload", labelKo: "QR Payload", labelEn: "QR Payload" },
      { key: "created_at", labelKo: "생성일", labelEn: "Created At" },
    ],
  },
]

const FALLBACK_ROWS: Record<SheetId, SourceRow[]> = {
  main: [
    {
      artifact_code: "KR-GD-UBM-2026-CAP-001",
      artifact_title: "PEACEMINUSONE1988-CAP",
      artifact_type: "stage_outfit",
      artist_name: "G-DRAGON",
      group_name: "BIGBANG",
      agency_name: "Galaxy Corporation",
      era_name: "Ubermensch Seoul Opening Stage",
      estimated_year: 2026,
      first_documented_usage: "Ubermensch / TOO BAD stage",
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
      storage_location: "Vault A-03",
      public_visibility: "collector_only",
      created_at: "2026-04-13",
      internal_notes: "Additional photos needed",
    },
  ],
  event: [
    {
      event_id: "EVT-0001",
      artifact_code: "KR-GD-UBM-2026-CAP-001",
      event_type: "stage_used",
      event_title: "Ubermensch Seoul Opening Stage Used",
      event_date_start: "2026-01-12",
      event_date_end: "2026-01-12",
      event_location: "Seoul",
      artist_name: "G-DRAGON",
      stylist_name: "Mara Kim",
      production_entity: "PEACEMINUSONE",
      source_confidence: "confirmed",
      evidence_summary: "performance video, backstage photos, stylist confirmation",
      media_reference: "/cap2-spin.mp4",
      visibility_level: "public",
      internal_notes: "Sleeve detail capture needed",
    },
  ],
  authentication: [
    {
      auth_id: "AUTH-0001",
      artifact_code: "KR-GD-UBM-2026-CAP-001",
      auth_method: "dna",
      auth_result: "verified",
      auth_status: "active",
      auth_date: "2026-04-13",
      auth_provider: "Agency",
      forensic_reference: "DNA-2026-0413-01",
      certificate_code: "KCERT-0001",
      expiry_date: "-",
      visibility_level: "collector_only",
      notes: "DNA verification completed",
    },
  ],
  transaction: [
    {
      transaction_id: "TRX-0001",
      artifact_code: "KR-GD-UBM-2026-CAP-001",
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
      winner_name: "Collector A",
      settlement_status: "settled",
      visibility_level: "public",
      notes: "No unpaid balance",
    },
  ],
  certificate: [
    {
      certificate_id: "CERT-0001",
      artifact_id: "artifact-demo-001",
      auth_id: "auth-demo-001",
      certificate_code: "KCERT-0001",
      certificate_type: "dna_verified",
      issued_at: "2026-04-13",
      revoked_at: "-",
      status: "active",
      public_url: "-",
      qr_payload: "krunch://certificate/KCERT-0001",
      created_at: "2026-04-13",
    },
  ],
}

const EXTRA_GALLERY_ITEMS: GalleryItem[] = [
  { id: 2, image: null, name: "Archive Slot 02" },
  { id: 3, image: null, name: "Archive Slot 03" },
  { id: 4, image: null, name: "Archive Slot 04" },
  { id: 5, image: null, name: "Archive Slot 05" },
  { id: 6, image: null, name: "Archive Slot 06" },
]

const ENUM_VALUE_LABELS: Record<string, LocalizedValue> = {
  black: { ko: "블랙", en: "Black" },
  pink: { ko: "핑크", en: "Pink" },
  unique: { ko: "유니크", en: "Unique" },
  highly_limited: { ko: "극소량", en: "Highly Limited" },
  limited: { ko: "리미티드", en: "Limited" },
  replicated: { ko: "복제본", en: "Replicated" },
  archived: { ko: "보관 종료", en: "Archived" },
  in_storage: { ko: "보관 중", en: "In Storage" },
  on_auction: { ko: "경매 진행 중", en: "On Auction" },
  sold: { ko: "판매 완료", en: "Sold" },
  retired: { ko: "은퇴", en: "Retired" },
  disputed: { ko: "분쟁 중", en: "Disputed" },
  created: { ko: "등록", en: "Created" },
  fitted: { ko: "피팅", en: "Fitted" },
  stage_used: { ko: "무대 사용", en: "Stage Used" },
  broadcast_used: { ko: "방송 사용", en: "Broadcast Used" },
  tour_used: { ko: "투어 사용", en: "Tour Used" },
  photographed: { ko: "촬영", en: "Photographed" },
  authenticated: { ko: "인증 완료", en: "Authenticated" },
  transferred: { ko: "이전", en: "Transferred" },
  auctioned: { ko: "경매 출품", en: "Auctioned" },
  exhibited: { ko: "전시", en: "Exhibited" },
  confirmed: { ko: "확정", en: "Confirmed" },
  probable: { ko: "개연성 높음", en: "Probable" },
  internal_only: { ko: "내부 전용", en: "Internal Only" },
  public: { ko: "공개", en: "Public" },
  collector_only: { ko: "컬렉터 전용", en: "Collector Only" },
  dna: { ko: "DNA", en: "DNA" },
  ucnp: { ko: "UCNP", en: "UCNP" },
  nfc: { ko: "NFC", en: "NFC" },
  visual: { ko: "비주얼 검증", en: "Visual" },
  document: { ko: "문서 검증", en: "Document" },
  stylist_confirmation: { ko: "스타일리스트 확인", en: "Stylist Confirmation" },
  agency_confirmation: { ko: "소속사 확인", en: "Agency Confirmation" },
  external_expert: { ko: "외부 전문가", en: "External Expert" },
  verified: { ko: "검증 완료", en: "Verified" },
  partially_verified: { ko: "부분 검증", en: "Partially Verified" },
  inconclusive: { ko: "판정 보류", en: "Inconclusive" },
  failed: { ko: "검증 실패", en: "Failed" },
  active: { ko: "활성", en: "Active" },
  pending: { ko: "대기", en: "Pending" },
  superseded: { ko: "대체됨", en: "Superseded" },
  revoked: { ko: "폐기", en: "Revoked" },
  krunch_certified: { ko: "크런치 인증", en: "Krunch Certified" },
  dna_verified: { ko: "DNA 인증", en: "DNA Verified" },
  provenance_verified: { ko: "프로비넌스 인증", en: "Provenance Verified" },
  market_verified: { ko: "마켓 검증", en: "Market Verified" },
  primary_auction: { ko: "프라이머리 경매", en: "Primary Auction" },
  secondary_sale: { ko: "세컨더리 세일", en: "Secondary Sale" },
  private_sale: { ko: "프라이빗 세일", en: "Private Sale" },
  consignment_sale: { ko: "위탁 판매", en: "Consignment Sale" },
  transfer: { ko: "양도", en: "Transfer" },
  settled: { ko: "정산 완료", en: "Settled" },
  completed: { ko: "완료", en: "Completed" },
}

const PRICE_FIELDS = new Set(["opening_bid", "reserve_price", "hammer_price", "final_price"])
const DATE_FIELDS = new Set([
  "created_at",
  "issued_at",
  "revoked_at",
  "auth_date",
  "expiry_date",
  "listing_date",
  "close_date",
  "event_date_start",
  "event_date_end",
])

function isRecord(value: unknown): value is SourceRow {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function parseMaybeJson(value: string) {
  try {
    return JSON.parse(value) as unknown
  } catch {
    return null
  }
}

function coerceRows(value: unknown): SourceRow[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => coerceRows(item))
  }

  if (isRecord(value)) {
    return [value]
  }

  if (typeof value === "string") {
    const parsed = parseMaybeJson(value)
    if (parsed !== null) {
      return coerceRows(parsed)
    }
  }

  return []
}

function uniqueRows(rows: SourceRow[]) {
  const seen = new Set<string>()
  return rows.filter((row) => {
    const key = JSON.stringify(row)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

function getNestedContainers(source: ProfileSource) {
  if (!source) {
    return []
  }

  return ["provenance", "provenance_data", "certificate_data", "gallery_certificate"]
    .map((key) => source[key])
    .flatMap((value) => (isRecord(value) ? [value] : []))
}

function buildPrefixes(definition: SheetDefinition) {
  const prefixes = new Set<string>([
    definition.id,
    ...definition.aliases,
    `provenance_${definition.id}`,
    ...definition.aliases.map((alias) => `provenance_${alias}`),
  ])

  if (definition.id === "main") {
    prefixes.add("artifact")
    prefixes.add("artifact_master")
    prefixes.add("provenance_artifact")
    prefixes.add("provenance_artifact_master")
  }

  return Array.from(prefixes)
}

function collectByPrefixes(source: SourceRow, prefixes: string[]) {
  const row: SourceRow = {}

  for (const [key, value] of Object.entries(source)) {
    for (const prefix of prefixes) {
      const marker = `${prefix}_`
      if (!key.startsWith(marker)) {
        continue
      }

      const strippedKey = key.slice(marker.length)
      if (!strippedKey) {
        continue
      }

      row[strippedKey] = value
      break
    }
  }

  return row
}

function collectByFieldKeys(source: SourceRow, fields: SheetFieldDefinition[]) {
  const row: SourceRow = {}

  for (const field of fields) {
    const candidates = [field.key, ...(field.aliases ?? [])]

    for (const candidate of candidates) {
      if (!(candidate in source)) {
        continue
      }

      row[candidate] = source[candidate]
      break
    }
  }

  return row
}

function buildRowsForSheet(source: ProfileSource, definition: SheetDefinition) {
  if (!source) {
    return FALLBACK_ROWS[definition.id]
  }

  const containers = [source, ...getNestedContainers(source)]
  const rows: SourceRow[] = []

  for (const container of containers) {
    for (const key of [definition.id, ...definition.aliases]) {
      rows.push(...coerceRows(container[key]))
    }

    const fieldRow = collectByFieldKeys(container, definition.fields)
    if (Object.keys(fieldRow).length > 0) {
      rows.push(fieldRow)
    }

    const prefixedRow = collectByPrefixes(container, buildPrefixes(definition))
    if (Object.keys(prefixedRow).length > 0) {
      rows.push(prefixedRow)
    }
  }

  const deduped = uniqueRows(rows)
  return deduped.length > 0 ? deduped : FALLBACK_ROWS[definition.id]
}

function readProfileString(profile: ProfileSource, keys: string[], fallback: string) {
  if (!profile) {
    return fallback
  }

  for (const key of keys) {
    const value = profile[key]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return fallback
}

function readFirstValue(rows: SourceRow[] | undefined, keys: string[]) {
  if (!rows?.length) {
    return null
  }

  for (const row of rows) {
    for (const key of keys) {
      const value = row[key]
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return value
      }
    }
  }

  return null
}

function formatDisplayValue(fieldKey: string, value: unknown): LocalizedValue | null {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value === "boolean") {
    return value ? { ko: "예", en: "Yes" } : { ko: "아니오", en: "No" }
  }

  const raw = String(value).trim()
  if (!raw) {
    return null
  }

  const mapped = ENUM_VALUE_LABELS[raw.toLowerCase()]
  if (mapped) {
    return mapped
  }

  if (PRICE_FIELDS.has(fieldKey)) {
    const numeric = Number(raw.replace(/,/g, ""))
    if (Number.isFinite(numeric)) {
      return {
        ko: `${numeric.toLocaleString("ko-KR")} KRW`,
        en: `${numeric.toLocaleString("en-US")} KRW`,
      }
    }
  }

  if (DATE_FIELDS.has(fieldKey) && raw.includes("T")) {
    return { ko: raw.slice(0, 10), en: raw.slice(0, 10) }
  }

  return { ko: raw, en: raw }
}

function buildSheet(definition: SheetDefinition, row: SourceRow, index: number, totalRows: number) {
  const fields = definition.fields.flatMap<CertificateField>((field) => {
    const value = readFirstValue([row], [field.key, ...(field.aliases ?? [])])
    const formatted = formatDisplayValue(field.key, value)

    if (!formatted) {
      return []
    }

    return [
      {
        labelKo: field.labelKo,
        labelEn: field.labelEn,
        valueKo: formatted.ko,
        valueEn: formatted.en,
      },
    ]
  })

  if (!fields.length) {
    fields.push({
      labelKo: "상태",
      labelEn: "Status",
      valueKo: "데이터 준비 중",
      valueEn: "Preparing data",
    })
  }

  const suffix = totalRows > 1 ? ` ${index + 1}` : ""
  return {
    id: `${definition.id}-${index}`,
    labelKo: `${definition.labelKo}${suffix}`,
    labelEn: `${definition.labelEn}${suffix}`,
    fields,
  }
}

function buildProvenanceState(profile: ProfileSource) {
  const rowsBySheet = new Map<SheetId, SourceRow[]>()
  const sheets: CertificateSheet[] = []

  for (const definition of SHEETS) {
    const rows = buildRowsForSheet(profile, definition)
    rowsBySheet.set(definition.id, rows)

    const displayRows = definition.repeatable ? rows : rows.slice(0, 1)
    displayRows.forEach((row, index) => {
      sheets.push(buildSheet(definition, row, index, displayRows.length))
    })
  }

  return { rowsBySheet, sheets }
}

function buildVerificationBadge(
  authRows: SourceRow[] | undefined,
  certificateRows: SourceRow[] | undefined,
) {
  const certificateType = String(readFirstValue(certificateRows, ["certificate_type"]) ?? "").trim().toLowerCase()
  const certificateStatus = String(readFirstValue(certificateRows, ["status"]) ?? "").trim().toLowerCase()
  const authResult = String(readFirstValue(authRows, ["auth_result"]) ?? "").trim().toLowerCase()

  if (certificateStatus === "active" && certificateType === "dna_verified") {
    return { badgeKo: "DNA 인증", badgeEn: "DNA Verified", isPositive: true }
  }

  if (certificateStatus === "active" && certificateType === "krunch_certified") {
    return { badgeKo: "크런치 인증", badgeEn: "Krunch Certified", isPositive: true }
  }

  if (authResult === "verified") {
    return { badgeKo: "인증 완료", badgeEn: "Verified", isPositive: true }
  }

  if (authResult === "partially_verified") {
    return { badgeKo: "부분 인증", badgeEn: "Partially Verified", isPositive: true }
  }

  if (authResult === "failed") {
    return { badgeKo: "검증 실패", badgeEn: "Verification Failed", isPositive: false }
  }

  return { badgeKo: "검증 대기", badgeEn: "Verification Pending", isPositive: false }
}

function buildTierLabel(mainRows: SourceRow[] | undefined) {
  const value = readFirstValue(mainRows, ["rarity_tier", "usage_tier"])
  const formatted = formatDisplayValue("usage_tier", value)

  if (!formatted) {
    return { ko: "BLACK Tier", en: "BLACK Tier" }
  }

  return {
    ko: `${formatted.ko} Tier`,
    en: `${formatted.en} Tier`,
  }
}

function buildPriceLine(transactionRows: SourceRow[] | undefined) {
  const rawValue =
    readFirstValue(transactionRows, ["final_price"]) ??
    readFirstValue(transactionRows, ["hammer_price"]) ??
    readFirstValue(transactionRows, ["reserve_price"])
  const formatted = formatDisplayValue("final_price", rawValue)

  if (!formatted) {
    return {
      ko: "최종 거래가 : 52,000,000 KRW",
      en: "Final Price : 52,000,000 KRW",
    }
  }

  return {
    ko: `최종 거래가 : ${formatted.ko}`,
    en: `Final Price : ${formatted.en}`,
  }
}

export function buildProfileGalleryItems(profile: ProfileSource) {
  const provenanceState = buildProvenanceState(profile)
  const mainRows = provenanceState.rowsBySheet.get("main")
  const authRows = provenanceState.rowsBySheet.get("authentication")
  const transactionRows = provenanceState.rowsBySheet.get("transaction")
  const certificateRows = provenanceState.rowsBySheet.get("certificate")

  const artifactTitle =
    String(readFirstValue(mainRows, ["artifact_title"]) ?? "").trim() ||
    readProfileString(profile, ["certificate_item_name", "item_name"], "PEACEMINUSONE1988-CAP")
  const serialNumber =
    String(readFirstValue(certificateRows, ["certificate_code"]) ?? "").trim() ||
    String(readFirstValue(authRows, ["certificate_code"]) ?? "").trim() ||
    String(readFirstValue(mainRows, ["artifact_code"]) ?? "").trim() ||
    readProfileString(profile, ["certificate_serial_number", "serial_number"], "KCERT-0001")
  const priceLine = buildPriceLine(transactionRows)
  const tierLabel = buildTierLabel(mainRows)
  const verificationBadge = buildVerificationBadge(authRows, certificateRows)

  const certificate: GalleryCertificate = {
    titleKo: readProfileString(profile, ["certificate_title_ko"], DEFAULT_MEDIA.certificate_title_ko),
    titleEn: readProfileString(profile, ["certificate_title_en"], DEFAULT_MEDIA.certificate_title_en),
    subtitleKo: readProfileString(profile, ["certificate_subtitle_ko"], DEFAULT_MEDIA.certificate_subtitle_ko),
    subtitleEn: readProfileString(profile, ["certificate_subtitle_en"], DEFAULT_MEDIA.certificate_subtitle_en),
    serialNumber,
    lastPriceKo: priceLine.ko,
    lastPriceEn: priceLine.en,
    dnaVerified: verificationBadge.isPositive,
    tierLabelKo: tierLabel.ko,
    tierLabelEn: tierLabel.en,
    verificationBadgeKo: verificationBadge.badgeKo,
    verificationBadgeEn: verificationBadge.badgeEn,
    videoSrc: readProfileString(profile, ["certificate_video_src"], DEFAULT_MEDIA.certificate_video_src),
    sheets: provenanceState.sheets,
  }

  return [
    {
      id: 1,
      image: readProfileString(profile, ["certificate_image_src"], DEFAULT_MEDIA.certificate_image_src),
      name: artifactTitle,
      certificate,
    },
    ...EXTRA_GALLERY_ITEMS,
  ]
}
