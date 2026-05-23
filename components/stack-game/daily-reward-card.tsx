"use client"

import { motion } from "framer-motion"
import { Coins, Gift, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import {
  dailyCooldownMs,
  dailyRewardFor,
  WELCOME_REWARD,
  type GameStorage,
} from "@/hooks/use-game-storage"

interface DailyRewardCardProps {
  storage: GameStorage
  onClaimDaily: () => number
  onClaimWelcome: () => number
}

function formatCooldown(ms: number): string {
  const h = Math.floor(ms / (60 * 60 * 1000))
  const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000))
  return `${h}h ${m.toString().padStart(2, "0")}m`
}

export function DailyRewardCard({
  storage,
  onClaimDaily,
  onClaimWelcome,
}: DailyRewardCardProps) {
  const [cooldown, setCooldown] = useState(dailyCooldownMs(storage.lastDailyClaim))
  const [justClaimed, setJustClaimed] = useState<number | null>(null)

  useEffect(() => {
    setCooldown(dailyCooldownMs(storage.lastDailyClaim))
    const id = setInterval(
      () => setCooldown(dailyCooldownMs(storage.lastDailyClaim)),
      30 * 1000,
    )
    return () => clearInterval(id)
  }, [storage.lastDailyClaim])

  // Welcome gift — shown once on first launch.
  if (!storage.welcomeClaimed) {
    return (
      <motion.button
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.25, type: "spring", stiffness: 220, damping: 20 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          const granted = onClaimWelcome()
          if (granted) setJustClaimed(granted)
        }}
        className="relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-left text-slate-950 shadow-[0_12px_40px_-10px_rgba(245,158,11,0.7)]"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.4 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950/20"
          >
            <Gift size={20} aria-hidden />
          </motion.div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-900/70">
              Welcome Gift
            </p>
            <p className="text-sm font-bold">Tap to claim {WELCOME_REWARD} coins</p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-slate-950/20 px-2.5 py-1 text-sm font-bold tabular-nums">
          <Coins size={14} aria-hidden />+{WELCOME_REWARD}
        </div>
      </motion.button>
    )
  }

  const available = cooldown <= 0
  const nextReward = dailyRewardFor(
    available ? (storage.dailyStreak || 0) + 1 : storage.dailyStreak || 1,
  )

  // Just-claimed celebration state (replaces card briefly).
  if (justClaimed !== null) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        onAnimationComplete={() => {
          // Auto-revert after 1.4s.
          setTimeout(() => setJustClaimed(null), 1400)
        }}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500/20 px-4 py-3 ring-1 ring-inset ring-emerald-400/40"
      >
        <Sparkles size={16} className="text-emerald-300" aria-hidden />
        <span className="text-sm font-bold text-emerald-100">
          +{justClaimed} coins claimed!
        </span>
      </motion.div>
    )
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.4 }}
      whileTap={available ? { scale: 0.97 } : undefined}
      disabled={!available}
      onClick={() => {
        if (!available) return
        const granted = onClaimDaily()
        if (granted) setJustClaimed(granted)
      }}
      className={`relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-2xl px-4 py-3 text-left transition-all ring-1 ring-inset ${
        available
          ? "bg-gradient-to-r from-teal-500/30 to-cyan-500/30 ring-teal-300/40 shadow-[0_10px_30px_-10px_rgba(20,184,166,0.6)] hover:from-teal-500/40 hover:to-cyan-500/40"
          : "bg-white/5 ring-white/10 opacity-80"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            available ? "bg-teal-400/20" : "bg-white/5"
          }`}
        >
          <Gift size={20} className={available ? "text-teal-200" : "text-white/40"} aria-hidden />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
            Daily Reward
          </p>
          <p className="text-sm font-semibold text-white">
            {available ? "Claim today's bonus" : `Back in ${formatCooldown(cooldown)}`}
          </p>
        </div>
      </div>
      <div
        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold tabular-nums ${
          available ? "bg-amber-400 text-slate-950" : "bg-white/10 text-white/60"
        }`}
      >
        <Coins size={14} aria-hidden />+{nextReward}
      </div>
    </motion.button>
  )
}
