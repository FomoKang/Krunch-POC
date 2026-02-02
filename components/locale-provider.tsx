"use client"

import { createContext, useContext, useState, useCallback, useEffect } from "react"

const STORAGE_KEY = "krunch-locale"

export type Locale = "ko" | "en"

const LocaleContext = createContext<{
  locale: Locale
  setLocale: (locale: Locale) => void
}>({ locale: "en", setLocale: () => {} })

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null
    if (stored === "ko" || stored === "en") setLocaleState(stored)
  }, [])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next)
      document.documentElement.lang = next === "ko" ? "ko" : "en"
    }
  }, [])

  useEffect(() => {
    if (!mounted || typeof document === "undefined") return
    document.documentElement.lang = locale === "ko" ? "ko" : "en"
  }, [locale, mounted])

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}
