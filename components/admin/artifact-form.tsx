"use client"

import { useMemo, useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { useRouter } from "next/navigation"
import {
  ARTIFACT_STATUS_OPTIONS,
  PUBLIC_VISIBILITY_OPTIONS,
  USAGE_TIER_OPTIONS,
} from "@/lib/admin/constants"
import {
  normalizeOptionalNumber,
  normalizeOptionalString,
} from "@/lib/admin/utils"
import type { ArtifactRecord } from "@/lib/supabase/provenance"
import {
  createArtifact,
  getArtifactByCode,
  updateArtifact,
} from "@/lib/supabase/provenance"
import { toast } from "@/hooks/use-toast"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"

const artifactFormSchema = z.object({
  artifact_code: z.string().trim().min(1, "artifact_code is required."),
  artifact_title: z.string().trim().min(1, "artifact_title is required."),
  artifact_type: z.string().trim().min(1, "artifact_type is required."),
  artist_name: z.string().trim().optional(),
  group_name: z.string().trim().optional(),
  agency_name: z.string().trim().optional(),
  era_name: z.string().trim().optional(),
  estimated_year: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^\d{4}$/.test(value), "Enter a four-digit year."),
  first_documented_usage: z.string().trim().optional(),
  usage_tier: z.enum(USAGE_TIER_OPTIONS),
  is_custom_made: z.boolean(),
  is_stage_used: z.boolean(),
  is_screen_used: z.boolean(),
  material_summary: z.string().trim().optional(),
  size_info: z.string().trim().optional(),
  colorway: z.string().trim().optional(),
  current_status: z.enum(ARTIFACT_STATUS_OPTIONS),
  current_holder: z.string().trim().optional(),
  storage_location: z.string().trim().optional(),
  public_visibility: z.enum(PUBLIC_VISIBILITY_OPTIONS),
  internal_notes: z.string().trim().optional(),
})

type ArtifactFormValues = z.infer<typeof artifactFormSchema>

type ArtifactFormProps = {
  mode: "create" | "edit"
  artifactId?: string
  initialValues?: Partial<ArtifactRecord>
}

function getDefaultValues(initialValues?: Partial<ArtifactRecord>): ArtifactFormValues {
  return {
    artifact_code: initialValues?.artifact_code ?? "",
    artifact_title: initialValues?.artifact_title ?? "",
    artifact_type: initialValues?.artifact_type ?? "",
    artist_name: initialValues?.artist_name ?? "",
    group_name: initialValues?.group_name ?? "",
    agency_name: initialValues?.agency_name ?? "",
    era_name: initialValues?.era_name ?? "",
    estimated_year: initialValues?.estimated_year ? String(initialValues.estimated_year) : "",
    first_documented_usage: initialValues?.first_documented_usage ?? "",
    usage_tier: (initialValues?.usage_tier as ArtifactFormValues["usage_tier"]) ?? "BLACK",
    is_custom_made: initialValues?.is_custom_made ?? false,
    is_stage_used: initialValues?.is_stage_used ?? false,
    is_screen_used: initialValues?.is_screen_used ?? false,
    material_summary: initialValues?.material_summary ?? "",
    size_info: initialValues?.size_info ?? "",
    colorway: initialValues?.colorway ?? "",
    current_status: (initialValues?.current_status as ArtifactFormValues["current_status"]) ?? "in_storage",
    current_holder: initialValues?.current_holder ?? "",
    storage_location: initialValues?.storage_location ?? "",
    public_visibility:
      (initialValues?.public_visibility as ArtifactFormValues["public_visibility"]) ?? "internal_only",
    internal_notes: initialValues?.internal_notes ?? "",
  }
}

function ErrorMessage({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return <p className="text-sm text-rose-300">{message}</p>
}

export function ArtifactForm({ mode, artifactId, initialValues }: ArtifactFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [generalError, setGeneralError] = useState<string | null>(null)
  const defaults = useMemo(() => getDefaultValues(initialValues), [initialValues])
  const form = useForm<ArtifactFormValues>({
    resolver: zodResolver(artifactFormSchema),
    defaultValues: defaults,
  })

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = form

  const submit = handleSubmit((values) => {
    setGeneralError(null)

    startTransition(async () => {
      try {
        const existing = await getArtifactByCode(values.artifact_code)

        if (existing && existing.id !== artifactId) {
          setError("artifact_code", {
            type: "validate",
            message: "artifact_code already exists.",
          })
          return
        }

        const payload = {
          artifact_code: values.artifact_code.trim(),
          artifact_title: values.artifact_title.trim(),
          artifact_type: values.artifact_type.trim(),
          artist_name: normalizeOptionalString(values.artist_name),
          group_name: normalizeOptionalString(values.group_name),
          agency_name: normalizeOptionalString(values.agency_name),
          era_name: normalizeOptionalString(values.era_name),
          estimated_year: normalizeOptionalNumber(values.estimated_year),
          first_documented_usage: normalizeOptionalString(values.first_documented_usage),
          usage_tier: values.usage_tier,
          is_custom_made: values.is_custom_made,
          is_stage_used: values.is_stage_used,
          is_screen_used: values.is_screen_used,
          material_summary: normalizeOptionalString(values.material_summary),
          size_info: normalizeOptionalString(values.size_info),
          colorway: normalizeOptionalString(values.colorway),
          current_status: values.current_status,
          current_holder: normalizeOptionalString(values.current_holder),
          storage_location: normalizeOptionalString(values.storage_location),
          public_visibility: values.public_visibility,
          internal_notes: normalizeOptionalString(values.internal_notes),
        }

        const artifact =
          mode === "create"
            ? await createArtifact(payload)
            : await updateArtifact(artifactId!, payload)

        toast({
          title: mode === "create" ? "Artifact created" : "Artifact updated",
          description: `${artifact.artifact_code} is now saved to Supabase.`,
        })

        router.push(`/admin/artifacts/${artifact.id}`)
        router.refresh()
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to save the artifact."
        setGeneralError(message)
        toast({
          title: "Save failed",
          description: message,
          variant: "destructive",
        })
      }
    })
  })

  const loadingLabel = mode === "create" ? "Creating artifact..." : "Saving changes..."

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card className="border-white/10 bg-white/[0.03] text-white">
        <CardHeader>
          <CardTitle>{mode === "create" ? "Create artifact" : "Artifact overview"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {generalError ? (
            <div className="rounded-md border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {generalError}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="artifact_code">Artifact code</Label>
              <Input
                id="artifact_code"
                {...register("artifact_code")}
                className="border-white/10 bg-black/30 text-white"
                placeholder="KR-ART-0001"
              />
              <ErrorMessage message={errors.artifact_code?.message} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="artifact_title">Artifact title</Label>
              <Input
                id="artifact_title"
                {...register("artifact_title")}
                className="border-white/10 bg-black/30 text-white"
                placeholder="Stage Jacket"
              />
              <ErrorMessage message={errors.artifact_title?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="artifact_type">Artifact type</Label>
              <Input
                id="artifact_type"
                {...register("artifact_type")}
                className="border-white/10 bg-black/30 text-white"
                placeholder="Stage jacket"
              />
              <ErrorMessage message={errors.artifact_type?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="artist_name">Artist name</Label>
              <Input id="artist_name" {...register("artist_name")} className="border-white/10 bg-black/30 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group_name">Group name</Label>
              <Input id="group_name" {...register("group_name")} className="border-white/10 bg-black/30 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agency_name">Agency name</Label>
              <Input id="agency_name" {...register("agency_name")} className="border-white/10 bg-black/30 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="era_name">Era name</Label>
              <Input id="era_name" {...register("era_name")} className="border-white/10 bg-black/30 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimated_year">Estimated year</Label>
              <Input id="estimated_year" {...register("estimated_year")} className="border-white/10 bg-black/30 text-white" placeholder="2022" />
              <ErrorMessage message={errors.estimated_year?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="first_documented_usage">First documented usage</Label>
              <Input
                id="first_documented_usage"
                {...register("first_documented_usage")}
                className="border-white/10 bg-black/30 text-white"
                placeholder="M Countdown performance"
              />
            </div>

            <div className="space-y-2">
              <Label>Usage tier</Label>
              <Controller
                control={control}
                name="usage_tier"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full border-white/10 bg-black/30 text-white">
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                      {USAGE_TIER_OPTIONS.map((option) => (
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
              <Label>Status</Label>
              <Controller
                control={control}
                name="current_status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full border-white/10 bg-black/30 text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                      {ARTIFACT_STATUS_OPTIONS.map((option) => (
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
              <Label>Public visibility</Label>
              <Controller
                control={control}
                name="public_visibility"
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

            <div className="space-y-2">
              <Label htmlFor="material_summary">Material summary</Label>
              <Input id="material_summary" {...register("material_summary")} className="border-white/10 bg-black/30 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="size_info">Size info</Label>
              <Input id="size_info" {...register("size_info")} className="border-white/10 bg-black/30 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="colorway">Colorway</Label>
              <Input id="colorway" {...register("colorway")} className="border-white/10 bg-black/30 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_holder">Current holder</Label>
              <Input id="current_holder" {...register("current_holder")} className="border-white/10 bg-black/30 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storage_location">Storage location</Label>
              <Input id="storage_location" {...register("storage_location")} className="border-white/10 bg-black/30 text-white" />
            </div>
          </div>

          <div className="grid gap-4 rounded-lg border border-white/10 bg-black/20 p-4 md:grid-cols-3">
            {[
              { name: "is_custom_made" as const, label: "Custom made" },
              { name: "is_stage_used" as const, label: "Stage used" },
              { name: "is_screen_used" as const, label: "Screen used" },
            ].map((item) => (
              <Controller
                key={item.name}
                control={control}
                name={item.name}
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="text-xs text-white/50">{field.value ? "Yes" : "No"}</p>
                    </div>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                )}
              />
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="internal_notes">Internal notes</Label>
              <Textarea
                id="internal_notes"
                {...register("internal_notes")}
                className="min-h-36 border-white/10 bg-black/30 text-white"
                placeholder="Operator context, handling notes, risk flags..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="material_summary_notes">Operator guidance</Label>
              <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/60">
                Keep artifact codes stable, use the visibility field conservatively, and prefer plain-language notes that another operator can pick up without extra context.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button type="submit" disabled={isPending} className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
          {isPending ? (
            <>
              <Spinner className="mr-2" />
              {loadingLabel}
            </>
          ) : mode === "create" ? (
            "Create artifact"
          ) : (
            "Save overview"
          )}
        </Button>
      </div>
    </form>
  )
}
