"use client"

import { useEffect, useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { useRouter, useSearchParams } from "next/navigation"
import {
  EVENT_TYPE_OPTIONS,
  PUBLIC_VISIBILITY_OPTIONS,
  SOURCE_CONFIDENCE_OPTIONS,
} from "@/lib/admin/constants"
import { normalizeOptionalDate, normalizeOptionalString } from "@/lib/admin/utils"
import { createEvent, listArtifactOptions, type ArtifactOption } from "@/lib/supabase/provenance"
import { toast } from "@/hooks/use-toast"
import { ArtifactCombobox } from "@/components/admin/artifact-combobox"
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
import { Textarea } from "@/components/ui/textarea"

const eventFormSchema = z.object({
  artifact_id: z.string().min(1, "Select an artifact."),
  event_type: z.enum(EVENT_TYPE_OPTIONS),
  event_title: z.string().trim().min(1, "event_title is required."),
  event_date_start: z.string().trim().optional(),
  event_date_end: z.string().trim().optional(),
  event_location: z.string().trim().optional(),
  artist_name: z.string().trim().optional(),
  stylist_name: z.string().trim().optional(),
  production_entity: z.string().trim().optional(),
  source_confidence: z.enum(SOURCE_CONFIDENCE_OPTIONS),
  evidence_summary: z.string().trim().optional(),
  media_link: z.string().trim().optional(),
  visibility_level: z.enum(PUBLIC_VISIBILITY_OPTIONS),
  internal_notes: z.string().trim().optional(),
})

type EventFormValues = z.infer<typeof eventFormSchema>

function ErrorMessage({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return <p className="text-sm text-rose-300">{message}</p>
}

export function EventForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [artifacts, setArtifacts] = useState<ArtifactOption[]>([])
  const [loadingArtifacts, setLoadingArtifacts] = useState(true)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      artifact_id: "",
      event_type: "created",
      event_title: "",
      event_date_start: "",
      event_date_end: "",
      event_location: "",
      artist_name: "",
      stylist_name: "",
      production_entity: "",
      source_confidence: "confirmed",
      evidence_summary: "",
      media_link: "",
      visibility_level: "internal_only",
      internal_notes: "",
    },
  })

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = form

  useEffect(() => {
    let active = true

    async function loadArtifacts() {
      try {
        const nextArtifacts = await listArtifactOptions()

        if (!active) {
          return
        }

        setArtifacts(nextArtifacts)
        const artifactIdFromQuery = searchParams.get("artifactId")

        if (artifactIdFromQuery && nextArtifacts.some((artifact) => artifact.id === artifactIdFromQuery)) {
          setValue("artifact_id", artifactIdFromQuery)
        }
      } catch (error) {
        if (!active) {
          return
        }

        const message = error instanceof Error ? error.message : "Unable to load artifacts."
        setGeneralError(message)
      } finally {
        if (active) {
          setLoadingArtifacts(false)
        }
      }
    }

    void loadArtifacts()

    return () => {
      active = false
    }
  }, [searchParams, setValue])

  const submit = handleSubmit((values) => {
    setGeneralError(null)

    startTransition(async () => {
      try {
        const artifact = artifacts.find((item) => item.id === values.artifact_id)

        if (!artifact) {
          setGeneralError("Select a valid artifact before saving the event.")
          return
        }

        const record = await createEvent({
          artifact_id: values.artifact_id,
          artifact_code: artifact.artifact_code,
          event_type: values.event_type,
          event_title: values.event_title.trim(),
          event_date_start: normalizeOptionalDate(values.event_date_start),
          event_date_end: normalizeOptionalDate(values.event_date_end),
          event_location: normalizeOptionalString(values.event_location),
          artist_name: normalizeOptionalString(values.artist_name) ?? artifact.artist_name ?? null,
          stylist_name: normalizeOptionalString(values.stylist_name),
          production_entity: normalizeOptionalString(values.production_entity),
          source_confidence: values.source_confidence,
          evidence_summary: normalizeOptionalString(values.evidence_summary),
          media_link: normalizeOptionalString(values.media_link),
          visibility_level: values.visibility_level,
          internal_notes: normalizeOptionalString(values.internal_notes),
        })

        toast({
          title: "Provenance event created",
          description: `${record.event_title} is now linked to ${artifact.artifact_code}.`,
        })

        router.push(`/admin/artifacts/${values.artifact_id}`)
        router.refresh()
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to create the provenance event."
        setGeneralError(message)
        toast({
          title: "Save failed",
          description: message,
          variant: "destructive",
        })
      }
    })
  })

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card className="border-white/10 bg-white/[0.03] text-white">
        <CardHeader>
          <CardTitle>Create provenance event</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {generalError ? (
            <div className="rounded-md border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {generalError}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2 xl:col-span-3">
              <Label>Artifact</Label>
              <Controller
                control={control}
                name="artifact_id"
                render={({ field }) => (
                  <ArtifactCombobox
                    artifacts={artifacts}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={loadingArtifacts || isPending}
                    placeholder={loadingArtifacts ? "Loading artifacts..." : "Select an artifact"}
                  />
                )}
              />
              <ErrorMessage message={errors.artifact_id?.message} />
            </div>

            <div className="space-y-2">
              <Label>Event type</Label>
              <Controller
                control={control}
                name="event_type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full border-white/10 bg-black/30 text-white">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                      {EVENT_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="event_title">Event title</Label>
              <Input id="event_title" {...register("event_title")} className="border-white/10 bg-black/30 text-white" />
              <ErrorMessage message={errors.event_title?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_date_start">Start date</Label>
              <Input id="event_date_start" type="date" {...register("event_date_start")} className="border-white/10 bg-black/30 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event_date_end">End date</Label>
              <Input id="event_date_end" type="date" {...register("event_date_end")} className="border-white/10 bg-black/30 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event_location">Location</Label>
              <Input id="event_location" {...register("event_location")} className="border-white/10 bg-black/30 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="artist_name">Artist name</Label>
              <Input id="artist_name" {...register("artist_name")} className="border-white/10 bg-black/30 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stylist_name">Stylist name</Label>
              <Input id="stylist_name" {...register("stylist_name")} className="border-white/10 bg-black/30 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="production_entity">Production entity</Label>
              <Input id="production_entity" {...register("production_entity")} className="border-white/10 bg-black/30 text-white" />
            </div>
            <div className="space-y-2">
              <Label>Source confidence</Label>
              <Controller
                control={control}
                name="source_confidence"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full border-white/10 bg-black/30 text-white">
                      <SelectValue placeholder="Select confidence" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                      {SOURCE_CONFIDENCE_OPTIONS.map((option) => (
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
            <div className="space-y-2 xl:col-span-3">
              <Label htmlFor="media_link">Media link</Label>
              <Input id="media_link" {...register("media_link")} className="border-white/10 bg-black/30 text-white" placeholder="https://..." />
            </div>
            <div className="space-y-2 xl:col-span-3">
              <Label htmlFor="evidence_summary">Evidence summary</Label>
              <Textarea id="evidence_summary" {...register("evidence_summary")} className="min-h-28 border-white/10 bg-black/30 text-white" />
            </div>
            <div className="space-y-2 xl:col-span-3">
              <Label htmlFor="internal_notes">Internal notes</Label>
              <Textarea id="internal_notes" {...register("internal_notes")} className="min-h-28 border-white/10 bg-black/30 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || loadingArtifacts} className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
          {isPending ? (
            <>
              <Spinner className="mr-2" />
              Saving event...
            </>
          ) : (
            "Create event"
          )}
        </Button>
      </div>
    </form>
  )
}
