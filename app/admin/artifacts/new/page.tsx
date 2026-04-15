import { ArtifactForm } from "@/components/admin/artifact-form"
import { PageHeader } from "@/components/admin/page-header"

export default function NewArtifactPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Registry"
        title="Create artifact"
        description="Add the canonical provenance artifact record first, then attach events, authentications, media, and auctions from the linked admin flows."
      />
      <ArtifactForm mode="create" />
    </div>
  )
}
