"use client"

import type { LucideIcon } from "lucide-react"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Empty className="rounded-lg border border-dashed border-white/10 bg-white/[0.02]">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="border border-white/10 bg-white/[0.04] text-white">
          <Icon className="size-5" />
        </EmptyMedia>
        <EmptyTitle className="text-white">{title}</EmptyTitle>
        <EmptyDescription className="text-white/60">{description}</EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  )
}
