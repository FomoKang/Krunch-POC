"use client"

interface SuccessPopupProps {
  show: boolean
  onClose: () => void
  amount: string
}

export function SuccessPopup({ show, onClose, amount }: SuccessPopupProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Popup */}
      <div className="relative bg-card border border-primary/30 rounded-lg p-6 max-w-sm w-full animate-popup-scale">
        {/* Success checkmark */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-primary animate-checkmark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h3 className="text-2xl font-bold text-foreground text-center mb-2 font-sans">Bid Successful!</h3>

        <p className="text-muted-foreground text-center mb-1 font-sans">Your offer has been placed</p>

        <p className="text-3xl font-bold text-primary text-center mb-6 font-sans">₩{Number(amount.replace(/,/g, "")).toLocaleString()}</p>

        <button
          onClick={onClose}
          className="w-full py-3 bg-primary text-primary-foreground font-bold uppercase tracking-widest hover:brightness-110 transition-all font-sans"
        >
          Done
        </button>
      </div>
    </div>
  )
}
