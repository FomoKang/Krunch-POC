interface Bid {
  username: string
  amount: number
  time: string
}

interface BidHistoryProps {
  bids: Bid[]
}

export function BidHistory({ bids }: BidHistoryProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Recent Bids</h3>
      <div className="space-y-1.5">
        {bids.map((bid, index) => (
          <div
            key={index}
            className={`flex items-center justify-between py-2 px-3 rounded-lg ${
              index === 0 ? "bg-primary/10 border border-primary/30" : "bg-secondary/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-xs font-bold text-muted-foreground">{bid.username.charAt(0).toUpperCase()}</span>
              </div>
              <span className={`text-sm font-medium ${index === 0 ? "text-primary" : "text-foreground"}`}>
                {bid.username}
              </span>
            </div>
            <div className="text-right">
              <span className={`text-sm font-bold ${index === 0 ? "text-primary" : "text-foreground"}`}>
                ${bid.amount.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground ml-2">{bid.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
