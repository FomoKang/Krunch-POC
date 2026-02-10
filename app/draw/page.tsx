"use client"

import Image from "next/image"
import Link from "next/link"
import { Search, Bell, Dices } from "lucide-react"
import { useSiteTheme } from "@/components/theme-provider"
import { useLocale } from "@/components/locale-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import LuckyDrawPage from "@/components/lucky-draw-page"

export default function DrawPage() {
  const { theme } = useSiteTheme()
  const { locale } = useLocale()
  const isKo = locale === "ko"
  const basePath = theme === "black" ? "/black" : ""
  const logoSrc = theme === "black" ? "/logo-white.png" : "/logo-pink.png"

  return (
    <div className="min-h-screen bg-black text-white pb-for-nav">
      {/* 상단 네비게이션 */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/5 overflow-visible">
        <div className="flex items-center justify-between gap-1.5 px-2.5 py-3 min-h-[3.5rem] sm:min-h-[6rem] sm:gap-2 sm:px-4">
          <div className="h-16 w-32 min-w-0 flex-shrink-0 sm:h-[72px] sm:w-[225px]">
            <Link href={basePath || "/"} className="block h-full w-full">
              <Image
                src={logoSrc}
                alt="Krunch"
                width={225}
                height={72}
                className={`h-full w-full object-contain object-left ${theme !== "black" ? "scale-[1.02] origin-center" : ""}`}
              />
            </Link>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 overflow-visible">
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <Dices className={`w-4 h-4 shrink-0 sm:w-5 sm:h-5 ${theme === "black" ? "text-white" : "text-[#FF6B9D]"}`} />
              <span className={isKo ? "font-sans font-bold tracking-tight text-xs sm:text-base text-white/95 uppercase whitespace-nowrap" : "font-display text-xs sm:text-lg tracking-wide text-white uppercase whitespace-nowrap"}>{isKo ? "드로우" : "Draw"}</span>
            </div>
            <Link href={`${basePath}/search`} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors shrink-0">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
            </Link>
            <Link href={`${basePath}/notifications`} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors relative shrink-0">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
              <span className={`absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${theme === "black" ? "bg-white" : "bg-[#FF6B9D]"}`} />
            </Link>
            <ThemeToggle inline />
            <LanguageToggle inline />
          </div>
        </div>
      </header>

      <LuckyDrawPage />
    </div>
  )
}
