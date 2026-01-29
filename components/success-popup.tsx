"use client"

import { useEffect, useState } from "react"
import { useSiteTheme } from "./theme-provider"

interface SuccessPopupProps {
  show: boolean
  onClose: () => void
  amount: string
}

export function SuccessPopup({ show, onClose, amount }: SuccessPopupProps) {
  const theme = useSiteTheme()
  const isBlack = theme === "black"
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setTimeout(() => setIsVisible(true), 10)
    } else {
      setIsVisible(false)
    }
  }, [show])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`relative max-w-sm w-full transition-all duration-500 ${
          isVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        {/* Outer glow — 블랙 모드: 핑크 glow 더 진하게 / 기본: 핑크 링 */}
        <div
          className={`absolute -inset-1 rounded-2xl blur-xl animate-pulse ${
            isBlack ? "bg-[#FF69B4]/30" : "bg-[#FF6B9D] opacity-40"
          }`}
        />

        {/* Main card (BID PLACED) — 블랙 모드: #0a0a0a + 제일 연한 핑크 테두리 / 기본: glassmorphism */}
        <div
          className={`relative backdrop-blur-xl rounded-2xl p-8 shadow-2xl ${
            isBlack ? "bg-[#0a0a0a] border border-[rgba(255,105,180,0.12)]" : "bg-black/80 border border-[#FF6B9D]/40"
          }`}
          style={isBlack ? { boxShadow: "0 0 0 1px rgba(255,105,180,0.1), 0 0 12px rgba(255,105,180,0.06)" } : undefined}
        >
          {!isBlack && (
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B9D]/10 via-transparent to-[#FF6B9D]/5 rounded-2xl pointer-events-none" />
          )}

          <div className="relative z-10">
            {/* Success icon — 블랙 모드: 핑크 외곽/글로우 / 기본: 핑크 채움 */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div
                className={`absolute inset-0 rounded-full blur-xl animate-pulse ${
                  isBlack ? "bg-[#FF69B4]/25" : "bg-[#FF6B9D]/30"
                }`}
              />
              <div
                className={`relative w-full h-full rounded-full flex items-center justify-center backdrop-blur-sm ${
                  isBlack
                    ? "bg-transparent border-2 border-[rgba(255,105,180,0.4)]"
                    : "bg-[#FF6B9D]/20 border border-[#FF6B9D]/50"
                }`}
              >
                <svg
                  className={`w-10 h-10 drop-shadow-[0_0_8px_rgba(255,105,180,0.8)] ${isBlack ? "text-[#FF69B4]" : "text-[#FF6B9D]"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{
                    animation: "checkmark-draw 0.6s ease-out forwards",
                    strokeDasharray: 24,
                    strokeDashoffset: isVisible ? 0 : 24,
                  }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h3
              className={`text-3xl font-display font-bold text-center mb-3 tracking-wide ${
                isBlack ? "text-white" : "text-white drop-shadow-[0_0_12px_rgba(255,107,157,0.5)]"
              }`}
            >
              BID PLACED
            </h3>

            <p className={`text-center mb-6 text-sm font-medium tracking-wide ${isBlack ? "text-[#999999]" : "text-white/70"}`}>
              Your offer has been successfully placed
            </p>

            {/* Amount — 블랙 모드: 흰 숫자 + 숫자에 핑크 외곽선 굵게 / 기본: 핑크 */}
            <div className="relative mb-8">
              {!isBlack && <div className="absolute inset-0 bg-[#FF6B9D]/20 blur-2xl rounded-lg" />}
              <div
                className={`relative backdrop-blur-sm rounded-lg p-4 ${
                  isBlack
                    ? "bg-[#0a0a0a] border border-[rgba(255,105,180,0.25)]"
                    : "bg-black/40 border border-[#FF6B9D]/30"
                }`}
              >
                <p
                  className={`text-4xl font-display font-bold text-center tracking-wider ${
                    isBlack
                      ? "text-white"
                      : "text-[#FF6B9D] drop-shadow-[0_0_12px_rgba(255,107,157,0.6)]"
                  }`}
                  style={isBlack ? { WebkitTextStroke: "1.25px rgba(255, 105, 180, 0.45)" } : undefined}
                >
                  ₩{Number(amount.replace(/,/g, "")).toLocaleString()}
                </p>
              </div>
            </div>

            {/* DONE 버튼 — 블랙 모드: 검정 + 화이트 텍스트 + 핑크 테두리 진하게 / 기본: 핑크 배경 */}
            <button
              onClick={onClose}
              className={`relative w-full py-4 font-display font-medium text-lg uppercase tracking-wider rounded-lg overflow-hidden group transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                isBlack
                  ? "bg-black text-white border-2 border-[rgba(255,105,180,0.5)] hover:border-[rgba(255,105,180,0.7)]"
                  : "bg-[#FF6B9D] text-white hover:bg-[#FF6B9D]/90 shadow-lg shadow-[#FF6B9D]/30"
              }`}
            >
              {!isBlack && (
                <>
                  <div className="absolute inset-0 bg-[#FF6B9D] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </>
              )}
              <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">DONE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
