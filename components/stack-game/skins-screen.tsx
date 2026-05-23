"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Check, Coins, Flame, Lock, Trophy } from "lucide-react"
import { useState } from "react"
import { meetsSkillLock, SKINS, SKIN_IDS, type SkinId } from "@/lib/skins"
import type { GameStorage } from "@/hooks/use-game-storage"
import { sfx } from "@/lib/sfx"

interface SkinsScreenProps {
  storage: GameStorage
  onBack: () => void
  onSelect: (skin: SkinId) => void
  onUnlock: (skin: SkinId, cost: number) => boolean
}

/**
 * Skins screen
 * - Background is driven by the currently selected skin so equipping feels
 *   immediate (no need to back out to see it apply).
 * - Selecting an already-unlocked skin equips it; a small toast confirms it.
 * - Tapping a locked skin attempts to unlock; if the player cannot afford it,
 *   the card shakes and a toast explains why.
 */
export function SkinsScreen({ storage, onBack, onSelect, onUnlock }: SkinsScreenProps) {
  const stats = { bestScore: storage.bestScore, bestCombo: storage.bestCombo }
  const activeSkin = SKINS[storage.selectedSkin]

  const [toast, setToast] = useState<{ id: number; text: string; tone: "ok" | "warn" } | null>(
    null,
  )
  const [shakeId, setShakeId] = useState<SkinId | null>(null)

  const flash = (text: string, tone: "ok" | "warn" = "ok") => {
    setToast({ id: Date.now(), text, tone })
    // auto-dismiss is handled by AnimatePresence exit
    setTimeout(() => setToast(null), 1500)
  }

  return (
    <motion.div
      key={storage.selectedSkin}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative h-[100dvh] overflow-y-auto text-white transition-[background] duration-500"
      style={{ background: activeSkin.background }}
    >
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 backdrop-blur-md"
        style={{ background: "rgba(2, 6, 23, 0.6)" }}
      >
        <button
          onClick={() => {
            sfx.ui()
            onBack()
          }}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/15"
        >
          <ArrowLeft size={18} aria-hidden />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Skins</h1>
        <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-inset ring-white/10">
          <Coins size={14} className="text-amber-300" aria-hidden />
          <span className="text-sm font-semibold tabular-nums">{storage.coins}</span>
        </div>
      </header>

      <main className="grid grid-cols-2 gap-4 p-5">
        {SKIN_IDS.map((id, i) => {
          const skin = SKINS[id]
          const unlocked = storage.unlockedSkins.includes(id)
          const selected = storage.selectedSkin === id
          const canAfford = storage.coins >= skin.cost
          const skillMet = meetsSkillLock(skin.skillLock, stats)
          const isSkillGated = !!skin.skillLock
          const shaking = shakeId === id

          const handleTap = () => {
            sfx.ui()
            if (unlocked) {
              if (selected) {
                flash(`${skin.name} already equipped`)
                return
              }
              onSelect(id)
              flash(`${skin.name} equipped`)
              return
            }
            if (isSkillGated) {
              flash(`Locked — hit the skill goal to unlock ${skin.name}`, "warn")
              return
            }
            if (!canAfford) {
              setShakeId(id)
              setTimeout(() => setShakeId(null), 400)
              flash(`Need ${skin.cost - storage.coins} more coins`, "warn")
              return
            }
            const ok = onUnlock(id, skin.cost)
            if (ok) flash(`${skin.name} unlocked & equipped`)
          }

          return (
            <motion.button
              key={id}
              initial={{ opacity: 0, y: 12 }}
              animate={
                shaking
                  ? { opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }
                  : { opacity: 1, y: 0, x: 0 }
              }
              transition={
                shaking
                  ? { x: { duration: 0.4 } }
                  : { delay: i * 0.04, duration: 0.3 }
              }
              whileTap={{ scale: 0.97 }}
              onClick={handleTap}
              className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white/5 p-4 text-left ring-1 ring-inset transition-all ${
                selected
                  ? "bg-white/10 ring-2 ring-teal-300 shadow-[0_0_0_1px_rgba(94,234,212,0.35)]"
                  : "ring-white/10 hover:ring-white/20"
              }`}
            >
              {/* Preview: mini stacked blocks */}
              <div className="relative mb-4 flex h-24 items-end justify-center rounded-xl bg-slate-950/50 p-3">
                {[0, 1, 2, 3].map((j) => (
                  <div
                    key={j}
                    className="absolute left-1/2 h-3 -translate-x-1/2 rounded-sm"
                    style={{
                      bottom: `${12 + j * 12}px`,
                      width: `${70 - j * 10}px`,
                      background: `linear-gradient(180deg, ${skin.colors[j % skin.colors.length]}, ${
                        skin.colors[(j + 1) % skin.colors.length]
                      })`,
                    }}
                  />
                ))}
                {isSkillGated && !unlocked && (
                  <div className="absolute right-2 top-2 rounded-full bg-amber-400/90 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-950">
                    Rare
                  </div>
                )}
                {selected && (
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-teal-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-950">
                    <Check size={10} strokeWidth={3} aria-hidden />
                    <span>Equipped</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{skin.name}</h3>
              </div>

              <div className="mt-1">
                {unlocked ? (
                  <p className="text-xs font-medium text-white/60">
                    {selected ? "Currently equipped" : "Tap to equip"}
                  </p>
                ) : isSkillGated ? (
                  <div className="flex flex-col gap-0.5">
                    {skin.skillLock?.bestScore !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <Trophy
                          size={11}
                          className={
                            stats.bestScore >= skin.skillLock.bestScore
                              ? "text-amber-300"
                              : "text-white/40"
                          }
                          aria-hidden
                        />
                        <span
                          className={`text-[11px] font-semibold tabular-nums ${
                            stats.bestScore >= skin.skillLock.bestScore
                              ? "text-amber-300"
                              : "text-white/50"
                          }`}
                        >
                          {stats.bestScore}/{skin.skillLock.bestScore}
                        </span>
                      </div>
                    )}
                    {skin.skillLock?.bestCombo !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <Flame
                          size={11}
                          className={
                            stats.bestCombo >= skin.skillLock.bestCombo
                              ? "text-orange-300"
                              : "text-white/40"
                          }
                          aria-hidden
                        />
                        <span
                          className={`text-[11px] font-semibold tabular-nums ${
                            stats.bestCombo >= skin.skillLock.bestCombo
                              ? "text-orange-300"
                              : "text-white/50"
                          }`}
                        >
                          x{stats.bestCombo}/x{skin.skillLock.bestCombo}
                        </span>
                      </div>
                    )}
                    {skillMet && (
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                        Unlocked · auto-equips
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Lock size={11} className="text-white/40" aria-hidden />
                    <Coins
                      size={11}
                      className={canAfford ? "text-amber-300" : "text-white/40"}
                      aria-hidden
                    />
                    <span
                      className={`text-xs font-semibold tabular-nums ${
                        canAfford ? "text-amber-300" : "text-white/50"
                      }`}
                    >
                      {skin.cost}
                    </span>
                  </div>
                )}
              </div>
            </motion.button>
          )
        })}
      </main>

      <p className="px-5 pb-24 text-center text-xs text-white/40">
        Earn coins by stacking. Perfect drops pay more. Rare skins unlock with skill.
      </p>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none fixed bottom-8 left-1/2 z-20 -translate-x-1/2"
          >
            <div
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg backdrop-blur-md ${
                toast.tone === "warn"
                  ? "bg-amber-400/90 text-slate-950"
                  : "bg-teal-400/95 text-slate-950"
              }`}
            >
              <span>{toast.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
