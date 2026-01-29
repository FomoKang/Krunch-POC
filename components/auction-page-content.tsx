"use client"

import { AuctionCard } from "@/components/auction-card"
import { useSiteTheme } from "@/components/theme-provider"

export function AuctionPageContent() {
  const theme = useSiteTheme()
  const isBlack = theme === "black"

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black">
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/bg-main.mp4" type="video/mp4" />
        </video>
        <video
          autoPlay
          loop
          muted
          playsInline
          className={`absolute inset-0 h-full w-full object-cover object-[50%_center] ${isBlack ? "opacity-40" : "opacity-50"}`}
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>
        <div className={`absolute inset-0 ${isBlack ? "bg-black/85" : "bg-black/70"}`} />
      </div>
      <div className="relative z-10 flex h-full flex-col">
        <AuctionCard />
      </div>
    </main>
  )
}
