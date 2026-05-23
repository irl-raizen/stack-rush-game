"use client"

import { AnimatePresence } from "framer-motion"
import { useCallback, useEffect, useState } from "react"
import { SplashScreen } from "@/components/stack-game/splash-screen"
import { HomeScreen } from "@/components/stack-game/home-screen"
import { GameScreen } from "@/components/stack-game/game-screen"
import { GameOverScreen } from "@/components/stack-game/game-over-screen"
import { SkinsScreen } from "@/components/stack-game/skins-screen"
import { LeaderboardScreen } from "@/components/stack-game/leaderboard-screen"
import { InterstitialAd } from "@/components/stack-game/interstitial-ad"
import { useGameStorage } from "@/hooks/use-game-storage"
import { meetsSkillLock, SKINS } from "@/lib/skins"

type Screen = "splash" | "home" | "game" | "gameover" | "skins" | "leaderboard"

/** Show the interstitial every N completed runs. */
const INTERSTITIAL_EVERY = 4

export default function Page() {
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
