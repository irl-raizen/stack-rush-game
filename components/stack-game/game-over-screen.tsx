"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, Coins, Flame, Home, RotateCcw, Share2, Sparkles, Trophy } from "lucide-react"
import { SKINS, type SkinId } from "@/lib/skins"

interface GameOverScreenProps {
  skinId: SkinId
  score: number
  bestScore: number
  bestCombo: number
  perfects: number
  coinsEarned: number
  isNewBest: boolean
  onRetry: () => void
  onHome: () => void
  onContinueWithAd?: () => void
  multiplayerResult?: { winner: "host" | "guest" | "draw"; hostScore: number; guestScore: number; hostName?: string; guestName?: string }
}

export function GameOverScreen({
  skinId,
  score,
  bestScore,
  bestCombo,
  perfects,
  coinsEarned,
  isNewBest,
  onRetry,
  onHome,
  onContinueWithAd,
  multiplayerResult,
}: GameOverScreenProps) {
  const skin = SKINS[skinId]
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared" | "unavailable">("idle")

  const handleShare = async () => {
    const shareText = `I scored ${score} in Stack Rush: Perfect Tower!\nBest: ${bestScore} · Best combo: x${bestCombo} · Perfect stacks: ${perfects}\nCan you beat me?`
    const shareData = { title: "Stack Rush: Perfect Tower", text: shareText, url: window.location.href }

    try {
      if (typeof navigator.share === "function") {
        await navigator.share(shareData)
        setShareStatus("shared")
        return
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`)
        setShareStatus("copied")
        return
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return

      try {
        await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`)
        setShareStatus("copied")
        return
      } catch {
        setShareStatus("unavailable")
      }
    }

    setShareStatus("unavailable")
  }

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center overflow-y-auto px-5 py-6 text-white"
      style={{
        background: skin.background,
        paddingTop: "max(1.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm rounded-3xl bg-white/5 p-6 backdrop-blur-xl ring-1 ring-inset ring-white/10"
      >
        <div className="flex flex-col items-center">
          {isNewBest ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, -6, 6, 0] }}
              transition={{ delay: 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-2 rounded-full bg-amber-400 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-slate-950"
            >
              <Sparkles size={12} aria-hidden />
              <span>New Best!</span>
            </motion.div>
          ) : (
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">Game Over</p>
          )}

          {multiplayerResult && <div className="mt-4 w-full rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-4 text-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Multiplayer result</p><p className="mt-2 text-2xl font-black">{multiplayerResult.winner === "draw" ? "Draw match" : `${multiplayerResult.winner === "host" ? (multiplayerResult.hostName ?? "Player 1") : (multiplayerResult.guestName ?? "Player 2")} wins`}</p><p className="mt-1 text-sm text-white/70">{multiplayerResult.hostScore} — {multiplayerResult.guestScore}</p></div>}

          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 160 }}
            className="mt-4 flex flex-col items-center"
          >
            <p className="text-xs font-medium uppercase tracking-widest text-white/40">Score</p>
            <p className="mt-1 text-7xl font-bold tabular-nums">{score}</p>
          </motion.div>

          {/* Run recap */}
          <div className="mt-6 grid w-full grid-cols-4 gap-1.5">
            <div className="flex flex-col items-center rounded-2xl bg-white/5 px-1.5 py-3 ring-1 ring-inset ring-white/10">
              <div className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wide text-white/55">
                <Trophy size={11} className="shrink-0 text-amber-300" aria-hidden />
                <span>Best</span>
              </div>
              <p className="mt-1 text-lg font-bold tabular-nums">{bestScore}</p>
            </div>
            <div className="flex flex-col items-center rounded-2xl bg-white/5 px-1.5 py-3 ring-1 ring-inset ring-white/10">
              <div className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wide text-white/55">
                <Flame size={11} className="shrink-0 text-orange-300" aria-hidden />
                <span>Combo</span>
              </div>
              <p className="mt-1 text-lg font-bold tabular-nums">x{bestCombo}</p>
            </div>
            <div className="flex flex-col items-center rounded-2xl bg-white/5 px-1.5 py-3 ring-1 ring-inset ring-white/10">
              <div className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wide text-white/55">
                <Sparkles size={11} className="shrink-0 text-cyan-300" aria-hidden />
                <span>Perfect</span>
              </div>
              <p className="mt-1 text-lg font-bold tabular-nums">{perfects}</p>
            </div>
            <div className="flex flex-col items-center rounded-2xl bg-white/5 px-1.5 py-3 ring-1 ring-inset ring-white/10">
              <div className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wide text-white/55">
                <Coins size={11} className="shrink-0 text-amber-300" aria-hidden />
                <span>Coins</span>
              </div>
              <p className="mt-1 text-lg font-bold tabular-nums">+{coinsEarned}</p>
            </div>
          </div>

          {/* Rewarded-ad placeholder: offered once as "Continue" */}
          {onContinueWithAd && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={onContinueWithAd}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-amber-300/50 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-200 transition-colors hover:bg-amber-400/20"
            >
              <Sparkles size={14} aria-hidden />
              <span>Watch ad to continue</span>
            </motion.button>
          )}

          {/* Primary actions */}
          <div className="mt-5 flex w-full flex-col gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onRetry}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0878f9] to-[#1769ee] font-bold text-white shadow-[0_6px_0_#0758c9] shadow-[0_10px_30px_-8px_rgba(20,184,166,0.6)]"
            >
              <RotateCcw size={18} aria-hidden />
              <span>Retry</span>
            </motion.button>

            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onHome}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#d9d6ff] font-bold text-[#071957] ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/15"
              >
                <Home size={16} aria-hidden />
                <span>Home</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleShare}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#d9d6ff] font-bold text-[#071957] ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/15"
              >
                {shareStatus === "copied" || shareStatus === "shared" ? <Check size={16} aria-hidden /> : <Share2 size={16} aria-hidden />}
                <span>{shareStatus === "copied" ? "Copied!" : shareStatus === "shared" ? "Shared!" : "Share"}</span>
              </motion.button>
            </div>
            <p className="min-h-5 text-center text-xs text-white/60" role="status" aria-live="polite">
              {shareStatus === "copied" ? "Run summary copied to clipboard." : shareStatus === "shared" ? "Run summary shared." : shareStatus === "unavailable" ? "Sharing isn’t available in this browser." : ""}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
