"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Trophy, User, Settings, Wallet, Search, Bell, X, Plus, QrCode, Share2 } from "lucide-react"
import { useSiteTheme } from "@/components/theme-provider"
import { useLocale } from "@/components/locale-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { useToast } from "@/hooks/use-toast"

const TIER_NAMES: Record<number, string> = {
  1: "Bronze",
  2: "Silver",
  3: "Gold",
  4: "Platinum",
  5: "Diamond (VIP)",
}

const LEVEL_CURRENT = 3
const XP_PERCENT = 87

const GALLERY_ITEMS: Array<{ id: number; image: string | null; name: string }> = [
  { id: 1, image: "/Cap.png", name: "Cap" },
  { id: 2, image: "/T-Shirts.png", name: "T-Shirts" },
  { id: 3, image: null, name: "Empty Slot" },
  { id: 4, image: null, name: "Empty Slot" },
  { id: 5, image: null, name: "Empty Slot" },
  { id: 6, image: null, name: "Empty Slot" },
]

function getTierName(level: number) {
  if (level >= 5) return "Diamond (VIP)"
  return TIER_NAMES[level] ?? "Bronze"
}

export default function ProfilePage() {
  const { theme } = useSiteTheme()
  const { locale } = useLocale()
  const isKo = locale === "ko"
  const basePath = theme === "black" ? "/black" : ""
  const { toast } = useToast()

  const [showAddItem, setShowAddItem] = useState(false)
  const [showQR, setShowQR] = useState(false)

  const userStats = [
    { label: isKo ? "총 입찰" : "Total Bids", value: "127" },
    { label: isKo ? "낙찰 수" : "Won Items", value: "4" },
    { label: isKo ? "낙찰률" : "Win Rate", value: "18%" },
  ]

  return (
    <>
      <div className="min-h-screen bg-black text-white pb-for-nav">
        <header
          className="sticky top-0 z-40 backdrop-blur-md overflow-visible"
          style={theme === "black"
            ? { background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.1)" }
            : { background: "rgba(0,0,0,0.8)", borderBottom: "1px solid rgba(255,255,255,0.1)" }
          }
        >
          <div className="flex items-center justify-between gap-1.5 px-2.5 py-3 min-h-[3.5rem] sm:min-h-[6rem] sm:gap-2 sm:px-4">
            <div className="h-16 w-32 min-w-0 flex-shrink-0 sm:h-[72px] sm:w-[225px]">
              <Link href={basePath || "/"} className="block h-full w-full">
                <Image
                  src={theme === "black" ? "/logo-white.png" : "/logo-pink.png"}
                  alt="Krunch"
                  width={225}
                  height={72}
                  className={`h-full w-full object-contain object-left`}
                />
              </Link>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 overflow-visible">
              <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                <User className={`w-4 h-4 shrink-0 sm:w-5 sm:h-5 ${theme === "black" ? "text-white" : "text-[#FF6B9D]"}`} />
                <span className={isKo ? "font-sans font-bold tracking-tight text-xs sm:text-base text-white/95 uppercase whitespace-nowrap" : "font-display text-xs sm:text-lg tracking-wide text-white uppercase whitespace-nowrap"}>{isKo ? "마이 프로필" : "My Profile"}</span>
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

        <main className="relative z-10 px-4 py-4 pb-8 space-y-4">
          <section
            className="rounded-2xl border p-4"
            style={theme === "black"
              ? {
                background: "#0a0a0a",
                borderColor: "rgba(255,255,255,0.15)",
              }
              : {
                background: "rgba(255,255,255,0.04)",
                borderColor: "rgba(255,255,255,0.12)",
              }
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full overflow-hidden border border-white/20">
                  <img
                    src="/profile-avatar.jpg"
                    alt="Fomo_KR"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      if (target.src.includes("/profile-avatar.jpg") && !target.src.includes("/images/")) {
                        target.src = "/images/profile-avatar.jpg"
                      }
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-lg tracking-wide uppercase">Fomo_KR</p>
                  <p className="text-xs text-white/60">{isKo ? "멤버 ID" : "Member ID"}: KR-2024-00847</p>
                  <p className="text-xs text-white/60">K-Point: 530,000</p>
                </div>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowQR((v) => !v)}
                  className="rounded-lg p-2 border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                  aria-label="Show share QR"
                >
                  <QrCode className="w-5 h-5 text-white/80" />
                </button>
                {showQR && (
                  <div className="absolute right-0 top-11 z-20 w-[220px] rounded-xl border border-white/15 bg-black/95 p-3 shadow-2xl">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const profileUrl = `${window.location.origin}${basePath}/profile`
                          await navigator.clipboard.writeText(profileUrl)
                          toast({
                            title: isKo ? "URL 복사 완료" : "Profile URL copied",
                            description: profileUrl,
                          })
                        } catch {
                          toast({
                            title: isKo ? "복사 실패" : "Copy failed",
                            description: isKo ? "수동으로 복사해주세요" : "Please copy manually",
                            variant: "destructive",
                          })
                        }
                      }}
                      className="mb-3 flex w-full items-center gap-1.5 text-left text-xs text-white/85 hover:text-white"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      {isKo ? "프로필 공유 링크 복사" : "Copy profile share link"}
                    </button>
                    <div className="flex justify-center">
                      <Image src="/Krunch-QR.jpg" alt="Profile QR" width={150} height={150} className="rounded-md" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70">{isKo ? "현재 등급" : "Current Tier"}</span>
                <span className="font-semibold text-white">{getTierName(LEVEL_CURRENT)}</span>
              </div>
              <div className="mt-1.5 h-1 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#ec4899] to-[#f472b6]" style={{ width: `${XP_PERCENT}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10">
              {userStats.map((stat) => (
                <div key={stat.label} className="text-center rounded-lg bg-white/[0.03] border border-white/10 py-2">
                  <p className="text-base font-semibold text-white">{stat.value}</p>
                  <p className="text-[11px] text-white/60">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-3 gap-3">
            {[
              { icon: Wallet, label: isKo ? "충전" : "Charge", iconColor: "text-white/80" },
              { icon: Trophy, label: isKo ? "배지" : "Badges", iconColor: "text-white/80" },
              { icon: Settings, label: isKo ? "설정" : "Settings", iconColor: "text-white/80" },
            ].map((action, index) => (
              <button
                key={index}
                type="button"
                className={`profile-quick-action flex flex-col items-center justify-center gap-1 rounded-xl transition-colors h-[72px] box-border p-2 border border-white/10 ${theme === "black" ? "hover:bg-white/10" : ""}`}
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <action.icon className={`w-4 h-4 ${action.iconColor}`} />
                </div>
                <span className="text-[11px] text-white/70">{action.label}</span>
              </button>
            ))}
          </section>

          <section className="mt-6">
            <div className="flex items-center justify-between mb-4 px-0">
              <h2 className="text-lg font-display tracking-wide flex items-center gap-2">
                <span className={theme === "black" ? "text-white uppercase" : "text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B9D] to-[#FF6B9D]/80 uppercase"}>{isKo ? "마이 갤러리" : "MY GALLERY"}</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowAddItem(true)}
                className={`text-xs transition-colors ${theme === "black" ? "text-white/80 hover:text-white" : "text-pink-400 hover:text-pink-300"}`}
              >
                {isKo ? "아이템 추가" : "Add Item"}
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {GALLERY_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => !item.image && setShowAddItem(true)}
                    className="aspect-[3/4] rounded-xl overflow-hidden border border-white/15 bg-black/40 hover:border-white/30 transition-colors"
                  >
                    {item.image ? (
                      <Image src={item.image} alt={item.name} width={180} height={240} className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex flex-col items-center justify-center text-white/50">
                        <Plus className="w-5 h-5" />
                        <span className="text-[11px] mt-1">{isKo ? "비어 있음" : "Empty"}</span>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </main>

        {showAddItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowAddItem(false)}>
            <div className="bg-[#0d0d0d] border border-white/20 rounded-2xl p-5 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg uppercase tracking-wide text-white">{isKo ? "아이템 추가" : "Add Item"}</h3>
                <button type="button" onClick={() => setShowAddItem(false)} className="p-1 rounded-full hover:bg-white/10">
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </div>
              <p className="text-sm text-white/60">{isKo ? "2차 마켓에서 구매한 아이템을 갤러리에 걸 수 있습니다. (준비 중)" : "Items purchased on 2nd Market can be displayed in your gallery. (Coming soon)"}</p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
