"use client"

import { createContext, useContext, useMemo, useEffect, useState, useCallback } from "react"
import { usePathname } from "next/navigation"

const STORAGE_KEY = "krunch-theme"

export type SiteTheme = "default" | "black"

const ThemeContext = createContext<{
  theme: SiteTheme
  setTheme: (theme: SiteTheme) => void
}>({ theme: "default", setTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [theme, setThemeState] = useState<SiteTheme>("default")
  const [mounted, setMounted] = useState(false)

  // 초기값: localStorage 우선, 없으면 경로(/black → black)
  useEffect(() => {
    setMounted(true)
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(STORAGE_KEY) as SiteTheme | null
    if (stored === "black" || stored === "default") {
      setThemeState(stored)
      return
    }
    setThemeState(pathname?.startsWith("/black") ? "black" : "default")
  }, [pathname])

  // data-theme 적용 (블랙 버전 그대로 — 기존 [data-theme="black"] CSS 사용)
  useEffect(() => {
    if (!mounted || typeof document === "undefined") return
    const root = document.documentElement
    if (theme === "black") {
      root.setAttribute("data-theme", "black")
    } else {
      root.removeAttribute("data-theme")
    }
  }, [theme, mounted])

  const setTheme = useCallback((next: SiteTheme) => {
    setThemeState(next)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next)
    }
  }, [])

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useSiteTheme() {
  return useContext(ThemeContext)
}
