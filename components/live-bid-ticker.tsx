"use client"

import { useState, useEffect } from "react"

interface Bid {
  id: number
  username: string
  amount: number
}

export function LiveBidTicker() {
  const [bids, setBids] = useState<Bid[]>([])
  const [newestBidId, setNewestBidId] = useState<number | null>(null)

  const generateRandomBid = (): Bid => {
    const usernames = [
      "User8823",
      "Bidder456",
      "Collector789",
      "StreetwearFan",
      "AuctionPro",
      "StyleHunter",
      "HypeBeast2024",
      "FashionLover",
      "SneakerHead",
      "UrbanCollector",
      "TrendSetter",
      "Fashionista",
    ]

    const baseAmount = 200000
    const randomIncrement = Math.floor(Math.random() * 500000) + 50000
    const amount = baseAmount + randomIncrement

    return {
      id: Date.now() + Math.random(),
      username: usernames[Math.floor(Math.random() * usernames.length)],
      amount: amount,
    }
  }

  useEffect(() => {
    // Generate initial bids
    const initialBids: Bid[] = []
    for (let i = 0; i < 3; i++) {
      initialBids.push(generateRandomBid())
    }
    setBids(initialBids)
    setNewestBidId(initialBids[0]?.id || null)

    // Add new bid every 2-3 seconds
    const interval = setInterval(() => {
      const newBid = generateRandomBid()
      setNewestBidId(newBid.id)
      setBids((prev) => {
        // Keep only the last 5 bids
        const updated = [newBid, ...prev].slice(0, 5)
        return updated
      })
      
      // Clear the newest bid ID after animation completes
      setTimeout(() => {
        setNewestBidId(null)
      }, 500)
    }, Math.random() * 1000 + 2000) // Random between 2000-3000ms

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-sm border-t border-primary/20">
      <div className="px-4 py-2 overflow-hidden">
        <div className="flex flex-col gap-1">
          {bids.map((bid) => (
            <div
              key={bid.id}
              className={`text-xs text-white font-sans ${
                bid.id === newestBidId ? "animate-slide-up-fade-in" : ""
              }`}
            >
              <span className="text-primary/90">{bid.username}</span>
              <span className="text-white/80"> placed a bid of </span>
              <span className="text-primary font-semibold">
                {bid.amount.toLocaleString()} KRW
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
