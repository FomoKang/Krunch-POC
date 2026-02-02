"use client"

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"

const STORAGE_KEY = "krunch-locale"
const TRANSITION_MS = 220

export type Locale = "ko" | "en"

const LocaleContext = createContext<{
  locale: Locale
  setLocale: (locale: Locale) => void
}>({ locale: "en", setLocale: () => {} })

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")
  const [mounted, setMounted] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setMounted(true)
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null
    if (stored === "ko" || stored === "en") setLocaleState(stored)
  }, [])

  const setLocale = useCallback((next: Locale) => {
    if (next === locale) return
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setTransitioning(true)
    timeoutRef.current = setTimeout(() => {
      setLocaleState(next)
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, next)
        document.documentElement.lang = next === "ko" ? "ko" : "en"
      }
      setTransitioning(false)
      timeoutRef.current = null
    }, TRANSITION_MS)
  }, [locale])

  useEffect(() => {
    if (!mounted || typeof document === "undefined") return
    document.documentElement.lang = locale === "ko" ? "ko" : "en"
  }, [locale, mounted])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <div
        className="min-h-full"
        style={{
          opacity: transitioning ? 0 : 1,
          transition: `opacity ${TRANSITION_MS}ms ease-in-out`,
          pointerEvents: transitioning ? "none" : "auto",
        }}
      >
        {children}
      </div>
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}
