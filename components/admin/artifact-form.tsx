"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { StatusBadge } from "@/components/admin/status-badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import {
  ARTIFACT_STATUS_OPTIONS,
  BROKERAGE_FEE_POLICY_OPTIONS,
  CARRIER_PREFERENCE_OPTIONS,
  CUSTOMS_RISK_TIER_OPTIONS,
  DDP_MODE_OPTIONS,
  INTERNATIONAL_SALE_STATUS_OPTIONS,
  PACKAGE_TYPE_OPTIONS,
  PUBLIC_VISIBILITY_OPTIONS,
  USAGE_TIER_OPTIONS,
} from "@/lib/admin/constants"
import { normalizeOptionalNumber, normalizeOptionalString } from "@/lib/admin/utils"
import type {
  ArtifactRecord,
  ProductCustomsInfoRecord,
  ProductShippingInfoRecord,
  ProductShippingProfileRecord,
} from "@/lib/supabase/provenance"
import {
  computeCustomsInfoStatus,
  computeShippingInfoStatus,
  createArtifact,
  getArtifactByCode,
  getArtifactLogistics,
  getInternationalReadiness,
  listShippingProfiles,
  markArtifactInternationalReady,
  saveArtifactLogistics,
  updateArtifact,
} from "@/lib/supabase/provenance"

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

type ShippingFormValues = {
  shipping_profile_code: string
  shipping_profile_name: string
  estimated_package_weight_grams: string
  estimated_package_length_cm: string
  estimated_package_width_cm: string
  estimated_package_height_cm: string
  package_type: string
  carrier_preference: string
  ddp_supported: boolean
  insurance_required: boolean
  special_handling_required: boolean
  international_sale_status: string
  manual_review_required: boolean
  allowed_destination_countries: string
  restricted_destination_countries: string
  restricted_reason: string
  brokerage_fee_policy: string
  ddp_mode: string
  customs_risk_tier: string
}

type CustomsFormValues = {
  customs_product_name_en: string
  customs_product_type: string
  hs_code_global_6: string
  hs_code_local: string
  country_of_origin: string
  commercial_invoice_description: string
  material_composition: string
  contains_battery: boolean
  contains_electronics: boolean
  contains_leather: boolean
  contains_fur: boolean
  preferential_origin_eligible: boolean
  declared_value_override: string
  declared_currency: string
  customs_notes_internal: string
}

type ArtifactFormProps = {
  mode: "create" | "edit"
  artifactId?: string
  initialValues?: Partial<ArtifactRecord>
}

type SectionKey = "shipping" | "customs" | "sales" | "restrictions"

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
      (initialValues?.public_visibility as ArtifactFormValues["public_visibility"]) ?? "public",
    internal_notes: initialValues?.internal_notes ?? "",
  }
}

function getDefaultShippingValues(): ShippingFormValues {
  return {
    shipping_profile_code: "",
    shipping_profile_name: "",
    estimated_package_weight_grams: "",
    estimated_package_length_cm: "",
    estimated_package_width_cm: "",
    estimated_package_height_cm: "",
    package_type: "",
    carrier_preference: "",
    ddp_supported: false,
    insurance_required: false,
    special_handling_required: false,
    international_sale_status: "draft",
    manual_review_required: false,
    allowed_destination_countries: "",
    restricted_destination_countries: "",
    restricted_reason: "",
    brokerage_fee_policy: "",
    ddp_mode: "",
    customs_risk_tier: "",
  }
}

function getDefaultCustomsValues(): CustomsFormValues {
  return {
    customs_product_name_en: "",
    customs_product_type: "",
    hs_code_global_6: "",
    hs_code_local: "",
    country_of_origin: "",
    commercial_invoice_description: "",
    material_composition: "",
    contains_battery: false,
    contains_electronics: false,
    contains_leather: false,
    contains_fur: false,
    preferential_origin_eligible: false,
    declared_value_override: "",
    declared_currency: "",
    customs_notes_internal: "",
  }
}

function toInputValue(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return ""
  }

  return String(value)
}

function formatCountryCodes(values: string[] | null | undefined) {
  return (values ?? []).join(", ")
}

function parseCountryCodesInput(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[,\n]/)
        .map((token) => token.trim().toUpperCase())
        .filter(Boolean),
    ),
  )
}

function getShippingFormValues(record?: ProductShippingInfoRecord | null): ShippingFormValues {
  return {
    shipping_profile_code: record?.shipping_profile_code ?? "",
    shipping_profile_name: record?.shipping_profile_name ?? "",
    estimated_package_weight_grams: toInputValue(record?.estimated_package_weight_grams),
    estimated_package_length_cm: toInputValue(record?.estimated_package_length_cm),
    estimated_package_width_cm: toInputValue(record?.estimated_package_width_cm),
    estimated_package_height_cm: toInputValue(record?.estimated_package_height_cm),
    package_type: record?.package_type ?? "",
    carrier_preference: record?.carrier_preference ?? "",
    ddp_supported: record?.ddp_supported ?? false,
    insurance_required: record?.insurance_required ?? false,
    special_handling_required: record?.special_handling_required ?? false,
    international_sale_status: record?.international_sale_status ?? "draft",
    manual_review_required: record?.manual_review_required ?? false,
    allowed_destination_countries: formatCountryCodes(record?.allowed_destination_countries),
    restricted_destination_countries: formatCountryCodes(record?.restricted_destination_countries),
    restricted_reason: record?.restricted_reason ?? "",
    brokerage_fee_policy: record?.brokerage_fee_policy ?? "",
    ddp_mode: record?.ddp_mode ?? "",
    customs_risk_tier: record?.customs_risk_tier ?? "",
  }
}

function getCustomsFormValues(record?: ProductCustomsInfoRecord | null): CustomsFormValues {
  return {
    customs_product_name_en: record?.customs_product_name_en ?? "",
    customs_product_type: record?.customs_product_type ?? "",
    hs_code_global_6: record?.hs_code_global_6 ?? "",
    hs_code_local: record?.hs_code_local ?? "",
    country_of_origin: record?.country_of_origin ?? "",
    commercial_invoice_description: record?.commercial_invoice_description ?? "",
    material_composition: record?.material_composition ?? "",
    contains_battery: record?.contains_battery ?? false,
    contains_electronics: record?.contains_electronics ?? false,
    contains_leather: record?.contains_leather ?? false,
    contains_fur: record?.contains_fur ?? false,
    preferential_origin_eligible: record?.preferential_origin_eligible ?? false,
    declared_value_override: toInputValue(record?.declared_value_override),
    declared_currency: record?.declared_currency ?? "",
    customs_notes_internal: record?.customs_notes_internal ?? "",
  }
}

function toShippingPayload(values: ShippingFormValues): Partial<ProductShippingInfoRecord> {
  return {
    shipping_profile_code: normalizeOptionalString(values.shipping_profile_code),
    shipping_profile_name: normalizeOptionalString(values.shipping_profile_name),
    estimated_package_weight_grams: normalizeOptionalNumber(values.estimated_package_weight_grams),
    estimated_package_length_cm: normalizeOptionalNumber(values.estimated_package_length_cm),
    estimated_package_width_cm: normalizeOptionalNumber(values.estimated_package_width_cm),
    estimated_package_height_cm: normalizeOptionalNumber(values.estimated_package_height_cm),
    package_type: normalizeOptionalString(values.package_type) as ProductShippingInfoRecord["package_type"],
    carrier_preference: normalizeOptionalString(values.carrier_preference) as ProductShippingInfoRecord["carrier_preference"],
    ddp_supported: values.ddp_supported,
    insurance_required: values.insurance_required,
    special_handling_required: values.special_handling_required,
    international_sale_status:
      (normalizeOptionalString(values.international_sale_status) as ProductShippingInfoRecord["international_sale_status"]) ?? "draft",
    manual_review_required: values.manual_review_required,
    allowed_destination_countries: parseCountryCodesInput(values.allowed_destination_countries),
    restricted_destination_countries: parseCountryCodesInput(values.restricted_destination_countries),
    restricted_reason: normalizeOptionalString(values.restricted_reason),
    brokerage_fee_policy: normalizeOptionalString(values.brokerage_fee_policy) as ProductShippingInfoRecord["brokerage_fee_policy"],
    ddp_mode: normalizeOptionalString(values.ddp_mode) as ProductShippingInfoRecord["ddp_mode"],
    customs_risk_tier: normalizeOptionalString(values.customs_risk_tier) as ProductShippingInfoRecord["customs_risk_tier"],
  }
}

function toCustomsPayload(values: CustomsFormValues): Partial<ProductCustomsInfoRecord> {
  return {
    customs_product_name_en: normalizeOptionalString(values.customs_product_name_en),
    customs_product_type: normalizeOptionalString(values.customs_product_type),
    hs_code_global_6: normalizeOptionalString(values.hs_code_global_6),
    hs_code_local: normalizeOptionalString(values.hs_code_local),
    country_of_origin: normalizeOptionalString(values.country_of_origin),
    commercial_invoice_description: normalizeOptionalString(values.commercial_invoice_description),
    material_composition: normalizeOptionalString(values.material_composition),
    contains_battery: values.contains_battery,
    contains_electronics: values.contains_electronics,
    contains_leather: values.contains_leather,
    contains_fur: values.contains_fur,
    preferential_origin_eligible: values.preferential_origin_eligible,
    declared_value_override: normalizeOptionalNumber(values.declared_value_override),
    declared_currency: normalizeOptionalString(values.declared_currency),
    customs_notes_internal: normalizeOptionalString(values.customs_notes_internal),
  }
}

function getShippingBadgeValue(status: ReturnType<typeof computeShippingInfoStatus>) {
  if (status === "complete") {
    return "shipping_info_complete"
  }

  if (status === "partial") {
    return "shipping_info_partial"
  }

  return "shipping_info_missing"
}

function getCustomsBadgeValue(status: ReturnType<typeof computeCustomsInfoStatus>) {
  if (status === "complete") {
    return "customs_info_complete"
  }

  if (status === "partial") {
    return "customs_info_partial"
  }

  return "customs_info_missing"
}

function ErrorMessage({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return <p className="text-sm text-rose-300">{message}</p>
}

function ToggleField({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-white/50">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function FormHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-5 text-white/45">{children}</p>
}

function SectionCard({
  title,
  description,
  open,
  onOpenChange,
  badges,
  children,
}: {
  title: string
  description: string
  open: boolean
  onOpenChange: (open: boolean) => void
  badges?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card className="border-white/10 bg-white/[0.03] text-white">
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <CardTitle>{title}</CardTitle>
              <p className="max-w-3xl text-sm leading-6 text-white/55">{description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {badges}
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/10 bg-transparent text-white hover:bg-white/[0.04]"
                >
                  {open ? (
                    <>
                      Collapse
                      <ChevronUp className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Expand
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-6">{children}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

export function ArtifactForm({ mode, artifactId, initialValues }: ArtifactFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isMarkingReady, startReadyTransition] = useTransition()
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [supplementalError, setSupplementalError] = useState<string | null>(null)
  const [readinessError, setReadinessError] = useState<string | null>(null)
  const [readinessMissingFields, setReadinessMissingFields] = useState<string[]>([])
  const [shippingProfiles, setShippingProfiles] = useState<ProductShippingProfileRecord[]>([])
  const [shippingValues, setShippingValues] = useState<ShippingFormValues>(getDefaultShippingValues)
  const [customsValues, setCustomsValues] = useState<CustomsFormValues>(getDefaultCustomsValues)
  const [isSupplementalLoading, setIsSupplementalLoading] = useState(mode === "edit")
  const [lastSavedInternationalStatus, setLastSavedInternationalStatus] = useState<string>("draft")
  const [sectionsOpen, setSectionsOpen] = useState<Record<SectionKey, boolean>>({
    shipping: false,
    customs: false,
    sales: false,
    restrictions: false,
  })

  const defaults = useMemo(() => getDefaultValues(initialValues), [initialValues])
  const form = useForm<ArtifactFormValues>({
    resolver: zodResolver(artifactFormSchema),
    defaultValues: defaults,
  })

  useEffect(() => {
    form.reset(defaults)
  }, [defaults, form])

  useEffect(() => {
    let active = true

    async function loadSupplemental() {
      try {
        setIsSupplementalLoading(true)
        setSupplementalError(null)
        const [profiles, logistics] = await Promise.all([
          listShippingProfiles(),
          mode === "edit" && artifactId ? getArtifactLogistics(artifactId) : Promise.resolve(null),
        ])

        if (!active) {
          return
        }

        setShippingProfiles(profiles)

        if (logistics) {
          setShippingValues(getShippingFormValues(logistics.shipping))
          setCustomsValues(getCustomsFormValues(logistics.customs))
          setLastSavedInternationalStatus(logistics.shipping?.international_sale_status ?? "draft")
          setSectionsOpen({
            shipping: logistics.readiness.shippingStatus !== "empty",
            customs: logistics.readiness.customsStatus !== "empty",
            sales: Boolean(logistics.shipping),
            restrictions: Boolean(
              logistics.shipping?.manual_review_required ||
                logistics.shipping?.allowed_destination_countries?.length ||
                logistics.shipping?.restricted_destination_countries?.length ||
                logistics.shipping?.restricted_reason,
            ),
          })
        }
      } catch (error) {
        if (!active) {
          return
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to load shipping and customs data."
        setSupplementalError(message)
      } finally {
        if (active) {
          setIsSupplementalLoading(false)
        }
      }
    }

    void loadSupplemental()

    return () => {
      active = false
    }
  }, [artifactId, mode])

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = form

  const selectedShippingProfile = useMemo(
    () =>
      shippingProfiles.find(
        (profile) => profile.shipping_profile_code === shippingValues.shipping_profile_code,
      ) ?? null,
    [shippingProfiles, shippingValues.shipping_profile_code],
  )

  const shippingPreview = useMemo(() => toShippingPayload(shippingValues), [shippingValues])
  const customsPreview = useMemo(() => toCustomsPayload(customsValues), [customsValues])
  const readinessPreview = useMemo(
    () => getInternationalReadiness(shippingPreview, customsPreview, selectedShippingProfile),
    [customsPreview, selectedShippingProfile, shippingPreview],
  )

  const shippingStatus = useMemo(
    () => computeShippingInfoStatus(shippingPreview, selectedShippingProfile),
    [selectedShippingProfile, shippingPreview],
  )
  const customsStatus = useMemo(
    () => computeCustomsInfoStatus(customsPreview),
    [customsPreview],
  )

  const setSectionOpen = (section: SectionKey, open: boolean) => {
    setSectionsOpen((current) => ({
      ...current,
      [section]: open,
    }))
  }

  const patchShippingValues = (patch: Partial<ShippingFormValues>) => {
    setShippingValues((current) => ({
      ...current,
      ...patch,
    }))
  }

  const patchCustomsValues = (patch: Partial<CustomsFormValues>) => {
    setCustomsValues((current) => ({
      ...current,
      ...patch,
    }))
  }

  const applyShippingProfileDefaults = (profile: ProductShippingProfileRecord) => {
    setShippingValues((current) => ({
      ...current,
      shipping_profile_code: profile.shipping_profile_code,
      shipping_profile_name: current.shipping_profile_name || profile.shipping_profile_name,
      estimated_package_weight_grams:
        current.estimated_package_weight_grams || toInputValue(profile.estimated_package_weight_grams),
      estimated_package_length_cm:
        current.estimated_package_length_cm || toInputValue(profile.estimated_package_length_cm),
      estimated_package_width_cm:
        current.estimated_package_width_cm || toInputValue(profile.estimated_package_width_cm),
      estimated_package_height_cm:
        current.estimated_package_height_cm || toInputValue(profile.estimated_package_height_cm),
      package_type: current.package_type || profile.package_type || "",
      carrier_preference: current.carrier_preference || profile.carrier_preference || "",
      ddp_supported: current.ddp_supported || profile.ddp_supported,
      insurance_required: current.insurance_required || profile.insurance_required,
      special_handling_required:
        current.special_handling_required || profile.special_handling_required,
    }))
  }

  async function saveArtifactAndLogistics(
    values: ArtifactFormValues,
    options?: { activateInternational?: boolean },
  ) {
    if (
      shippingPreview.international_sale_status === "international_ready" &&
      lastSavedInternationalStatus !== "international_ready" &&
      !options?.activateInternational
    ) {
      throw new Error("Use Mark International Ready to validate and activate international sales.")
    }

    const existing = await getArtifactByCode(values.artifact_code)

    if (existing && existing.id !== artifactId) {
      setError("artifact_code", {
        type: "validate",
        message: "artifact_code already exists.",
      })
      throw new Error("artifact_code already exists.")
    }

    const artifactPayload = {
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
        ? await createArtifact(artifactPayload)
        : await updateArtifact(artifactId!, artifactPayload)

    const logistics = await saveArtifactLogistics(artifact.id, {
      shipping: shippingPreview,
      customs: customsPreview,
    })

    if (options?.activateInternational) {
      const ready = await markArtifactInternationalReady(artifact.id)
      return { artifact, logistics: ready }
    }

    return { artifact, logistics }
  }

  const submit = handleSubmit((values) => {
    setGeneralError(null)
    setReadinessError(null)
    setReadinessMissingFields([])

    startTransition(async () => {
      try {
        const { artifact, logistics } = await saveArtifactAndLogistics(values)

        setShippingValues(getShippingFormValues(logistics.shipping))
        setCustomsValues(getCustomsFormValues(logistics.customs))
        setLastSavedInternationalStatus(logistics.shipping?.international_sale_status ?? "draft")

        toast({
          title: mode === "create" ? "Artifact created" : "Artifact updated",
          description:
            mode === "create"
              ? `${artifact.artifact_code} draft is now saved to Supabase.`
              : `${artifact.artifact_code} changes are now saved to Supabase.`,
        })

        if (mode === "create") {
          router.push(`/admin/artifacts/${artifact.id}`)
        } else {
          router.refresh()
        }
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

  const handleMarkReady = handleSubmit((values) => {
    setGeneralError(null)
    setReadinessError(null)
    setReadinessMissingFields([])

    startReadyTransition(async () => {
      try {
        const { artifact, logistics } = await saveArtifactAndLogistics(values, {
          activateInternational: true,
        })

        setShippingValues(getShippingFormValues(logistics.shipping))
        setCustomsValues(getCustomsFormValues(logistics.customs))
        setLastSavedInternationalStatus("international_ready")

        toast({
          title: "International Ready",
          description: `${artifact.artifact_code} is now cleared for international sale.`,
        })

        router.refresh()
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "International readiness validation failed."
        setReadinessError(message)
        setReadinessMissingFields(readinessPreview.missingFields)
        toast({
          title: "International readiness failed",
          description: message,
          variant: "destructive",
        })
      }
    })
  })

  const saveLabel = mode === "create" ? "Save Draft" : "Save Changes"

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card className="border-white/10 bg-white/[0.03] text-white">
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <CardTitle>Basic Product Info</CardTitle>
              <p className="max-w-3xl text-sm leading-6 text-white/55">
                You can save a draft with only the core product fields. Shipping and customs data
                can be completed later by the operations team.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge value={getShippingBadgeValue(shippingStatus)} />
              <StatusBadge value={getCustomsBadgeValue(customsStatus)} />
              <StatusBadge value={shippingValues.international_sale_status} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {generalError ? (
            <div className="rounded-md border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {generalError}
            </div>
          ) : null}

          {supplementalError ? (
            <div className="rounded-md border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
              {supplementalError}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="artifact_code">Artifact code</Label>
              <Input id="artifact_code" {...register("artifact_code")} className="border-white/10 bg-black/30 text-white" placeholder="KR-ART-0001" />
              <ErrorMessage message={errors.artifact_code?.message} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="artifact_title">Artifact title</Label>
              <Input id="artifact_title" {...register("artifact_title")} className="border-white/10 bg-black/30 text-white" placeholder="Stage Jacket" />
              <ErrorMessage message={errors.artifact_title?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="artifact_type">Artifact type</Label>
              <Input id="artifact_type" {...register("artifact_type")} className="border-white/10 bg-black/30 text-white" placeholder="Stage jacket" />
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
              <FormHint>Use a short era, tour, or campaign note even if the exact label is not final yet.</FormHint>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimated_year">Estimated year</Label>
              <Input id="estimated_year" {...register("estimated_year")} className="border-white/10 bg-black/30 text-white" placeholder="2022" />
              <ErrorMessage message={errors.estimated_year?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="first_documented_usage">First documented usage</Label>
              <Input id="first_documented_usage" {...register("first_documented_usage")} className="border-white/10 bg-black/30 text-white" placeholder="M Countdown performance" />
            </div>
            <div className="space-y-2">
              <Label>Usage tier</Label>
              <Controller
                control={control}
                name="usage_tier"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full border-white/10 bg-black/30 text-white"><SelectValue placeholder="Select tier" /></SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                      {USAGE_TIER_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
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
                    <SelectTrigger className="w-full border-white/10 bg-black/30 text-white"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                      {ARTIFACT_STATUS_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
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
                    <SelectTrigger className="w-full border-white/10 bg-black/30 text-white"><SelectValue placeholder="Select visibility" /></SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                      {PUBLIC_VISIBILITY_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormHint>Public records can flow into the registry while shipping and customs data stays editable internally.</FormHint>
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
            <Controller control={control} name="is_custom_made" render={({ field }) => <ToggleField label="Custom made" description={field.value ? "Yes" : "No"} checked={field.value} onCheckedChange={field.onChange} />} />
            <Controller control={control} name="is_stage_used" render={({ field }) => <ToggleField label="Stage used" description={field.value ? "Yes" : "No"} checked={field.value} onCheckedChange={field.onChange} />} />
            <Controller control={control} name="is_screen_used" render={({ field }) => <ToggleField label="Screen used" description={field.value ? "Yes" : "No"} checked={field.value} onCheckedChange={field.onChange} />} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="internal_notes">Internal notes</Label>
              <Textarea id="internal_notes" {...register("internal_notes")} className="min-h-36 border-white/10 bg-black/30 text-white" placeholder="Operator context, handling notes, risk flags..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="operator_guidance">Operator guidance</Label>
              <div id="operator_guidance" className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/60">
                Keep the first save lightweight, then complete shipping and customs once the data is confirmed. International activation is validated only through the separate action below.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <SectionCard
        title="Shipping Profile"
        description="Manage packaging, weight, and carrier preferences here. Leave it blank for now if needed and keep the product in draft."
        open={sectionsOpen.shipping}
        onOpenChange={(open) => setSectionOpen("shipping", open)}
        badges={<StatusBadge value={getShippingBadgeValue(shippingStatus)} />}
      >
        {isSupplementalLoading ? (
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Spinner />
            Loading shipping profiles...
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2">
            <Label>Shipping Profile</Label>
            <Select
              value={shippingValues.shipping_profile_code || undefined}
              onValueChange={(value) => {
                const profile = shippingProfiles.find((item) => item.shipping_profile_code === value) ?? null
                patchShippingValues({ shipping_profile_code: value, shipping_profile_name: profile?.shipping_profile_name ?? "" })
                if (profile) {
                  applyShippingProfileDefaults(profile)
                }
              }}
            >
              <SelectTrigger className="w-full border-white/10 bg-black/30 text-white"><SelectValue placeholder="Select shipping profile" /></SelectTrigger>
              <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                {shippingProfiles.map((profile) => <SelectItem key={profile.shipping_profile_code} value={profile.shipping_profile_code}>{profile.shipping_profile_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormHint>Choosing a preset will prefill the common packaging defaults for the team.</FormHint>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shipping_profile_name">Shipping profile name</Label>
            <Input id="shipping_profile_name" value={shippingValues.shipping_profile_name} onChange={(event) => patchShippingValues({ shipping_profile_name: event.target.value })} className="border-white/10 bg-black/30 text-white" placeholder="Apparel Premium Box" />
          </div>
          <div className="space-y-2">
            <Label>Package type</Label>
            <Select value={shippingValues.package_type || undefined} onValueChange={(value) => patchShippingValues({ package_type: value })}>
              <SelectTrigger className="w-full border-white/10 bg-black/30 text-white"><SelectValue placeholder="Select package type" /></SelectTrigger>
              <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                {PACKAGE_TYPE_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimated_package_weight_grams">Estimated package weight (g)</Label>
            <Input id="estimated_package_weight_grams" value={shippingValues.estimated_package_weight_grams} onChange={(event) => patchShippingValues({ estimated_package_weight_grams: event.target.value })} className="border-white/10 bg-black/30 text-white" placeholder="700" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimated_package_length_cm">Length (cm)</Label>
            <Input id="estimated_package_length_cm" value={shippingValues.estimated_package_length_cm} onChange={(event) => patchShippingValues({ estimated_package_length_cm: event.target.value })} className="border-white/10 bg-black/30 text-white" placeholder="38" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimated_package_width_cm">Width (cm)</Label>
            <Input id="estimated_package_width_cm" value={shippingValues.estimated_package_width_cm} onChange={(event) => patchShippingValues({ estimated_package_width_cm: event.target.value })} className="border-white/10 bg-black/30 text-white" placeholder="28" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimated_package_height_cm">Height (cm)</Label>
            <Input id="estimated_package_height_cm" value={shippingValues.estimated_package_height_cm} onChange={(event) => patchShippingValues({ estimated_package_height_cm: event.target.value })} className="border-white/10 bg-black/30 text-white" placeholder="6" />
          </div>
          <div className="space-y-2">
            <Label>Carrier preference</Label>
            <Select value={shippingValues.carrier_preference || undefined} onValueChange={(value) => patchShippingValues({ carrier_preference: value })}>
              <SelectTrigger className="w-full border-white/10 bg-black/30 text-white"><SelectValue placeholder="Select carrier" /></SelectTrigger>
              <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                {CARRIER_PREFERENCE_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedShippingProfile ? (
          <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-white/60">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-white">{selectedShippingProfile.shipping_profile_name}</p>
                <p className="mt-1 text-xs text-white/45">Code: {selectedShippingProfile.shipping_profile_code}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge value={selectedShippingProfile.package_type} />
                <StatusBadge value={selectedShippingProfile.carrier_preference} />
              </div>
            </div>
            <p className="mt-3 leading-6">Missing package fields can inherit from this profile when readiness is calculated.</p>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <ToggleField label="DDP supported" description={shippingValues.ddp_supported ? "Enabled" : "Disabled"} checked={shippingValues.ddp_supported} onCheckedChange={(checked) => patchShippingValues({ ddp_supported: checked })} />
          <ToggleField label="Insurance required" description={shippingValues.insurance_required ? "Enabled" : "Disabled"} checked={shippingValues.insurance_required} onCheckedChange={(checked) => patchShippingValues({ insurance_required: checked })} />
          <ToggleField label="Special handling required" description={shippingValues.special_handling_required ? "Enabled" : "Disabled"} checked={shippingValues.special_handling_required} onCheckedChange={(checked) => patchShippingValues({ special_handling_required: checked })} />
        </div>
      </SectionCard>

      <SectionCard
        title="Customs Info"
        description="Store customs wording, origin, and HS codes here. Unknown values can stay blank while the record remains in draft."
        open={sectionsOpen.customs}
        onOpenChange={(open) => setSectionOpen("customs", open)}
        badges={<StatusBadge value={getCustomsBadgeValue(customsStatus)} />}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="customs_product_name_en">Customs product name (EN)</Label>
            <Input id="customs_product_name_en" value={customsValues.customs_product_name_en} onChange={(event) => patchCustomsValues({ customs_product_name_en: event.target.value })} className="border-white/10 bg-black/30 text-white" placeholder="Cotton stage jacket" />
            <FormHint>This field is required before the product can become international_ready.</FormHint>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customs_product_type">Customs product type</Label>
            <Input id="customs_product_type" value={customsValues.customs_product_type} onChange={(event) => patchCustomsValues({ customs_product_type: event.target.value })} className="border-white/10 bg-black/30 text-white" placeholder="apparel" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hs_code_global_6">HS Code</Label>
            <Input id="hs_code_global_6" value={customsValues.hs_code_global_6} onChange={(event) => patchCustomsValues({ hs_code_global_6: event.target.value })} className="border-white/10 bg-black/30 text-white" placeholder="620333" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hs_code_local">HS Code Local</Label>
            <Input id="hs_code_local" value={customsValues.hs_code_local} onChange={(event) => patchCustomsValues({ hs_code_local: event.target.value })} className="border-white/10 bg-black/30 text-white" placeholder="6203331000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country_of_origin">Country of Origin</Label>
            <Input id="country_of_origin" value={customsValues.country_of_origin} onChange={(event) => patchCustomsValues({ country_of_origin: event.target.value })} className="border-white/10 bg-black/30 text-white" placeholder="KR" />
          </div>
          <div className="space-y-2 md:col-span-2 xl:col-span-3">
            <Label htmlFor="commercial_invoice_description">Commercial invoice description</Label>
            <Input id="commercial_invoice_description" value={customsValues.commercial_invoice_description} onChange={(event) => patchCustomsValues({ commercial_invoice_description: event.target.value })} className="border-white/10 bg-black/30 text-white" placeholder="Collector-grade cotton jacket with stage provenance" />
          </div>
          <div className="space-y-2 md:col-span-2 xl:col-span-3">
            <Label htmlFor="material_composition">Material composition</Label>
            <Textarea id="material_composition" value={customsValues.material_composition} onChange={(event) => patchCustomsValues({ material_composition: event.target.value })} className="min-h-28 border-white/10 bg-black/30 text-white" placeholder="Shell 100% cotton / Lining 100% polyester" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="declared_value_override">Declared value override</Label>
            <Input id="declared_value_override" value={customsValues.declared_value_override} onChange={(event) => patchCustomsValues({ declared_value_override: event.target.value })} className="border-white/10 bg-black/30 text-white" placeholder="1500" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="declared_currency">Declared currency</Label>
            <Input id="declared_currency" value={customsValues.declared_currency} onChange={(event) => patchCustomsValues({ declared_currency: event.target.value })} className="border-white/10 bg-black/30 text-white" placeholder="USD" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <ToggleField label="Contains battery" description={customsValues.contains_battery ? "Yes" : "No"} checked={customsValues.contains_battery} onCheckedChange={(checked) => patchCustomsValues({ contains_battery: checked })} />
          <ToggleField label="Contains electronics" description={customsValues.contains_electronics ? "Yes" : "No"} checked={customsValues.contains_electronics} onCheckedChange={(checked) => patchCustomsValues({ contains_electronics: checked })} />
          <ToggleField label="Contains leather" description={customsValues.contains_leather ? "Yes" : "No"} checked={customsValues.contains_leather} onCheckedChange={(checked) => patchCustomsValues({ contains_leather: checked })} />
          <ToggleField label="Contains fur" description={customsValues.contains_fur ? "Yes" : "No"} checked={customsValues.contains_fur} onCheckedChange={(checked) => patchCustomsValues({ contains_fur: checked })} />
          <ToggleField label="Preferential origin eligible" description={customsValues.preferential_origin_eligible ? "Yes" : "No"} checked={customsValues.preferential_origin_eligible} onCheckedChange={(checked) => patchCustomsValues({ preferential_origin_eligible: checked })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customs_notes_internal">Customs notes internal</Label>
          <Textarea id="customs_notes_internal" value={customsValues.customs_notes_internal} onChange={(event) => patchCustomsValues({ customs_notes_internal: event.target.value })} className="min-h-28 border-white/10 bg-black/30 text-white" placeholder="Internal customs notes, conservative descriptions, country-specific warnings..." />
        </div>
      </SectionCard>

      <SectionCard
        title="International Sales Settings"
        description="Draft saves and international_ready activation are separate. Settings here can be saved partially, but ready activation is strict."
        open={sectionsOpen.sales}
        onOpenChange={(open) => setSectionOpen("sales", open)}
        badges={<StatusBadge value={shippingValues.international_sale_status} />}
      >
        {readinessError ? (
          <Alert className="border-rose-500/25 bg-rose-500/10 text-rose-100">
            <AlertTitle>International readiness blocked</AlertTitle>
            <AlertDescription>
              <p>{readinessError}</p>
              {readinessMissingFields.length ? (
                <ul className="mt-2 list-disc pl-5">
                  {readinessMissingFields.map((field) => <li key={field}>{field}</li>)}
                </ul>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2">
            <Label>International sale status</Label>
            <Select value={shippingValues.international_sale_status || undefined} onValueChange={(value) => patchShippingValues({ international_sale_status: value })}>
              <SelectTrigger className="w-full border-white/10 bg-black/30 text-white"><SelectValue placeholder="Select sale status" /></SelectTrigger>
              <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                {INTERNATIONAL_SALE_STATUS_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormHint>Use Mark International Ready below instead of Save when you want to activate global sale status.</FormHint>
          </div>
          <div className="space-y-2">
            <Label>DDP Mode</Label>
            <Select value={shippingValues.ddp_mode || undefined} onValueChange={(value) => patchShippingValues({ ddp_mode: value })}>
              <SelectTrigger className="w-full border-white/10 bg-black/30 text-white"><SelectValue placeholder="Select DDP mode" /></SelectTrigger>
              <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                {DDP_MODE_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Brokerage fee policy</Label>
            <Select value={shippingValues.brokerage_fee_policy || undefined} onValueChange={(value) => patchShippingValues({ brokerage_fee_policy: value })}>
              <SelectTrigger className="w-full border-white/10 bg-black/30 text-white"><SelectValue placeholder="Select brokerage policy" /></SelectTrigger>
              <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                {BROKERAGE_FEE_POLICY_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Customs risk tier</Label>
            <Select value={shippingValues.customs_risk_tier || undefined} onValueChange={(value) => patchShippingValues({ customs_risk_tier: value })}>
              <SelectTrigger className="w-full border-white/10 bg-black/30 text-white"><SelectValue placeholder="Select risk tier" /></SelectTrigger>
              <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                {CUSTOMS_RISK_TIER_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-black/20 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={getShippingBadgeValue(shippingStatus)} />
            <StatusBadge value={getCustomsBadgeValue(customsStatus)} />
            <StatusBadge value={readinessPreview.internationalReady ? "international_ready" : shippingValues.international_sale_status === "restricted" ? "restricted" : shippingValues.international_sale_status === "domestic_only" ? "domestic_only" : "review_required"} />
          </div>
          <p className="mt-3 text-sm leading-6 text-white/60">Readiness checks shipping, customs, and manual review together. Missing fields never block Save, but they do block international_ready.</p>
        </div>
      </SectionCard>

      <SectionCard
        title="Country Restrictions / Manual Review"
        description="Manage destination restrictions and manual review flags here. This is the final ops checkpoint before international release."
        open={sectionsOpen.restrictions}
        onOpenChange={(open) => setSectionOpen("restrictions", open)}
        badges={<><StatusBadge value={shippingValues.international_sale_status} />{shippingValues.manual_review_required ? <StatusBadge value="review_required" /> : null}</>}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="allowed_destination_countries">Allowed destination countries</Label>
            <Textarea id="allowed_destination_countries" value={shippingValues.allowed_destination_countries} onChange={(event) => patchShippingValues({ allowed_destination_countries: event.target.value })} className="min-h-28 border-white/10 bg-black/30 text-white" placeholder="US, JP, SG" />
            <FormHint>Enter comma-separated ISO country codes such as US, JP, or SG.</FormHint>
          </div>
          <div className="space-y-2">
            <Label htmlFor="restricted_destination_countries">Restricted destination countries</Label>
            <Textarea id="restricted_destination_countries" value={shippingValues.restricted_destination_countries} onChange={(event) => patchShippingValues({ restricted_destination_countries: event.target.value })} className="min-h-28 border-white/10 bg-black/30 text-white" placeholder="BR, RU" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="restricted_reason">Restricted reason</Label>
            <Textarea id="restricted_reason" value={shippingValues.restricted_reason} onChange={(event) => patchShippingValues({ restricted_reason: event.target.value })} className="min-h-28 border-white/10 bg-black/30 text-white" placeholder="Leather import restrictions / carrier limitation / customs sensitivity" />
          </div>
          <ToggleField label="Manual Review" description={shippingValues.manual_review_required ? "International release is blocked" : "Clear for readiness validation"} checked={shippingValues.manual_review_required} onCheckedChange={(checked) => patchShippingValues({ manual_review_required: checked })} />
        </div>
      </SectionCard>

      <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-white">Operational actions</p>
          <p className="text-sm text-white/55">Save keeps draft/partial data. Mark International Ready runs the strict shipping + customs validation.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {mode === "edit" ? (
            <Button type="button" onClick={handleMarkReady} disabled={isPending || isMarkingReady} variant="outline" className="border-emerald-400/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20">
              {isMarkingReady ? <><Spinner className="mr-2" />Validating...</> : "Mark International Ready"}
            </Button>
          ) : (
            <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/55">
              Create the draft first, then mark it International Ready from the detail page.
            </div>
          )}

          <Button type="submit" disabled={isPending || isMarkingReady} className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
            {isPending ? <><Spinner className="mr-2" />{mode === "create" ? "Saving draft..." : "Saving changes..."}</> : saveLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}
