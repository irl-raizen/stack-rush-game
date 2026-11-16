"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Crown, RefreshCw, Trophy } from "lucide-react"
import { getLeaderboard } from "@/app/actions/game"

interface LeaderboardScreenProps {
  onBack: () => void
}

type Period = "weekly" | "all-time"
type Entry = { id: string; userId: string; name: string; score: number; combo: number; rank: number }
type LeaderboardData = { entries: Entry[]; personal: Entry | null }

const regions = [
  { code: "US", name: "United States" },
  { code: "IN", name: "India" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "JP", name: "Japan" },
  { code: "BR", name: "Brazil" },
]

export function LeaderboardScreen({ onBack }: LeaderboardScreenProps) {
  const [region, setRegion] = useState("US")
  const [period, setPeriod] = useState<Period>("weekly")
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      setData(await getLeaderboard(region, period))
    } catch {
      setError("Couldn’t load the leaderboard. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function changePeriod(nextPeriod: Period) {
    setPeriod(nextPeriod)
    setData(null)
    setError(null)
  }

  return (
    <div className="relative h-[100dvh] overflow-y-auto bg-[#070b1b] text-slate-100">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0b1024]/95 px-5 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <button onClick={onBack} aria-label="Back to home" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition hover:bg-white/10">
            <ArrowLeft size={18} aria-hidden />
          </button>
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-200">Stack Rush</p>
            <h1 className="text-lg font-black">Leaderboards</h1>
          </div>
          <Trophy size={19} className="text-amber-300" aria-hidden />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 pb-10 pt-6">
        <div className="mb-5 rounded-3xl border border-white/10 bg-gradient-to-br from-[#172447] to-[#10172d] p-5 shadow-xl shadow-black/20">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">Climb the rankings</h2>
              <p className="mt-1 text-sm text-slate-300/70">
                {period === "weekly" ? "Weekly scores reset every Monday at 00:00 UTC." : "Your highest score from every run."}
              </p>
            </div>
            <div className="rounded-2xl bg-amber-300/10 p-3 text-amber-200 ring-1 ring-inset ring-amber-200/20">
              <Crown size={20} aria-hidden />
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-black/20 p-1.5" aria-label="Leaderboard period">
            {(["weekly", "all-time"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={period === option}
                disabled={loading}
                onClick={() => changePeriod(option)}
                className={`rounded-xl px-3 py-2.5 text-sm font-bold transition ${period === option ? "bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/20" : "text-slate-300 hover:bg-white/5"}`}
              >
                {option === "weekly" ? "This week" : "All-time"}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <label className="sr-only" htmlFor="leaderboard-region">Choose a region</label>
            <select
              id="leaderboard-region"
              disabled={loading}
              value={region}
              onChange={(event) => { setRegion(event.target.value); setData(null); setError(null) }}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              {regions.map(({ code, name }) => <option key={code} value={code}>{name}</option>)}
            </select>
            <button
              onClick={refresh}
              disabled={loading}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-extrabold text-slate-950 transition hover:bg-amber-200 disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} aria-hidden />
              {loading ? "Loading" : data ? "Refresh" : "Load"}
            </button>
          </div>
        </div>

        {data?.personal && (
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-cyan-200/25 bg-cyan-300/10 px-5 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/70">Your {period === "weekly" ? "weekly" : "all-time"} rank</p>
              <p className="mt-1 text-sm font-semibold text-white">{data.personal.score.toLocaleString()} points</p>
            </div>
            <p className="text-3xl font-black tabular-nums text-cyan-200">#{data.personal.rank}</p>
          </div>
        )}

        <section aria-label="Rankings" aria-live="polite">
          {error ? (
            <p role="alert" className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-5 py-8 text-center text-sm text-rose-100">{error}</p>
          ) : loading ? (
            <p className="rounded-2xl bg-white/[0.04] px-5 py-8 text-center text-sm text-slate-300">Loading rankings…</p>
          ) : !data ? (
            <p className="rounded-2xl bg-white/[0.04] px-5 py-8 text-center text-sm text-slate-300">Load the rankings to see where you stand.</p>
          ) : data.entries.length === 0 ? (
            <p className="rounded-2xl bg-white/[0.04] px-5 py-8 text-center text-sm text-slate-300">No scores yet {period === "weekly" ? "this week" : "for this region"}. Play a run to claim the top spot.</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {data.entries.map((entry, index) => {
                const isYou = entry.id === data.personal?.id
                return (
                  <motion.li
                    key={entry.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.035 }}
                    className={`flex items-center gap-4 rounded-2xl px-4 py-3.5 ring-1 ring-inset ${isYou ? "bg-cyan-300/10 ring-cyan-200/30" : "bg-white/[0.04] ring-white/10"}`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${entry.rank === 1 ? "bg-amber-300 text-slate-950" : entry.rank === 2 ? "bg-slate-200 text-slate-900" : entry.rank === 3 ? "bg-orange-300 text-slate-950" : "bg-white/10 text-white/70"}`}>
                      {entry.rank === 1 ? <Crown size={16} aria-label="First place" /> : entry.rank}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{entry.name}{isYou && <span className="ml-2 rounded-full bg-cyan-200/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-cyan-100">You</span>}</p>
                      <p className="mt-0.5 text-xs text-slate-400">Best combo x{entry.combo}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black tabular-nums">{entry.score.toLocaleString()}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">points</p>
                    </div>
                  </motion.li>
                )
              })}
            </ol>
          )}
        </section>
      </main>
    </div>
  )
}
