"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, Clock3, FileBadge, Gavel, ImageIcon, Package2 } from "lucide-react"
import { EmptyState } from "@/components/admin/empty-state"
import { PageHeader } from "@/components/admin/page-header"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateTime } from "@/lib/admin/utils"
import { getDashboardCounts, getRecentActivity, type RecentActivityItem } from "@/lib/supabase/provenance"

type DashboardState = {
  totalArtifacts: number
  totalActiveAuctions: number
  totalAuthentications: number
  totalMediaAssets: number
}

const QUICK_ACTIONS = [
  { href: "/admin/artifacts/new", label: "Create artifact" },
  { href: "/admin/events/new", label: "Add provenance event" },
  { href: "/admin/authentications/new", label: "Add authentication" },
  { href: "/admin/media/upload", label: "Upload media" },
  { href: "/admin/auctions/new", label: "Create auction" },
]

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardState | null>(null)
  const [activity, setActivity] = useState<RecentActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      try {
        const [nextStats, nextActivity] = await Promise.all([
          getDashboardCounts(),
          getRecentActivity(),
        ])

        if (!active) {
          return
        }

        setStats(nextStats)
        setActivity(nextActivity)
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard data.")
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Operations dashboard"
        description="Track the live provenance catalog, monitor recent changes, and jump straight into the next operator task."
        actions={
          <>
            <Button asChild variant="outline" className="border-white/10 bg-transparent text-white hover:bg-white/[0.04]">
              <Link href="/admin/artifacts">Open registry</Link>
            </Button>
            <Button asChild className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
              <Link href="/admin/artifacts/new">Create artifact</Link>
            </Button>
          </>
        }
      />

      {error ? (
        <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Package2, label: "Total artifacts", value: stats?.totalArtifacts ?? 0 },
          { icon: Gavel, label: "Active auctions", value: stats?.totalActiveAuctions ?? 0 },
          { icon: FileBadge, label: "Authentication records", value: stats?.totalAuthentications ?? 0 },
          { icon: ImageIcon, label: "Media assets", value: stats?.totalMediaAssets ?? 0 },
        ].map((item) => (
          <Card key={item.label} className="border-white/10 bg-white/[0.03] text-white">
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm text-white/55">{item.label}</p>
                {loading ? <Skeleton className="mt-3 h-10 w-20 bg-white/10" /> : <p className="mt-3 text-3xl font-semibold">{item.value.toLocaleString()}</p>}
              </div>
              <div className="flex size-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.04]">
                <item.icon className="size-5 text-[#FF6B9D]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-white/10 bg-white/[0.03] text-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent activity</CardTitle>
              <p className="mt-1 text-sm text-white/55">Latest writes landing in the shared provenance tables.</p>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full bg-white/10" />
                ))}
              </div>
            ) : activity.length ? (
              <div className="space-y-3">
                {activity.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-black/25 px-4 py-3 transition-colors hover:bg-black/35"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <StatusBadge value={item.type.toLowerCase()} />
                        <p className="truncate text-sm font-medium text-white">{item.title}</p>
                      </div>
                      <p className="mt-1 truncate text-sm text-white/55">{item.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/45">
                      <Clock3 className="size-3.5" />
                      {formatDateTime(item.timestamp)}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Clock3}
                title="No recent activity"
                description="As soon as operators create artifacts, events, or auctions, the latest changes will appear here."
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03] text-white">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <p className="mt-1 text-sm text-white/55">Follow the recommended operator flow from creation through auction review.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {QUICK_ACTIONS.map((action) => (
              <Button
                key={action.href}
                asChild
                variant="outline"
                className="h-auto w-full justify-between border-white/10 bg-black/25 px-4 py-3 text-left text-white hover:bg-black/35"
              >
                <Link href={action.href}>
                  <span>{action.label}</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
