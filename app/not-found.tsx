"use client"

import Link from "next/link"
import { FileQuestion, Home, Sparkles } from "lucide-react"
import { useLocale } from "@/components/locale-provider"

export default function NotFound() {
  const { locale } = useLocale()
  const isKo = locale === "ko"

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#FF6B9D]/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-[60px]" />
      </div>

      <div className="text-center max-w-sm w-full relative z-10">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-white/5 border border-white/10 flex items-center justify-center ring-2 ring-white/10">
              <FileQuestion className="w-14 h-14 text-white/70" strokeWidth={1.5} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#FF6B9D]/20 border border-[#FF6B9D]/30 flex items-center justify-center">
              <span className="text-[10px] font-black text-[#FF6B9D]">404</span>
            </div>
          </div>
        </div>

        <h1 className="font-display text-2xl tracking-wide uppercase mb-3 text-white">
          {isKo ? "페이지를 찾을 수 없습니다" : "Page not found"}
        </h1>
        <p className="text-white/50 text-sm leading-relaxed mb-10">
          {isKo ? "요청하신 주소가 없거나 변경되었을 수 있어요." : "The page you're looking for doesn't exist or may have been moved."}
          <br />
          {isKo ? "홈이나 랭킹에서 다시 시작해 보세요." : "Try starting from Home or Ranking."}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#FF006E] text-white font-bold text-sm shadow-lg shadow-[#FF6B9D]/30 hover:shadow-[#FF6B9D]/50 hover:-translate-y-0.5 transition-all"
          >
            <Home className="w-4 h-4" />
            {isKo ? "홈으로 돌아가기" : "Back to Home"}
          </Link>
          <Link
            href="/ranking"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white/10 text-white font-semibold text-sm border border-white/20 hover:bg-white/15 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            {isKo ? "랭킹 보기" : "View Ranking"}
          </Link>
        </div>
      </div>
    </div>
  )
}
