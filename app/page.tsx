"use client"

import { AnimatePresence } from "framer-motion"
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { submitGameRun as submitGameRunToCloud } from "@/app/actions/game"
import { SplashScreen } from "@/components/stack-game/splash-screen"
import { HomeScreen } from "@/components/stack-game/home-screen"
import { GameScreen } from "@/components/stack-game/game-screen"
import { GameOverScreen } from "@/components/stack-game/game-over-screen"
import { SkinsScreen } from "@/components/stack-game/skins-screen"
import { LeaderboardScreen } from "@/components/stack-game/leaderboard-screen"
import { InterstitialAd } from "@/components/stack-game/interstitial-ad"
import { MultiplayerScreen } from "@/components/stack-game/multiplayer-screen"
import { useGameStorage } from "@/hooks/use-game-storage"
import { meetsSkillLock, SKINS } from "@/lib/skins"

type Screen = "splash" | "home" | "game" | "gameover" | "skins" | "leaderboard" | "multiplayer"

/** Show the interstitial every N completed runs. */
const INTERSTITIAL_EVERY = 4

export default function Page() {
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const [screen, setScreen] = useState<Screen>("splash")
  const [runKey, setRunKey] = useState(0)
  const [lastRun, setLastRun] = useState<{
    score: number
    coinsEarned: number
    bestCombo: number
    perfects: number
    isNewBest: boolean
  } | null>(null)
  const [showAd, setShowAd] = useState(false)

  const {
    state,
    hydrated,
    submitRun,
    unlockSkin,
    grantSkin,
    selectSkin,
    claimDaily,
    claimWelcome,
  } = useGameStorage()

  // Auto-grant any skill-gated skins as soon as the player's stats qualify.
  useEffect(() => {
    if (!hydrated) return
    const stats = { bestScore: state.bestScore, bestCombo: state.bestCombo }
    for (const skin of Object.values(SKINS)) {
      if (
        skin.skillLock &&
        meetsSkillLock(skin.skillLock, stats) &&
        !state.unlockedSkins.includes(skin.id)
      ) {
        grantSkin(skin.id)
      }
    }
  }, [hydrated, state.bestScore, state.bestCombo, state.unlockedSkins, grantSkin])

  const handleGameOver = useCallback(
    (score: number, coinsEarned: number, bestCombo: number, perfects: number) => {
      const isNewBest = score > state.bestScore
      submitRun(score, coinsEarned, bestCombo, perfects)
      void submitGameRunToCloud({ score, combo: bestCombo, perfects, coinsEarned, region: "US" }).catch(() => undefined)
      setLastRun({ score, coinsEarned, bestCombo, perfects, isNewBest })

      // Count runs for interstitial cadence.
      const runCount =
        Number(
          typeof window !== "undefined" ? localStorage.getItem("sr-runs") ?? "0" : "0",
        ) + 1
      if (typeof window !== "undefined") localStorage.setItem("sr-runs", String(runCount))
      if (runCount % INTERSTITIAL_EVERY === 0) {
        setShowAd(true)
      } else {
        setScreen("gameover")
      }
    },
    [state.bestScore, submitRun],
  )

  const startGame = () => {
    setRunKey((k) => k + 1)
    setScreen("game")
  }

  if (sessionPending) return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Loading your player profile…</div>
  if (!session?.user) {
    return <main className="flex min-h-screen items-center justify-center bg-background px-5 text-foreground"><div className="w-full max-w-md space-y-5 rounded-3xl border border-border bg-card p-8 text-center shadow-2xl"><p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">STACK RUSH</p><h1 className="text-3xl font-bold">Compete with real players</h1><p className="text-sm leading-6 text-muted-foreground">Create an account to save scores, buy skins with coins, join multiplayer rooms, and appear on regional leaderboards.</p><div className="flex gap-3"><Link href="/sign-in" className="flex-1 rounded-xl border border-border px-4 py-3 font-semibold">Sign in</Link><Link href="/sign-up" className="flex-1 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground">Register</Link></div></div></main>
  }
  if (!hydrated || screen === "splash") {
    return <SplashScreen onReady={() => setScreen("home")} />
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {screen === "home" && (
          <HomeScreen
            key="home"
            storage={state}
            onPlay={startGame}
            onSkins={() => setScreen("skins")}
            onLeaderboard={() => setScreen("leaderboard")}
            onMultiplayer={() => setScreen("multiplayer")}
            onClaimDaily={claimDaily}
            onClaimWelcome={claimWelcome}
          />
        )}

        {screen === "game" && (
          <GameScreen
            key={`game-${runKey}`}
            skinId={state.selectedSkin}
            hapticsEnabled={state.hapticsEnabled}
            onExit={() => setScreen("home")}
            onGameOver={handleGameOver}
          />
        )}

        {screen === "skins" && (
          <SkinsScreen
            key="skins"
            storage={state}
            onBack={() => setScreen("home")}
            onSelect={selectSkin}
            onUnlock={unlockSkin}
          />
        )}

        {screen === "leaderboard" && (
          <LeaderboardScreen
            key="leaderboard"
            userBest={state.bestScore}
            onBack={() => setScreen("home")}
          />
        )}

        {screen === "multiplayer" && <MultiplayerScreen key="multiplayer" onBack={() => setScreen("home")} />}
      </AnimatePresence>

      {/* Game Over overlays the game canvas */}
      {screen === "gameover" && lastRun && (
        <GameOverScreen
          skinId={state.selectedSkin}
          score={lastRun.score}
          bestScore={state.bestScore}
          bestCombo={lastRun.bestCombo}
          coinsEarned={lastRun.coinsEarned}
          isNewBest={lastRun.isNewBest}
          onRetry={startGame}
          onHome={() => setScreen("home")}
        />
      )}

      <AnimatePresence>
        {showAd && (
          <InterstitialAd
            onClose={() => {
              setShowAd(false)
              setScreen("gameover")
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
