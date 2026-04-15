"use client"

import Image from "next/image"
import { useEffect, useMemo, useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { useRouter, useSearchParams } from "next/navigation"
import { Camera, FileUp } from "lucide-react"
import {
  MEDIA_ASSET_TYPE_OPTIONS,
  PUBLIC_VISIBILITY_OPTIONS,
} from "@/lib/admin/constants"
import { normalizeOptionalDateTime, normalizeOptionalString } from "@/lib/admin/utils"
import {
  createMediaAsset,
  listArtifactOptions,
  listEvents,
  type ArtifactOption,
  type ProvenanceEventRecord,
  uploadMediaFile,
} from "@/lib/supabase/provenance"
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

const mediaUploadFormSchema = z.object({
  artifact_id: z.string().min(1, "Select an artifact."),
  provenance_event_id: z.string().optional(),
  asset_type: z.enum(MEDIA_ASSET_TYPE_OPTIONS),
  caption: z.string().trim().optional(),
  source: z.string().trim().optional(),
  copyright_status: z.string().trim().optional(),
  visibility_level: z.enum(PUBLIC_VISIBILITY_OPTIONS),
  taken_at: z.string().trim().optional(),
})

type MediaUploadFormValues = z.infer<typeof mediaUploadFormSchema>

function ErrorMessage({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return <p className="text-sm text-rose-300">{message}</p>
}

export function MediaUploadForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [artifacts, setArtifacts] = useState<ArtifactOption[]>([])
  const [events, setEvents] = useState<ProvenanceEventRecord[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loadingArtifacts, setLoadingArtifacts] = useState(true)
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const form = useForm<MediaUploadFormValues>({
    resolver: zodResolver(mediaUploadFormSchema),
    defaultValues: {
      artifact_id: "",
      provenance_event_id: "",
      asset_type: "photo",
      caption: "",
      source: "",
      copyright_status: "",
      visibility_level: "internal_only",
      taken_at: "",
    },
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form

  const selectedArtifactId = watch("artifact_id")
  const filteredEvents = useMemo(
    () => events.filter((event) => event.artifact_id === selectedArtifactId),
    [events, selectedArtifactId],
  )

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

  useEffect(() => {
    let active = true

    async function loadEvents() {
      if (!selectedArtifactId) {
        setEvents([])
        setValue("provenance_event_id", "")
        return
      }

      setLoadingEvents(true)

      try {
        const nextEvents = await listEvents({ artifactId: selectedArtifactId })

        if (!active) {
          return
        }

        setEvents(nextEvents)
        const eventIdFromQuery = searchParams.get("eventId")

        if (eventIdFromQuery && nextEvents.some((event) => event.id === eventIdFromQuery)) {
          setValue("provenance_event_id", eventIdFromQuery)
        }
      } catch (error) {
        if (!active) {
          return
        }

        setGeneralError(error instanceof Error ? error.message : "Unable to load provenance events.")
      } finally {
        if (active) {
          setLoadingEvents(false)
        }
      }
    }

    void loadEvents()

    return () => {
      active = false
    }
  }, [searchParams, selectedArtifactId, setValue])

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }

    const nextPreviewUrl = URL.createObjectURL(file)
    setPreviewUrl(nextPreviewUrl)

    return () => {
      URL.revokeObjectURL(nextPreviewUrl)
    }
  }, [file])

  const submit = handleSubmit((values) => {
    setGeneralError(null)

    if (!file) {
      setGeneralError("Choose a file before uploading.")
      return
    }

    startTransition(async () => {
      try {
        const upload = await uploadMediaFile(file, values.artifact_id, values.provenance_event_id || null)

        await createMediaAsset({
          artifact_id: values.artifact_id,
          provenance_event_id: normalizeOptionalString(values.provenance_event_id),
          asset_type: values.asset_type,
          caption: normalizeOptionalString(values.caption),
          source: normalizeOptionalString(values.source),
          copyright_status: normalizeOptionalString(values.copyright_status),
          visibility_level: values.visibility_level,
          taken_at: normalizeOptionalDateTime(values.taken_at),
          file_url: upload.fileUrl,
          thumbnail_url: upload.thumbnailUrl,
          file_type: upload.fileType,
          file_hash: upload.fileHash,
          uploaded_at: new Date().toISOString(),
        })

        toast({
          title: "Media uploaded",
          description: "The file was uploaded to Supabase Storage and saved in media_assets.",
        })

        router.push(`/admin/artifacts/${values.artifact_id}`)
        router.refresh()
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to upload media."
        setGeneralError(message)
        toast({
          title: "Upload failed",
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
          <CardTitle>Upload provenance media</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {generalError ? (
            <div className="rounded-md border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {generalError}
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
            <div className="space-y-4">
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
                        onChange={(nextValue) => {
                          field.onChange(nextValue)
                          setValue("provenance_event_id", "")
                        }}
                        disabled={loadingArtifacts || isPending}
                        placeholder={loadingArtifacts ? "Loading artifacts..." : "Select an artifact"}
                      />
                    )}
                  />
                  <ErrorMessage message={errors.artifact_id?.message} />
                </div>
                <div className="space-y-2">
                  <Label>Provenance event</Label>
                  <Controller
                    control={control}
                    name="provenance_event_id"
                    render={({ field }) => (
                      <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
                        <SelectTrigger className="w-full border-white/10 bg-black/30 text-white">
                          <SelectValue placeholder={loadingEvents ? "Loading events..." : "Optional"} />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                          <SelectItem value="none">No linked event</SelectItem>
                          {filteredEvents.map((event) => (
                            <SelectItem key={event.id} value={event.id}>
                              {event.event_title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Asset type</Label>
                  <Controller
                    control={control}
                    name="asset_type"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full border-white/10 bg-black/30 text-white">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                          {MEDIA_ASSET_TYPE_OPTIONS.map((option) => (
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
                  <Label htmlFor="caption">Caption</Label>
                  <Input id="caption" {...register("caption")} className="border-white/10 bg-black/30 text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Input id="source" {...register("source")} className="border-white/10 bg-black/30 text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="copyright_status">Copyright status</Label>
                  <Input id="copyright_status" {...register("copyright_status")} className="border-white/10 bg-black/30 text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taken_at">Taken at</Label>
                  <Input id="taken_at" type="datetime-local" {...register("taken_at")} className="border-white/10 bg-black/30 text-white" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Card className="border-white/10 bg-black/25 text-white">
                <CardHeader>
                  <CardTitle className="text-base">File</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.03] p-4">
                    <Label htmlFor="asset-file" className="flex cursor-pointer flex-col items-center justify-center gap-3 text-center">
                      <div className="flex size-12 items-center justify-center rounded-md border border-white/10 bg-white/[0.04]">
                        <FileUp className="size-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Choose a file</p>
                        <p className="text-xs text-white/50">Images, videos, scans, and supporting files are all supported.</p>
                      </div>
                    </Label>
                    <Input
                      id="asset-file"
                      type="file"
                      className="mt-4 border-white/10 bg-black/30 text-white file:text-white"
                      onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                    />
                  </div>

                  {previewUrl ? (
                    file?.type.startsWith("image/") ? (
                      <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
                        <Image
                          src={previewUrl}
                          alt={file.name}
                          width={800}
                          height={600}
                          className="h-auto w-full object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex size-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.05]">
                          <Camera className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{file?.name}</p>
                          <p className="text-xs text-white/55">{file?.type || "File"}</p>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-4 py-10 text-center text-sm text-white/45">
                      Preview appears here after a file is selected.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || loadingArtifacts} className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
          {isPending ? (
            <>
              <Spinner className="mr-2" />
              Uploading...
            </>
          ) : (
            "Upload media"
          )}
        </Button>
      </div>
    </form>
  )
}
