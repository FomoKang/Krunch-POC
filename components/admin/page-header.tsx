import { cn } from "@/lib/utils"

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("sticky top-0 z-20 -mx-4 border-b border-white/10 bg-[#05070c]/95 px-4 py-5 backdrop-blur", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          {eyebrow ? <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/45">{eyebrow}</p> : null}
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
            {description ? <p className="max-w-3xl text-sm leading-6 text-white/60">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}
