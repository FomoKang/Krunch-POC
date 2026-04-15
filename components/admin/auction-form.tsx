"use client"

import { useEffect, useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AUCTION_STATUS_OPTIONS,
  AUCTION_TYPE_OPTIONS,
  GUARANTEE_TYPE_OPTIONS,
  SETTLEMENT_STATUS_OPTIONS,
} from "@/lib/admin/constants"
import {
  normalizeOptionalDateTime,
  normalizeOptionalNumber,
  normalizeOptionalString,
} from "@/lib/admin/utils"
import { createAuction, listArtifactOptions, type ArtifactOption } from "@/lib/supabase/provenance"
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

const auctionFormSchema = z.object({
  artifact_id: z.string().min(1, "Select an artifact."),
  lot_number: z.string().trim().optional(),
  auction_title: z.string().trim().min(1, "auction_title is required."),
  auction_type: z.enum(AUCTION_TYPE_OPTIONS),
  estimate_low: z.string().trim().optional(),
  estimate_high: z.string().trim().optional(),
  reserve_price: z.string().trim().optional(),
  opening_bid: z.string().trim().optional(),
  currency: z.string().trim().min(1, "currency is required."),
  buyer_premium_rate: z.string().trim().optional(),
  seller_fee_rate: z.string().trim().optional(),
  auction_start_time: z.string().trim().optional(),
  auction_end_time: z.string().trim().optional(),
  auction_status: z.enum(AUCTION_STATUS_OPTIONS),
  settlement_status: z.enum(SETTLEMENT_STATUS_OPTIONS),
  closing_reason: z.string().trim().optional(),
  guarantee_type: z.enum(GUARANTEE_TYPE_OPTIONS),
  guarantee_amount: z.string().trim().optional(),
})

type AuctionFormValues = z.infer<typeof auctionFormSchema>

function ErrorMessage({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return <p className="text-sm text-rose-300">{message}</p>
}

export function AuctionForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [artifacts, setArtifacts] = useState<ArtifactOption[]>([])
  const [loadingArtifacts, setLoadingArtifacts] = useState(true)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const form = useForm<AuctionFormValues>({
    resolver: zodResolver(auctionFormSchema),
    defaultValues: {
      artifact_id: "",
      lot_number: "",
      auction_title: "",
      auction_type: "premium",
      estimate_low: "",
      estimate_high: "",
      reserve_price: "",
      opening_bid: "",
      currency: "USD",
      buyer_premium_rate: "",
      seller_fee_rate: "",
      auction_start_time: "",
      auction_end_time: "",
      auction_status: "draft",
      settlement_status: "pending",
      closing_reason: "",
      guarantee_type: "none",
      guarantee_amount: "",
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
          setGeneralError("Select a valid artifact before saving the auction.")
          return
        }

        const auction = await createAuction({
          artifact_id: values.artifact_id,
          lot_number: normalizeOptionalString(values.lot_number),
          auction_title: values.auction_title.trim(),
          auction_type: values.auction_type,
          estimate_low: normalizeOptionalNumber(values.estimate_low),
          estimate_high: normalizeOptionalNumber(values.estimate_high),
          reserve_price: normalizeOptionalNumber(values.reserve_price),
          opening_bid: normalizeOptionalNumber(values.opening_bid),
          currency: values.currency.trim().toUpperCase(),
          buyer_premium_rate: normalizeOptionalNumber(values.buyer_premium_rate),
          seller_fee_rate: normalizeOptionalNumber(values.seller_fee_rate),
          auction_start_time: normalizeOptionalDateTime(values.auction_start_time),
          auction_end_time: normalizeOptionalDateTime(values.auction_end_time),
          auction_status: values.auction_status,
          settlement_status: values.settlement_status,
          closing_reason: normalizeOptionalString(values.closing_reason),
          guarantee_type: values.guarantee_type,
          guarantee_amount: normalizeOptionalNumber(values.guarantee_amount),
        })

        toast({
          title: "Auction created",
          description: `${auction.auction_title} is now linked to ${artifact.artifact_code}.`,
        })

        router.push(`/admin/auctions/${auction.auction_id}`)
        router.refresh()
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to create the auction."
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
          <CardTitle>Create auction</CardTitle>
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
              <Label htmlFor="lot_number">Lot number</Label>
              <Input id="lot_number" {...register("lot_number")} className="border-white/10 bg-black/30 text-white" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="auction_title">Auction title</Label>
              <Input id="auction_title" {...register("auction_title")} className="border-white/10 bg-black/30 text-white" />
              <ErrorMessage message={errors.auction_title?.message} />
            </div>
            <div className="space-y-2">
              <Label>Auction type</Label>
              <Controller
                control={control}
                name="auction_type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full border-white/10 bg-black/30 text-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                      {AUCTION_TYPE_OPTIONS.map((option) => (
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
              <Label>Auction status</Label>
              <Controller
                control={control}
                name="auction_status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full border-white/10 bg-black/30 text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                      {AUCTION_STATUS_OPTIONS.map((option) => (
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
              <Label>Settlement status</Label>
              <Controller
                control={control}
                name="settlement_status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full border-white/10 bg-black/30 text-white">
                      <SelectValue placeholder="Select settlement status" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                      {SETTLEMENT_STATUS_OPTIONS.map((option) => (
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
              <Label htmlFor="estimate_low">Estimate low</Label>
              <Input id="estimate_low" {...register("estimate_low")} className="border-white/10 bg-black/30 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimate_high">Estimate high</Label>
              <Input id="estimate_high" {...register("estimate_high")} className="border-white/10 bg-black/30 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reserve_price">Reserve price</Label>
              <Input id="reserve_price" {...register("reserve_price")} className="border-white/10 bg-black/30 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opening_bid">Opening bid</Label>
              <Input id="opening_bid" {...register("opening_bid")} className="border-white/10 bg-black/30 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" {...register("currency")} className="border-white/10 bg-black/30 text-white" />
              <ErrorMessage message={errors.currency?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyer_premium_rate">Buyer premium rate</Label>
              <Input id="buyer_premium_rate" {...register("buyer_premium_rate")} className="border-white/10 bg-black/30 text-white" placeholder="15" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seller_fee_rate">Seller fee rate</Label>
              <Input id="seller_fee_rate" {...register("seller_fee_rate")} className="border-white/10 bg-black/30 text-white" placeholder="8" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auction_start_time">Auction start time</Label>
              <Input id="auction_start_time" type="datetime-local" {...register("auction_start_time")} className="border-white/10 bg-black/30 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auction_end_time">Auction end time</Label>
              <Input id="auction_end_time" type="datetime-local" {...register("auction_end_time")} className="border-white/10 bg-black/30 text-white" />
            </div>
            <div className="space-y-2">
              <Label>Guarantee type</Label>
              <Controller
                control={control}
                name="guarantee_type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full border-white/10 bg-black/30 text-white">
                      <SelectValue placeholder="Select guarantee type" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#0f1117] text-white">
                      {GUARANTEE_TYPE_OPTIONS.map((option) => (
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
              <Label htmlFor="guarantee_amount">Guarantee amount</Label>
              <Input id="guarantee_amount" {...register("guarantee_amount")} className="border-white/10 bg-black/30 text-white" />
            </div>
            <div className="space-y-2 xl:col-span-3">
              <Label htmlFor="closing_reason">Closing reason</Label>
              <Input id="closing_reason" {...register("closing_reason")} className="border-white/10 bg-black/30 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || loadingArtifacts} className="bg-[#FF6B9D] text-black hover:bg-[#ff86b0]">
          {isPending ? (
            <>
              <Spinner className="mr-2" />
              Saving auction...
            </>
          ) : (
            "Create auction"
          )}
        </Button>
      </div>
    </form>
  )
}
