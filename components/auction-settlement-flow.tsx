"use client"
import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, BadgeCheck, Globe2, MapPinned, ShieldCheck, Truck, WalletCards, X } from "lucide-react"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { formatMoney, titleCase } from "@/lib/admin/utils"
import type { PurchaseSettlementQuoteRecord, SettlementShippingInput } from "@/lib/supabase/settlements"

type SettlementFlowAdapter = {
  generateQuote: (quoteId: string) => Promise<PurchaseSettlementQuoteRecord>
  proceedToPay: (quoteId: string) => Promise<PurchaseSettlementQuoteRecord>
  saveShippingInfo: (input: SettlementShippingInput) => Promise<PurchaseSettlementQuoteRecord>
}
type SettlementFormState = {
  addressLine1: string; addressLine2: string; city: string; customsIdType: string; customsIdValue: string; deliveryNote: string
  destinationCountry: string; personalCustomsClearanceNumber: string; postalCode: string; recipientEmail: string
  recipientName: string; recipientPhone: string; stateRegion: string
}
type SettlementFlowProps = {
  adapter: SettlementFlowAdapter; artifactTitle: string; isBlack: boolean; onOpenChange: (open: boolean) => void
  onPaid?: (quote: PurchaseSettlementQuoteRecord) => void; onQuoteChange: (quote: PurchaseSettlementQuoteRecord) => void
  open: boolean; quote: PurchaseSettlementQuoteRecord | null; recipientEmail?: string | null; recipientName?: string | null
}
const COUNTRY_OPTIONS = [
  ["KR", "South Korea"], ["US", "United States"], ["JP", "Japan"], ["SG", "Singapore"], ["HK", "Hong Kong"], ["TW", "Taiwan"],
  ["CN", "China"], ["TH", "Thailand"], ["VN", "Vietnam"], ["CA", "Canada"], ["GB", "United Kingdom"], ["FR", "France"],
  ["DE", "Germany"], ["AU", "Australia"], ["AE", "United Arab Emirates"],
] as const
const GENERIC_CUSTOMS_ID_OPTIONS = [["passport", "Passport"], ["national_id", "National ID"], ["tax_id", "Tax ID / Import ID"]] as const
const US_CUSTOMS_ID_OPTIONS = [["ssn_last4", "Tax ID / SSN (Last 4)"], ["passport", "Passport"]] as const

function initialForm(quote: PurchaseSettlementQuoteRecord | null, recipientName?: string | null, recipientEmail?: string | null): SettlementFormState {
  return {
    addressLine1: quote?.address_line_1 ?? "", addressLine2: quote?.address_line_2 ?? "", city: quote?.city ?? "", customsIdType: quote?.customs_id_type ?? "",
    customsIdValue: quote?.customs_id_value ?? "", deliveryNote: quote?.delivery_note ?? "", destinationCountry: quote?.destination_country ?? "US",
    personalCustomsClearanceNumber: quote?.personal_customs_clearance_number ?? "", postalCode: quote?.postal_code ?? "",
    recipientEmail: quote?.recipient_email ?? recipientEmail ?? "", recipientName: quote?.recipient_name ?? recipientName ?? "",
    recipientPhone: quote?.recipient_phone ?? "", stateRegion: quote?.state_region ?? "",
  }
}
function customsOptions(country: string) { return country === "US" ? US_CUSTOMS_ID_OPTIONS : country === "KR" ? [] : GENERIC_CUSTOMS_ID_OPTIONS }
function carrierLabel(quote: PurchaseSettlementQuoteRecord) {
  if (!quote.carrier_preference && !quote.package_type) return "Carrier assigned after quote generation"
  return `${quote.carrier_preference ? titleCase(quote.carrier_preference) : "Carrier"} • ${quote.package_type ? titleCase(quote.package_type) : "Parcel"}`
}
function ddpLabel(quote: PurchaseSettlementQuoteRecord) {
  if (quote.ddp_mode === "required") return "DDP included"
  if (quote.ddp_supported && quote.ddp_mode === "available") return "DDP available"
  return "Non-DDP / taxes payable on import"
}
function stepPill(active: boolean, complete: boolean, label: string) {
  return <div className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] ${complete ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-100" : active ? "border-[#FF6B9D]/45 bg-[#FF6B9D]/12 text-white" : "border-white/10 bg-white/[0.03] text-white/45"}`}>{label}</div>
}

export function AuctionSettlementFlow({ adapter, artifactTitle, isBlack, onOpenChange, onPaid, onQuoteChange, open, quote, recipientEmail, recipientName }: SettlementFlowProps) {
  const [form, setForm] = useState<SettlementFormState>(() => initialForm(quote, recipientName, recipientEmail))
  const [errors, setErrors] = useState<Partial<Record<keyof SettlementFormState, string>>>({})
  const [actionError, setActionError] = useState<string | null>(null)
  const [submittingShipping, setSubmittingShipping] = useState(false)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    if (!open) { setActionError(null); setErrors({}); return }
    setForm(initialForm(quote, recipientName, recipientEmail)); setActionError(null); setErrors({})
  }, [open, quote, recipientEmail, recipientName])

  const countryOptions = useMemo(() => COUNTRY_OPTIONS.map(([value, label]) => ({ value, label })), [])
  const customsIdOptions = useMemo(() => customsOptions(form.destinationCountry).map(([value, label]) => ({ value, label })), [form.destinationCountry])
  if (!open || !quote) return null
  const activeQuote = quote

  const awaitingShipping = activeQuote.quote_status === "awaiting_shipping_info" || activeQuote.quote_status === "quote_preparing"
  const reviewRequired = activeQuote.quote_status === "review_required"
  const paid = activeQuote.quote_status === "paid"
  const countryLabel = countryOptions.find((option) => option.value === (activeQuote.destination_country ?? form.destinationCountry))?.label ?? form.destinationCountry
  const cardSurface = isBlack ? "border-white/10 bg-[#070707]/95 text-white" : "border-[#FF6B9D]/25 bg-[#07070a]/95 text-white"
  const mutedPanel = isBlack ? "bg-white/[0.03]" : "bg-[#12070d]"
  const patchForm = (values: Partial<SettlementFormState>) => setForm((current) => ({ ...current, ...values }))

  function validateForm() {
    const nextErrors: Partial<Record<keyof SettlementFormState, string>> = {}
    if (!form.destinationCountry) nextErrors.destinationCountry = "Select a destination country."
    if (!form.recipientName.trim()) nextErrors.recipientName = "Recipient name is required."
    if (!form.recipientPhone.trim()) nextErrors.recipientPhone = "Phone is required."
    if (!form.addressLine1.trim()) nextErrors.addressLine1 = "Address line 1 is required."
    if (!form.city.trim()) nextErrors.city = "City is required."
    if (!form.postalCode.trim()) nextErrors.postalCode = form.destinationCountry === "US" ? "ZIP code is required." : "Postal code is required."
    if (form.destinationCountry === "US" && !form.stateRegion.trim()) nextErrors.stateRegion = "State is required for US destinations."
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmitShipping() {
    if (!validateForm()) return
    try {
      setSubmittingShipping(true); setActionError(null)
      const preparingQuote = await adapter.saveShippingInfo({
        quoteId: activeQuote.quote_id, destinationCountry: form.destinationCountry, recipientName: form.recipientName, recipientPhone: form.recipientPhone,
        recipientEmail: form.recipientEmail || null, addressLine1: form.addressLine1, addressLine2: form.addressLine2 || null, city: form.city,
        stateRegion: form.stateRegion || null, postalCode: form.postalCode,
        customsIdType: form.destinationCountry === "KR" ? null : form.customsIdType || null,
        customsIdValue: form.destinationCountry === "KR" ? null : form.customsIdValue || null,
        personalCustomsClearanceNumber: form.destinationCountry === "KR" ? form.personalCustomsClearanceNumber || null : null,
        deliveryNote: form.deliveryNote || null,
      })
      onQuoteChange(preparingQuote)
      onQuoteChange(await adapter.generateQuote(preparingQuote.quote_id))
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to prepare the settlement quote.")
    } finally {
      setSubmittingShipping(false)
    }
  }

  async function handleProceedToPay() {
    try {
      setPaying(true); setActionError(null)
      const paidQuote = await adapter.proceedToPay(activeQuote.quote_id)
      onQuoteChange(paidQuote); onPaid?.(paidQuote)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to complete payment.")
    } finally {
      setPaying(false)
    }
  }

  return <>
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md" onClick={() => onOpenChange(false)} />
    <div className="fixed inset-0 z-[80] overflow-y-auto p-4 sm:p-6">
      <div className={`mx-auto max-w-6xl rounded-[28px] border shadow-[0_28px_120px_rgba(0,0,0,0.55)] ${cardSurface}`}>
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-8">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2"><StatusBadge value={quote.quote_status} />{quote.is_demo ? <StatusBadge value="demo_mode" /> : null}</div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">Hybrid Settlement</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Payment summary after shipping review</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">Shipping destination, recipient identity, and import estimates are captured before payment so the Buy Now flow feels operationally believable in demos.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {stepPill(awaitingShipping, !awaitingShipping, "Shipping Details")}
              {stepPill(quote.quote_status === "review_required" || quote.quote_status === "payment_requested", quote.quote_status === "review_required" || quote.quote_status === "payment_requested" || quote.quote_status === "paid", "Quote Review")}
              {stepPill(paid, paid, "Payment")}
            </div>
          </div>
          <button type="button" className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white" onClick={() => onOpenChange(false)}><X className="size-5" /></button>
        </div>

        <div className="grid gap-0 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="border-b border-white/10 p-5 sm:p-8 xl:border-b-0 xl:border-r">
            {awaitingShipping ? <div className="space-y-6">
              <div className={`rounded-3xl border border-white/10 p-5 ${mutedPanel}`}>
                <div className="flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-2xl border border-[#FF6B9D]/35 bg-[#FF6B9D]/12"><MapPinned className="size-5 text-[#FF9DBE]" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">Shipping destination</p><p className="mt-1 text-sm text-white/65">Admin handles packaging defaults and customs logic. The buyer only provides recipient details.</p></div></div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Destination country</Label><Select value={form.destinationCountry || undefined} onValueChange={(value) => patchForm({ destinationCountry: value, customsIdType: value === "KR" ? "" : form.customsIdType, customsIdValue: value === "KR" ? "" : form.customsIdValue, personalCustomsClearanceNumber: value === "KR" ? form.personalCustomsClearanceNumber : "" })}><SelectTrigger className="w-full border-white/10 bg-black/35 text-white"><SelectValue placeholder="Select country" /></SelectTrigger><SelectContent className="border-white/10 bg-[#0f1117] text-white">{countryOptions.map((country) => <SelectItem key={country.value} value={country.value}>{country.label}</SelectItem>)}</SelectContent></Select>{errors.destinationCountry ? <p className="text-xs text-rose-300">{errors.destinationCountry}</p> : null}</div>
                <div className="space-y-2"><Label>Recipient name</Label><Input value={form.recipientName} onChange={(event) => patchForm({ recipientName: event.target.value })} className="border-white/10 bg-black/35 text-white" placeholder="Collector name" />{errors.recipientName ? <p className="text-xs text-rose-300">{errors.recipientName}</p> : null}</div>
                <div className="space-y-2"><Label>Recipient phone</Label><Input value={form.recipientPhone} onChange={(event) => patchForm({ recipientPhone: event.target.value })} className="border-white/10 bg-black/35 text-white" placeholder="+1 555 123 4567" />{errors.recipientPhone ? <p className="text-xs text-rose-300">{errors.recipientPhone}</p> : null}</div>
                <div className="space-y-2"><Label>Recipient email</Label><Input value={form.recipientEmail} onChange={(event) => patchForm({ recipientEmail: event.target.value })} className="border-white/10 bg-black/35 text-white" placeholder="collector@example.com" /></div>
                <div className="space-y-2 md:col-span-2"><Label>Address line 1</Label><Input value={form.addressLine1} onChange={(event) => patchForm({ addressLine1: event.target.value })} className="border-white/10 bg-black/35 text-white" placeholder="Street address" />{errors.addressLine1 ? <p className="text-xs text-rose-300">{errors.addressLine1}</p> : null}</div>
                <div className="space-y-2 md:col-span-2"><Label>Address line 2</Label><Input value={form.addressLine2} onChange={(event) => patchForm({ addressLine2: event.target.value })} className="border-white/10 bg-black/35 text-white" placeholder="Apartment, suite, district" /></div>
                <div className="space-y-2"><Label>City</Label><Input value={form.city} onChange={(event) => patchForm({ city: event.target.value })} className="border-white/10 bg-black/35 text-white" placeholder="City" />{errors.city ? <p className="text-xs text-rose-300">{errors.city}</p> : null}</div>
                <div className="space-y-2"><Label>{form.destinationCountry === "US" ? "State" : "State / region"}</Label><Input value={form.stateRegion} onChange={(event) => patchForm({ stateRegion: event.target.value })} className="border-white/10 bg-black/35 text-white" placeholder={form.destinationCountry === "US" ? "California" : "Optional"} />{errors.stateRegion ? <p className="text-xs text-rose-300">{errors.stateRegion}</p> : null}</div>
                <div className="space-y-2"><Label>{form.destinationCountry === "US" ? "ZIP code" : "Postal code"}</Label><Input value={form.postalCode} onChange={(event) => patchForm({ postalCode: event.target.value })} className="border-white/10 bg-black/35 text-white" placeholder={form.destinationCountry === "US" ? "10001" : "Postal code"} />{errors.postalCode ? <p className="text-xs text-rose-300">{errors.postalCode}</p> : null}</div>
              </div>

              <div className={`rounded-3xl border border-white/10 p-5 ${mutedPanel}`}>
                <div className="flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]"><Globe2 className="size-5 text-white/75" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">Customs / import information</p><p className="mt-1 text-sm text-white/60">Country-specific fields appear here only when they are relevant to the buyer.</p></div></div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {form.destinationCountry === "KR" ? <div className="space-y-2 md:col-span-2"><Label>Personal customs clearance number</Label><Input value={form.personalCustomsClearanceNumber} onChange={(event) => patchForm({ personalCustomsClearanceNumber: event.target.value })} className="border-white/10 bg-black/35 text-white" placeholder="P123456789012" /><p className="text-xs text-white/45">Shown for Korea-bound shipments when the recipient wants to provide it up front.</p></div> : customsIdOptions.length ? <>
                    <div className="space-y-2"><Label>Customs ID type</Label><Select value={form.customsIdType || undefined} onValueChange={(value) => patchForm({ customsIdType: value })}><SelectTrigger className="w-full border-white/10 bg-black/35 text-white"><SelectValue placeholder="Optional" /></SelectTrigger><SelectContent className="border-white/10 bg-[#0f1117] text-white">{customsIdOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Customs ID value</Label><Input value={form.customsIdValue} onChange={(event) => patchForm({ customsIdValue: event.target.value })} className="border-white/10 bg-black/35 text-white" placeholder="Optional" /></div>
                  </> : null}
                  <div className="space-y-2 md:col-span-2"><Label>Delivery note</Label><Textarea value={form.deliveryNote} onChange={(event) => patchForm({ deliveryNote: event.target.value })} className="min-h-24 border-white/10 bg-black/35 text-white" placeholder="Gate code, concierge note, delivery preference" /></div>
                </div>
              </div>

              {actionError ? <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{actionError}</div> : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-white/55">Some destinations may require manual review before payment can be completed.</p><Button type="button" onClick={() => void handleSubmitShipping()} disabled={submittingShipping} className="bg-[#FF6B9D] text-black hover:bg-[#ff82ae]">{submittingShipping ? <><Spinner className="mr-2" />Preparing quote...</> : "Generate payment quote"}</Button></div>
            </div> : reviewRequired ? <div className="space-y-6">
              <div className="flex items-start gap-4 rounded-3xl border border-amber-400/25 bg-amber-500/10 p-5"><div className="flex size-12 items-center justify-center rounded-2xl border border-amber-400/25 bg-amber-500/12"><AlertTriangle className="size-5 text-amber-200" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-100/70">Review required before payment</p><h3 className="mt-2 text-xl font-semibold text-white">Operations review is needed for this destination</h3><p className="mt-2 text-sm leading-6 text-amber-100/80">{quote.review_reason ?? "Some destinations require manual review before the final payment request can be released."}</p></div></div>
              <div className={`rounded-3xl border border-white/10 p-5 ${mutedPanel}`}><p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">What happens next</p><p className="mt-3 text-sm leading-6 text-white/60">Admin or operations can inspect the artifact shipping profile, destination restrictions, and customs defaults before re-issuing the payment request. The lot remains reserved while this quote is under review.</p></div>
            </div> : paid ? <div className="space-y-6">
              <div className="flex items-start gap-4 rounded-3xl border border-emerald-400/25 bg-emerald-500/10 p-5"><div className="flex size-12 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-500/12"><BadgeCheck className="size-5 text-emerald-200" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100/70">Payment completed</p><h3 className="mt-2 text-xl font-semibold text-white">The hybrid auction settlement is now marked paid</h3><p className="mt-2 text-sm leading-6 text-emerald-100/75">This demo path wrote a realistic settlement record, payment attempts, and a paid state back into the auction flow.</p></div></div>
            </div> : <div className="space-y-6">
              <div className={`rounded-3xl border border-white/10 p-5 ${mutedPanel}`}><div className="flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-2xl border border-[#FF6B9D]/35 bg-[#FF6B9D]/12"><WalletCards className="size-5 text-[#FF9DBE]" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">Payment summary</p><p className="mt-1 text-sm text-white/60">Import duties and taxes are estimated and may vary by customs authority.</p></div></div></div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className={`rounded-3xl border border-white/10 p-5 ${mutedPanel}`}><div className="flex items-center gap-3"><Truck className="size-5 text-white/75" /><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Shipping method</p><p className="mt-1 text-sm text-white">{carrierLabel(quote)}</p></div></div><p className="mt-4 text-sm text-white/55">{ddpLabel(quote)}</p></div>
                <div className={`rounded-3xl border border-white/10 p-5 ${mutedPanel}`}><div className="flex items-center gap-3"><ShieldCheck className="size-5 text-white/75" /><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Customs basis</p><p className="mt-1 text-sm text-white">{quote.customs_product_name_en ?? artifactTitle}</p></div></div><p className="mt-4 text-sm text-white/55">HS {quote.hs_code_global_6 ?? quote.hs_code_local ?? "Pending"} • Origin {quote.country_of_origin ?? "Pending"}</p></div>
              </div>
              {actionError ? <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{actionError}</div> : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="text-sm text-white/55">Some destinations may require manual review before payment can be completed.</div><Button type="button" onClick={() => void handleProceedToPay()} disabled={paying} className="bg-[#FF6B9D] text-black hover:bg-[#ff82ae]">{paying ? <><Spinner className="mr-2" />Processing payment...</> : "Proceed to pay"}</Button></div>
            </div>}
          </div>

          <div className="p-5 sm:p-8">
            <div className={`rounded-[28px] border border-white/10 p-5 ${mutedPanel}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/40">Final amount due</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight">{formatMoney(quote.total_payable_amount, quote.currency)}</h3>
              <p className="mt-2 text-sm text-white/60">{artifactTitle}</p>
              <div className="mt-6 space-y-3 text-sm">{[
                ["Item amount", quote.base_item_amount], ["Buyer premium", quote.buyer_premium_amount], ["Shipping & handling", quote.shipping_amount],
                ["Insurance fee", quote.insurance_amount], ["Estimated import duty", quote.estimated_duty_amount], ["Estimated VAT / tax", quote.estimated_vat_amount], ["Extra handling", quote.extra_handling_amount],
              ].map(([label, amount]) => <div key={label} className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 text-white/70 last:border-b-0 last:pb-0"><span>{label}</span><span className="font-medium text-white">{formatMoney(Number(amount), quote.currency)}</span></div>)}</div>
            </div>
            <div className="mt-5 space-y-4">
              <div className={`rounded-3xl border border-white/10 p-5 ${mutedPanel}`}><p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">Recipient details</p><div className="mt-4 space-y-2 text-sm text-white/65"><p>{quote.recipient_name ?? form.recipientName ?? "Awaiting shipping information"}</p><p>{countryLabel}</p><p>{quote.recipient_phone ?? form.recipientPhone ?? "Phone pending"}</p><p>{quote.address_line_1 ?? form.addressLine1 ?? "Address pending"}</p></div></div>
              <div className={`rounded-3xl border border-white/10 p-5 ${mutedPanel}`}><p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">Operational note</p><p className="mt-3 text-sm leading-6 text-white/60">Import duties and taxes are estimated and may vary by customs authority. Some destinations may require manual review before payment can be completed.</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
}
