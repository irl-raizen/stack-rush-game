"use client"

import { motion } from "framer-motion"
import { X } from "lucide-react"
import { useEffect, useState } from "react"

interface InterstitialAdProps {
  onClose: () => void
  /** Seconds until the close button appears. Defaults to 3. */
  countdown?: number
}

/**
 * Placeholder interstitial ad modal. In production this would be replaced by a
 * real ad SDK. Exposes the same UX contract so the rest of the app doesn't change.
 */
export function InterstitialAd({ onClose, countdown = 3 }: InterstitialAdProps) {
  const [remaining, setRemaining] = useState(countdown)

  useEffect(() => {
    if (remaining <= 0) return
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 p-6 text-white backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 16, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        className="relative flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl bg-gradient-to-b from-slate-800 to-slate-900 p-6 ring-1 ring-inset ring-white/10"
      >
        <div className="absolute right-4 top-4">
          {remaining > 0 ? (
            <div
              aria-live="polite"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold tabular-nums"
            >
              {remaining}
            </div>
          ) : (
            <button
              onClick={onClose}
              aria-label="Close ad"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            >
              <X size={14} aria-hidden />
            </button>
          )}
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">Sponsored</p>
        <div className="flex h-40 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 ring-1 ring-inset ring-white/5">
          <p className="text-sm font-medium text-white/60">Ad placeholder</p>
        </div>
        <p className="text-center text-sm text-white/70">
          Enjoying Stack Rush? Ads help keep the game free.
        </p>
      </motion.div>
    </motion.div>
  )
}
