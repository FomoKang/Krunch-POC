import { Badge } from "@/components/ui/badge"
import { titleCase } from "@/lib/admin/utils"

const STATUS_CLASS_MAP: Record<string, string> = {
  BLACK: "border-violet-400/30 bg-violet-500/15 text-violet-100",
  PINK: "border-pink-400/30 bg-pink-500/15 text-pink-100",
  archived: "border-zinc-500/30 bg-zinc-500/15 text-zinc-200",
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
  closed: "border-zinc-500/30 bg-zinc-500/15 text-zinc-200",
  cancelled: "border-rose-400/30 bg-rose-500/15 text-rose-100",
  settled: "border-indigo-400/30 bg-indigo-500/15 text-indigo-100",
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
      {value ? titleCase(value) : "N/A"}
    </Badge>
  )
}
