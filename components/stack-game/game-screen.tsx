"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Coins, Flame } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { StackGameEngine, type DropResult } from "@/lib/game-engine"
import { SKINS, type SkinId } from "@/lib/skins"
import { sfx } from "@/lib/sfx"

interface GameScreenProps {
  skinId: SkinId
  hapticsEnabled: boolean
  onExit: () => void
  onGameOver: (score: number, coinsEarned: number, bestCombo: number, perfects: number) => void
}

/** Per-tier color for the floating PERFECT callout. */
const MULTIPLIER_STYLE: Record<1 | 2 | 3 | 5, { label: string; bg: string; glow: string }> = {
  1: { label: "PERFECT", bg: "bg-amber-400", glow: "rgba(245,158,11,0.5)" },
  2: { label: "PERFECT x2", bg: "bg-amber-400", glow: "rgba(245,158,11,0.6)" },
  3: { label: "PERFECT x3", bg: "bg-orange-500", glow: "rgba(249,115,22,0.7)" },
  5: { label: "PERFECT x5", bg: "bg-rose-500", glow: "rgba(244,63,94,0.75)" },
}

export function GameScreen({ skinId, hapticsEnabled, onExit, onGameOver }: GameScreenProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const engineRef = useRef<StackGameEngine | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef<number>(0)
  /** Time-scale for slow-mo on near misses. Resets to 1 after ~260ms. */
  const slowMoRef = useRef(1)
  const slowMoUntilRef = useRef(0)
  const perfectsRef = useRef(0)

  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [coins, setCoins] = useState(0)
  const [multiplier, setMultiplier] = useState<1 | 2 | 3 | 5>(1)
  const [perfectFloat, setPerfectFloat] = useState<{ id: number; tier: 1 | 2 | 3 | 5 } | null>(
    null,
  )
  const [perfectFlashId, setPerfectFlashId] = useState(0)
  const [scoreGainPopup, setScoreGainPopup] = useState<{ id: number; value: number } | null>(null)

  const skin = SKINS[skinId]

  const handleDrop = useCallback(
    (r: DropResult) => {
      setScore(r.score)
      setCombo(r.combo)
      setCoins(r.totalCoins)
      setMultiplier(r.multiplier)

      if (r.kind === "perfect") {
        perfectsRef.current += 1
        sfx.perfect(r.combo)
        sfx.coin()
        if (r.multiplier >= 2) sfx.multiplier(r.multiplier)
        setPerfectFloat({ id: Date.now(), tier: r.multiplier })
        setPerfectFlashId((n) => n + 1)
        if (r.scoreGain > 0) setScoreGainPopup({ id: Date.now(), value: r.scoreGain })
        if (hapticsEnabled && typeof navigator !== "undefined" && "vibrate" in navigator) {
          // Tiered haptic: crisper bumps as the multiplier climbs.
          const pattern =
            r.multiplier === 5 ? [12, 30, 12, 30, 24] : r.multiplier === 3 ? [12, 30, 18] : [30]
          navigator.vibrate?.(pattern)
        }
      } else {
        sfx.drop(r.combo)
        if (r.nearMiss) {
          sfx.nearMiss()
          // Engage slow-mo: drop time-scale for 260ms then ease back up.
          slowMoRef.current = 0.35
          slowMoUntilRef.current = performance.now() + 260
        }
        if (hapticsEnabled && typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate?.(r.nearMiss ? [10, 20, 40] : 12)
        }
      }
    },
    [hapticsEnabled],
  )

  const handleGameOver = useCallback(
    (finalScore: number, coinsEarned: number, bestCombo: number) => {
      sfx.gameOver()
      if (hapticsEnabled && typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.([20, 40, 80])
      }
      // Let the impact / debris settle before transitioning.
      setTimeout(() => onGameOver(finalScore, coinsEarned, bestCombo, perfectsRef.current), 750)
    },
    [hapticsEnabled, onGameOver],
  )

  // Init engine + resize handling.
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const rect = container.getBoundingClientRect()
      const w = Math.floor(rect.width)
      const h = Math.floor(rect.height)
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      const ctx = canvas.getContext("2d")
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      if (!engineRef.current) {
        engineRef.current = new StackGameEngine({
          width: w,
          height: h,
          skin: skinId,
          onDrop: handleDrop,
          onGameOver: handleGameOver,
        })
      } else {
        engineRef.current.cfg.width = w
        engineRef.current.cfg.height = h
      }
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)
    return () => ro.disconnect()
  }, [skinId, handleDrop, handleGameOver])

  // Animation loop with time-scale (for near-miss slow-mo).
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const loop = (ts: number) => {
      const last = lastTsRef.current || ts
      let dt = Math.min(64, ts - last)
      lastTsRef.current = ts

      // Ease slow-mo back to 1.0 after its window expires.
      if (ts < slowMoUntilRef.current) {
        // hold at reduced scale
      } else if (slowMoRef.current < 1) {
        slowMoRef.current = Math.min(1, slowMoRef.current + dt * 0.004)
      }
      dt *= slowMoRef.current

      const engine = engineRef.current
      if (engine) {
        engine.update(dt)
        engine.draw(ctx)
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      lastTsRef.current = 0
    }
  }, [])

  // Input: tap anywhere on the play area. A ~60ms micro-delay is already
  // implicit in the RAF loop; this keeps the feedback feeling reactive but
  // lets the visual settle animation read cleanly.
  const onTap = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    sfx.unlock()
    engineRef.current?.drop()
  }, [])

  // Prevent iOS double-tap zoom on the play area.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const prevent = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault()
    }
    el.addEventListener("touchmove", prevent, { passive: false })
    return () => el.removeEventListener("touchmove", prevent)
  }, [])

  const floatStyle = perfectFloat ? MULTIPLIER_STYLE[perfectFloat.tier] : null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="relative flex h-[100dvh] w-full flex-col text-white"
      style={{ background: skin.background }}
    >
      {/* HUD */}
      <header className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex items-start justify-between p-4">
        <button
          aria-label="Back to home"
          onClick={() => {
            sfx.unlock()
            sfx.ui()
            onExit()
          }}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm ring-1 ring-inset ring-white/10 transition-all hover:bg-white/15 active:scale-95"
        >
          <ArrowLeft size={18} aria-hidden />
        </button>

        <div className="pointer-events-none flex flex-col items-center">
          <motion.div
            key={score}
            initial={{ scale: 1 }}
            animate={{ scale: [1.22, 0.96, 1] }}
            transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
            className="text-5xl font-bold tabular-nums drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
          >
            {score}
          </motion.div>
          <AnimatePresence>
            {combo > 1 && (
              <motion.div
                key={combo}
                initial={{ opacity: 0, y: -6, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ type: "spring", stiffness: 480, damping: 22 }}
                className={`mt-1 flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-[0_6px_20px_-4px_rgba(245,158,11,0.7)] ${
                  multiplier === 5
                    ? "bg-rose-400"
                    : multiplier === 3
                      ? "bg-orange-400"
                      : "bg-amber-400"
                }`}
              >
                <Flame size={12} aria-hidden />
                <span>
                  Combo x{combo}
                  {multiplier > 1 ? ` · ${multiplier}x` : ""}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="pointer-events-auto flex h-10 items-center gap-1.5 rounded-full bg-white/10 px-3 backdrop-blur-sm ring-1 ring-inset ring-white/10">
          <Coins size={14} className="text-amber-300" aria-hidden />
          <motion.span
            key={coins}
            initial={{ scale: 1.25 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
            className="text-sm font-semibold tabular-nums"
          >
            +{coins}
          </motion.span>
        </div>
      </header>

      {/* Perfect radial flash vignette */}
      <AnimatePresence>
        {perfectFlashId > 0 && (
          <motion.div
            key={perfectFlashId}
            initial={{ opacity: multiplier === 5 ? 0.55 : multiplier === 3 ? 0.45 : 0.35 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background:
                "radial-gradient(circle at 50% 55%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 55%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Canvas play area */}
      <div
        ref={containerRef}
        onPointerDown={onTap}
        role="button"
        aria-label="Tap to drop block"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault()
            sfx.unlock()
            engineRef.current?.drop()
          }
        }}
        className="relative flex-1 touch-none select-none"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

        {/* Floating "PERFECT" / multiplier text */}
        <AnimatePresence>
          {perfectFloat && floatStyle && (
            <motion.div
              key={perfectFloat.id}
              initial={{ opacity: 0, y: 0, scale: 0.4 }}
              animate={{
                opacity: 1,
                y: -56,
                scale: perfectFloat.tier === 5 ? 1.25 : perfectFloat.tier === 3 ? 1.12 : 1,
              }}
              exit={{ opacity: 0, y: -110, scale: 1.1 }}
              transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
              onAnimationComplete={() => setPerfectFloat(null)}
              className={`pointer-events-none absolute left-1/2 top-[55%] -translate-x-1/2 rounded-full px-4 py-1.5 text-sm font-extrabold uppercase tracking-widest text-slate-950 ${floatStyle.bg}`}
              style={{ boxShadow: `0 10px 40px ${floatStyle.glow}` }}
            >
              {floatStyle.label}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating score gain (+N) near the block */}
        <AnimatePresence>
          {scoreGainPopup && (
            <motion.div
              key={scoreGainPopup.id}
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: -28 }}
              exit={{ opacity: 0, y: -56 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              onAnimationComplete={() => setScoreGainPopup(null)}
              className="pointer-events-none absolute left-1/2 top-[48%] -translate-x-1/2 text-lg font-bold tabular-nums text-white/90 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
            >
              +{scoreGainPopup.value}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tap hint (fades after first drop) */}
      <AnimatePresence>
        {score === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute bottom-10 left-0 right-0 flex justify-center"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/80 backdrop-blur-sm"
            >
              Tap anywhere to drop
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
