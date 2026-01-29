"use client"

import { createContext, useContext, useMemo } from "react"
import { usePathname } from "next/navigation"

export type SiteTheme = "default" | "black"

const ThemeContext = createContext<SiteTheme>("default")

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const theme = useMemo<SiteTheme>(
    () => (pathname?.startsWith("/black") ? "black" : "default"),
    [pathname]
  )
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useSiteTheme() {
  return useContext(ThemeContext)
}
