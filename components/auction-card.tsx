"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
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

export function AuctionCard() {
  const [offerAmount, setOfferAmount] = useState(formatNumber("1"))
  const [currentBid, setCurrentBid] = useState(2450000)
  const [bidPulse, setBidPulse] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(24 * 60 * 60) // 24 hours in seconds

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

      <div className="flex flex-col min-h-screen bg-background pb-[120px]">
        <div className="relative flex-1">
          <div className="absolute inset-0">
            <Image
              src="/images/image.png"
              alt="PEACEMINUSONE Artist"
              fill
              className="object-cover object-top grayscale-hero"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/90" />
          </div>

          <div className="absolute top-4 left-4 z-10">
            <h1 className="font-serif italic text-2xl font-bold text-primary tracking-tight">Krunch</h1>
          </div>

          <div className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-primary/30">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-sans">Current Bid</p>
            <p
              className={`text-lg font-bold text-primary font-sans transition-transform ${bidPulse ? "animate-bid-pulse" : ""}`}
            >
              ₩{currentBid.toLocaleString()}
            </p>
          </div>

          <svg className="absolute bottom-32 left-4 w-28 h-36 z-10" viewBox="0 0 100 130" fill="none">
            <ellipse
              cx="35"
              cy="30"
              rx="8"
              ry="4"
              stroke="#ffffff"
              strokeWidth="1.2"
              fill="none"
              transform="rotate(-30 35 30)"
            />
            <ellipse
              cx="35"
              cy="30"
              rx="8"
              ry="4"
              stroke="#ffffff"
              strokeWidth="1.2"
              fill="none"
              transform="rotate(30 35 30)"
            />
            <ellipse
              cx="35"
              cy="30"
              rx="8"
              ry="4"
              stroke="#ffffff"
              strokeWidth="1.2"
              fill="none"
              transform="rotate(90 35 30)"
            />
            <circle cx="35" cy="30" r="3" stroke="#ffffff" strokeWidth="1.2" fill="none" />
            <path
              d="M35 38 Q30 55, 25 70"
              stroke="#ffffff"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
              className="signature-path"
            />
            <path
              d="M15 85 Q35 70, 55 80 Q75 90, 60 100 Q45 110, 30 105"
              stroke="#ffffff"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
              className="signature-path"
              style={{ animationDelay: "0.3s" }}
            />
            <path
              d="M20 115 Q50 108, 70 115"
              stroke="#ffffff"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
              className="signature-path"
              style={{ animationDelay: "0.6s" }}
            />
          </svg>
        </div>

        <div className="relative z-20 bg-card mx-4 mb-8 rounded-lg border border-border/50 overflow-hidden">
          <div className="p-4 pb-3">
            <h2 className="font-display text-5xl text-primary uppercase leading-[0.85] tracking-tight">GIVE</h2>
            <h2 className="font-display text-5xl text-primary uppercase leading-[0.85] tracking-tight">AWAY</h2>
          </div>

          <div className="px-4 pb-3 flex items-center gap-6">
            <div className="relative w-32 h-24 flex-shrink-0">
              <Image src="/images/ubermensch-cap.jpg" alt="Übermensch Cap" fill className="object-contain" />
            </div>
            <div className="flex-1 flex justify-end">
              <div className="font-display text-5xl font-bold text-primary neon-glow-subtle tracking-tight">
                {formatTime(timeRemaining)}
              </div>
            </div>
          </div>

          <div className="px-4 pb-3">
            <p className="text-xs font-semibold text-foreground tracking-wide font-sans">PEACEMINUSONE</p>
            <p className="text-xs text-muted-foreground mt-0.5 font-sans">Übermensch 2025 World Tour Special Merch</p>
            <p className="text-xs text-muted-foreground font-sans">Übermensch Cap (Burgundy) customized</p>
          </div>

          <div className="mx-4 border-t border-primary/30" />

          <div className="p-4 pt-3">
            <p className="text-sm font-medium text-foreground mb-2 font-sans">Your Offer</p>

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
                className="flex-1 bg-transparent border-b border-primary/50 text-right text-4xl font-bold text-foreground focus:outline-none focus:border-primary pb-1 font-sans"
              />
            </div>

            <button
              onClick={handleSetOffer}
              className="w-full py-4 bg-primary text-primary-foreground font-bold text-lg uppercase tracking-widest transition-all hover:brightness-110 active:scale-[0.98] font-sans"
            >
              SET OFFER
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
