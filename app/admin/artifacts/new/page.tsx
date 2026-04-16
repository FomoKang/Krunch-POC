import { ArtifactForm } from "@/components/admin/artifact-form"
import { PageHeader } from "@/components/admin/page-header"

export default function NewArtifactPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Registry"
        title="Create artifact"
        description="Add the canonical provenance artifact record first. Shipping and customs data can stay partial until the ops team is ready to mark the product international-ready."
      />
      <ArtifactForm mode="create" />
    </div>
  )
}
