"use client"

import { useEffect, useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AUTH_METHOD_OPTIONS,
  AUTH_RESULT_OPTIONS,
  PUBLIC_VISIBILITY_OPTIONS,
} from "@/lib/admin/constants"
import { normalizeOptionalDate, normalizeOptionalString } from "@/lib/admin/utils"
import {
  createAuthentication,
  listArtifactOptions,
  type ArtifactOption,
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
import { Textarea } from "@/components/ui/textarea"

const authenticationFormSchema = z.object({
  artifact_id: z.string().min(1, "Select an artifact."),
  auth_method: z.enum(AUTH_METHOD_OPTIONS),
  auth_result: z.enum(AUTH_RESULT_OPTIONS),
  auth_date: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), "Use YYYY-MM-DD."),
  auth_provider: z.string().trim().optional(),
  forensic_ref: z.string().trim().optional(),
  certificate_code: z.string().trim().optional(),
  expiry_date: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), "Use YYYY-MM-DD."),
  visibility_level: z.enum(PUBLIC_VISIBILITY_OPTIONS),
  notes: z.string().trim().optional(),
})

type AuthenticationFormValues = z.infer<typeof authenticationFormSchema>

function ErrorMessage({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return <p className="text-sm text-rose-300">{message}</p>
}

export function AuthenticationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [artifacts, setArtifacts] = useState<ArtifactOption[]>([])
  const [loadingArtifacts, setLoadingArtifacts] = useState(true)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const form = useForm<AuthenticationFormValues>({
    resolver: zodResolver(authenticationFormSchema),
    defaultValues: {
      artifact_id: "",
      auth_method: "visual",
      auth_result: "verified",
      auth_date: "",
      auth_provider: "",
      forensic_ref: "",
      certificate_code: "",
      expiry_date: "",
      visibility_level: "internal_only",
      notes: "",
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
          setGeneralError("Select a valid artifact before saving the authentication record.")
          return
        }

        const record = await createAuthentication({
          artifact_id: values.artifact_id,
          artifact_code: artifact.artifact_code,
          auth_method: values.auth_method,
          auth_result: values.auth_result,
          auth_date: normalizeOptionalDate(values.auth_date),
          auth_provider: normalizeOptionalString(values.auth_provider),
          forensic_ref: normalizeOptionalString(values.forensic_ref),
          certificate_code: normalizeOptionalString(values.certificate_code),
          expiry_date: normalizeOptionalDate(values.expiry_date),
          visibility_level: values.visibility_level,
          notes: normalizeOptionalString(values.notes),
        })

        toast({
          title: "Authentication saved",
          description: `${record.auth_method ?? "Record"} was linked to ${artifact.artifact_code}.`,
        })

        router.push(`/admin/artifacts/${values.artifact_id}`)
        router.refresh()
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to create the authentication record."
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
          <CardTitle>Create authentication record</CardTitle>
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
              <Label>Authentication method</Label>
              <Controller
                control={control}
                name="auth_method"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full border-white/10 bg-black/30 text-white">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                      {AUTH_METHOD_OPTIONS.map((option) => (
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
              <Label>Result</Label>
              <Controller
                control={control}
                name="auth_result"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full border-white/10 bg-black/30 text-white">
                      <SelectValue placeholder="Select result" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                      {AUTH_RESULT_OPTIONS.map((option) => (
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
            <div className="space-y-2">
              <Label htmlFor="auth_date">Authentication date</Label>
              <Input
                id="auth_date"
                type="text"
                inputMode="numeric"
                placeholder="2026-04-15"
                {...register("auth_date")}
                className="border-white/10 bg-black/30 text-white"
              />
              <ErrorMessage message={errors.auth_date?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry_date">Expiry date</Label>
              <Input
                id="expiry_date"
                type="text"
                inputMode="numeric"
                placeholder="2027-04-15"
                {...register("expiry_date")}
                className="border-white/10 bg-black/30 text-white"
              />
              <ErrorMessage message={errors.expiry_date?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auth_provider">Auth provider</Label>
              <Input id="auth_provider" {...register("auth_provider")} className="border-white/10 bg-black/30 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="forensic_ref">Forensic ref</Label>
              <Input id="forensic_ref" {...register("forensic_ref")} className="border-white/10 bg-black/30 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certificate_code">Certificate code</Label>
              <Input id="certificate_code" {...register("certificate_code")} className="border-white/10 bg-black/30 text-white" />
            </div>
            <div className="space-y-2 xl:col-span-3">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" {...register("notes")} className="min-h-32 border-white/10 bg-black/30 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || loadingArtifacts} className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
          {isPending ? (
            <>
              <Spinner className="mr-2" />
              Saving record...
            </>
          ) : (
            "Create authentication"
          )}
        </Button>
      </div>
    </form>
  )
}
