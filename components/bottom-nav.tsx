"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Dices, Home, Store, TrendingUp, User } from "lucide-react"
import { useLocale } from "@/components/locale-provider"
import { useSiteTheme } from "@/components/theme-provider"
import { useSupabaseSession } from "@/hooks/use-supabase-session"

type TabItem = {
  href: string
  icon: typeof Home
  label: string
  badge?: boolean
}

export function BottomNav() {
  const pathname = usePathname()
  const { theme } = useSiteTheme()
  const { locale } = useLocale()
  const { user } = useSupabaseSession()
  const basePath = theme === "black" ? "/black" : ""
  const isKo = locale === "ko"

  if (pathname?.startsWith("/admin")) {
    return null
  }

  const tabs: TabItem[] = [
    { href: basePath || "/", label: isKo ? "\uD648" : "Home", icon: Home },
    { href: `${basePath}/trend`, label: isKo ? "\uD2B8\uB80C\uB4DC" : "Trend", icon: TrendingUp },
    { href: `${basePath}/draw`, label: isKo ? "\uB4DC\uB85C\uC6B0" : "Draw", icon: Dices },
    { href: `${basePath}/market`, label: isKo ? "2\uCC28 \uB9C8\uCF13" : "2nd Market", icon: Store },
    {
      href: user ? `${basePath}/profile` : `${basePath}/login`,
      label: isKo ? "\uB9C8\uC774 \uD504\uB85C\uD544" : "My Profile",
      icon: User,
      badge: Boolean(user),
    },
  ]

  const pathSegment = pathname?.replace(/^\/black/, "") || "/"
  const activeIndex = tabs.findIndex((tab) => {
    const segment = tab.href.replace(/^\/black/, "") || "/"

    if (segment === "/trend") {
      return pathSegment === "/trend" || pathSegment === "/ranking" || pathSegment === "/community"
    }

    if (segment === "/profile" || segment === "/login") {
      return pathSegment === "/profile" || pathSegment === "/login" || pathSegment === "/signup"
    }

    return segment === pathSegment
  })

  const activeIndexResolved = activeIndex >= 0 ? activeIndex : 0
  const isPink = theme !== "black"
  const activeColor = isPink ? "text-[#FF6B9D]" : "text-white"
  const activeUnderline = isPink ? "bg-[#FF6B9D]" : "bg-white"
  const inactiveColor = isPink ? "text-white/50 hover:text-white/80" : "text-[#6B7280] hover:text-white/90"

  return (
    <nav
      className="nav-bottom-bar w-full border-t border-white/10 bg-black/95 backdrop-blur-sm [contain:layout]"
      aria-label={isKo ? "하단 내비게이션" : "Bottom navigation"}
    >
      <div className="relative flex w-full py-3">
        {tabs.map((tab, index) => {
          const isActive = index === activeIndexResolved

          return (
            <div key={tab.href} className="relative flex w-[20%] min-w-0 max-w-[20%] flex-[0_0_20%] flex-col items-center">
              <Link
                href={tab.href}
                className={`flex w-full flex-col items-center justify-center gap-1 overflow-hidden py-1 transition-[color,opacity] duration-300 ease-in-out ${isActive ? activeColor : inactiveColor}`}
              >
                <div className="relative">
                  <tab.icon className={`h-6 w-6 shrink-0 transition-opacity duration-300 ease-in-out ${isActive ? "opacity-100" : "opacity-70"}`} />
                  {tab.badge && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#FF6B9D]" />}
                </div>
                <span className="block w-full truncate text-center text-xs font-semibold transition-[color] duration-300 ease-in-out">
                  {tab.label}
                </span>
              </Link>
            </div>
          )
        })}

        <div
          className={`pointer-events-none absolute bottom-0 h-[3px] rounded-full ${activeUnderline}`}
          style={{
            width: "20%",
            left: `${activeIndexResolved * 20}%`,
            transition: "left 0.3s ease-out",
          }}
        />
      </div>
    </nav>
  )
}
