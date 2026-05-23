"use client"

import { motion } from "framer-motion"
import { ArrowLeft, Crown, Trophy } from "lucide-react"

interface LeaderboardScreenProps {
  userBest: number
  onBack: () => void
}

// Placeholder leaderboard entries — real backend would populate this.
const SEED = [
  { name: "SkyBreaker", score: 412 },
  { name: "NeonDrop", score: 356 },
  { name: "Blockstar", score: 298 },
  { name: "Rushify", score: 245 },
  { name: "TowerQueen", score: 201 },
  { name: "Pixel", score: 178 },
  { name: "Stackzilla", score: 142 },
  { name: "Glow", score: 98 },
]

export function LeaderboardScreen({ userBest, onBack }: LeaderboardScreenProps) {
  const entries = [...SEED, { name: "You", score: userBest }]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)

  return (
    <div className="relative h-[100dvh] overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-slate-950/80 px-5 py-4 backdrop-blur-md">
        <button
          onClick={onBack}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/15"
        >
          <ArrowLeft size={18} aria-hidden />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Leaderboard</h1>
        <div className="h-10 w-10" />
      </header>

      <main className="px-5 pb-10 pt-2">
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-amber-400/10 p-4 ring-1 ring-inset ring-amber-300/20">
          <Trophy size={18} className="text-amber-300" aria-hidden />
          <p className="text-sm text-amber-100/80">
            <span className="font-semibold text-amber-200">Local preview.</span> Connect a backend to show live
            global ranks.
          </p>
        </div>

        <ol className="flex flex-col gap-2">
          {entries.map((e, i) => {
            const rank = i + 1
            const isYou = e.name === "You"
            return (
              <motion.li
                key={`${e.name}-${i}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`flex items-center gap-4 rounded-2xl px-4 py-3 ring-1 ring-inset ${
                  isYou
                    ? "bg-teal-400/10 ring-teal-400/40"
                    : "bg-white/5 ring-white/10"
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold tabular-nums ${
                    rank === 1
                      ? "bg-amber-400 text-slate-950"
                      : rank === 2
                        ? "bg-slate-300 text-slate-950"
                        : rank === 3
                          ? "bg-amber-700 text-white"
                          : "bg-white/10 text-white/70"
                  }`}
                >
                  {rank === 1 ? <Crown size={14} aria-hidden /> : rank}
                </div>
                <p className={`flex-1 font-semibold ${isYou ? "text-teal-200" : ""}`}>{e.name}</p>
                <p className="text-lg font-bold tabular-nums">{e.score}</p>
              </motion.li>
            )
          })}
        </ol>
      </main>
    </div>
  )
}
