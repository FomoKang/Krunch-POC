import { AuctionCard } from "@/components/auction-card"
import { LiveBidTicker } from "@/components/live-bid-ticker"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <AuctionCard />
      <LiveBidTicker />
    </main>
  )
}
