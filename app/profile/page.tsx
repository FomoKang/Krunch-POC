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

type GalleryItem = { id: number; image: string | null; name: string }

const GALLERY_ITEMS: GalleryItem[] = [
  { id: 1, image: "/gallery-dress-1.png", name: "Black Ribbon Dress" },
  { id: 2, image: "/gallery-dress-2.png", name: "Navy Sport Dress" },
  { id: 3, image: "/gallery-dress-3.png", name: "Ice Ribbon Dress" },
  { id: 4, image: null, name: "Empty Slot" },
  { id: 5, image: null, name: "Empty Slot" },
  { id: 6, image: null, name: "Empty Slot" },
]

function getTierName(level: number) {
  if (level >= 5) return "Diamond (VIP)"
  return TIER_NAMES[level] ?? "Bronze"
}

function GalleryTile({ item, isKo, onAdd }: { item: GalleryItem; isKo: boolean; onAdd: () => void }) {
  const [imgError, setImgError] = useState(false)
  const hasImage = Boolean(item.image) && !imgError

  return (
    <button
      type="button"
      onClick={() => !hasImage && onAdd()}
      className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/20 bg-black/45 hover:border-white/35 transition-all hover:-translate-y-0.5"
    >
      {hasImage ? (
        <div className="relative w-full h-full">
          <Image
            src={item.image as string}
            alt={item.name}
            width={180}
            height={240}
            className={`w-full h-full object-cover ${item.id === 3 ? "object-[26%_center]" : "object-center"}`}
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2">
            <p className="text-[10px] uppercase tracking-[0.07em] text-white/85 text-left truncate">{item.name}</p>
          </div>
        </div>
      ) : (
        <span className="w-full h-full flex flex-col items-center justify-center text-white/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.25))]">
          <Plus className="w-5 h-5" />
          <span className="text-[11px] mt-1">{isKo ? "비어 있음" : "Empty"}</span>
        </span>
      )}
    </button>
  )
}

export default function ProfilePage() {
  const { theme } = useSiteTheme()
  const { locale } = useLocale()
  const isKo = locale === "ko"
  const isBlack = theme === "black"
  const basePath = isBlack ? "/black" : ""
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
          className="sticky top-0 z-40 backdrop-blur-xl overflow-visible"
          style={isBlack
            ? { background: "rgba(0,0,0,0.92)", borderBottom: "1px solid rgba(255,255,255,0.14)" }
            : { background: "rgba(0,0,0,0.92)", borderBottom: "1px solid rgba(255,255,255,0.12)" }
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

        <main className="relative z-10 px-4 py-5 pb-9 space-y-4">
          <section
            className="rounded-3xl border p-4 shadow-[0_16px_52px_rgba(0,0,0,0.42)]"
            style={isBlack
              ? {
                background: "linear-gradient(165deg, rgba(28,28,28,0.92), rgba(10,10,10,0.98))",
                borderColor: "rgba(255,255,255,0.2)",
              }
              : {
                background: "linear-gradient(165deg, rgba(18,18,18,0.95), rgba(10,10,10,0.98))",
                borderColor: "rgba(255,255,255,0.16)",
              }
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full overflow-hidden border border-white/20 shadow-[0_0_0_3px_rgba(255,255,255,0.04)]">
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
                  <p className="font-display text-xl tracking-wide uppercase leading-none">Fomo_KR</p>
                  <p className="text-xs text-white/60">{isKo ? "멤버 ID" : "Member ID"}: KR-2024-00847</p>
                  <p className="text-xs text-white/60">K-Point: 530,000</p>
                </div>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowQR((v) => !v)}
                  className="rounded-xl p-2.5 border border-white/20 bg-white/[0.05] hover:bg-white/[0.1] transition-colors"
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

            <div className="mt-4 rounded-2xl bg-white/[0.04] border border-white/15 px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className={isBlack ? "font-display text-lg tracking-wide text-white" : "font-display text-lg tracking-wide text-[#ffd36a]"}>
                    {getTierName(LEVEL_CURRENT)}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.08em] text-white/55">{isKo ? "현재 티어" : "Active Tier"}</p>
                </div>
                <span className="text-[11px] uppercase tracking-[0.08em] text-white/60">Lv.{LEVEL_CURRENT}</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#ff4f9a] via-[#ff7db8] to-[#ffd36a]" style={{ width: `${XP_PERCENT}%` }} />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10">
              <div className="grid grid-cols-3 rounded-2xl border border-white/15 bg-[#0e0e0e] overflow-hidden">
                {userStats.map((stat, idx) => (
                  <div
                    key={stat.label}
                    className={`py-3 text-center ${idx < userStats.length - 1 ? "border-r border-white/10" : ""}`}
                  >
                    <p className="text-[24px] leading-none font-display tracking-tight text-white">{stat.value}</p>
                    <p className="text-[10px] uppercase tracking-[0.08em] text-white/55 mt-1.5">{stat.label}</p>
                  </div>
                ))}
              </div>
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
                className={`profile-quick-action group flex flex-col items-center justify-center gap-1.5 rounded-2xl transition-colors h-[78px] box-border p-2.5 border border-white/15 bg-[#0f0f0f] hover:bg-[#151515] ${isBlack ? "" : ""}`}
              >
                <div className="w-8 h-8 rounded-full border border-white/15 bg-black flex items-center justify-center">
                  <action.icon className={`w-4 h-4 ${action.iconColor} group-hover:text-white transition-colors`} />
                </div>
                <span className="text-[11px] uppercase tracking-[0.08em] text-white/70 group-hover:text-white transition-colors">{action.label}</span>
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
                className={`text-xs transition-colors border rounded-full px-3 py-1 ${isBlack ? "text-white/85 hover:text-white border-white/25 hover:border-white/45" : "text-pink-300 hover:text-pink-200 border-pink-300/40 hover:border-pink-300/70"}`}
              >
                {isKo ? "아이템 추가" : "Add Item"}
              </button>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/[0.03] p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {GALLERY_ITEMS.map((item) => (
                  <GalleryTile key={item.id} item={item} isKo={isKo} onAdd={() => setShowAddItem(true)} />
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
