"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Trophy, Users, Store, User } from "lucide-react"
import { useSiteTheme } from "@/components/theme-provider"
import { useSplash } from "@/components/splash-context"
import { useLocale } from "@/components/locale-provider"

export function BottomNav() {
  const pathname = usePathname()
  const { theme } = useSiteTheme()
  const { isSplashVisible } = useSplash()
  const { locale } = useLocale()
  const basePath = theme === "black" ? "/black" : ""
  const isKo = locale === "ko"

  /* 로딩(스플래시) 창에서는 하단 네비 숨김 */
  if (isSplashVisible) return null
  /* 옥션 페이지에서는 하단 네비 숨김 → PLACE BID 버튼이 가려지지 않도록 */
  if (pathname?.includes("/auction")) return null

  const tabs = [
    { href: basePath || "/", label: isKo ? "홈" : "Home", icon: Home },
    { href: `${basePath}/ranking`, label: isKo ? "랭킹" : "Ranking", icon: Trophy },
    { href: `${basePath}/community`, label: isKo ? "커뮤니티" : "Community", icon: Users },
    { href: `${basePath}/market`, label: isKo ? "2차 마켓" : "2nd Market", icon: Store },
    { href: `${basePath}/profile`, label: isKo ? "마이 프로필" : "My Profile", icon: User },
  ]

  /* 모드 바꿔도 활성 탭 유지: pathname을 basePath 제거한 경로로 비교 */
  const pathSegment = pathname?.replace(/^\/black/, "") || "/"
  const activeIndex = tabs.findIndex((t) => {
    const tSegment = t.href.replace(/^\/black/, "") || "/"
    return tSegment === pathSegment
  })
  const activeIndexResolved = activeIndex >= 0 ? activeIndex : 0

  const isPink = theme !== "black"
  const activeColor = isPink ? "text-[#FF6B9D]" : "text-white"
  const activeUnderline = isPink ? "bg-[#FF6B9D]" : "bg-white"
  const inactiveColor = isPink ? "text-white/50 hover:text-white/80" : "text-[#6B7280] hover:text-white/90"

  return (
    <nav className="nav-bottom-bar bg-black/95 backdrop-blur-sm border-t border-white/10 w-full [contain:layout]">
      <div className="relative flex w-full py-3">
        {tabs.map((tab, index) => {
          const isActive = index === activeIndexResolved
          return (
            <div key={tab.href} className="relative flex-[0_0_20%] w-[20%] min-w-0 max-w-[20%] flex flex-col items-center">
              <Link
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-1 py-1 overflow-hidden transition-[color,opacity] duration-300 ease-in-out w-full ${isActive ? activeColor : inactiveColor}`}
              >
                <tab.icon className={`w-6 h-6 shrink-0 transition-opacity duration-300 ease-in-out ${isActive ? "opacity-100" : "opacity-70"}`} />
                <span className="text-xs font-semibold truncate w-full text-center transition-[color] duration-300 ease-in-out block">
                  {tab.label}
                </span>
              </Link>
            </div>
          )
        })}
        {/* 슬라이딩 언더라인: 활성 탭 위치로 이동 */}
        <div
          className={`absolute bottom-0 h-[3px] rounded-full pointer-events-none ${activeUnderline}`}
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
