"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Plus, ShieldCheck } from "lucide-react"
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
import {
  listAuthentications,
  type AuthenticationRecord,
} from "@/lib/supabase/provenance"

export default function AdminAuthenticationsPage() {
  const [records, setRecords] = useState<AuthenticationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadAuthentications() {
      try {
        const nextRecords = await listAuthentications()

        if (!active) {
          return
        }

        setRecords(nextRecords)
        setError(null)
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load authentication records.")
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadAuthentications()

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Registry"
        title="Authentications"
        description="Monitor the verification records already stored in provenance_authentications and add new evidence as it arrives."
        actions={
          <Button asChild className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
            <Link href="/admin/authentications/new">
              <Plus className="mr-2 size-4" />
              Create authentication
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
          ) : records.length ? (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-white/55">Method</TableHead>
                  <TableHead className="text-white/55">Artifact code</TableHead>
                  <TableHead className="text-white/55">Provider</TableHead>
                  <TableHead className="text-white/55">Date</TableHead>
                  <TableHead className="text-white/55">Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id} className="border-white/10">
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-white">{record.auth_method ?? "Authentication record"}</p>
                        <p className="text-sm text-white/55">{record.certificate_code ?? "No certificate code"}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-white/70">{record.artifact_code ?? "-"}</TableCell>
                    <TableCell className="text-white/70">{record.auth_provider ?? "-"}</TableCell>
                    <TableCell className="text-white/70">{record.auth_date ? formatDate(record.auth_date) : "-"}</TableCell>
                    <TableCell>
                      <StatusBadge value={record.auth_result} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={ShieldCheck}
              title="No authentication records yet"
              description="Create the first record to keep verification evidence connected to the artifact registry."
              action={
                <Button asChild className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
                  <Link href="/admin/authentications/new">Create authentication</Link>
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
