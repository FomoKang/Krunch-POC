"use client"

import { AlertCircle, WifiOff, ServerCrash, Home, RotateCw } from "lucide-react"
import { useLocale } from "@/components/locale-provider"

function getErrorType(error: Error & { digest?: string }) {
  const message = (error?.message || "").toLowerCase()
  if (message.includes("fetch") || message.includes("network") || message.includes("failed to fetch")) {
    return "network"
  }
  if (error?.digest || message.includes("server") || message.includes("500")) {
    return "server"
  }
  return "unknown"
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { locale } = useLocale()
  const isKo = locale === "ko"
  const type = getErrorType(error)
  const isNetwork = type === "network"
  const isServer = type === "server"

  const config = isNetwork
    ? {
        title: isKo ? "인터넷 연결을 확인해주세요" : "Check your connection",
        description: isKo
          ? "네트워크가 불안정할 수 있어요. 연결을 확인한 뒤 다시 시도해주세요."
          : "Network may be unstable. Please check your connection and try again.",
        icon: WifiOff,
      }
    : isServer
      ? {
          title: isKo ? "서비스 점검 중입니다" : "Service under maintenance",
          description: isKo ? "잠시 후 다시 시도해주세요." : "Please try again in a moment.",
          icon: ServerCrash,
        }
      : {
          title: isKo ? "문제가 발생했어요" : "Something went wrong",
          description: isKo ? "잠시 후 다시 시도해주세요." : "Please try again in a moment.",
          icon: AlertCircle,
        }

  const Icon = config.icon

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="text-center max-w-sm w-full">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center">
            <Icon className="w-12 h-12 text-white/80" />
          </div>
        </div>
        <h2 className="text-xl font-bold mb-2">{config.title}</h2>
        <p className="text-white/60 text-sm mb-8">{config.description}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF6B9D] text-white font-medium hover:bg-[#FF6B9D]/90 transition-colors"
          >
            <RotateCw className="w-4 h-4" />
            {isKo ? "다시 시도" : "Try again"}
          </button>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault()
              window.location.replace("/")
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors border border-white/10 no-underline"
          >
            <Home className="w-4 h-4" />
            {isKo ? "홈으로 돌아가기" : "Back to Home"}
          </a>
        </div>
      </div>
    </div>
  )
}
