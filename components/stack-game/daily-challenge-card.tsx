"use client"

import { motion } from "framer-motion"
import { CalendarDays, Check, Coins, Target } from "lucide-react"
import type { GameStorage } from "@/hooks/use-game-storage"
import { DAILY_CHALLENGE_REWARD, DAILY_CHALLENGE_TARGET, dailyChallengeDescription, dailyChallengeKey, dailyChallengeLabel, dailyChallengeProgress, dailyChallengeStatus, isDailyChallengeComplete } from "@/lib/daily-challenge"

export function DailyChallengeCard({ storage, onPlay, onClaim }: { storage: GameStorage; onPlay: () => void; onClaim: () => void }) {
  const today = dailyChallengeKey()
  const score = storage.dailyChallengeKey === today ? storage.dailyChallengeScore : 0
  const complete = isDailyChallengeComplete(score)
  const claimed = storage.dailyChallengeClaimedKey === today
  const progress = (dailyChallengeProgress(score) / DAILY_CHALLENGE_TARGET) * 100
  return <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 ring-1 ring-inset ring-white/10">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300/15 text-cyan-200"><CalendarDays size={19} aria-hidden /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-100/70">Daily Challenge</p><h2 className="mt-1 font-bold text-white">{dailyChallengeLabel()}</h2><p className="mt-1 text-xs text-white/60">{dailyChallengeDescription()}</p></div></div>
      <div className="flex items-center gap-1 rounded-full bg-amber-300 px-2 py-1 text-xs font-bold text-slate-950"><Coins size={12} aria-hidden />+{DAILY_CHALLENGE_REWARD}</div>
    </div>
    <div className="mt-4"><div className="mb-1 flex justify-between text-xs font-semibold text-white/70"><span>{score} / {DAILY_CHALLENGE_TARGET}</span><span>{dailyChallengeStatus(score, storage.dailyChallengeClaimedKey)}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-teal-300 transition-[width]" style={{ width: `${progress}%` }} /></div></div>
    {!claimed && <button onClick={complete ? onClaim : onPlay} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 font-bold text-slate-950 transition hover:bg-cyan-200">{complete ? <><Check size={16} aria-hidden />Claim reward</> : <><Target size={16} aria-hidden />Play challenge</>}</button>}
    {claimed && <p className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-emerald-200"><Check size={16} aria-hidden />Challenge complete</p>}
  </motion.section>
}
