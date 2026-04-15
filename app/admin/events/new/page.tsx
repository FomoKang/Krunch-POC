import { EventForm } from "@/components/admin/event-form"
import { PageHeader } from "@/components/admin/page-header"

export default function NewEventPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Registry"
        title="Create provenance event"
        description="Attach a documented moment in the artifact lifecycle and keep the confidence, visibility, and evidence fields clean for later review."
      />
      <EventForm />
    </div>
  )
}
