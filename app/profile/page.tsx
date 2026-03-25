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

type CertificateField = {
  labelKo: string
  labelEn: string
  valueKo: string
  valueEn: string
}

type GalleryItem = {
  id: number
  image: string | null
  name: string
  certificate?: {
    titleKo: string
    titleEn: string
    subtitleKo: string
    subtitleEn: string
    serialNumber: string
    lastPriceKo: string
    lastPriceEn: string
    dnaVerified: boolean
    videoSrc: string
    fields: CertificateField[]
  }
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 1,
    image: "/cap2.png",
    name: "PEACEMINUSONE1988-CAP",
    certificate: {
      titleKo: "디지털 보증서",
      titleEn: "Digital Certificate",
      subtitleKo: "KRUNCH가 검증한 아티스트 실착 아이템",
      subtitleEn: "Artist-worn item verified by KRUNCH",
      serialNumber: "KR-GD-UBM-2026-0001",
      lastPriceKo: "최종 거래가 : 52,000,000 KRW",
      lastPriceEn: "Last Price : 52,000,000 KRW",
      dnaVerified: true,
      videoSrc: "/cap2-spin.mp4",
      fields: [
        {
          labelKo: "아티스트 이름",
          labelEn: "Artist",
          valueKo: "G-DRAGON",
          valueEn: "G-DRAGON",
        },
        {
          labelKo: "착용 일자",
          labelEn: "Worn On",
          valueKo: "2026.01.12",
          valueEn: "Jan 12, 2026",
        },
        {
          labelKo: "무대 이름",
          labelEn: "Stage",
          valueKo: "Ubermensch Seoul Opening Stage",
          valueEn: "Ubermensch Seoul Opening Stage",
        },
        {
          labelKo: "무대 앨범/곡",
          labelEn: "Album / Track",
          valueKo: "Ubermensch / TOO BAD",
          valueEn: "Ubermensch / TOO BAD",
        },
        {
          labelKo: "브랜드",
          labelEn: "Brand",
          valueKo: "PEACEMINUSONE",
          valueEn: "PEACEMINUSONE",
        },
        {
          labelKo: "스타일리스트",
          labelEn: "Stylist",
          valueKo: "김마라",
          valueEn: "Mara Kim",
        },
        {
          labelKo: "DNA 인증 여부",
          labelEn: "DNA Verification",
          valueKo: "인증 완료",
          valueEn: "Verified",
        },
      ],
    },
  },
  { id: 2, image: "/gallery-dress-1.png", name: "Black Ribbon Dress" },
  { id: 3, image: "/gallery-dress-2.png", name: "Navy Sport Dress" },
  { id: 4, image: "/gallery-dress-3.png", name: "Ice Ribbon Dress" },
  { id: 5, image: null, name: "Empty Slot" },
  { id: 6, image: null, name: "Empty Slot" },
]

function getTierName(level: number) {
  if (level >= 5) return "Diamond (VIP)"
  return TIER_NAMES[level] ?? "Bronze"
}

/** e.g. PEACEMINUSONE1988-CAP → PEACEMINUSONE 1988 CAP */
function formatCertificateItemDisplayName(name: string) {
  const m = name.match(/^([A-Za-z]+)(\d{4})-(.+)$/)
  if (m) return `${m[1]} ${m[2]} ${m[3].replace(/-/g, " ")}`.toUpperCase()
  return name.replace(/-/g, " ")
}

function GalleryTile({
  item,
  isKo,
  onAdd,
  onSelect,
}: {
  item: GalleryItem
  isKo: boolean
  onAdd: () => void
  onSelect: (item: GalleryItem) => void
}) {
  const [imgError, setImgError] = useState(false)
  const hasImage = Boolean(item.image) && !imgError

  return (
    <button
      type="button"
      onClick={() => {
        if (!hasImage) {
          onAdd()
          return
        }

        if (item.certificate) {
          onSelect(item)
        }
      }}
      className={`aspect-[3/4] rounded-2xl overflow-hidden border border-white/20 bg-black/45 transition-all hover:-translate-y-0.5 hover:border-white/35 ${
        item.certificate ? "cursor-pointer" : hasImage ? "cursor-default" : ""
      }`}
    >
      {hasImage ? (
        <div className={`relative w-full h-full ${item.id === 1 ? "bg-white" : ""}`}>
          <Image
            src={item.image as string}
            alt={item.name}
            width={180}
            height={240}
            className={`h-full w-full object-cover ${
              item.id === 1 ? "scale-[1.04] object-contain p-2" : item.id === 4 ? "scale-[1.12] object-[26%_center]" : "object-center"
            }`}
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2">
            <p className="text-[10px] uppercase tracking-[0.07em] text-white/85 text-left truncate">{item.name}</p>
          </div>
          {item.certificate && (
            <div className="absolute left-2 top-2 rounded-full border border-[#ff8fbc]/50 bg-black/70 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#ffd6e7] backdrop-blur-sm">
              {isKo ? "보증서" : "Certified"}
            </div>
          )}
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
  const [selectedCertificate, setSelectedCertificate] = useState<GalleryItem | null>(null)

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
                  <GalleryTile
                    key={item.id}
                    item={item}
                    isKo={isKo}
                    onAdd={() => setShowAddItem(true)}
                    onSelect={(selectedItem) => setSelectedCertificate(selectedItem)}
                  />
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

        {selectedCertificate?.certificate && (
          <div
            className="fixed inset-0 z-[10050] flex items-end justify-center overflow-hidden bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={() => setSelectedCertificate(null)}
          >
            <div
              className="relative max-h-[calc(100dvh-16px)] w-full max-w-lg overflow-hidden rounded-t-2xl bg-[#070707] sm:max-h-[min(900px,calc(100dvh-48px))] sm:rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(255,107,157,0.07),transparent_55%)]"
                aria-hidden
              />

              <div className="relative max-h-[calc(100dvh-16px)] min-h-0 overflow-y-auto overscroll-y-contain px-5 pb-[max(2.5rem,calc(1.25rem+env(safe-area-inset-bottom)))] pt-[max(0.75rem,env(safe-area-inset-top))] scrollbar-dark sm:max-h-[min(900px,calc(100dvh-48px))] sm:px-8 sm:pb-10 sm:pt-8">
                <div className="mb-8 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedCertificate(null)}
                    className="rounded-full p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white/80"
                    aria-label="Close certificate"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <header className="mb-10">
                  <h2 className="font-display text-[28px] uppercase leading-none tracking-wide text-white">
                    {isKo ? selectedCertificate.certificate.titleKo : selectedCertificate.certificate.titleEn}
                  </h2>
                  <p className="mt-2 max-w-[16rem] text-xs leading-relaxed text-white/60">
                    {isKo ? selectedCertificate.certificate.subtitleKo : selectedCertificate.certificate.subtitleEn}
                  </p>
                </header>

                <div className="mb-10 w-full">
                  <div className="relative aspect-[4/3] w-full bg-black">
                    <div className="absolute inset-0 shadow-[0_0_100px_-30px_rgba(255,107,157,0.12)]" aria-hidden />
                    <video
                      className="relative z-[1] h-full w-full bg-black object-contain"
                      src={selectedCertificate.certificate.videoSrc}
                      autoPlay
                      loop
                      muted
                      playsInline
                      poster={selectedCertificate.image ?? undefined}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-display text-2xl font-bold uppercase leading-snug tracking-wide text-white sm:text-[1.75rem]">
                    {formatCertificateItemDisplayName(selectedCertificate.name)}
                  </h3>
                  <p className="text-xs tracking-wide text-white/40">
                    {isKo ? "DNA 인증 · 블랙 티어" : "DNA Verified · Black Tier"}
                  </p>
                </div>

                <p className="mt-8 text-base leading-relaxed text-white/60">
                  {isKo ? selectedCertificate.certificate.lastPriceKo : selectedCertificate.certificate.lastPriceEn}
                </p>

                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-white/28">
                  {selectedCertificate.certificate.serialNumber}
                </p>

                <div className="my-10 h-px w-full bg-white/[0.08]" />

                <div className="space-y-5 pb-6">
                  {selectedCertificate.certificate.fields.slice(0, 6).map((field) => (
                    <div key={field.labelEn} className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
                      <span className="shrink-0 text-[11px] uppercase tracking-[0.15em] text-white/38">
                        {isKo ? field.labelKo : field.labelEn}
                      </span>
                      <span className="min-w-0 text-sm leading-relaxed text-white/85">
                        {isKo ? field.valueKo : field.valueEn}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
