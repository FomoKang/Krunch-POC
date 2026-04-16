import { Badge } from "@/components/ui/badge"
import { titleCase } from "@/lib/admin/utils"

const STATUS_CLASS_MAP: Record<string, string> = {
  BLACK: "border-violet-400/30 bg-violet-500/15 text-violet-100",
  PINK: "border-pink-400/30 bg-pink-500/15 text-pink-100",
  archived: "border-zinc-500/30 bg-zinc-500/15 text-zinc-200",
  listed: "border-cyan-400/30 bg-cyan-500/15 text-cyan-100",
  in_storage: "border-sky-400/30 bg-sky-500/15 text-sky-100",
  on_auction: "border-amber-400/30 bg-amber-500/15 text-amber-100",
  sold: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
  retired: "border-slate-400/30 bg-slate-500/15 text-slate-100",
  disputed: "border-rose-400/30 bg-rose-500/15 text-rose-100",
  public: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
  collector_only: "border-indigo-400/30 bg-indigo-500/15 text-indigo-100",
  internal_only: "border-zinc-500/30 bg-zinc-500/15 text-zinc-200",
  confirmed: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
  probable: "border-amber-400/30 bg-amber-500/15 text-amber-100",
  verified: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
  partially_verified: "border-amber-400/30 bg-amber-500/15 text-amber-100",
  inconclusive: "border-zinc-500/30 bg-zinc-500/15 text-zinc-200",
  failed: "border-rose-400/30 bg-rose-500/15 text-rose-100",
  draft: "border-zinc-500/30 bg-zinc-500/15 text-zinc-200",
  scheduled: "border-sky-400/30 bg-sky-500/15 text-sky-100",
  live: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
  ended: "border-zinc-500/30 bg-zinc-500/15 text-zinc-200",
  closed: "border-zinc-500/30 bg-zinc-500/15 text-zinc-200",
  cancelled: "border-rose-400/30 bg-rose-500/15 text-rose-100",
  settled: "border-indigo-400/30 bg-indigo-500/15 text-indigo-100",
  active: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
  superseded: "border-amber-400/30 bg-amber-500/15 text-amber-100",
  revoked: "border-rose-400/30 bg-rose-500/15 text-rose-100",
  domestic_only: "border-sky-400/30 bg-sky-500/15 text-sky-100",
  review_required: "border-amber-400/30 bg-amber-500/15 text-amber-100",
  international_ready: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
  restricted: "border-rose-400/30 bg-rose-500/15 text-rose-100",
  shipping_info_missing: "border-zinc-500/30 bg-zinc-500/15 text-zinc-200",
  shipping_info_partial: "border-amber-400/30 bg-amber-500/15 text-amber-100",
  shipping_info_complete: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
  customs_info_missing: "border-zinc-500/30 bg-zinc-500/15 text-zinc-200",
  customs_info_partial: "border-amber-400/30 bg-amber-500/15 text-amber-100",
  customs_info_complete: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
  soft: "border-sky-400/30 bg-sky-500/15 text-sky-100",
  box: "border-indigo-400/30 bg-indigo-500/15 text-indigo-100",
  premium_box: "border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-100",
  framed: "border-cyan-400/30 bg-cyan-500/15 text-cyan-100",
  electronics: "border-amber-400/30 bg-amber-500/15 text-amber-100",
  special: "border-rose-400/30 bg-rose-500/15 text-rose-100",
  dhl: "border-red-400/30 bg-red-500/15 text-red-100",
  fedex: "border-violet-400/30 bg-violet-500/15 text-violet-100",
  ups: "border-amber-400/30 bg-amber-500/15 text-amber-100",
  ems: "border-sky-400/30 bg-sky-500/15 text-sky-100",
  local: "border-zinc-500/30 bg-zinc-500/15 text-zinc-200",
  hand_carry: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
  included: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
  excluded: "border-zinc-500/30 bg-zinc-500/15 text-zinc-200",
  manual: "border-amber-400/30 bg-amber-500/15 text-amber-100",
  available: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
  required: "border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-100",
  low: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
  medium: "border-amber-400/30 bg-amber-500/15 text-amber-100",
  high: "border-rose-400/30 bg-rose-500/15 text-rose-100",
  pending: "border-amber-400/30 bg-amber-500/15 text-amber-100",
  completed: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
  refunded: "border-zinc-500/30 bg-zinc-500/15 text-zinc-200",
  none: "border-zinc-500/30 bg-zinc-500/15 text-zinc-200",
  house: "border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-100",
  third_party: "border-cyan-400/30 bg-cyan-500/15 text-cyan-100",
  privacy: "border-amber-400/30 bg-amber-500/15 text-amber-100",
  contractual: "border-indigo-400/30 bg-indigo-500/15 text-indigo-100",
  risk_management: "border-rose-400/30 bg-rose-500/15 text-rose-100",
  reuse_sensitive: "border-cyan-400/30 bg-cyan-500/15 text-cyan-100",
  artifact: "border-sky-400/30 bg-sky-500/15 text-sky-100",
  event: "border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-100",
  authentication: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
  auction: "border-amber-400/30 bg-amber-500/15 text-amber-100",
  user: "border-zinc-500/30 bg-zinc-500/15 text-zinc-200",
  admin: "border-sky-400/30 bg-sky-500/15 text-sky-100",
  ops: "border-amber-400/30 bg-amber-500/15 text-amber-100",
  inspector: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
  finance: "border-indigo-400/30 bg-indigo-500/15 text-indigo-100",
  super_admin: "border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-100",
}

const STATUS_LABEL_MAP: Record<string, string> = {
  shipping_info_missing: "Shipping Info Missing",
  shipping_info_partial: "Shipping Info Partial",
  shipping_info_complete: "Shipping Info Complete",
  customs_info_missing: "Customs Info Missing",
  customs_info_partial: "Customs Info Partial",
  customs_info_complete: "Customs Info Complete",
  review_required: "International Review Required",
  international_ready: "International Ready",
  domestic_only: "Domestic Only",
  restricted: "Restricted",
  ops: "Ops",
  super_admin: "Super Admin",
}

type StatusBadgeProps = {
  value: string | null | undefined
}

export function StatusBadge({ value }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`rounded-md border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${
        value ? STATUS_CLASS_MAP[value] ?? "border-white/15 bg-white/[0.04] text-white/80" : "border-white/10 bg-white/[0.03] text-white/45"
      }`}
    >
      {value ? STATUS_LABEL_MAP[value] ?? titleCase(value) : "N/A"}
    </Badge>
  )
}
