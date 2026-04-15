"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Plus, Sparkles } from "lucide-react"
import { EmptyState } from "@/components/admin/empty-state"
import { PageHeader } from "@/components/admin/page-header"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/admin/utils"
import { listEvents, type ProvenanceEventRecord } from "@/lib/supabase/provenance"

export default function AdminEventsPage() {
  const [events, setEvents] = useState<ProvenanceEventRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadEvents() {
      try {
        const nextEvents = await listEvents()

        if (!active) {
          return
        }

        setEvents(nextEvents)
        setError(null)
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load provenance events.")
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadEvents()

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Registry"
        title="Provenance events"
        description="Review the event timeline records already linked to artifacts, then add the next documented milestone."
        actions={
          <Button asChild className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
            <Link href="/admin/events/new">
              <Plus className="mr-2 size-4" />
              Create event
            </Link>
          </Button>
        }
      />

      <Card className="border-white/10 bg-white/[0.03] text-white">
        <CardContent className="p-4">
          {error ? (
            <div className="mb-4 rounded-md border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full bg-white/10" />
              ))}
            </div>
          ) : events.length ? (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-white/55">Event</TableHead>
                  <TableHead className="text-white/55">Artifact code</TableHead>
                  <TableHead className="text-white/55">Date</TableHead>
                  <TableHead className="text-white/55">Confidence</TableHead>
                  <TableHead className="text-white/55">Visibility</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id} className="border-white/10">
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-white">{event.event_title}</p>
                        <p className="text-sm text-white/55">{event.event_type ?? "event"}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-white/70">{event.artifact_code ?? "-"}</TableCell>
                    <TableCell className="text-white/70">{event.event_date_start ? formatDate(event.event_date_start) : "-"}</TableCell>
                    <TableCell>
                      <StatusBadge value={event.source_confidence} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={event.visibility_level} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="No provenance events yet"
              description="Create the first event to start building the public-facing provenance timeline."
              action={
                <Button asChild className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
                  <Link href="/admin/events/new">Create event</Link>
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
