"use client"

import { useState } from "react"
import { ArrowLeft, Check, Coins, Gift, Lock, Sparkles } from "lucide-react"
import type { SeasonProgress } from "@/lib/season"

interface SeasonPassScreenProps {
  progress: SeasonProgress | null
  coins: number
  onBack: () => void
  onClaim: (tier: number) => Promise<void>
}

export function SeasonPassScreen({ progress, coins, onBack, onClaim }: SeasonPassScreenProps) {
  const [pendingTier, setPendingTier] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const nextMilestone = progress?.milestones.find((milestone) => !milestone.unlocked)
  const finalMilestone = progress?.milestones.at(-1)
  const nextTarget = nextMilestone?.targetXp ?? finalMilestone?.targetXp ?? 1
  const barProgress = progress ? Math.min(100, (progress.xp / nextTarget) * 100) : 0

  async function handleClaim(tier: number) {
    setPendingTier(tier)
    setError(null)
    try {
      await onClaim(tier)
    } catch {
      setError("That reward couldn’t be claimed. Please try again.")
    } finally {
      setPendingTier(null)
    }
  }

  return (
    <main className="min-h-[100dvh] bg-[#070b1b] px-5 py-6 text-slate-100">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between">
        <button onClick={onBack} aria-label="Back to home" className="rounded-full bg-white/5 p-3 transition hover:bg-white/10">
          <ArrowLeft size={18} aria-hidden />
        </button>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-200/75">Your balance</p>
          <p className="mt-1 flex items-center justify-end gap-1.5 font-bold tabular-nums"><Coins size={16} className="text-amber-300" aria-hidden />{coins.toLocaleString()}</p>
        </div>
      </header>

      <section className="mx-auto mt-8 w-full max-w-2xl">
        <div className="overflow-hidden rounded-[2rem] border border-cyan-200/15 bg-gradient-to-br from-[#162b4a] via-[#111a35] to-[#17132d] p-6 shadow-2xl shadow-black/25 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.22em] text-cyan-200"><Sparkles size={15} aria-hidden /> Season track</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{progress?.label ?? "Monthly Season"}</h1>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-300/75">Every score adds season XP. Reach each milestone and claim its coin reward before the month ends.</p>
            </div>
            <div className="hidden rounded-2xl border border-cyan-200/15 bg-cyan-200/10 p-3 text-cyan-100 sm:block"><Gift size={24} aria-hidden /></div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Season XP</p>
                <p className="mt-1 text-3xl font-black tabular-nums">{progress ? progress.xp.toLocaleString() : "—"}</p>
              </div>
              <p className="text-right text-xs font-semibold text-cyan-100/70">
                {progress ? nextMilestone ? `${Math.max(0, nextTarget - progress.xp).toLocaleString()} XP to next reward` : "All milestones reached" : "Loading your progress…"}
              </p>
            </div>
            <div
              className="mt-4 h-3 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-label="Progress to next season reward"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(barProgress)}
            >
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-amber-300 transition-[width] duration-500" style={{ width: `${barProgress}%` }} />
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3" aria-label="Season rewards" aria-live="polite">
          {progress ? progress.milestones.map((milestone) => (
            <article key={milestone.tier} className={`rounded-2xl border p-4 sm:p-5 ${milestone.unlocked ? "border-amber-200/25 bg-amber-200/[0.07]" : "border-white/10 bg-white/[0.035]"}`}>
              <div className="flex items-center gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${milestone.claimed ? "bg-emerald-300/15 text-emerald-200" : milestone.unlocked ? "bg-amber-200/15 text-amber-100" : "bg-white/5 text-slate-400"}`}>
                  {milestone.claimed ? <Check size={20} aria-label="Claimed" /> : milestone.unlocked ? <Gift size={20} aria-hidden /> : <Lock size={18} aria-label="Locked" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h2 className="font-extrabold">{milestone.title}</h2>
                    <span className="text-xs font-semibold text-slate-400">Tier {milestone.tier}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-300/65">{milestone.description}</p>
                </div>
                <div className="text-right">
                  <p className="flex items-center justify-end gap-1 text-sm font-extrabold text-amber-200"><Coins size={14} aria-hidden />+{milestone.rewardCoins}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{milestone.targetXp.toLocaleString()} XP</p>
                </div>
              </div>
              {milestone.unlocked && !milestone.claimed && (
                <button
                  type="button"
                  disabled={pendingTier !== null}
                  onClick={() => void handleClaim(milestone.tier)}
                  className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl bg-amber-300 px-4 text-sm font-extrabold text-slate-950 transition hover:bg-amber-200 disabled:cursor-wait disabled:opacity-60"
                >
                  {pendingTier === milestone.tier ? "Claiming…" : `Claim ${milestone.rewardCoins} coins`}
                </button>
              )}
              {milestone.claimed && <p className="mt-3 text-right text-xs font-bold text-emerald-200">Reward claimed</p>}
            </article>
          )) : (
            <p className="rounded-2xl bg-white/[0.04] px-5 py-8 text-center text-sm text-slate-300">Loading your season rewards…</p>
          )}
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</p>}
      </section>
    </main>
  )
}
