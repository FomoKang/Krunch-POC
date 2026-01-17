import { AuctionCard } from "@/components/auction-card"
import { LiveBidTicker } from "@/components/live-bid-ticker"

export default function Home() {
  return (
    <main className="min-h-screen bg-transparent relative">
      {/* 1층 (맨 뒤, 핑크 연기) */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-[-20]"
      >
        <source src="/bg-main.mp4" type="video/mp4" />
      </video>
      
      {/* 2층 (중간, 지디) */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 w-full h-full object-cover object-[50%_center] z-[-10] opacity-50"
      >
        <source src="/hero-bg.mp4" type="video/mp4" />
      </video>
      
      {/* 3층 (맨 앞, 어둡게) */}
      <div className="fixed inset-0 bg-black/70 z-[-5]" />

      <AuctionCard />
      <LiveBidTicker />
    </main>
  )
}
