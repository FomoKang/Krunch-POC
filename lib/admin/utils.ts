import { STORAGE_BUCKET_FALLBACK } from "@/lib/admin/constants"

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const ISO_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}$/

export function normalizeOptionalString(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function normalizeRequiredString(value: string | null | undefined) {
  return value?.trim() ?? ""
}

export function normalizeOptionalNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function normalizeOptionalDate(value: string | null | undefined) {
  const trimmed = value?.trim()

  if (!trimmed) {
    return null
  }

  if (ISO_DATE_PATTERN.test(trimmed)) {
    return trimmed
  }

  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10)
}

export function normalizeOptionalDateTime(value: string | null | undefined) {
  const trimmed = value?.trim()

  if (!trimmed) {
    return null
  }

  const normalized = ISO_DATETIME_PATTERN.test(trimmed) ? trimmed.replace(" ", "T") : trimmed
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

export function toDateInputValue(value: string | null | undefined) {
  if (!value) {
    return ""
  }

  return value.slice(0, 10)
}

export function toDateTimeLocalValue(value: string | null | undefined) {
  if (!value) {
    return ""
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return ""
  }

  const offset = parsed.getTimezoneOffset()
  const local = new Date(parsed.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-"
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-"
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatMoney(value: number | null | undefined, currency = "USD") {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-"
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${currency} ${value.toLocaleString("en-US")}`
  }
}

export function titleCase(value: string | null | undefined) {
  if (!value) {
    return "-"
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function artifactDisplayName(input: {
  artifact_code?: string | null
  artifact_title?: string | null
  artist_name?: string | null
}) {
  const parts = [input.artifact_code, input.artifact_title, input.artist_name].filter(Boolean)
  return parts.join(" - ")
}

export function getMediaBucketName() {
  return process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim() || STORAGE_BUCKET_FALLBACK
}

export async function hashFile(file: File) {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
  const bytes = Array.from(new Uint8Array(hashBuffer))
  return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

export function buildStoragePath(artifactId: string, file: File, provenanceEventId?: string | null) {
  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : undefined
  const safeExtension = extension ? `.${extension}` : ""
  const eventSegment = provenanceEventId?.trim() ? provenanceEventId.trim() : "general"
  return `artifacts/${artifactId}/${eventSegment}/${Date.now()}-${crypto.randomUUID()}${safeExtension}`
}

export function downloadCsv(filename: string, rows: Array<Record<string, string | number | null | undefined>>) {
  if (!rows.length) {
    return
  }

  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const rawValue = row[header]
          const value = rawValue === null || rawValue === undefined ? "" : String(rawValue)
          return `"${value.replaceAll('"', '""')}"`
        })
        .join(","),
    ),
  ].join("\n")

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.URL.revokeObjectURL(url)
}

export function buildDisclosureRowKey(record: {
  artifact_id: string
  field_name: string
  field_value_reference: string
  created_at?: string | null
}) {
  return [record.artifact_id, record.field_name, record.field_value_reference, record.created_at ?? "new"].join(":")
}

export function buildMediaRowKey(record: {
  artifact_id: string
  file_url: string
  file_hash?: string | null
  uploaded_at?: string | null
}) {
  return record.file_hash || [record.artifact_id, record.file_url, record.uploaded_at ?? "uploaded"].join(":")
}
