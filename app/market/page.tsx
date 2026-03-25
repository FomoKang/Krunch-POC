"use client"

import Image from "next/image"
import Link from "next/link"
import { Bell, Search, Store } from "lucide-react"
import { LanguageToggle } from "@/components/language-toggle"
import { useLocale } from "@/components/locale-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { useSiteTheme } from "@/components/theme-provider"

export default function SecondMarketPage() {
  const { theme } = useSiteTheme()
  const { locale } = useLocale()
  const isKo = locale === "ko"
  const basePath = theme === "black" ? "/black" : ""
  const logoSrc = theme === "black" ? "/logo-white.png" : "/logo-pink.png"

  return (
    <div className="min-h-screen bg-black pb-for-nav text-white">
      <header className="sticky top-0 z-50 overflow-visible border-b border-white/5 bg-black/90 backdrop-blur-sm">
        <div className="flex min-h-[3.5rem] items-center justify-between gap-1.5 px-2.5 py-3 sm:min-h-[6rem] sm:gap-2 sm:px-4">
          <div className="h-16 w-32 min-w-0 flex-shrink-0 sm:h-[72px] sm:w-[225px]">
            <Link href={basePath || "/"} className="block h-full w-full">
              <Image
                src={logoSrc}
                alt="Krunch"
                width={225}
                height={72}
                className="h-full w-full object-contain object-left"
              />
            </Link>
          </div>

          <div className="flex flex-shrink-0 items-center gap-0.5 overflow-visible sm:gap-1">
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
              <Store
                className={`h-4 w-4 shrink-0 sm:h-5 sm:w-5 ${
                  theme === "black" ? "store-icon-pink-outline text-white" : "text-[#FF6B9D]"
                }`}
              />
              <span
                className={
                  isKo
                    ? "whitespace-nowrap font-sans text-xs font-bold uppercase tracking-tight text-white/95 sm:text-base"
                    : "font-display whitespace-nowrap text-xs uppercase tracking-wide text-white sm:text-lg"
                }
              >
                {isKo ? "2차 마켓" : "2nd Market"}
              </span>
            </div>

            <Link href={`${basePath}/search`} className="shrink-0 rounded-full p-1.5 transition-colors hover:bg-white/10 sm:p-2">
              <Search className="h-4 w-4 text-white/80 sm:h-5 sm:w-5" />
            </Link>
            <Link
              href={`${basePath}/notifications`}
              className="relative shrink-0 rounded-full p-1.5 transition-colors hover:bg-white/10 sm:p-2"
            >
              <Bell className="h-4 w-4 text-white/80 sm:h-5 sm:w-5" />
              <span
                className={`absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full sm:right-1 sm:top-1 sm:h-2 sm:w-2 ${
                  theme === "black" ? "bg-white" : "bg-[#FF6B9D]"
                }`}
              />
            </Link>
            <ThemeToggle inline />
            <LanguageToggle inline />
          </div>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center gap-4 px-4 text-center">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
            theme === "black"
              ? "border border-[rgba(255,105,180,0.3)] bg-[#0a0a0a]"
              : "border border-[#FF6B9D]/40 bg-[#1a1a1a] shadow-lg shadow-[#FF6B9D]/20"
          }`}
        >
          <Store className={`h-8 w-8 ${theme === "black" ? "store-icon-pink-outline text-white" : "text-[#FF6B9D]"}`} />
        </div>

        <h1
          className={
            isKo
              ? "font-sans text-3xl font-bold uppercase italic tracking-wide text-white"
              : "font-display text-3xl uppercase italic tracking-wide text-white"
          }
        >
          {isKo ? "2차 마켓" : "2nd Market"}
        </h1>

        <p className="max-w-xs text-sm text-white/60">
          {isKo ? (
            <>
              P2P 거래 기능은{" "}
              <span
                className={theme === "black" ? "font-semibold text-white" : "font-semibold text-[#FF6B9D]"}
                style={theme === "black" ? { WebkitTextStroke: "1px rgba(255,105,180,0.4)" } : undefined}
              >
                준비 중
              </span>
              입니다. 곧 BLACK PINK 등급 및 다른 아이템들을 직접 거래할 수 있게 됩니다.
            </>
          ) : (
            <>
              Peer-to-peer trading is{" "}
              <span
                className={theme === "black" ? "font-semibold text-white" : "font-semibold text-[#FF6B9D]"}
                style={theme === "black" ? { WebkitTextStroke: "1px rgba(255,105,180,0.4)" } : undefined}
              >
                coming soon
              </span>
              . Soon you&apos;ll be able to directly trade BLACK PINK tier items and other items.
            </>
          )}
        </p>
      </main>
    </div>
  )
}
