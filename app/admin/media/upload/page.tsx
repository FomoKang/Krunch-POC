import { MediaUploadForm } from "@/components/admin/media-upload-form"
import { PageHeader } from "@/components/admin/page-header"

export default function MediaUploadPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assets"
        title="Upload media"
        description="Send the file to Supabase Storage first, then save the metadata row into media_assets so the public-facing mockup can reuse it later."
      />
      <MediaUploadForm />
    </div>
  )
}
