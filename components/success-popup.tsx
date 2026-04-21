"use client"

import { useEffect, useState } from "react"
import { useLocale } from "./locale-provider"
import { useSiteTheme } from "./theme-provider"

interface SuccessPopupProps {
  show: boolean
  onClose: () => void
  amount: string
}

export function SuccessPopup({ show, onClose, amount }: SuccessPopupProps) {
  const { theme } = useSiteTheme()
  const { locale } = useLocale()
  const isBlack = theme === "black"
  const isKo = locale === "ko"
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!show) {
      setIsVisible(false)
      return
    }

    const timeoutId = window.setTimeout(() => setIsVisible(true), 10)
    return () => window.clearTimeout(timeoutId)
  }, [show])

  if (!show) return null

  const normalizedAmount = Number(amount.replace(/,/g, "") || "0").toLocaleString("en-US")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`relative w-full max-w-sm transition-all duration-500 ${
          isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
        }`}
      >
        <div
          className={`absolute -inset-1 rounded-2xl blur-xl animate-pulse ${
            isBlack ? "bg-[#FF69B4]/30" : "bg-[#FF6B9D]/40"
          }`}
        />

        <div
          className={`relative rounded-2xl border p-8 shadow-2xl backdrop-blur-xl ${
            isBlack
              ? "border-[rgba(255,105,180,0.12)] bg-[#0a0a0a]"
              : "border-[#FF6B9D]/40 bg-black/80"
          }`}
          style={
            isBlack
              ? { boxShadow: "0 0 0 1px rgba(255,105,180,0.1), 0 0 12px rgba(255,105,180,0.06)" }
              : undefined
          }
        >
          {!isBlack ? (
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#FF6B9D]/10 via-transparent to-[#FF6B9D]/5" />
          ) : null}

          <div className="relative z-10">
            <div className="relative mx-auto mb-6 h-20 w-20">
              <div
                className={`absolute inset-0 rounded-full blur-xl animate-pulse ${
                  isBlack ? "bg-[#FF69B4]/25" : "bg-[#FF6B9D]/30"
                }`}
              />
              <div
                className={`relative flex h-full w-full items-center justify-center rounded-full backdrop-blur-sm ${
                  isBlack
                    ? "border-2 border-[rgba(255,105,180,0.4)] bg-transparent"
                    : "border border-[#FF6B9D]/50 bg-[#FF6B9D]/20"
                }`}
              >
                <svg
                  className={`h-10 w-10 ${isBlack ? "text-[#FF69B4]" : "text-[#FF6B9D]"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h3
              className={`mb-3 text-center font-display text-3xl font-bold tracking-wide ${
                isBlack ? "text-white" : "text-white drop-shadow-[0_0_12px_rgba(255,107,157,0.5)]"
              }`}
            >
              {isKo ? "입찰 완료" : "BID PLACED"}
            </h3>

            <p className={`mb-6 text-center text-sm font-medium tracking-wide ${isBlack ? "text-[#999999]" : "text-white/70"}`}>
              {isKo ? "입찰이 성공적으로 접수되었습니다." : "Your offer has been successfully placed."}
            </p>

            <div className="relative mb-8">
              {!isBlack ? <div className="absolute inset-0 rounded-lg bg-[#FF6B9D]/20 blur-2xl" /> : null}
              <div
                className={`relative rounded-lg p-4 backdrop-blur-sm ${
                  isBlack
                    ? "border border-[rgba(255,105,180,0.25)] bg-[#0a0a0a]"
                    : "border border-[#FF6B9D]/30 bg-black/40"
                }`}
              >
                <p
                  className={`text-center font-display text-4xl font-bold tracking-wider ${
                    isBlack ? "text-white" : "text-[#FF6B9D] drop-shadow-[0_0_12px_rgba(255,107,157,0.6)]"
                  }`}
                  style={isBlack ? { WebkitTextStroke: "1.25px rgba(255, 105, 180, 0.45)" } : undefined}
                >
                  {normalizedAmount}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`relative w-full overflow-hidden rounded-lg py-4 font-display text-lg font-medium uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                isBlack
                  ? "border-2 border-[rgba(255,105,180,0.5)] bg-black text-white hover:border-[rgba(255,105,180,0.7)]"
                  : "bg-[#FF6B9D] text-white shadow-lg shadow-[#FF6B9D]/30 hover:bg-[#FF6B9D]/90"
              }`}
            >
              <span className="relative z-10">{isKo ? "확인" : "DONE"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
