"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { useSearchParams } from "next/navigation"
import { PencilLine, ShieldEllipsis } from "lucide-react"
import { ArtifactCombobox } from "@/components/admin/artifact-combobox"
import { EmptyState } from "@/components/admin/empty-state"
import { PageHeader } from "@/components/admin/page-header"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  DISCLOSURE_FIELD_OPTIONS,
  DISCLOSURE_REASON_OPTIONS,
  PUBLIC_VISIBILITY_OPTIONS,
} from "@/lib/admin/constants"
import {
  buildDisclosureRowKey,
  normalizeOptionalDate,
} from "@/lib/admin/utils"
import {
  createDisclosureControl,
  listArtifactOptions,
  listDisclosureControls,
  updateDisclosureControl,
  type ArtifactOption,
  type DisclosureControlRecord,
} from "@/lib/supabase/provenance"
import { toast } from "@/hooks/use-toast"

const disclosureFormSchema = z.object({
  artifact_id: z.string().min(1, "Select an artifact."),
  field_name: z.enum(DISCLOSURE_FIELD_OPTIONS),
  field_value_reference: z.string().trim().min(1, "field_value_reference is required."),
  visibility_level: z.enum(PUBLIC_VISIBILITY_OPTIONS),
  reason_code: z.enum(DISCLOSURE_REASON_OPTIONS),
  expires_at: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), "Use YYYY-MM-DD."),
})

type DisclosureFormValues = z.infer<typeof disclosureFormSchema>

function ErrorMessage({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return <p className="text-sm text-rose-300">{message}</p>
}

export default function DisclosurePage() {
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [artifacts, setArtifacts] = useState<ArtifactOption[]>([])
  const [records, setRecords] = useState<DisclosureControlRecord[]>([])
  const [editingRecord, setEditingRecord] = useState<DisclosureControlRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const form = useForm<DisclosureFormValues>({
    resolver: zodResolver(disclosureFormSchema),
    defaultValues: {
      artifact_id: "",
      field_name: "stylist",
      field_value_reference: "",
      visibility_level: "internal_only",
      reason_code: "privacy",
      expires_at: "",
    },
  })

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = form

  useEffect(() => {
    let active = true

    async function loadPage() {
      try {
        const [nextArtifacts, nextRecords] = await Promise.all([
          listArtifactOptions(),
          listDisclosureControls(),
        ])

        if (!active) {
          return
        }

        setArtifacts(nextArtifacts)
        setRecords(nextRecords)
        const artifactIdFromQuery = searchParams.get("artifactId")

        if (artifactIdFromQuery && nextArtifacts.some((artifact) => artifact.id === artifactIdFromQuery)) {
          setValue("artifact_id", artifactIdFromQuery)
        }
      } catch (loadError) {
        if (!active) {
          return
        }

        setGeneralError(loadError instanceof Error ? loadError.message : "Unable to load disclosure data.")
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadPage()

    return () => {
      active = false
    }
  }, [searchParams, setValue])

  const artifactMap = useMemo(
    () => new Map(artifacts.map((artifact) => [artifact.id, artifact])),
    [artifacts],
  )

  const submit = handleSubmit((values) => {
    setGeneralError(null)

    startTransition(async () => {
      try {
        const payload = {
          artifact_id: values.artifact_id,
          field_name: values.field_name,
          field_value_reference: values.field_value_reference.trim(),
          visibility_level: values.visibility_level,
          reason_code: values.reason_code,
          expires_at: normalizeOptionalDate(values.expires_at),
        }

        if (editingRecord) {
          await updateDisclosureControl(
            {
              artifact_id: editingRecord.artifact_id,
              field_name: editingRecord.field_name,
              field_value_reference: editingRecord.field_value_reference,
            },
            payload,
          )
        } else {
          await createDisclosureControl(payload)
        }

        const nextRecords = await listDisclosureControls()
        setRecords(nextRecords)
        setEditingRecord(null)
        reset({
          artifact_id: values.artifact_id,
          field_name: "stylist",
          field_value_reference: "",
          visibility_level: "internal_only",
          reason_code: "privacy",
          expires_at: "",
        })

        toast({
          title: editingRecord ? "Disclosure rule updated" : "Disclosure rule created",
          description: "The visibility override is now saved in disclosure_controls.",
        })
      } catch (saveError) {
        const message = saveError instanceof Error ? saveError.message : "Unable to save the disclosure control."
        setGeneralError(message)
        toast({
          title: "Save failed",
          description: message,
          variant: "destructive",
        })
      }
    })
  })

  function startEditing(record: DisclosureControlRecord) {
    setEditingRecord(record)
    reset({
      artifact_id: record.artifact_id,
      field_name: record.field_name as DisclosureFormValues["field_name"],
      field_value_reference: record.field_value_reference,
      visibility_level: (record.visibility_level as DisclosureFormValues["visibility_level"]) ?? "internal_only",
      reason_code: (record.reason_code as DisclosureFormValues["reason_code"]) ?? "privacy",
      expires_at: record.expires_at?.slice(0, 10) ?? "",
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assets"
        title="Disclosure control"
        description="Control which provenance fields stay public, collector-only, or internal-only when the registry starts feeding user-facing surfaces."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-white/10 bg-white/[0.03] text-white">
          <CardHeader>
            <CardTitle>{editingRecord ? "Edit disclosure rule" : "Create disclosure rule"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              {generalError ? (
                <div className="rounded-md border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {generalError}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>Artifact</Label>
                <Controller
                  control={control}
                  name="artifact_id"
                  render={({ field }) => (
                    <ArtifactCombobox
                      artifacts={artifacts}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={loading || isPending}
                      placeholder={loading ? "Loading artifacts..." : "Select an artifact"}
                    />
                  )}
                />
                <ErrorMessage message={errors.artifact_id?.message} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Field name</Label>
                  <Controller
                    control={control}
                    name="field_name"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full border-white/10 bg-black/30 text-white">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                          {DISCLOSURE_FIELD_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Visibility level</Label>
                  <Controller
                    control={control}
                    name="visibility_level"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full border-white/10 bg-black/30 text-white">
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                          {PUBLIC_VISIBILITY_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="field_value_reference">Field value reference</Label>
                <Input id="field_value_reference" {...register("field_value_reference")} className="border-white/10 bg-black/30 text-white" />
                <ErrorMessage message={errors.field_value_reference?.message} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Reason code</Label>
                  <Controller
                    control={control}
                    name="reason_code"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full border-white/10 bg-black/30 text-white">
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                          {DISCLOSURE_REASON_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/60">
                  Approved by is saved automatically from the signed-in operator.
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires_at">Expires at</Label>
                <Input
                  id="expires_at"
                  type="text"
                  inputMode="numeric"
                  placeholder="2026-12-31"
                  {...register("expires_at")}
                  className="border-white/10 bg-black/30 text-white"
                />
                <ErrorMessage message={errors.expires_at?.message} />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                {editingRecord ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-white/10 bg-transparent text-white hover:bg-white/[0.04]"
                    onClick={() => {
                      setEditingRecord(null)
                      reset({
                        artifact_id: searchParams.get("artifactId") ?? "",
                        field_name: "stylist",
                        field_value_reference: "",
                        visibility_level: "internal_only",
                        reason_code: "privacy",
                        expires_at: "",
                      })
                    }}
                  >
                    Cancel edit
                  </Button>
                ) : null}
                <Button type="submit" disabled={isPending || loading} className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
                  {isPending ? (
                    <>
                      <Spinner className="mr-2" />
                      Saving rule...
                    </>
                  ) : editingRecord ? (
                    "Save changes"
                  ) : (
                    "Create rule"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03] text-white">
          <CardHeader>
            <CardTitle>Current disclosure rules</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-20 rounded-lg bg-white/10" />
                ))}
              </div>
            ) : records.length ? (
              <div className="space-y-3">
                {records.map((record) => {
                  const artifact = artifactMap.get(record.artifact_id)

                  return (
                    <div key={buildDisclosureRowKey(record)} className="rounded-lg border border-white/10 bg-black/25 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">
                            {artifact ? `${artifact.artifact_code} - ${artifact.artifact_title}` : record.artifact_id}
                          </p>
                          <p className="mt-1 truncate text-sm text-white/55">
                            {record.field_name} - {record.field_value_reference}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge value={record.reason_code} />
                          <StatusBadge value={record.visibility_level} />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-white/10 bg-transparent text-white hover:bg-white/[0.04]"
                            onClick={() => startEditing(record)}
                          >
                            <PencilLine className="mr-2 size-3.5" />
                            Edit
                          </Button>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-white/60">
                        Approved by {record.approved_by ?? "unknown"}
                        {record.expires_at ? ` - Expires ${record.expires_at.slice(0, 10)}` : ""}
                      </p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyState
                icon={ShieldEllipsis}
                title="No disclosure rules yet"
                description="Create the first rule to control how sensitive provenance data is exposed downstream."
                action={
                  <Button asChild className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
                    <Link href="/admin/disclosure">Create disclosure rule</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
