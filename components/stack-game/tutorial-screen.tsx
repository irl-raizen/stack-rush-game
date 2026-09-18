"use client"

import { motion } from "framer-motion"
import { ArrowLeft, Coins, Crosshair, Hand, Sparkles } from "lucide-react"
import { useState } from "react"
import { SKINS, type SkinId } from "@/lib/skins"

const STEPS = [
  { eyebrow: "01 / DROP", title: "Tap when it lines up", body: "A block sweeps across the tower. Tap anywhere to drop it and keep the stack alive.", icon: Hand, accent: "#5eead4" },
  { eyebrow: "02 / PERFECT", title: "Chase the clean hit", body: "Land directly over the block below for a PERFECT. Tight alignment builds your combo and multiplier.", icon: Crosshair, accent: "#fbbf24" },
  { eyebrow: "03 / REWARD", title: "Build your run", body: "Every successful drop earns points and coins. Unlock skins, beat your best, and reach the sky.", icon: Coins, accent: "#67e8f9" },
] as const

export function TutorialScreen({ skinId, onComplete, onBack }: { skinId: SkinId; onComplete: () => void; onBack: () => void }) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const Icon = current.icon
  const skin = SKINS[skinId]
  const isLast = step === STEPS.length - 1

  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-hidden px-6 py-6 text-white" style={{ background: skin.background }}>
      <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 50% 8%, rgba(45,212,191,.32), transparent 34%)" }} />
      <header className="relative z-10 flex items-center justify-between">
        <button onClick={onBack} aria-label="Back" className="flex h-10 items-center gap-2 rounded-full bg-white/10 px-3 text-sm font-medium ring-1 ring-inset ring-white/10"><ArrowLeft size={16} aria-hidden /> Back</button>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/50">How to play</p>
        <div className="w-16" />
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-8">
        <div className="mb-8 flex gap-2" aria-label={`Tutorial step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((item, index) => <div key={item.eyebrow} className={`h-1 flex-1 rounded-full transition-colors ${index <= step ? "bg-teal-300" : "bg-white/15"}`} />)}
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
          <div className="relative mb-10 flex h-64 items-end justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-black/20 p-8 shadow-2xl">
            <div className="absolute inset-x-10 top-8 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.25em] text-white/35"><span>Stack rush</span><Sparkles size={14} aria-hidden /></div>
            <motion.div animate={{ x: [-58, 58, -58] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} className="absolute top-20 h-7 w-32 rounded-md" style={{ background: `linear-gradient(90deg, ${skin.colors[0]}, ${skin.colors[1]})`, boxShadow: `0 10px 28px ${current.accent}55` }} />
            <div className="relative flex flex-col items-center gap-1">
              {[0, 1, 2, 3].map((index) => <div key={index} className="h-7 rounded-md" style={{ width: 150 - index * 18, background: `linear-gradient(90deg, ${skin.colors[(index + 1) % skin.colors.length]}, ${skin.colors[(index + 2) % skin.colors.length]})` }} />)}
              <div className="mt-3 flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold text-slate-950" style={{ backgroundColor: current.accent }}><Icon size={13} aria-hidden /> {isLast ? "KEEP CLIMBING" : current.eyebrow.replace(" / ", " · ")}</div>
            </div>
          </div>

          <p className="font-mono text-xs font-bold tracking-[0.25em]" style={{ color: current.accent }}>{current.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">{current.title}</h1>
          <p className="mt-4 text-base leading-7 text-white/65">{current.body}</p>
        </motion.div>
      </section>

      <footer className="relative z-10 mx-auto flex w-full max-w-sm items-center justify-between gap-4 pb-2">
        <button onClick={isLast ? undefined : onComplete} disabled={isLast} className="text-sm font-semibold text-white/50 transition hover:text-white disabled:pointer-events-none disabled:opacity-0">{isLast ? "" : "Skip tutorial"}</button>
        <button onClick={isLast ? onComplete : () => setStep((value) => value + 1)} className="flex h-14 flex-1 items-center justify-center rounded-2xl bg-teal-300 font-bold text-slate-950 shadow-[0_12px_36px_-10px_rgba(45,212,191,.9)] transition active:scale-[.98]">{isLast ? "Start stacking" : "Continue"}</button>
      </footer>
    </main>
  )
}
