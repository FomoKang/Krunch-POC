"use client"

import Link from "next/link"
import Image from "next/image"
import { User, Sparkles, ArrowLeft, Music2 } from "lucide-react"
import { useSiteTheme } from "@/components/theme-provider"
import { useLocale } from "@/components/locale-provider"
import { ThemeToggle } from "@/components/theme-toggle"

type ArtistInfo = { name: string; nameKo?: string; avatar: string }

type Props = { artistId: string; artist?: ArtistInfo | null; basePath?: string }

export function ArtistComingSoonPage({ artistId, artist, basePath = "" }: Props) {
  const { theme } = useSiteTheme()
  const { locale } = useLocale()
  const isKo = locale === "ko"
  const isBlack = theme === "black"
  const logoSrc = isBlack ? "/logo-white.png" : "/logo-pink.png"

  return (
    <div className="min-h-screen bg-black text-white pb-for-nav flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-md border-b border-white/10"
        style={isBlack ? { background: "rgba(255,255,255,0.03)" } : { background: "rgba(0,0,0,0.8)" }}
      >
        <div className="flex items-center justify-between px-4 py-3 min-h-[4.5rem]">
          <Link href={basePath || "/"} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{isKo ? "뒤로" : "Back"}</span>
          </Link>
          <Link href={basePath || "/"} className="absolute left-1/2 -translate-x-1/2 block shrink-0">
            <Image src={logoSrc} alt="Krunch" width={225} height={72} className={`h-[72px] w-[225px] object-contain ${!isBlack ? "scale-[1.02] origin-center" : ""}`} />
          </Link>
          <div className="w-14 flex justify-end">
            <ThemeToggle inline />
          </div>
        </div>
      </header>

      {/* Main — 준비 중 카드 + 아티스트 사진·이름 */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div
          className={`w-full max-w-sm rounded-3xl overflow-hidden text-center ${
            isBlack ? "bg-white/[0.06] border border-white/10" : "bg-gradient-to-b from-white/10 to-white/5 border border-white/10"
          } shadow-2xl`}
        >
          {/* 아티스트 사진 + 이름 */}
          <div className="pt-10 pb-6 px-6">
            <div
              className={`mx-auto w-28 h-28 rounded-full overflow-hidden flex items-center justify-center mb-4 ${
                isBlack ? "bg-white/10 ring-2 ring-white/20" : "bg-gradient-to-br from-[#FF6B9D]/30 to-[#FF006E]/20 ring-2 ring-[#FF6B9D]/40"
              }`}
            >
              {artist?.avatar ? (
                <Image
                  src={artist.avatar}
                  alt={isKo && artist.nameKo ? artist.nameKo : artist.name}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className={isBlack ? "w-12 h-12 text-white/90" : "w-12 h-12 text-[#FF6B9D]"} strokeWidth={1.5} />
              )}
            </div>
            {artist?.name && (
              <p className={`font-display text-xl tracking-wide uppercase mb-2 ${isBlack ? "text-white" : "text-white"}`}>
                {isKo && "nameKo" in artist && artist.nameKo ? artist.nameKo : artist.name}
              </p>
            )}
            <div className="flex items-center justify-center gap-2 mb-3">
              <Music2 className={isBlack ? "w-5 h-5 text-white/60" : "w-5 h-5 text-[#FF6B9D]/80"} />
              <span className={`text-xs font-bold uppercase tracking-widest ${isBlack ? "text-white/50" : "text-[#FF6B9D]/80"}`}>
                {isKo ? "아티스트 프로필" : "Artist Profile"}
              </span>
            </div>
            <h1 className={`font-display text-2xl tracking-wide uppercase mb-2 ${isBlack ? "text-white" : "text-white"}`}>
              {isKo ? "준비 중" : "Coming Soon"}
            </h1>
            <p className={`text-sm ${isBlack ? "text-white/50" : "text-white/60"}`}>
              {isKo ? (
                <>
                  아티스트 프로필 화면을 열심히 만들고 있어요.
                  <br />
                  조금만 기다려 주세요!
                </>
              ) : (
                <>
                  We&apos;re building the artist profile page.
                  <br />
                  Stay tuned!
                </>
              )}
            </p>
          </div>

          {/* 하단 그라디언트 라인 + CTA */}
          <div className={`px-6 pb-8 pt-2 ${isBlack ? "border-t border-white/10" : ""}`}>
            <div className={`h-1 rounded-full mx-auto mb-6 max-w-[120px] ${isBlack ? "bg-white/20" : "bg-gradient-to-r from-[#FF6B9D]/50 to-[#FF006E]/50"}`} />
            <Link
              href={basePath ? `${basePath}/ranking` : "/ranking"}
              className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
                isBlack
                  ? "bg-white/10 text-white border border-white/20 hover:bg-white/15"
                  : "bg-gradient-to-r from-[#FF6B9D] to-[#FF006E] text-white shadow-lg shadow-[#FF6B9D]/30 hover:shadow-[#FF6B9D]/50 hover:-translate-y-0.5"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {isKo ? "랭킹 보기" : "View Ranking"}
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
