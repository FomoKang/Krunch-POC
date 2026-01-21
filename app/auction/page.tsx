import { AuctionCard } from "@/components/auction-card"
import { LiveBidTicker } from "@/components/live-bid-ticker"

export default function Home() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black">
      
      {/* --- [Layer 1] 배경 비디오 그룹 (z-0) --- */}
      <div className="absolute inset-0 z-0">
        
        {/* 1-1. Pink Smoke (가장 뒤) */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/bg-main.mp4" type="video/mp4" />
        </video>

        {/* 1-2. GD Video (중간, 반투명) */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover object-[50%_center] opacity-50"
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>

        {/* 1-3. 어두운 오버레이 (비디오 위, 콘텐츠 아래) */}
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* --- [Layer 2] 실제 콘텐츠 (z-10) --- */}
      <div className="relative z-10 flex h-full flex-col">
        <AuctionCard />
        <LiveBidTicker />
      </div>

    </main>
  )
}
