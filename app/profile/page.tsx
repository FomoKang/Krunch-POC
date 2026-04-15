"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Gavel, Heart, LogOut, Trophy, User, Settings, Wallet, Search, Bell, X, Plus, QrCode, Share2 } from "lucide-react"
import { useSiteTheme } from "@/components/theme-provider"
import { useLocale } from "@/components/locale-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { AuthPanel } from "@/components/auth-panel"
import { useFavoriteItems } from "@/hooks/use-favorite-items"
import { useSupabaseSession } from "@/hooks/use-supabase-session"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useToast } from "@/hooks/use-toast"
import {
  formatDropDate,
  getParticipatingAuctionsForUser,
  HYBRID_AUCTION_ITEMS,
  isLegacyGalleryUser,
  type HybridAuctionItem,
  type ParticipatingAuctionItem,
} from "@/lib/auction-catalog"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

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

type CertificateSection = {
  id: string
  chapter: string
  titleKo: string
  titleEn: string
  fields: CertificateField[]
}

type CertificateData = {
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

type GalleryItem = {
  id: number
  image: string | null
  name: string
  certificate?: CertificateData
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 1,
    image: "/cap2.png",
    name: "PEACEMINUSONE1988-CAP",
    certificate: {
      titleKo: "디지털 인증서",
      titleEn: "Digital Certificate",
      subtitleKo: "KRUNCH가 검증한 아티스트 착용 아이템",
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
          labelKo: "앨범 / 곡",
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
          valueKo: "마라 킴",
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

function resolveCertificateField(
  certificate: CertificateData,
  labels: { ko?: string[]; en?: string[] },
  fallback: { valueKo: string; valueEn: string },
) {
  const match = certificate.fields.find((field) => {
    const koMatch = labels.ko?.includes(field.labelKo)
    const enMatch = labels.en?.includes(field.labelEn)
    return Boolean(koMatch || enMatch)
  })

  return {
    valueKo: match?.valueKo?.trim() || fallback.valueKo,
    valueEn: match?.valueEn?.trim() || fallback.valueEn,
  }
}

function getCertificateProvenanceSections(item: GalleryItem): CertificateSection[] {
  if (!item.certificate) {
    return []
  }

  const certificate = item.certificate
  const displayName = formatCertificateItemDisplayName(item.name)
  const artist = resolveCertificateField(certificate, { ko: ["아티스트 이름"], en: ["Artist"] }, {
    valueKo: "G-DRAGON",
    valueEn: "G-DRAGON",
  })
  const wornOn = resolveCertificateField(certificate, { ko: ["착용 일자"], en: ["Worn On"] }, {
    valueKo: "2026.01.12",
    valueEn: "Jan 12, 2026",
  })
  const stage = resolveCertificateField(certificate, { ko: ["무대 이름"], en: ["Stage"] }, {
    valueKo: "Ubermensch Seoul Opening Stage",
    valueEn: "Ubermensch Seoul Opening Stage",
  })
  const albumTrack = resolveCertificateField(certificate, { ko: ["앨범 / 곡"], en: ["Album / Track"] }, {
    valueKo: "Ubermensch / TOO BAD",
    valueEn: "Ubermensch / TOO BAD",
  })
  const brand = resolveCertificateField(certificate, { ko: ["브랜드"], en: ["Brand"] }, {
    valueKo: "PEACEMINUSONE",
    valueEn: "PEACEMINUSONE",
  })
  const stylist = resolveCertificateField(certificate, { ko: ["스타일리스트"], en: ["Stylist"] }, {
    valueKo: "마라 킴",
    valueEn: "Mara Kim",
  })
  const verification = resolveCertificateField(certificate, { ko: ["DNA 인증 여부"], en: ["DNA Verification"] }, {
    valueKo: certificate.dnaVerified ? "인증 완료" : "검토 중",
    valueEn: certificate.dnaVerified ? "Verified" : "Pending",
  })

  return [
    {
      id: "identity",
      chapter: "01",
      titleKo: "아티팩트 식별",
      titleEn: "Artifact Identity",
      fields: [
        { labelKo: "아이템명", labelEn: "Artifact", valueKo: displayName, valueEn: displayName },
        { labelKo: "아티스트", labelEn: "Artist", valueKo: artist.valueKo, valueEn: artist.valueEn },
        { labelKo: "브랜드", labelEn: "Brand", valueKo: brand.valueKo, valueEn: brand.valueEn },
        { labelKo: "아카이브 분류", labelEn: "Archive Class", valueKo: "무대 착용 아카이브", valueEn: "Stage-worn archive" },
      ],
    },
    {
      id: "usage",
      chapter: "02",
      titleKo: "착용 맥락",
      titleEn: "Performance Context",
      fields: [
        { labelKo: "착용 일자", labelEn: "Worn On", valueKo: wornOn.valueKo, valueEn: wornOn.valueEn },
        { labelKo: "무대", labelEn: "Stage", valueKo: stage.valueKo, valueEn: stage.valueEn },
        { labelKo: "앨범 / 트랙", labelEn: "Album / Track", valueKo: albumTrack.valueKo, valueEn: albumTrack.valueEn },
        { labelKo: "스타일리스트", labelEn: "Stylist", valueKo: stylist.valueKo, valueEn: stylist.valueEn },
      ],
    },
    {
      id: "custody",
      chapter: "03",
      titleKo: "소장 이력",
      titleEn: "Custody Record",
      fields: [
        { labelKo: "최초 인수", labelEn: "Archive Intake", valueKo: "2026.01.18 / KRUNCH archive intake", valueEn: "Jan 18, 2026 / KRUNCH archive intake" },
        { labelKo: "현재 보관", labelEn: "Current Holder", valueKo: "KRUNCH 온습도 보관 아카이브", valueEn: "KRUNCH climate archive" },
        { labelKo: "보관 위치", labelEn: "Storage Zone", valueKo: "Vault B-12 / 직물 전용", valueEn: "Vault B-12 / textile controlled" },
        { labelKo: "릴리즈 상태", labelEn: "Release Status", valueKo: "콜렉터 릴리즈 승인", valueEn: "Collector release approved" },
      ],
    },
    {
      id: "verification",
      chapter: "04",
      titleKo: "검증 로그",
      titleEn: "Verification Ledger",
      fields: [
        { labelKo: "인증 결과", labelEn: "Verification", valueKo: verification.valueKo, valueEn: verification.valueEn },
        { labelKo: "검증 방식", labelEn: "Method", valueKo: "DNA + 시각 연속성 검토", valueEn: "DNA + visual continuity review" },
        { labelKo: "증빙 묶음", labelEn: "Evidence Bundle", valueKo: "무대 스틸 / 스타일리스트 노트 / 아카이브 미디어", valueEn: "stage stills / stylist note / archive media" },
        { labelKo: "인증서 코드", labelEn: "Certificate Code", valueKo: certificate.serialNumber, valueEn: certificate.serialNumber },
      ],
    },
  ]
}

/** e.g. PEACEMINUSONE1988-CAP -> PEACEMINUSONE 1988 CAP */
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
              {isKo ? "인증됨" : "Certified"}
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

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.22em] text-white/38">{eyebrow}</p>
      <h2 className="mt-1 font-display text-xl uppercase tracking-wide text-white">{title}</h2>
    </div>
  )
}

function getHybridStatusLabel(item: HybridAuctionItem, isKo: boolean) {
  if (item.status === "Coming Soon") {
    return isKo ? "오픈 예정" : "Coming Soon"
  }

  if (item.status === "Live Now") {
    return isKo ? "라이브" : "LIVE NOW"
  }

  if (item.status === "Sold Out") {
    return isKo ? "마감" : "Sold Out"
  }

  return item.dateIso ? formatDropDate(item.dateIso, isKo) : ""
}

function FavoriteAuctionCard({
  item,
  isKo,
  onToggle,
}: {
  item: HybridAuctionItem
  isKo: boolean
  onToggle: (itemId: string) => void
}) {
  const isFelix = item.id === "hybrid-human-made-tee"

  return (
    <article className="relative overflow-hidden rounded-2xl border border-white/12 bg-[#101010] shadow-[0_14px_36px_rgba(0,0,0,0.35)]">
      <button
        type="button"
        aria-label="Remove from favorites"
        onClick={() => onToggle(item.id)}
        className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[#FF6B9D]/60 bg-[#FF6B9D]/18 text-[#FF6B9D] shadow-[0_0_18px_rgba(255,107,157,0.24)] backdrop-blur-md transition-transform active:scale-95"
      >
        <Heart className="h-4 w-4 fill-current" />
      </button>
      <div className="relative aspect-[4/3] bg-[radial-gradient(circle_at_center,rgba(255,107,157,0.08),transparent_58%)]">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className={isFelix ? "object-cover" : "object-contain scale-[0.9] translate-x-1 translate-y-1"}
        />
      </div>
      <div className="p-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#ff9ebe]">{getHybridStatusLabel(item, isKo)}</p>
        <h3 className="mt-1 line-clamp-1 text-sm font-semibold text-white">{isKo ? item.nameKo : item.name}</h3>
        <p className="mt-0.5 line-clamp-1 text-xs italic text-white/45">{isKo ? item.subtitleKo : item.subtitle}</p>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
          <span className="text-[10px] uppercase tracking-[0.14em] text-white/35">{isKo ? "현재 정보" : "Current"}</span>
          <span className="text-right text-xs font-semibold text-white/85">{item.currentBid}</span>
        </div>
      </div>
    </article>
  )
}

function FavoriteItemsSection({
  favoriteItems,
  favoritesLoading,
  isKo,
  onToggle,
}: {
  favoriteItems: HybridAuctionItem[]
  favoritesLoading: boolean
  isKo: boolean
  onToggle: (itemId: string) => void
}) {
  return (
    <section className="mt-4 rounded-2xl border border-white/15 bg-white/[0.035] p-4">
      <div className="flex items-start justify-between gap-3">
        <SectionTitle eyebrow={isKo ? "찜한 상품" : "Saved Items"} title={isKo ? "관심 있는 옥션" : "Saved Auctions"} />
        <span className="rounded-full border border-[#FF6B9D]/30 bg-[#FF6B9D]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#ffb0cb]">
          {favoritesLoading ? "..." : favoriteItems.length}
        </span>
      </div>

      {favoriteItems.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {favoriteItems.map((item) => (
            <FavoriteAuctionCard key={item.id} item={item} isKo={isKo} onToggle={onToggle} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-white/14 bg-black/25 p-4 text-center">
          <Heart className="mx-auto h-6 w-6 text-[#FF6B9D]/70" />
          <p className="mt-3 text-sm font-medium text-white/85">{isKo ? "아직 찜한 상품이 없어요" : "No saved items yet"}</p>
          <p className="mx-auto mt-1 max-w-[15rem] text-xs leading-5 text-white/48">
            {isKo
              ? "홈의 HYBRID AUCTION 카드에서 하트를 누르면 이곳에 저장됩니다."
              : "Tap the heart on a Hybrid Auction card and it will appear here."}
          </p>
        </div>
      )}
    </section>
  )
}

function ParticipatingAuctionsSection({
  auctions,
  isKo,
}: {
  auctions: ParticipatingAuctionItem[]
  isKo: boolean
}) {
  return (
    <section className="mt-4 rounded-2xl border border-white/15 bg-white/[0.035] p-4">
      <SectionTitle eyebrow={isKo ? "참여중인 옥션" : "Active Auctions"} title={isKo ? "입찰 현황" : "Auction Activity"} />

      {auctions.length > 0 ? (
        <div className="mt-4 space-y-3">
          {auctions.map((auction) => (
            <article key={auction.id} className="flex gap-3 rounded-2xl border border-white/10 bg-black/28 p-3">
              <div className="relative h-[74px] w-[74px] shrink-0 overflow-hidden rounded-xl bg-white/[0.04]">
                {auction.videoSrc ? (
                  <video
                    src={auction.videoSrc}
                    className="h-full w-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    poster={auction.image}
                  />
                ) : (
                  <Image src={auction.image} alt={auction.name} fill className="object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="line-clamp-1 text-sm font-semibold text-white">{auction.name}</h3>
                    <p className="mt-0.5 text-xs uppercase tracking-[0.12em] text-white/45">{auction.artist}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-[#FF6B9D]/30 bg-[#FF6B9D]/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#ffb0cb]">
                    {auction.status}
                  </span>
                </div>
                <p className="mt-3 text-xs font-medium text-white/78">{auction.currentInfo}</p>
                <p className="mt-1 text-[11px] text-white/42">{auction.note}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-white/14 bg-black/25 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/[0.04]">
              <Gavel className="h-5 w-5 text-white/55" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/85">{isKo ? "현재 참여중인 옥션이 없습니다" : "No active auctions yet"}</p>
              <p className="mt-1 text-xs leading-5 text-white/48">
                {isKo
                  ? "입찰하거나 드로우에 참여하면 진행 중인 항목이 이곳에 표시됩니다."
                  : "Bids and joined auctions will appear here once you participate."}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { theme } = useSiteTheme()
  const { locale } = useLocale()
  const isKo = locale === "ko"
  const isBlack = theme === "black"
  const basePath = isBlack ? "/black" : ""
  const { user, session, loading: sessionLoading } = useSupabaseSession()
  const { profile, loading: profileLoading, error: profileError } = useUserProfile(user)
  const { favoriteIds, loading: favoritesLoading, toggleFavorite } = useFavoriteItems(user)
  const { toast } = useToast()

  const [showAddItem, setShowAddItem] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [selectedCertificate, setSelectedCertificate] = useState<GalleryItem | null>(null)

  const userStats = [
    { label: isKo ? "총 입찰" : "Total Bids", value: "127" },
    { label: isKo ? "낙찰 수" : "Won Items", value: "4" },
    { label: isKo ? "낙찰률" : "Win Rate", value: "18%" },
  ]

  const isLoading = sessionLoading || (Boolean(user) && profileLoading)
  const isLegacyUser = isLegacyGalleryUser(user?.email)
  const favoriteItems = HYBRID_AUCTION_ITEMS.filter((item) => favoriteIds.includes(item.id))
  const participatingAuctions = getParticipatingAuctionsForUser(user?.email)
  const displayName = profile?.nickname ?? user?.user_metadata?.nickname ?? user?.email?.split("@")[0] ?? "Fomo_KR"
  const memberId = user?.id.slice(0, 8).toUpperCase() ?? "KR-2024-00847"
  const profileSubline = user?.email ?? (isKo ? "로그인 후 이메일이 표시됩니다." : "Your email appears after login.")
  const selectedCertificateSections = selectedCertificate ? getCertificateProvenanceSections(selectedCertificate) : []
  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(isKo ? "ko-KR" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : isKo
      ? "아직 없음"
      : "Not available yet"

  async function handleLogout() {
    try {
      const supabase = getSupabaseBrowserClient()
      const { error: signOutError } = await supabase.auth.signOut()

      if (signOutError) {
        throw signOutError
      }

      toast({
        title: isKo ? "로그아웃 완료" : "Logged out",
        description: isKo ? "프로필 세션 연결을 종료했습니다." : "Your profile session has been cleared.",
      })
      router.replace(`${basePath}/login`)
      router.refresh()
    } catch (signOutError) {
      toast({
        title: isKo ? "로그아웃 실패" : "Logout failed",
        description: signOutError instanceof Error ? signOutError.message : isKo ? "다시 시도해주세요." : "Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
        <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#0d0d0d] p-6 text-center shadow-[0_16px_52px_rgba(0,0,0,0.42)]">
          <p className="text-xs uppercase tracking-[0.22em] text-white/45">Profile</p>
          <h1 className="mt-3 font-display text-3xl uppercase tracking-wide text-white">{isKo ? "계정 확인 중" : "Checking account"}</h1>
          <p className="mt-3 text-sm text-white/60">
            {isKo ? "Supabase 세션과 프로필 정보를 불러오고 있습니다." : "Loading your Supabase session and profile data."}
          </p>
        </div>
      </div>
    )
  }

  if (!user || !session) {
    return (
      <div className="min-h-screen bg-black px-4 text-white">
        <AuthPanel mode="login" />
      </div>
    )
  }

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
                    alt={displayName}
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
                  <p className="font-display text-xl tracking-wide uppercase leading-none">{displayName}</p>
                  <p className="text-xs text-white/60">{profileSubline}</p>
                  <p className="text-xs text-white/60">{`Member ID: ${memberId}`}</p>
                </div>
              </div>
              <div className="relative flex shrink-0 flex-col items-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQR((v) => !v)}
                  className="flex h-10 min-w-[5.5rem] items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/[0.05] px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80 transition-colors hover:bg-white/[0.1]"
                  aria-label="Show share QR"
                >
                  <QrCode className="w-4 h-4" />
                  QR
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex h-10 min-w-[5.5rem] items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-black/30 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70 transition-colors hover:border-[#FF6B9D]/45 hover:bg-[#FF6B9D]/10 hover:text-[#ffd6e7]"
                >
                  <LogOut className="w-4 h-4" />
                  {isKo ? "로그아웃" : "Log out"}
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

            <div className="mt-4 rounded-2xl border border-white/15 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">{isKo ? "내 정보" : "Account Info"}</p>
                  <h2 className="mt-1 font-display text-xl uppercase tracking-wide text-white">{isKo ? "기본 프로필" : "Profile Basics"}</h2>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  { label: isKo ? "닉네임" : "Nickname", value: profile?.nickname ?? displayName },
                  { label: isKo ? "이메일" : "Email", value: user.email ?? "-" },
                  { label: isKo ? "가입일" : "Joined", value: joinedDate },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
                    <span className="text-xs uppercase tracking-[0.18em] text-white/45">{item.label}</span>
                    <span className="text-sm text-white/85">{item.value}</span>
                  </div>
                ))}
              </div>
              {profileError && <p className="mt-4 text-xs text-amber-200">{profileError}</p>}
            </div>

            {!isLegacyUser && (
              <FavoriteItemsSection
                favoriteItems={favoriteItems}
                favoritesLoading={favoritesLoading}
                isKo={isKo}
                onToggle={(itemId) => void toggleFavorite(itemId)}
              />
            )}

            <ParticipatingAuctionsSection auctions={participatingAuctions} isKo={isKo} />

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

          {isLegacyUser && (
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
          )}
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
              <p className="text-sm text-white/60">{isKo ? "2차 마켓에서 구매한 아이템은 갤러리에 표시됩니다. (준비 중)" : "Items purchased on 2nd Market can be displayed in your gallery. (Coming soon)"}</p>
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
                  <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs tracking-wide">
                    <span
                      className="font-semibold uppercase tracking-[0.14em] text-[#00FF9C] [text-shadow:0_0_10px_rgba(0,255,156,0.45),0_0_22px_rgba(0,255,156,0.12)]"
                    >
                      {isKo ? "DNA 인증" : "DNA Verified"}
                    </span>
                    <span className="text-white/20 select-none" aria-hidden>
                      •
                    </span>
                    <span className="font-medium tracking-[0.04em] text-[#e8e8ec]">
                      {isKo ? "블랙 티어" : "Black Tier"}
                    </span>
                  </p>
                </div>

                <p className="mt-8 text-base leading-relaxed text-white/60">
                  {isKo ? selectedCertificate.certificate.lastPriceKo : selectedCertificate.certificate.lastPriceEn}
                </p>

                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-white/28">
                  {selectedCertificate.certificate.serialNumber}
                </p>

                <div className="my-10 h-px w-full bg-white/[0.08]" />

                <div className="pb-6">
                  <div className="mb-5">
                    <h4 className="font-display text-[24px] uppercase leading-none tracking-[0.14em] text-[#ffd4e5] [text-shadow:0_0_18px_rgba(255,107,157,0.18)]">
                      {isKo ? "프로비넌스" : "PROVENANCE"}
                    </h4>
                  </div>

                  <div className="-mx-5 overflow-x-auto px-5 pb-2 scrollbar-hide sm:-mx-8 sm:px-8">
                    <div className="flex snap-x snap-mandatory gap-4">
                      {selectedCertificateSections.map((section, index) => (
                        <article
                          key={section.id}
                          className="w-[84%] max-w-[21.5rem] shrink-0 snap-start rounded-[24px] border border-white/10 bg-white/[0.035] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.24)]"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.24em] text-[#ff98c0]">{section.chapter}</p>
                              <h5 className="mt-2 text-base font-semibold text-white">
                                {isKo ? section.titleKo : section.titleEn}
                              </h5>
                            </div>
                            <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white/38">
                              {index + 1}/4
                            </span>
                          </div>

                          <div className="mt-4 space-y-4">
                            {section.fields.map((field) => (
                              <div key={`${section.id}-${field.labelEn}`} className="border-t border-white/8 pt-4 first:border-t-0 first:pt-0">
                                <p className="text-[10px] uppercase tracking-[0.18em] text-white/34">
                                  {isKo ? field.labelKo : field.labelEn}
                                </p>
                                <p className="mt-1.5 text-sm leading-6 text-white/86">
                                  {isKo ? field.valueKo : field.valueEn}
                                </p>
                              </div>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
