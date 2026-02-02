"use client"

import { useLocale } from "@/components/locale-provider"

export function LanguageToggle({ inline }: { inline?: boolean }) {
  const { locale, setLocale } = useLocale()

  const toggle = () => setLocale(locale === "ko" ? "en" : "ko")

  if (inline) {
    return (
      <button
        type="button"
        onClick={toggle}
        className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors shrink-0 min-w-[2rem] sm:min-w-[2.5rem]"
        aria-label={locale === "ko" ? "Switch to English" : "한국어로 전환"}
        title={locale === "ko" ? "Switch to English" : "한국어로 전환"}
      >
        <span className="text-[10px] sm:text-xs font-bold text-white/80 uppercase tracking-wider">
          {locale === "ko" ? "KR" : "EN"}
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="fixed top-4 right-4 z-[60] flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/80 text-white backdrop-blur-sm transition-colors hover:bg-white/10 text-xs font-bold uppercase"
      aria-label={locale === "ko" ? "Switch to English" : "한국어로 전환"}
    >
      {locale === "ko" ? "KR" : "EN"}
    </button>
  )
}
