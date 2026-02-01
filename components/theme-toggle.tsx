"use client"

import { useSiteTheme } from "@/components/theme-provider"
import { Moon, Sparkles } from "lucide-react"

export function ThemeToggle({ inline }: { inline?: boolean }) {
  const { theme, setTheme } = useSiteTheme()

  if (inline) {
    return (
      <button
        type="button"
        onClick={() => setTheme(theme === "black" ? "default" : "black")}
        className="p-2 hover:bg-white/10 rounded-full transition-colors"
        aria-label={theme === "black" ? "Pink mode" : "Black mode"}
      >
        {theme === "black" ? (
          <Sparkles className="w-5 h-5 text-[#FF6B9D]" />
        ) : (
          <Moon className="w-5 h-5 text-white/80" />
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "black" ? "default" : "black")}
      className="fixed top-4 right-4 z-[60] flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/80 text-white backdrop-blur-sm transition-colors hover:bg-white/10"
      aria-label={theme === "black" ? "Pink mode" : "Black mode"}
    >
      {theme === "black" ? (
        <Sparkles className="h-5 w-5 text-[#FF6B9D]" />
      ) : (
        <Moon className="h-5 w-5 text-white/80" />
      )}
    </button>
  )
}
