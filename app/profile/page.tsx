"use client"

import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { Home, Trophy, Users, User, Settings, QrCode, Wallet, Store, Search, Bell, X, Share2, Plus, Pencil } from "lucide-react"
import { useSiteTheme } from "@/components/theme-provider"
import { useLocale } from "@/components/locale-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { useToast } from "@/hooks/use-toast"

// 등급 시스템: Bronze → Silver → Gold → Platinum → Diamond (VIP)
const TIER_NAMES: Record<number, string> = {
  1: "Bronze",
  2: "Silver",
  3: "Gold",
  4: "Platinum",
  5: "Diamond (VIP)",
}
const LEVEL_CURRENT = 3
const LEVEL_NEXT = 4
const XP_PERCENT = 87
const XP_CURRENT = 870
const XP_NEEDED = 1000
function getTierName(level: number) {
  if (level >= 5) return "Diamond (VIP)"
  return TIER_NAMES[level] ?? "Bronze"
}

// 원기둥 갤러리: 벽 개수, 드래그로 회전
const GALLERY_WALLS = 16
const GALLERY_RADIUS = 320
const DRAG_SENSITIVITY = 0.45

// 구매한 착장 슬롯 (나중에 사진 넣을 예정)
// 0번 벽의 2개 슬롯에 기본 샘플(Cap / T-Shirts)을 미리 걸어둠 — 액자 두 개로 줄여 겹침 방지
const GALLERY_ITEMS: (string | null)[][] = Array.from({ length: GALLERY_WALLS }, (_, wallIndex) => {
  if (wallIndex === 0) {
    return ["/Cap.png", "/T-Shirts.png"]
  }
  return [null, null]
})

// SNS 공유 아이콘 (카카오톡, 인스타그램, X)
function IconKakao({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 3c5.8 0 10.5 3.66 10.5 8.18 0 4.52-4.7 8.18-10.5 8.18-1.24 0-2.43-.18-3.53-.5L3 21l1.92-5.5C3.7 14.2 1.5 11.5 1.5 11.18 1.5 6.66 6.2 3 12 3z" />
    </svg>
  )
}
function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}
function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

export default function ProfilePage() {
  const { theme } = useSiteTheme()
  const { locale } = useLocale()
  const isKo = locale === "ko"
  const basePath = theme === "black" ? "/black" : ""
  const { toast } = useToast()
  const [showQR, setShowQR] = useState(false)
  const [showLevelModal, setShowLevelModal] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [galleryAngle, setGalleryAngle] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const galleryRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const startAngleRef = useRef(0)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    galleryRef.current?.setPointerCapture(e.pointerId)
    isDraggingRef.current = true
    setIsDragging(true)
    startXRef.current = e.clientX
    startAngleRef.current = galleryAngle
  }, [galleryAngle])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return
    const deltaX = e.clientX - startXRef.current
    setGalleryAngle(startAngleRef.current + deltaX * DRAG_SENSITIVITY)
  }, [])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    galleryRef.current?.releasePointerCapture(e.pointerId)
    isDraggingRef.current = false
    setIsDragging(false)
  }, [])

  const handlePointerLeave = useCallback(() => {
    isDraggingRef.current = false
    setIsDragging(false)
  }, [])

  const userStats = [
    { label: isKo ? "총 입찰" : "Total Bids", value: "127", change: "+12", icon: "🔨", tooltipLines: isKo ? ["이번 달 입찰 42회", "가장 많이 입찰한 카테고리: 스니커즈"] : ["42 bids this month", "Top category: Sneakers"] },
    { label: isKo ? "낙찰 수" : "Won Items", value: "4", change: "+1", icon: "🏆", tooltipLines: isKo ? ["이번 달 낙찰 1건", "LEGEND 1, UNIQUE 3"] : ["1 win this month", "LEGEND 1, UNIQUE 3"] },
    { label: isKo ? "낙찰률" : "Win Rate", value: "18%", change: "+2%", icon: "📈", tooltipLines: isKo ? ["전월 16% → 이번 달 18%"] : ["16% last month → 18% this month"] },
  ]

  return (
    <>
      <div className="min-h-screen bg-black text-white pb-for-nav">
        {/* Ambient lighting effects — 블랙 모드에서는 끄거나 최소화 */}
        {theme !== "black" && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/3 right-0 w-80 h-80 bg-pink-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
            <div className="absolute top-1/2 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: "2s" }} />
          </div>
        )}

        {/* Header — 모바일: 로고·우측 한 줄·테마 안 짤리게 */}
        <header
          className="sticky top-0 z-40 backdrop-blur-md overflow-visible"
          style={theme === "black"
            ? { background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.1)" }
            : { background: "rgba(0,0,0,0.8)", borderBottom: "1px solid rgba(255,255,255,0.1)" }
          }
        >
          <div className="flex items-center justify-between gap-2 px-3 py-3 min-h-[3.5rem] sm:min-h-[6rem] sm:px-4">
            <div className="h-12 w-24 min-w-0 flex-shrink-0 sm:h-[72px] sm:w-[225px]">
              <Link href={basePath || "/"} className="block h-full w-full">
                <Image
                  src={theme === "black" ? "/logo-white.png" : "/logo-pink.png"}
                  alt="Krunch"
                  width={225}
                  height={72}
                  className={`h-full w-full object-contain object-left ${theme !== "black" ? "scale-[1.02] origin-center" : ""}`}
                />
              </Link>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 overflow-visible">
              <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                <User className={`w-4 h-4 shrink-0 sm:w-5 sm:h-5 ${theme === "black" ? "text-white" : "text-[#FF6B9D]"}`} />
                <span className={isKo ? "font-sans font-bold tracking-tight text-sm sm:text-base text-white/95 uppercase whitespace-nowrap" : "font-display text-sm sm:text-lg tracking-wide text-white uppercase whitespace-nowrap"}>{isKo ? "마이 프로필" : "My Profile"}</span>
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

        <main className="relative z-10 px-4 py-4 space-y-4">
          {/* Holographic ID Card — 블랙 모드: 카드 블랙 + 글씨 흰색 */}
          <div className="relative">
            <div 
              className="relative rounded-2xl p-4 overflow-hidden border"
              style={theme === "black" ? {
                background: "#0a0a0a",
                borderColor: "rgba(255,105,180,0.28)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
              } : {
                background: "linear-gradient(135deg, rgba(255,107,157,0.08) 0%, rgba(255,107,157,0.05) 100%)",
                borderColor: "transparent",
                boxShadow: "0 4px 24px rgba(255,107,157,0.15)",
              }}
            >
              {/* Holographic overlay — 블랙 모드에서는 숨김 */}
              {theme !== "black" && (
                <>
                  <div 
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
                    }}
                  />
                  <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                      background: "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
                      animation: "shimmer 3s infinite",
                    }}
                  />
                </>
              )}

              {/* Card content */}
              <div className="relative z-10">
                {/* Top row */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start gap-6">
                    <div>
                      <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">{isKo ? "회원 ID" : "MEMBER ID"}</p>
                      <p className="text-lg font-mono tracking-wider">KR-2024-00847</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">K-Point</p>
                      <p className={`text-lg font-mono tracking-wider ${theme === "black" ? "text-white" : "text-[#FF6B9D]"}`}>530,000</p>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowQR((v) => !v)}
                      className={`flex items-center justify-center rounded-lg p-2 cursor-pointer ${theme === "black" ? "bg-white/10 hover:bg-white/15" : "bg-black/30 hover:bg-black/40"} transition-colors`}
                      aria-label="Share profile"
                    >
                      <QrCode className="w-8 h-8 text-white/80" />
                    </button>
                    {showQR && (
                      <>
                        <div className="fixed inset-0 z-40 bg-black/20 cursor-default" onClick={() => setShowQR(false)} aria-hidden />
                        <div className="fixed top-24 right-4 z-50 p-4 bg-black/95 border border-white/10 rounded-xl shadow-2xl w-[220px]" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const profileUrl = `${window.location.origin}${basePath}/profile`
                                await navigator.clipboard.writeText(profileUrl)
                                toast({
                                  title: isKo ? "클립보드에 복사되었습니다" : "Copied to clipboard",
                                  description: profileUrl,
                                })
                              } catch (err) {
                                toast({
                                  title: isKo ? "복사 실패" : "Copy failed",
                                  description: isKo ? "URL을 수동으로 복사해주세요" : "Please copy the URL manually",
                                  variant: "destructive",
                                })
                              }
                            }}
                            className="text-xs font-semibold text-white/90 mb-3 flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5" /> {isKo ? "프로필 공유" : "Share profile"}
                          </button>
                          <div className="flex justify-center mb-3">
                            <Image src="/Krunch-QR.jpg" alt="QR" width={160} height={160} className="rounded-lg" />
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <a href="#" className={`p-2.5 rounded-full bg-white/10 transition-colors ${theme === "black" ? "hover:bg-gradient-to-br hover:from-white hover:via-gray-400 hover:to-black hover:text-white" : "hover:bg-gradient-to-br hover:from-[#FEE500] hover:via-[#FBC02D] hover:to-[#F9A825] hover:text-black"}`} title="카카오톡" aria-label="카카오톡">
                              <IconKakao className="w-5 h-5" />
                            </a>
                            <a href="#" className={`p-2.5 rounded-full bg-white/10 transition-colors ${theme === "black" ? "hover:bg-gradient-to-br hover:from-white hover:via-gray-400 hover:to-black hover:text-white" : "hover:bg-gradient-to-br hover:from-[#833AB4] hover:via-[#E1306C] hover:to-[#FCAF45] hover:text-white"}`} title="인스타그램" aria-label="인스타그램">
                              <IconInstagram className="w-5 h-5" />
                            </a>
                            <a href="#" className={`p-2.5 rounded-full bg-white/10 transition-colors ${theme === "black" ? "hover:bg-gradient-to-br hover:from-white hover:via-gray-400 hover:to-black hover:text-white" : "hover:bg-gradient-to-br hover:from-white hover:via-gray-400 hover:to-black hover:text-white"}`} title="X (트위터)" aria-label="X">
                              <IconX className="w-5 h-5" />
                            </a>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* User info + 레벨 진행률 + XP 바 */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <div
                      className={`w-16 h-16 rounded-full overflow-hidden bg-black/20 ${theme === "black" ? "" : "ring-2 ring-purple-500/50"}`}
                      style={theme === "black" ? { border: "2px solid rgba(255,255,255,0.2)" } : undefined}
                    >
                      <img
                        src="/profile-avatar.jpg"
                        alt="Fomo_KR"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          if (target.src.includes('/profile-avatar.jpg') && !target.src.includes('/images/')) {
                            target.src = '/images/profile-avatar.jpg'
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-display text-lg tracking-wide uppercase">Fomo_KR</p>
                      <button
                        type="button"
                        className={`p-1 rounded-full border border-white/20 transition-colors ${theme === "black" ? "hover:bg-white/10 hover:border-white/30" : "hover:bg-black/30 hover:border-white/30"}`}
                        aria-label={isKo ? "프로필 수정" : "Edit profile"}
                      >
                        <Pencil className="w-3 h-3 text-white/60 hover:text-white/90" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowLevelModal(true)}
                      className={`text-left mt-1 flex flex-col gap-1 rounded-lg px-2.5 py-1.5 transition-colors border ${theme === "black" ? "border-white/30 hover:bg-white/5" : "border-transparent bg-black/20 hover:bg-black/30"}`}
                      style={theme === "black" ? { background: "rgba(255,255,255,0.05)" } : undefined}
                    >
                      <span className="text-[10px] font-semibold text-white/80">{getTierName(LEVEL_CURRENT)} → {getTierName(LEVEL_NEXT)} ({XP_PERCENT}%)</span>
                      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#ec4899] to-[#f472b6] transition-all duration-500"
                          style={{ width: `${XP_PERCENT}%` }}
                        />
                      </div>
                    </button>
                  </div>
                </div>

                {/* Stats row: 핑크/다크 동일 — 카드 안 컴팩트, 아이콘·숫자·라벨 */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10 gap-2">
                  {userStats.map((stat, index) => (
                    <div
                      key={index}
                      className="flex-1 text-center relative group"
                      title={stat.tooltipLines.join(" · ")}
                    >
                      <p className="text-lg font-bold flex items-center justify-center gap-1">
                        <span className="text-base" aria-hidden>{stat.icon}</span>
                        {stat.value}
                        {stat.change && <span className="text-xs font-normal text-emerald-400/90">({stat.change} ↑)</span>}
                      </p>
                      <p className="text-xs text-white/50 mt-0.5">{stat.label}</p>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-3 py-2 rounded-lg bg-black/95 text-xs text-white/90 min-w-[200px] max-w-[280px] whitespace-normal text-left opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10 border border-white/10 shadow-xl">
                        {stat.tooltipLines.map((line, i) => (
                          <p key={i} className="leading-snug">{line}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions — 블랙 모드: 배경/테두리/호버 밝아짐 */}
          <section className="grid grid-cols-3 gap-3">
            {[
              { icon: Wallet, label: isKo ? "충전" : "Charge", iconColor: "text-white/80" },
              { icon: Trophy, label: isKo ? "배지" : "Badges", iconColor: "text-white/80" },
              { icon: Settings, label: isKo ? "설정" : "Settings", iconColor: "text-white/80" },
            ].map((action, index) => (
              <button
                key={index}
                type="button"
                className={`profile-quick-action flex flex-col items-center justify-center gap-1.5 rounded-xl transition-colors h-[88px] box-border ${theme === "black" ? "p-3 border border-white/10 hover:bg-white/10" : "p-3 border border-white/10"}`}
                style={theme === "black"
                  ? { background: "rgba(255,255,255,0.05)" }
                  : { background: "rgba(255,255,255,0.05)" }
                }
              >
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                  <action.icon className={`w-[1.1rem] h-[1.1rem] ${action.iconColor}`} />
                </div>
                <span className="text-xs text-white/70">{action.label}</span>
              </button>
            ))}
          </section>

          {/* 3D Gallery Section — MY GALLERY·Add Item는 박스 위(공통), 다크모드만 갤러리 박스에 테두리 */}
          <section className="mt-6">
            <div className="flex items-center justify-between mb-4 px-0">
              <h2 className="text-lg font-display tracking-wide flex items-center gap-2">
                <span className={theme === "black" ? "text-white uppercase" : "text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B9D] to-[#FF6B9D]/80 uppercase"}>{isKo ? "마이 갤러리" : "MY GALLERY"}</span>
              </h2>
              <button type="button" onClick={() => setShowAddItem(true)} className={`text-xs transition-colors ${theme === "black" ? "text-white/80 hover:text-white" : "text-pink-400 hover:text-pink-300"}`}>
                {isKo ? "아이템 추가" : "Add Item"}
              </button>
            </div>

            {/* 원기둥 장식장 — 테두리/링 제거 (두 모드 공통) */}
            <div
              ref={galleryRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerLeave}
              onPointerCancel={handlePointerLeave}
              className="relative rounded-2xl overflow-hidden select-none touch-none"
              style={{
                height: "540px",
                cursor: isDragging ? "grabbing" : "grab",
                background: `
                  radial-gradient(ellipse 70% 45% at 50% 55%, rgba(40,35,55,0.6) 0%, transparent 55%),
                  radial-gradient(ellipse 90% 70% at 50% 50%, rgba(15,12,22,0.95) 0%, rgba(0,0,0,0.99) 70%)
                `,
              }}
            >
              {/* 바닥 그림자 (원기둥이 서 있는 느낌) */}
              <div
                className="absolute left-1/2 bottom-0 -translate-x-1/2 rounded-full opacity-40"
                style={{
                  width: GALLERY_RADIUS * 2.2,
                  height: 28,
                  background: "radial-gradient(ellipse 100% 100%, rgba(0,0,0,0.8) 0%, transparent 70%)",
                }}
              />
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  perspective: "900px",
                  perspectiveOrigin: "50% 52%",
                  transformStyle: "preserve-3d",
                }}
              >
                <div
                  className="relative flex items-center justify-center"
                  style={{
                    width: GALLERY_RADIUS * 2,
                    height: 480,
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* 원기둥 위쪽 뚜껑 (둥근 링) — 테두리 제거 */}
                  <div
                    className="absolute left-1/2 top-0 -translate-x-1/2 z-20 rounded-full"
                    style={{
                      width: GALLERY_RADIUS * 2.15,
                      height: 28,
                      background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 30%, rgba(0,0,0,0.4) 100%)",
                      boxShadow: "0 -2px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
                    }}
                  />
                  {/* 원기둥 본체 — 회전하는 벽들 (강한 원근) */}
                  <div
                    className="absolute"
                    style={{
                      top: 20,
                      left: "50%",
                      marginLeft: -GALLERY_RADIUS,
                      width: GALLERY_RADIUS * 2,
                      height: 420,
                      transformStyle: "preserve-3d",
                      transform: `rotateY(${galleryAngle}deg)`,
                    }}
                  >
                    {Array.from({ length: GALLERY_WALLS }).map((_, i) => {
                      const angle = (i / GALLERY_WALLS) * 360
                      const items = GALLERY_ITEMS[i] ?? [null, null, null]
                      // 정면에 가까운 벽만 보이게 하고, 뒤쪽은 아예 숨겨서 어지러운 느낌 제거
                      const normalizedAngle = ((angle - galleryAngle) % 360 + 360) % 360
                      const frontness = 1 - Math.min(normalizedAngle, 360 - normalizedAngle) / 180 // 0(완전 뒤) ~ 1(정면)
                      if (frontness < 0.18) return null
                      const opacity = 0.2 + frontness * 0.8
                      return (
                        <div
                          key={i}
                          className="absolute top-1/2 left-1/2 backface-hidden"
                          style={{
                            transform: `translate(-50%,-50%) rotateY(${angle}deg) translateZ(${GALLERY_RADIUS}px)`,
                            transformStyle: "preserve-3d",
                            backfaceVisibility: "hidden",
                            opacity,
                          }}
                        >
                          {/* 액자 2개가 원기둥 표면에 붙어 있고, 세로 간격 넓혀 겹치지 않게 */}
                          {[0, 1].map((slotIndex) => {
                            const verticalOffset = (slotIndex - 0.5) * 160 // 위·아래 두 칸, 간격 넉넉히
                            const item = items[slotIndex]
                            return (
                              <div
                                key={slotIndex}
                                className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
                                style={{
                                  top: `calc(50% + ${verticalOffset}px)`,
                                  transform: "translateZ(1px)", // 표면 위로 약간 띄워 보이게
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => !item && setShowAddItem(true)}
                                  className={`rounded-2xl overflow-hidden flex items-center justify-center w-[96px] h-[128px] transition-colors ${theme === "black" ? "border hover:border-white/25" : "border border-white/15 bg-black/60 hover:border-[rgba(255,105,180,0.4)]"}`}
                                  style={theme === "black"
                                    ? item
                                      ? { border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 4px 14px rgba(0,0,0,0.6)", background: "rgba(0,0,0,0.6)" }
                                      : { border: "1px dashed rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.03)", boxShadow: "0 4px 14px rgba(0,0,0,0.4)" }
                                    : { boxShadow: "0 4px 14px rgba(0,0,0,0.6)" }
                                  }
                                >
                                  {item ? (
                                    <Image src={item} alt="" width={96} height={128} className="w-full h-full object-cover pointer-events-none" />
                                  ) : (
                                    <span className={`flex flex-col items-center justify-center gap-0.5 ${theme === "black" ? "text-[#9CA3AF]" : "text-white/50"}`}>
                                      <Plus className={`w-5 h-5 ${theme === "black" ? "text-[#9CA3AF]" : "text-white/50"}`} />
                                      <span className="text-[10px] font-medium">{isKo ? "추가" : "Add Item"}</span>
                                    </span>
                                  )}
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                  {/* 원기둥 아래쪽 뚜껑 — 테두리 제거 */}
                  <div
                    className="absolute left-1/2 bottom-0 -translate-x-1/2 z-20 rounded-full"
                    style={{
                      width: GALLERY_RADIUS * 2.15,
                      height: 28,
                      background: "linear-gradient(0deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 30%, rgba(0,0,0,0.4) 100%)",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(255,255,255,0.06)",
                    }}
                  />
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* 등급 시스템 설명 모달 */}
        {showLevelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowLevelModal(false)}>
            <div className="bg-[#0d0d0d] border border-white/20 rounded-2xl p-5 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg uppercase tracking-wide text-white">{isKo ? "등급" : "Tier"}</h3>
                <button type="button" onClick={() => setShowLevelModal(false)} className="p-1 rounded-full hover:bg-white/10">
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </div>
              <p className="text-xs text-white/70 leading-relaxed mb-4">
                {isKo ? "입찰·낙찰·커뮤니티 활동으로 XP를 쌓아 등급이 올라갑니다. 등급이 높을수록 LEGEND 드롭 참여 기회와 보상이 늘어납니다." : "Earn XP through bids, wins, and community activity to level up. Higher tiers unlock more LEGEND drop access and rewards."}
              </p>
              <div className="text-[10px] text-white/50 space-y-2">
                <p>Bronze → Silver → Gold → Platinum → Diamond (VIP)</p>
                <p className="text-white/60 font-medium mt-2">{isKo ? "달성 조건" : "Tier requirements"}</p>
                <ul className="space-y-0.5 list-none pl-0">
                  <li>{isKo ? "Diamond (VIP) — 1억 원 이상" : `Diamond (VIP) — ₩${'\u2009'}100M+`}</li>
                  <li>{isKo ? "Platinum — 5,000만 원 이상" : `Platinum — ₩${'\u2009'}50M+`}</li>
                  <li>{isKo ? "Gold — 1,000만 원 이상" : `Gold — ₩${'\u2009'}10M+`}</li>
                  <li>{isKo ? "Silver — 300만 원 이상" : `Silver — ₩${'\u2009'}3M+`}</li>
                  <li>{isKo ? "Bronze — 가입 즉시" : "Bronze — On sign-up"}</li>
                </ul>
                <p className="mt-2 pt-2 border-t border-white/10">{isKo ? "현재" : "Current"}: {getTierName(LEVEL_CURRENT)} · {XP_CURRENT} / {XP_NEEDED} XP ({isKo ? "다음 등급까지 " : ""}{XP_NEEDED - XP_CURRENT} XP)</p>
              </div>
            </div>
          </div>
        )}

        {/* Add Item 모달 (플레이스홀더) */}
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
