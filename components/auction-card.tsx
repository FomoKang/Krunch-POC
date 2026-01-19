"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Confetti } from "./confetti"
import { SuccessPopup } from "./success-popup"

// Format number with thousand separators
const formatNumber = (value: string): string => {
  // Remove all non-numeric characters
  const numericValue = value.replace(/\D/g, "")
  if (!numericValue) return ""
  // Add thousand separators
  return parseInt(numericValue, 10).toLocaleString("en-US")
}

interface BidLogEntry {
  id: number
  username: string
  amount: number
  time: string
}

export function AuctionCard() {
  const [offerAmount, setOfferAmount] = useState(formatNumber("1"))
  const [currentBid, setCurrentBid] = useState(2450000)
  const [bidPulse, setBidPulse] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(24 * 60 * 60) // 24 hours in seconds
  const [bidLog, setBidLog] = useState<BidLogEntry[]>([])
  const [showBidLog, setShowBidLog] = useState(false)
  const [showAuctionCard, setShowAuctionCard] = useState(false)

  // Handle input change with formatting
  const handleOfferChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    // Remove all non-numeric characters and format
    const formatted = formatNumber(inputValue)
    setOfferAmount(formatted)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const increment = Math.floor(Math.random() * 50000) + 10000
      setCurrentBid((prev) => prev + increment)
      setBidPulse(true)
      setTimeout(() => setBidPulse(false), 300)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (timeRemaining <= 0) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(interval)
  }, [timeRemaining])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleSetOffer = () => {
    // Parse the offer amount (remove commas)
    const numericAmount = parseInt(offerAmount.replace(/,/g, ""), 10)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return
    }

    // Update current bid
    setCurrentBid(numericAmount)
    setBidPulse(true)
    setTimeout(() => setBidPulse(false), 300)

    // Add to bid log
    const now = new Date()
    const timeString = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    
    const newBidEntry: BidLogEntry = {
      id: Date.now(),
      username: "You",
      amount: numericAmount,
      time: timeString,
    }

    setBidLog((prev) => [newBidEntry, ...prev].slice(0, 5)) // Keep only latest 5 entries

    // Show confetti and popup
    setShowConfetti(true)
    setTimeout(() => {
      setShowPopup(true)
    }, 300)
    setTimeout(() => {
      setShowConfetti(false)
    }, 2500)
  }

  const handleClosePopup = () => {
    setShowPopup(false)
  }

  return (
    <>
      <Confetti active={showConfetti} />
      <SuccessPopup show={showPopup} onClose={handleClosePopup} amount={offerAmount} />

      <div className="flex flex-col min-h-[100dvh] bg-transparent" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }}>
        {/* Header Section - Fixed */}
        <div className="relative z-50" style={{ minHeight: 'calc(4rem + env(safe-area-inset-top))' }}>
          <Link href="/" className="absolute top-4 left-4" style={{ top: 'calc(1rem + env(safe-area-inset-top))' }}>
            <Image
              src="/logo-pink.png"
              alt="Krunch Logo"
              width={150}
              height={48}
              className="h-12 w-auto"
              width={120}
              height={40}
              className="h-auto w-24 sm:w-[120px] cursor-pointer hover:opacity-80 transition-opacity"
            />
          </Link>

          <div className="absolute top-4 right-4 z-10 bg-black/30 backdrop-blur-md px-3 py-2 rounded-lg border border-primary/30" style={{ top: 'calc(1rem + env(safe-area-inset-top))' }}>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-sans">Current Bid</p>
            <p
              className={`text-lg font-bold text-primary font-sans transition-transform drop-shadow-md ${bidPulse ? "animate-bid-pulse" : ""}`}
            >
              ₩{currentBid.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Background Video */}
        <div className="fixed inset-0 -z-50">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover object-left"
          >
            <source src="/hero-bg.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Main Content - 상품 정보 (항상 보임) */}
        <div className="relative z-20 bg-black/30 mx-4 mb-4 mt-24 sm:mt-28 rounded-lg border border-border/50 overflow-hidden" style={{ marginLeft: 'max(1rem, env(safe-area-inset-left))', marginRight: 'max(1rem, env(safe-area-inset-right))' }}>
          <div className="p-4 pb-3 sm:p-6">
            <h2 className="font-display text-4xl sm:text-5xl text-primary uppercase leading-[0.85] tracking-tight drop-shadow-md">LEGEND</h2>
            <h2 className="font-display text-4xl sm:text-5xl text-primary uppercase leading-[0.85] tracking-tight drop-shadow-md">AUCTION</h2>
          </div>

          <div className="px-4 pb-3 flex items-center gap-4 sm:gap-6">
            <div className="relative w-40 h-32 sm:w-56 sm:h-44 flex-shrink-0">
              <video
                src="/cap-spin.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div className="flex-1 flex justify-end">
              <div className="font-display text-3xl sm:text-5xl font-bold text-primary neon-glow-subtle tracking-tight drop-shadow-md">
                {formatTime(timeRemaining)}
              </div>
            </div>
          </div>

          <div className="px-4 pb-3">
            <p className="text-xs font-semibold text-foreground tracking-wide font-sans drop-shadow-md">PEACEMINUSONE</p>
            <p className="text-xs text-muted-foreground mt-0.5 font-sans">Übermensch 2025 World Tour Special Merch</p>
            <p className="text-xs text-muted-foreground font-sans">Übermensch Cap (Burgundy) customized</p>
          </div>

          <div className="mx-4 border-t border-primary/30" />
        </div>


        {/* Bottom Sheet - 입찰 입력 폼만 */}
        {showAuctionCard && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 z-30"
              onClick={() => setShowAuctionCard(false)}
            />
            {/* Input Form Sheet */}
            <div 
              className="fixed bottom-0 left-0 right-0 z-40 bg-black/30 rounded-t-2xl border-t border-l border-r border-border/50 overflow-hidden animate-slide-up-bottom-sheet"
              style={{ 
                marginLeft: 'max(0, env(safe-area-inset-left))', 
                marginRight: 'max(0, env(safe-area-inset-right))',
                paddingBottom: 'calc(100px + env(safe-area-inset-bottom))'
              }}
            >
              {/* Close Button */}
              <div className="flex justify-end p-4 pb-2">
                <button
                  onClick={() => setShowAuctionCard(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                >
                  <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-4 pt-0">
                <p className="text-sm font-medium text-foreground mb-2 font-sans drop-shadow-md">Your Offer</p>

                <div className="flex items-end gap-2 mb-4">
                  <span className="text-xs text-muted-foreground pb-1 font-sans">KRW</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={offerAmount}
                    onChange={handleOfferChange}
                    onKeyDown={(e) => {
                      // Allow: backspace, delete, tab, escape, enter, and arrow keys
                      if (
                        [8, 9, 27, 13, 46, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
                        // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                        (e.keyCode === 65 && e.ctrlKey === true) ||
                        (e.keyCode === 67 && e.ctrlKey === true) ||
                        (e.keyCode === 86 && e.ctrlKey === true) ||
                        (e.keyCode === 88 && e.ctrlKey === true) ||
                        // Allow: home, end, left, right
                        (e.keyCode >= 35 && e.keyCode <= 40)
                      ) {
                        return
                      }
                      // Ensure that it is a number and stop the keypress if not
                      if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                        e.preventDefault()
                      }
                    }}
                    className="flex-1 bg-transparent border-b border-primary/50 text-right text-2xl sm:text-4xl font-bold text-foreground focus:outline-none focus:border-primary pb-1 font-sans drop-shadow-md"
                  />
                </div>

                <button
                  onClick={handleSetOffer}
                  className="w-full py-4 bg-primary text-primary-foreground font-display font-medium text-lg uppercase tracking-wide transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  SET OFFER
                </button>
              </div>
            </div>
          </>
        )}

        {/* Fixed Footer - Place Bid Button */}
        {!showAuctionCard && (
          <div 
            className="fixed bottom-0 left-0 right-0 z-50 bg-black w-full"
            style={{ 
              height: 'calc(100px + env(safe-area-inset-bottom))',
              paddingLeft: 'max(0, env(safe-area-inset-left))',
              paddingRight: 'max(0, env(safe-area-inset-right))',
              paddingBottom: 'env(safe-area-inset-bottom)'
            }}
          >
            <button
              onClick={() => setShowAuctionCard(true)}
              className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground font-display font-medium text-xl uppercase tracking-wide transition-all hover:brightness-110 active:scale-[0.98]"
            >
              PLACE BID
            </button>
          </div>
        )}

      </div>
    </>
  )
}
