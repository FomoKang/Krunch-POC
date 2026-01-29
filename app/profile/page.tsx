"use client"

import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { Home, Trophy, Users, User, Settings, QrCode, Wallet, Store, Search, Bell } from "lucide-react"
import { useSiteTheme } from "@/components/theme-provider"

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

export default function ProfilePage() {
  const theme = useSiteTheme()
  const basePath = theme === "black" ? "/black" : ""
  const [showQR, setShowQR] = useState(false)
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
    { label: "Total Bids", value: "127" },
    { label: "Won Items", value: "4" },
    { label: "Win Rate", value: "18%" },
  ]

  return (
    <>
      <div className="min-h-screen bg-black text-white pb-24">
        {/* Ambient lighting effects — 블랙 모드에서는 끄거나 최소화 */}
        {theme !== "black" && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/3 right-0 w-80 h-80 bg-pink-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
            <div className="absolute top-1/2 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: "2s" }} />
          </div>
        )}

        {/* Header */}
        <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href={basePath || "/"}>
              <Image src="/logo-pink.png" alt="Krunch" width={150} height={48} className="h-12 w-auto" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <User className={`w-5 h-5 ${theme === "black" ? "text-white" : "text-[#FF6B9D]"}`} />
                <span className="font-display text-lg tracking-wide text-white uppercase">My Vault</span>
              </div>
              <Link href={`${basePath}/search`} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <Search className="w-5 h-5 text-white/80" />
              </Link>
              <Link href={`${basePath}/notifications`} className="p-2 hover:bg-white/10 rounded-full transition-colors relative">
                <Bell className="w-5 h-5 text-white/80" />
                <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${theme === "black" ? "bg-white" : "bg-[#FF6B9D]"}`} />
              </Link>
              <button type="button" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <Settings className="w-5 h-5 text-white/70" />
              </button>
            </div>
          </div>
        </header>

        <main className="relative z-10 px-4 py-4 space-y-4">
          {/* Holographic ID Card — 블랙 모드: 카드 블랙 + 글씨 흰색 */}
          <div className="relative">
            <div 
              className="relative rounded-2xl p-4 overflow-hidden"
              style={theme === "black" ? {
                background: "#0a0a0a",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
              } : {
                background: "linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(236,72,153,0.3) 50%, rgba(59,130,246,0.3) 100%)",
                boxShadow: "0 0 40px rgba(139,92,246,0.3), inset 0 0 60px rgba(255,255,255,0.05)",
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
                      <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">MEMBER ID</p>
                      <p className="text-lg font-mono tracking-wider">KR-2024-00847</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">K-Point</p>
                      <p className={`text-lg font-mono tracking-wider ${theme === "black" ? "text-white" : "text-orange-400"}`}>530,000</p>
                    </div>
                  </div>
                  <div 
                    className={`relative flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer ${theme === "black" ? "bg-white/10" : "bg-black/30"}`}
                    onMouseEnter={() => setShowQR(true)}
                    onMouseLeave={() => setShowQR(false)}
                  >
                    <QrCode className="w-8 h-8 text-white/80" />
                    {/* QR Image on Hover */}
                    {showQR && (
                      <div className="absolute top-full right-0 mt-2 z-50 p-2 bg-white rounded-lg shadow-2xl">
                        <Image 
                          src="/Krunch-QR.jpg" 
                          alt="Krunch QR Code" 
                          width={200} 
                          height={200}
                          className="rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* User info */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-full overflow-hidden ring-2 bg-black/20 ${theme === "black" ? "ring-white/20" : "ring-purple-500/50"}`}>
                      <img
                        src="/profile-avatar.jpg"
                        alt="Fomo_KR"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to images folder if root doesn't work
                          const target = e.target as HTMLImageElement
                          if (target.src.includes('/profile-avatar.jpg') && !target.src.includes('/images/')) {
                            target.src = '/images/profile-avatar.jpg'
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="font-display text-lg tracking-wide uppercase">Fomo_KR</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${theme === "black" ? "bg-white/15 text-white border border-white/20" : "bg-gradient-to-r from-purple-600 to-pink-600"}`}>
                        LEVEL 3
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  {userStats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <p className="text-lg font-bold">{stat.value}</p>
                      <p className="text-xs text-white/50">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <section className="grid grid-cols-3 gap-3">
            {[
              { icon: Wallet, label: "Charge", iconColor: "text-white/80" },
              { icon: Trophy, label: "Badges", iconColor: "text-white/80" },
              { icon: Settings, label: "Settings", iconColor: "text-white/80" },
            ].map((action, index) => (
              <button
                key={index}
                type="button"
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <action.icon className={`w-4 h-4 ${action.iconColor}`} />
                </div>
                <span className="text-xs text-white/70">{action.label}</span>
              </button>
            ))}
          </section>

          {/* 3D Gallery Section — 블랙 모드: MY GALLERY에만 분홍 테두리 살짝 */}
          <section className={`mt-6 ${theme === "black" ? "rounded-2xl border border-[rgba(255,105,180,0.3)] p-4" : ""}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display tracking-wide flex items-center gap-2">
                <span className={theme === "black" ? "text-white uppercase" : "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 uppercase"}>MY GALLERY</span>
              </h2>
              <button type="button" className={`text-xs transition-colors ${theme === "black" ? "text-white/80 hover:text-white" : "text-pink-400 hover:text-pink-300"}`}>
                Add Item
              </button>
            </div>

            {/* 원기둥 장식장 — 3D 원근·곡면·광원 적용 */}
            <div
              ref={galleryRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerLeave}
              onPointerCancel={handlePointerLeave}
              className={`relative rounded-2xl overflow-hidden select-none touch-none ${theme === "black" ? "ring-1 ring-[rgba(255,105,180,0.2)]" : ""}`}
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
                  {/* 원기둥 위쪽 뚜껑 (둥근 링) */}
                  <div
                    className="absolute left-1/2 top-0 -translate-x-1/2 z-20 rounded-full"
                    style={{
                      width: GALLERY_RADIUS * 2.15,
                      height: 28,
                      background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 30%, rgba(0,0,0,0.4) 100%)",
                      boxShadow: "0 -2px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
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
                                <div
                                  className="rounded-2xl overflow-hidden flex items-center justify-center border border-white/15 bg-black/60"
                                  style={{
                                    width: 96,
                                    height: 128,
                                    boxShadow: "0 4px 14px rgba(0,0,0,0.6)",
                                  }}
                                >
                                  {item ? (
                                    <Image src={item} alt="" width={96} height={128} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-white/25 text-[10px] font-medium">+</span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                  {/* 원기둥 아래쪽 뚜껑 */}
                  <div
                    className="absolute left-1/2 bottom-0 -translate-x-1/2 z-20 rounded-full"
                    style={{
                      width: GALLERY_RADIUS * 2.15,
                      height: 28,
                      background: "linear-gradient(0deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 30%, rgba(0,0,0,0.4) 100%)",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  />
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t border-white/10 z-50">
          <div className="flex items-center justify-around py-3">
            <Link href={basePath || "/"} className="flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors">
              <Home className="w-6 h-6" />
              <span className="text-xs font-medium">Home</span>
            </Link>
            <Link href={`${basePath}/ranking`} className="flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors">
              <Trophy className="w-6 h-6" />
              <span className="text-xs font-medium">Ranking</span>
            </Link>
            <Link href={`${basePath}/community`} className="flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors">
              <Users className="w-6 h-6" />
              <span className="text-xs font-medium">Community</span>
            </Link>
            <Link href={`${basePath}/market`} className="flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors">
              <Store className="w-6 h-6" />
              <span className="text-xs font-medium">2nd Market</span>
            </Link>
            <Link href={`${basePath}/profile`} className={`flex flex-col items-center gap-1 ${theme === "black" ? "text-white" : "text-[#FF6B9D]"}`}>
              <User className="w-6 h-6" />
              <span className="text-xs font-medium">My Profile</span>
            </Link>
          </div>
        </nav>
      </div>
    </>
  )
}
