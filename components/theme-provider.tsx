"use client"

import { createContext, useContext, useMemo, useEffect } from "react"
import { usePathname } from "next/navigation"

export type SiteTheme = "default" | "black"

const ThemeContext = createContext<SiteTheme>("default")

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const theme = useMemo<SiteTheme>(
    () => (pathname?.startsWith("/black") ? "black" : "default"),
    [pathname]
  )

  useEffect(() => {
    const root = document.documentElement
    if (theme === "black") {
      root.setAttribute("data-theme", "black")
    } else {
      root.removeAttribute("data-theme")
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useSiteTheme() {
  return useContext(ThemeContext)
}
