"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Crown, RefreshCw, Trophy } from "lucide-react"
import { getRegionalLeaderboard } from "@/app/actions/game"

interface LeaderboardScreenProps { userBest: number; onBack: () => void }
type Entry = { id: string; name: string; score: number; combo: number }

export function LeaderboardScreen({ userBest, onBack }: LeaderboardScreenProps) {
  const [region, setRegion] = useState("US")
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  async function refresh() {
    setLoading(true)
    try { setEntries(await getRegionalLeaderboard(region)); setLoaded(true) } finally { setLoading(false) }
  }
  const shown = entries.length ? entries : [{ id: "you", name: "Your current best", score: userBest, combo: 0 }]
  return <div className="relative h-[100dvh] overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
    <header className="sticky top-0 z-10 flex items-center justify-between bg-slate-950/90 px-5 py-4 backdrop-blur-md"><button onClick={onBack} aria-label="Back" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"><ArrowLeft size={18} /></button><h1 className="text-lg font-bold">Regional rankings</h1><div className="h-10 w-10" /></header>
    <main className="px-5 pb-10 pt-4"><div className="mb-5 rounded-2xl bg-amber-400/10 p-4 ring-1 ring-inset ring-amber-300/20"><div className="flex items-center gap-2"><Trophy size={18} className="text-amber-300" /><p className="text-sm text-amber-100/80">Real players, ranked by their best score.</p></div><div className="mt-4 flex gap-2"><select value={region} onChange={event => { setRegion(event.target.value); setLoaded(false) }} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"><option value="US">United States</option><option value="IN">India</option><option value="GB">United Kingdom</option><option value="CA">Canada</option><option value="AU">Australia</option><option value="DE">Germany</option><option value="JP">Japan</option><option value="BR">Brazil</option></select><button onClick={refresh} disabled={loading} className="flex items-center gap-2 rounded-xl bg-amber-300 px-3 py-2 text-sm font-bold text-slate-950 disabled:opacity-60"><RefreshCw size={15} className={loading ? "animate-spin" : ""} />{loaded ? "Refresh" : "Load"}</button></div></div>
      <ol className="flex flex-col gap-2">{shown.map((entry, index) => { const rank = index + 1; return <motion.li key={entry.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }} className="flex items-center gap-4 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-inset ring-white/10"><div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${rank === 1 ? "bg-amber-400 text-slate-950" : "bg-white/10 text-white/70"}`}>{rank === 1 ? <Crown size={14} /> : rank}</div><p className="flex-1 font-semibold">{entry.name}</p><div className="text-right"><p className="text-lg font-bold tabular-nums">{entry.score}</p><p className="text-[10px] uppercase tracking-wider text-white/40">best score</p></div></motion.li> })}</ol>
    </main>
  </div>
}
