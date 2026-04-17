"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Bell, Heart, Search } from "lucide-react"
import { PREMIUM_SHOWCASE_ID } from "@/lib/auction-showcase"
import { useSiteTheme } from "@/components/theme-provider"
import { useLocale } from "@/components/locale-provider"
import { useSplash } from "@/components/splash-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { useFavoriteItems } from "@/hooks/use-favorite-items"
import { useSupabaseSession } from "@/hooks/use-supabase-session"
import { formatDropDate as formatHybridDropDate, HYBRID_AUCTION_ITEMS } from "@/lib/auction-catalog"
import { formatMoney } from "@/lib/admin/utils"
import { listPublicAuctionHighlights, type AuctionHomeHighlightRecord } from "@/lib/supabase/provenance"

// 로고 크기 통일 (logo-white, logo-pink, logo-black 동일 높이)
const LOGO_WIDTH = 225
const LOGO_HEIGHT = 72
// 로딩창 전용: 로딩 바와 비슷한 가로 길이로 조정 (w-32 = 128px 기준, 조금 더 크게)
const SPLASH_LOGO_WIDTH = 160
const SPLASH_LOGO_HEIGHT = 51

// Splash Screen (테마 악센트 + 로딩 시간별 메시지)
function SplashScreen({ accentBg, logoSrc, isKo }: { accentBg: string; logoSrc: string; isKo: boolean }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 500)
    return () => clearInterval(t)
  }, [])
  const loadingMessage = elapsed >= 10
    ? (isKo ? "조금만 더 기다려 주세요..." : "Please wait a moment...")
    : elapsed >= 3
      ? (isKo ? "로딩 중..." : "Loading...")
      : null
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        <Image src={logoSrc} alt="Krunch Logo" width={SPLASH_LOGO_WIDTH} height={SPLASH_LOGO_HEIGHT} className={`h-[51px] w-[160px] object-contain animate-pulse block mb-4`} />
        <div className="w-32 h-1 bg-white/20 rounded-full overflow-hidden">
          <div className={`h-full ${accentBg} animate-[loading_3s_ease-in-out_forwards]`} />
        </div>
        {loadingMessage && <p className="text-white/60 text-sm mt-3 animate-in fade-in duration-300">{loadingMessage}</p>}
      </div>
    </div>
  )
}

// Legend Drop 타이머 (테마 악센트)
function CountdownTimer({ accentText }: { accentText: string }) {
  const [time, setTime] = useState({ hours: 23, minutes: 58, seconds: 17 })

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => {
        let { hours, minutes, seconds } = prev
        seconds--
        if (seconds < 0) {
          seconds = 59
          minutes--
        }
        if (minutes < 0) {
          minutes = 59
          hours--
        }
        if (hours < 0) {
          hours = 23
          minutes = 59
          seconds = 59
        }
        return { hours, minutes, seconds }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (n: number) => n.toString().padStart(2, "0")

  return (
    <div className={`font-mono text-3xl md:text-4xl font-bold ${accentText} tracking-wider tabular-nums`}>
      {formatTime(time.hours)}:{formatTime(time.minutes)}:{formatTime(time.seconds)}
    </div>
  )
}

// 날짜 포맷 + 문맥 (한글: 2026년 1월 28일 개시, 영어: Opens Jan 28, 2026)
function formatDropDate(isoDate: string, isKo: boolean) {
  const d = new Date(isoDate)
  if (isKo) {
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 개시`
  }
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `Opens ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

// Unique Drop 상품 데이터 (nameKo, subtitleKo: KR일 때 표시)
const uniqueDrops = [
  {
    id: 1,
    name: "Burberry Trench Jacket",
    subtitle: "worn by SON HEUNG MIN",
    nameKo: "버버리 트렌치 자켓",
    subtitleKo: "손흥민 착용",
    image: "/son-burberry.png",
    status: "date",
    dateIso: "2026-01-28",
  },
  {
    id: 2,
    name: "Squid Game 2 Guard Mask",
    subtitle: "worn by PARK GYU YOUNG",
    nameKo: "오징어 게임2 병정 가면",
    subtitleKo: "박규영 착용",
    image: "/squid-mask.png",
    status: "Coming Soon",
    date: null,
  },
  {
    id: 3,
    name: "The Recruiter Suit",
    subtitle: "worn by GONG YOO",
    nameKo: "더 리크루터 수트",
    subtitleKo: "공유 착용",
    image: "/gongyoo-suit.png",
    status: "Live Now",
    date: null,
  },
  {
    id: 4,
    name: "Human Made Heart Tee",
    subtitle: "worn by FELIX",
    nameKo: "휴먼메이드 하트 티",
    subtitleKo: "펠릭스 착용",
    image: "/felix-human.png",
    status: "Sold Out",
    date: null,
  },
]

function homeAuctionStatusLabel(
  auction: AuctionHomeHighlightRecord["auction"],
  isKo: boolean,
) {
  if (auction.auction_status === "live") {
    return isKo ? "라이브" : "LIVE NOW"
  }

  if (auction.auction_status === "ended") {
    return isKo ? "종료" : "ENDED"
  }

  if (auction.auction_start_time) {
    return formatHybridDropDate(auction.auction_start_time, isKo)
  }

  return isKo ? "준비 중" : "Coming Soon"
}

function resolveHomeAuctionMedia(
  highlight: AuctionHomeHighlightRecord,
  fallbackImage: string,
) {
  const fileUrl = highlight.media?.thumbnail_url ?? highlight.media?.file_url
  const fileType = highlight.media?.file_type?.toLowerCase() ?? ""

  if (fileUrl && fileType.startsWith("image/")) {
    return fileUrl
  }

  if (fileUrl && /\.(png|jpg|jpeg|webp|gif|avif)$/i.test(fileUrl)) {
    return fileUrl
  }

  return fallbackImage
}

export default function HomePage() {
  const { theme } = useSiteTheme()
  const { locale } = useLocale()
  const { setSplashVisible } = useSplash()
  const { user } = useSupabaseSession()
  const { isFavorite, toggleFavorite } = useFavoriteItems(user)
  const router = useRouter()
  const isKo = locale === "ko"
  const basePath = theme === "black" ? "/black" : ""
  const accentText = theme === "black" ? "text-white" : "text-primary"
  const accentBg = theme === "black" ? "bg-white" : "bg-primary"
  const logoSrc = theme === "black" ? "/logo-white.png" : "/logo-pink.png"

  const [showSplash, setShowSplash] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [premiumHighlights, setPremiumHighlights] = useState<AuctionHomeHighlightRecord[]>([])
  const [hybridHighlights, setHybridHighlights] = useState<AuctionHomeHighlightRecord[]>([])

  useEffect(() => {
    setMounted(true)
    setSplashVisible(true)
    // 스플래시 화면을 3초 후에 사라지게 함
    const timer = setTimeout(() => {
      setShowSplash(false)
      setSplashVisible(false)
    }, 3000)

    return () => {
      clearTimeout(timer)
      setSplashVisible(false)
    }
  }, [setSplashVisible])

  useEffect(() => {
    let active = true

    async function loadHomeAuctions() {
      try {
        const [nextPremium, nextHybrid] = await Promise.all([
          listPublicAuctionHighlights({ auctionType: "premium", limit: 3 }),
          listPublicAuctionHighlights({ auctionType: "hybrid", limit: 1 }),
        ])

        if (!active) {
          return
        }

        setPremiumHighlights(nextPremium)
        setHybridHighlights(nextHybrid)
      } catch {
        if (!active) {
          return
        }

        setPremiumHighlights([])
        setHybridHighlights([])
      }
    }

    void loadHomeAuctions()

    return () => {
      active = false
    }
  }, [])

  if (!mounted || showSplash) {
    return <SplashScreen accentBg={accentBg} logoSrc={logoSrc} isKo={isKo} />
  }

  const premiumPreviewItems = premiumHighlights.filter((highlight) => highlight.auction.auction_id !== "fb")
  const hybridPreview = hybridHighlights[0] ?? null
  const hybridGridItems = hybridPreview ? HYBRID_AUCTION_ITEMS.slice(0, 3) : HYBRID_AUCTION_ITEMS

  return (
    <div className="min-h-screen bg-black text-white pb-for-nav overflow-x-hidden">
      {/* 상단 네비게이션 — 모바일: 로고·아이콘 축소, 테마 안 짤리게 */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/5 overflow-visible">
        <div className="flex items-center justify-between gap-1.5 px-2.5 py-3 min-h-[3.5rem] sm:min-h-[6rem] sm:gap-2 sm:px-4">
          <div className="h-16 w-32 min-w-0 flex-shrink-0 sm:h-[72px] sm:w-[225px]">
            <Link href={basePath || "/"} className="block h-full w-full">
              <Image
                src={logoSrc}
                alt="Krunch"
                width={LOGO_WIDTH}
                height={LOGO_HEIGHT}
                className={`h-full w-full object-contain object-left`}
              />
            </Link>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 overflow-visible">
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

      <main className="px-4 py-6 space-y-8">
        {/* LEGEND DROP 섹션 */}
        <section>
          <h2 className={`font-display text-3xl tracking-wide uppercase italic mb-4 min-h-10 leading-tight flex items-center ${theme === "black" ? "black-mode-legend-title" : "text-white"}`}>PREMIUM AUCTION</h2>
          <Link href={`${basePath}/auction?showcaseId=${PREMIUM_SHOWCASE_ID}`} className="block">
            <div className={`relative rounded-2xl overflow-hidden border ${theme === "black" ? "black-home-hero-card bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f]" : "bg-gradient-to-br from-[#2a1a1a] to-[#1a0a0a] border-white/10"}`}>
              {/* 배경 이미지 오버레이 — 블랙 모드: 레이어 분리 */}
              <div className={`absolute inset-0 ${theme === "black" ? "bg-gradient-to-br from-[#2a1a1a] via-[#0f0f0f] to-[#0a0a0a]" : "bg-gradient-to-br from-[#3d1a2a] via-[#1a0a0a] to-[#0d0505]"}`} />

              <div className="relative p-5">
                {/* Live Now 뱃지 — 높이 고정해서 핑크/다크 전환 시 카드 시작 구간 동일 */}
                <div className="min-h-[2.5rem] flex items-center gap-2 mb-4">
                  <span
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide border ${
                      theme === "black"
                        ? "bg-transparent text-white border-[rgba(255,105,180,0.5)]"
                        : "bg-[#FF6B9D] text-black border-transparent live-now-badge"
                    }`}
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                    </span>
                    LIVE NOW
                  </span>
                </div>

                {/* 상품 이미지 */}
                <div className="flex flex-col items-center">
                  <div className={`relative w-full aspect-[4/3] max-h-64 rounded-xl overflow-hidden mb-5 ${theme === "black" ? "bg-[radial-gradient(circle,#2a1a1a_0%,#0a0a0a_100%)]" : "bg-black/50"}`}>
                    <video
                      src="/cap-spin.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="w-full text-center">
                    <h3 className="font-bold text-white text-lg md:text-xl min-h-[2rem]">PEACEMINUSONE</h3>
                    <p className={`text-sm md:text-base mt-1 min-h-[1.5rem] ${theme === "black" ? "text-[#b0b0b0]" : "text-white/60"}`}>{isKo ? "Übermensch 2025 월드 투어 스페셜 머치" : "Übermensch 2025 World Tour Special Merch"}</p>
                    <p className={`text-xs mt-0.5 min-h-[1.25rem] ${theme === "black" ? "text-[#808080]" : "text-white/40"}`}>{isKo ? "Übermensch 캡 (버건디) 커스텀" : "Übermensch Cap (Burgundy) customized"}</p>

                    <div className={`mt-5 min-h-[2.5rem] flex items-center justify-center ${theme === "black" ? "font-mono text-3xl md:text-4xl font-bold text-white tracking-wider tabular-nums" : ""}`} style={theme === "black" ? { textShadow: "0 0 20px rgba(255,255,255,0.3)", letterSpacing: "2px" } : undefined}>
                      <CountdownTimer accentText={accentText} />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between min-h-[3rem]">
                  <span className={`text-sm uppercase tracking-wide ${theme === "black" ? "text-[#808080]" : "text-white/60"}`} style={theme === "black" ? { letterSpacing: "1px" } : undefined}>{isKo ? "현재 입찰가" : "Current Bid"}</span>
                  <span className={`font-bold tabular-nums ${theme === "black" ? "text-white text-2xl md:text-3xl" : `${accentText} text-2xl md:text-3xl`}`} style={theme === "black" ? { textShadow: "0 2px 8px rgba(255,255,255,0.2)" } : undefined}>₩{'\u2009'}6,733,184</span>
                </div>
              </div>
            </div>
          </Link>
          {premiumPreviewItems.length ? (
            <div className="mt-3 grid gap-3">
              {premiumPreviewItems.map((highlight) => (
                <Link
                  key={highlight.auction.auction_id}
                  href={`${basePath}/auction?auctionId=${highlight.auction.auction_id}`}
                  className={`block rounded-xl overflow-hidden ${theme === "black" ? "black-home-unique-card" : "bg-[#1a1a1a] border border-[#FF6B9D]/30 hover:border-[#FF6B9D]/50"} transition-colors`}
                >
                  <div className="flex gap-3 p-3">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-black/40">
                      <img
                        src={resolveHomeAuctionMedia(highlight, "/cap2.png")}
                        alt={highlight.artifact.artifact_title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-[10px] uppercase tracking-[0.24em] ${theme === "black" ? "text-[#808080]" : "text-white/45"}`}>
                          {homeAuctionStatusLabel(highlight.auction, isKo)}
                        </p>
                      </div>
                      <h3 className="mt-1 line-clamp-1 text-sm font-semibold text-white">{highlight.artifact.artifact_title}</h3>
                      <p className={`mt-0.5 text-xs italic ${theme === "black" ? "text-[#b0b0b0]" : "text-white/40"}`}>
                        {highlight.artifact.artist_name ? `worn by ${highlight.artifact.artist_name}` : highlight.artifact.artifact_code}
                      </p>
                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <p className={`text-[10px] uppercase tracking-[0.2em] ${theme === "black" ? "text-[#808080]" : "text-white/45"}`}>
                            Current Bid
                          </p>
                          <p className={`mt-1 text-lg font-bold tabular-nums ${theme === "black" ? "text-white" : accentText}`}>
                            {formatMoney(highlight.currentHighestBid, highlight.auction.currency ?? "KRW")}
                          </p>
                        </div>
                        <p className={`text-xs ${theme === "black" ? "text-[#b0b0b0]" : "text-white/55"}`}>
                          {highlight.artifact.artifact_code}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </section>

        {/* UNIQUE DROPS 섹션 */}
        <section>
          <h2 className={`font-display text-3xl tracking-wide uppercase italic mb-4 min-h-10 leading-tight flex items-center ${theme === "black" ? "black-mode-legend-title" : "text-white"}`}>HYBRID AUCTION</h2>
          <div className="grid grid-cols-2 gap-3">
            {hybridPreview ? (
              <Link
                href={`${basePath}/auction?auctionId=${hybridPreview.auction.auction_id}`}
                className={`relative rounded-xl overflow-hidden ${theme === "black" ? "black-home-unique-card" : "bg-[#1a1a1a] border border-[#FF6B9D]/30 hover:border-[#FF6B9D]/50"} transition-colors`}
              >
                <div className="relative aspect-[4/3] bg-transparent">
                  <img
                    src={resolveHomeAuctionMedia(hybridPreview, "/placeholder.svg")}
                    alt={hybridPreview.artifact.artifact_title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="line-clamp-1 text-sm font-medium text-white">{hybridPreview.artifact.artifact_title}</p>
                  </div>
                  <p className={`mt-0.5 text-xs italic ${theme === "black" ? "text-[#b0b0b0]" : "text-white/40"}`}>
                    {hybridPreview.artifact.artist_name ? `worn by ${hybridPreview.artifact.artist_name}` : hybridPreview.artifact.artifact_code}
                  </p>
                  <p
                    className={`${theme === "black" ? "text-white" : accentText} mt-2 text-xs font-medium uppercase tracking-wide`}
                    style={theme === "black" ? { WebkitTextStroke: "1px rgba(255,105,180,0.4)" } : undefined}
                  >
                    {homeAuctionStatusLabel(hybridPreview.auction, isKo)}
                  </p>
                  <p className={`mt-2 text-sm font-semibold tabular-nums ${theme === "black" ? "text-white" : "text-white"}`}>
                    {formatMoney(hybridPreview.currentHighestBid, hybridPreview.auction.currency ?? "KRW")}
                  </p>
                </div>
              </Link>
            ) : null}
            {hybridGridItems.map((item) => {
              const isFelix = item.id === "hybrid-human-made-tee"
              const favorite = isFavorite(item.id)
              const statusClass = theme === "black"
                ? "text-white text-xs mt-2 font-medium uppercase tracking-wide"
                : `${accentText} text-xs mt-2 font-medium uppercase tracking-wide`

              return (
                <div
                  key={item.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`${basePath}/auction?showcaseId=${item.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      router.push(`${basePath}/auction?showcaseId=${item.id}`)
                    }
                  }}
                  className={`relative cursor-pointer rounded-xl overflow-hidden ${theme === "black" ? "black-home-unique-card" : "bg-[#1a1a1a] border border-[#FF6B9D]/30 hover:border-[#FF6B9D]/50"} transition-colors`}
                >
                  <button
                    type="button"
                    aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
                    aria-pressed={favorite}
                    onClick={(event) => {
                      event.stopPropagation()
                      void toggleFavorite(item.id)
                    }}
                    className={`absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md transition-all active:scale-95 ${
                      favorite
                        ? "border-[#FF6B9D]/70 bg-[#FF6B9D]/18 text-[#FF6B9D] shadow-[0_0_18px_rgba(255,107,157,0.28)]"
                        : "border-white/15 bg-black/45 text-white/75 hover:border-[#FF6B9D]/50 hover:text-[#FF9EBE]"
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} />
                  </button>
                  <div className="relative aspect-[4/3] bg-transparent">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      fill
                      className={
                        isFelix
                          ? "object-cover"
                          : "object-contain scale-[0.92] translate-x-2 translate-y-2"
                      }
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-white text-sm font-medium line-clamp-1">{isKo && "nameKo" in item && item.nameKo ? item.nameKo : item.name}</h3>
                    <p className={`text-xs mt-0.5 italic ${theme === "black" ? "text-[#b0b0b0]" : "text-white/40"}`}>{isKo && "subtitleKo" in item && item.subtitleKo ? item.subtitleKo : item.subtitle}</p>
                    <p
                      className={statusClass}
                      style={theme === "black" ? { WebkitTextStroke: "1px rgba(255,105,180,0.4)" } : undefined}
                    >
                      {item.status === "Coming Soon"
                        ? (isKo ? "준비 중" : "Coming Soon")
                        : item.status === "Live Now"
                          ? (isKo ? "라이브" : "LIVE NOW")
                          : item.status === "Sold Out"
                            ? (isKo ? "품절" : "Sold Out")
                            : "dateIso" in item && item.dateIso
                              ? formatHybridDropDate(item.dateIso, isKo)
                              : null}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>

    </div>
  )
}
