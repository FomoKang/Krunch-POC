"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { deleteArtifact } from "@/lib/supabase/provenance"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

type ArtifactDeleteButtonProps = {
  artifactId: string
  artifactCode: string
  artifactTitle: string
  linkedRecordCount: number
}

export function ArtifactDeleteButton({
  artifactId,
  artifactCode,
  artifactTitle,
  linkedRecordCount,
}: ArtifactDeleteButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    try {
      setIsDeleting(true)
      await deleteArtifact(artifactId)
      toast({
        title: "Artifact deleted",
        description: `${artifactCode} was removed from Supabase.`,
      })
      setOpen(false)
      router.push("/admin/artifacts")
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete this artifact."
      toast({
        title: "Delete failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isDeleting) {
          setOpen(nextOpen)
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="h-4 w-4" />
          Delete artifact
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="border-white/10 bg-[#09090b] text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this artifact?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 text-white/65">
            <span className="block">
              <span className="font-medium text-white">{artifactTitle}</span>
              <span className="mx-2 text-white/35">-</span>
              <span className="font-mono text-[13px] text-white/80">{artifactCode}</span>
            </span>
            <span className="block">
              This removes the artifact record from Supabase. Public search and admin registry views will stop showing it.
            </span>
            <span className="block">
              {linkedRecordCount > 0
                ? `This page already found ${linkedRecordCount} linked records. Supabase may block deletion until those linked rows are removed.`
                : "No linked records were loaded on this page, so the delete should go through cleanly."}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/[0.04]">
            Cancel
          </AlertDialogCancel>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
            Delete now
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
