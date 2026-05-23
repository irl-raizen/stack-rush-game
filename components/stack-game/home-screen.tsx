"use client"

import { motion } from "framer-motion"
import { Play, Palette, Trophy, Coins, Flame } from "lucide-react"
import { SKINS } from "@/lib/skins"
import type { GameStorage } from "@/hooks/use-game-storage"
import { DailyRewardCard } from "./daily-reward-card"

interface HomeScreenProps {
  storage: GameStorage
  onPlay: () => void
  onSkins: () => void
  onLeaderboard: () => void
  onClaimDaily: () => number
  onClaimWelcome: () => number
}

export function HomeScreen({
  storage,
  onPlay,
  onSkins,
  onLeaderboard,
  onClaimDaily,
  onClaimWelcome,
}: HomeScreenProps) {
  const skin = SKINS[storage.selectedSkin]

  return (
    <div
      className="relative flex h-[100dvh] flex-col overflow-y-auto overflow-x-hidden text-white"
      style={{ background: skin.background }}
    >
      {/* Decorative floating blocks */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[
          { top: "12%", left: "8%", size: 36, delay: 0 },
          { top: "22%", right: "14%", size: 24, delay: 0.4 },
          { top: "64%", left: "18%", size: 20, delay: 0.8 },
          { top: "72%", right: "10%", size: 30, delay: 1.2 },
        ].map((b, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 0.25, y: 0 }}
            transition={{ delay: b.delay, duration: 0.8 }}
            className="absolute rounded-md"
            style={{
              top: b.top,
              left: b.left,
              right: b.right,
              width: b.size,
              height: b.size * 0.35,
              background: `linear-gradient(180deg, ${skin.preview[0]}, ${skin.preview[1]})`,
              boxShadow: `0 10px 30px ${skin.preview[0]}40`,
            }}
          />
        ))}
      </div>

      {/* Top bar: coins + best + best combo */}
      <header className="relative z-10 flex items-center justify-between gap-2 px-5 pt-6">
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm ring-1 ring-inset ring-white/10">
          <Coins size={16} className="text-amber-300" aria-hidden />
          <span className="text-sm font-semibold tabular-nums">{storage.coins}</span>
        </div>
        <div className="flex items-center gap-2">
          {storage.bestCombo > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm ring-1 ring-inset ring-white/10">
              <Flame size={14} className="text-orange-300" aria-hidden />
              <span className="text-xs font-semibold tabular-nums">x{storage.bestCombo}</span>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm ring-1 ring-inset ring-white/10">
            <Trophy size={16} className="text-amber-300" aria-hidden />
            <span className="text-sm font-semibold tabular-nums">{storage.bestScore}</span>
          </div>
        </div>
      </header>

      {/* Title + tower */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <div className="relative mb-6 h-32 w-40">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 * i, type: "spring", stiffness: 160, damping: 14 }}
                className="absolute left-1/2 h-5 -translate-x-1/2 rounded-md"
                style={{
                  bottom: `${i * 22}px`,
                  width: `${140 - i * 16}px`,
                  background: `linear-gradient(180deg, ${skin.colors[i % skin.colors.length]}, ${
                    skin.colors[(i + 1) % skin.colors.length]
                  })`,
                  boxShadow: `0 8px 24px ${skin.colors[i % skin.colors.length]}30`,
                }}
              />
            ))}
          </div>

          <h1 className="text-center text-4xl font-bold tracking-tight text-balance">Stack Rush</h1>
          <p className="mt-2 text-center text-sm font-medium text-white/60">
            Tap to drop. Perfect the stack. Reach the sky.
          </p>
        </motion.div>

        {/* Daily / welcome reward card */}
        <div className="w-full max-w-xs">
          <DailyRewardCard
            storage={storage}
            onClaimDaily={onClaimDaily}
            onClaimWelcome={onClaimWelcome}
          />
        </div>

        {/* Play button */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          whileTap={{ scale: 0.96 }}
          onClick={onPlay}
          className="group relative flex h-16 w-full max-w-xs items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-teal-400 to-cyan-400 font-bold text-slate-950 shadow-[0_10px_40px_-8px_rgba(20,184,166,0.6)] transition-shadow hover:shadow-[0_10px_50px_-8px_rgba(20,184,166,0.9)]"
        >
          <Play size={22} fill="currentColor" aria-hidden />
          <span className="text-lg tracking-wide">PLAY</span>
          <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-700 group-hover:translate-x-full" />
        </motion.button>

        {/* Secondary actions */}
        <div className="grid w-full max-w-xs grid-cols-2 gap-3">
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            whileTap={{ scale: 0.97 }}
            onClick={onSkins}
            className="flex h-14 items-center justify-center gap-2 rounded-xl bg-white/10 font-semibold text-white backdrop-blur-sm ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/15"
          >
            <Palette size={18} aria-hidden />
            <span>Skins</span>
          </motion.button>
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            whileTap={{ scale: 0.97 }}
            onClick={onLeaderboard}
            className="flex h-14 items-center justify-center gap-2 rounded-xl bg-white/10 font-semibold text-white backdrop-blur-sm ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/15"
          >
            <Trophy size={18} aria-hidden />
            <span>Ranks</span>
          </motion.button>
        </div>
      </main>

      <footer className="relative z-10 pb-6 text-center text-xs font-medium uppercase tracking-[0.2em] text-white/30">
        v1.0 · Stack Rush
      </footer>
    </div>
  )
}
