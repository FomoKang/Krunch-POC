"use client"

import { useEffect, useState } from "react"

interface SuccessPopupProps {
  show: boolean
  onClose: () => void
  amount: string
}

export function SuccessPopup({ show, onClose, amount }: SuccessPopupProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (show) {
      // 약간의 지연 후 애니메이션 시작
      setTimeout(() => setIsVisible(true), 10)
    } else {
      setIsVisible(false)
    }
  }, [show])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Premium Popup with glassmorphism */}
      <div
        className={`relative max-w-sm w-full transition-all duration-500 ${
          isVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        {/* Outer glow ring */}
        <div className="absolute -inset-1 bg-[#FF6B9D] rounded-2xl blur-xl opacity-40 animate-pulse" />

        {/* Main card with glassmorphism */}
        <div className="relative bg-black/80 backdrop-blur-xl border border-[#FF6B9D]/40 rounded-2xl p-8 shadow-2xl">
          {/* Inner gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B9D]/10 via-transparent to-[#FF6B9D]/5 rounded-2xl pointer-events-none" />

          {/* Content */}
          <div className="relative z-10">
            {/* Premium success icon with glow */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              {/* Outer glow */}
              <div className="absolute inset-0 rounded-full bg-[#FF6B9D]/30 blur-xl animate-pulse" />
              {/* Icon container */}
              <div className="relative w-full h-full rounded-full bg-[#FF6B9D]/20 border border-[#FF6B9D]/50 flex items-center justify-center backdrop-blur-sm">
                <svg
                  className="w-10 h-10 text-[#FF6B9D] drop-shadow-[0_0_8px_rgba(255,107,157,0.8)]"
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

            {/* Title with premium typography */}
            <h3 className="text-3xl font-display font-bold text-white text-center mb-3 tracking-wide drop-shadow-[0_0_12px_rgba(255,107,157,0.5)]">
              BID PLACED
            </h3>

            {/* Subtitle */}
            <p className="text-white/70 text-center mb-6 text-sm font-medium tracking-wide">
              Your offer has been successfully placed
            </p>

            {/* Amount with premium styling */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-[#FF6B9D]/20 blur-2xl rounded-lg" />
              <div className="relative bg-black/40 backdrop-blur-sm border border-[#FF6B9D]/30 rounded-lg p-4">
                <p className="text-4xl font-display font-bold text-[#FF6B9D] text-center tracking-wider drop-shadow-[0_0_12px_rgba(255,107,157,0.6)]">
                  ₩{Number(amount.replace(/,/g, "")).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Premium button */}
            <button
              onClick={onClose}
              className="relative w-full py-4 bg-[#FF6B9D] text-white font-display font-medium text-lg uppercase tracking-wider rounded-lg overflow-hidden group transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:bg-[#FF6B9D]/90 shadow-lg shadow-[#FF6B9D]/30"
            >
              {/* Button glow */}
              <div className="absolute inset-0 bg-[#FF6B9D] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Button text */}
              <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">DONE</span>
              {/* Shine effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
