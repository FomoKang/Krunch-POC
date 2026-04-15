import { AuctionForm } from "@/components/admin/auction-form"
import { PageHeader } from "@/components/admin/page-header"

export default function NewAuctionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Commerce"
        title="Create auction"
        description="Open a new lot in the real auctions table and capture pricing, scheduling, settlement, and guarantee fields in one pass."
      />
      <AuctionForm />
    </div>
  )
}
