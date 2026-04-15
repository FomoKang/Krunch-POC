"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { ArtifactOption } from "@/lib/supabase/provenance"
import { cn } from "@/lib/utils"

type ArtifactComboboxProps = {
  artifacts: ArtifactOption[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ArtifactCombobox({
  artifacts,
  value,
  onChange,
  disabled,
  placeholder = "Select an artifact",
}: ArtifactComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const selectedArtifact = artifacts.find((artifact) => artifact.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between border-white/10 bg-white/[0.03] text-left text-white hover:bg-white/[0.05]"
        >
          <span className="truncate">
            {selectedArtifact
              ? `${selectedArtifact.artifact_code} - ${selectedArtifact.artifact_title}`
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] max-w-[calc(100vw-2rem)] border-white/10 bg-[#0f1117] p-0 text-white" align="start">
        <Command className="bg-transparent">
          <CommandInput placeholder="Search by code, title, or artist..." />
          <CommandList>
            <CommandEmpty>No artifacts found.</CommandEmpty>
            <CommandGroup>
              {artifacts.map((artifact) => (
                <CommandItem
                  key={artifact.id}
                  value={`${artifact.artifact_code} ${artifact.artifact_title} ${artifact.artist_name ?? ""}`}
                  onSelect={() => {
                    onChange(artifact.id)
                    setOpen(false)
                  }}
                  className="items-start"
                >
                  <Check className={cn("mt-1 size-4", value === artifact.id ? "opacity-100" : "opacity-0")} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {artifact.artifact_code} - {artifact.artifact_title}
                    </p>
                    <p className="truncate text-xs text-white/55">
                      {artifact.artist_name || "Unknown artist"}
                      {artifact.current_status ? ` - ${artifact.current_status}` : ""}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
