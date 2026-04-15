import { AuthenticationForm } from "@/components/admin/authentication-form"
import { PageHeader } from "@/components/admin/page-header"

export default function NewAuthenticationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Registry"
        title="Create authentication"
        description="Capture the verification method, provider, dates, and visibility settings for a new authentication record."
      />
      <AuthenticationForm />
    </div>
  )
}
