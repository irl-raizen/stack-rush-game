"use client"

import { AnimatePresence } from "framer-motion"
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { claimDailyReward, getPlayerCloudProfile, purchaseSkin, submitGameRun as submitGameRunToCloud } from "@/app/actions/game"
import { finishRoom } from "@/app/actions/multiplayer"
import { SplashScreen } from "@/components/stack-game/splash-screen"
import { HomeScreen } from "@/components/stack-game/home-screen"
import { TutorialScreen } from "@/components/stack-game/tutorial-screen"
import { AchievementsScreen } from "@/components/stack-game/achievements-screen"
import { GameScreen } from "@/components/stack-game/game-screen"
import { GameOverScreen } from "@/components/stack-game/game-over-screen"
import { SkinsScreen } from "@/components/stack-game/skins-screen"
import { LeaderboardScreen } from "@/components/stack-game/leaderboard-screen"
import { InterstitialAd } from "@/components/stack-game/interstitial-ad"
import { MultiplayerScreen } from "@/components/stack-game/multiplayer-screen"
import { ProfileScreen } from "@/components/stack-game/profile-screen"
import { useGameStorage } from "@/hooks/use-game-storage"
import { meetsSkillLock, SKINS } from "@/lib/skins"
import { ACHIEVEMENTS, achievementProgress } from "@/lib/achievements"
import { dailyChallengeKey, DAILY_CHALLENGE_REWARD, isDailyChallengeComplete } from "@/lib/daily-challenge"
import { DAILY_MISSION_REWARD, DAILY_MISSION_TARGET, missionKey } from "@/lib/missions"

type Screen = "splash" | "home" | "tutorial" | "achievements" | "game" | "gameover" | "skins" | "leaderboard" | "multiplayer" | "profile"

/** Show the interstitial every N completed runs. */
const INTERSTITIAL_EVERY = 4
const RUN_COUNT_PREFIX = "sr-runs"

export default function Page() {
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const [screen, setScreen] = useState<Screen>("splash")
  const [runKey, setRunKey] = useState(0)
  const [gameMode, setGameMode] = useState<"classic" | "zen" | "timed">("classic")
  const [lastRun, setLastRun] = useState<{
    score: number
    coinsEarned: number
    bestCombo: number
    perfects: number
    isNewBest: boolean
  } | null>(null)
  const [showAd, setShowAd] = useState(false)
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [multiplayerResult, setMultiplayerResult] = useState<{ winner: "host" | "guest" | "draw"; hostScore: number; guestScore: number; hostName?: string; guestName?: string } | null>(null)
  const [multiplayerNames, setMultiplayerNames] = useState<{ hostName?: string; guestName?: string } | null>(null)

  const {
    state,
    hydrated,
    update,
    submitRun,
    hydrateFromCloud,
    unlockSkin,
    grantSkin,
    selectSkin,
    claimDaily,
    claimWelcome,
  } = useGameStorage(session?.user?.id ?? null)

  useEffect(() => {
    if (!session?.user?.id || !hydrated) return
    let cancelled = false
    void getPlayerCloudProfile().then((profile) => {
      if (cancelled || !profile.stats) return
      hydrateFromCloud({ ...profile.stats, selectedSkinId: profile.stats.selectedSkinId as typeof state.selectedSkin, purchasedSkinIds: profile.purchasedSkinIds as typeof state.unlockedSkins[number][] })
    }).catch(() => undefined)
    return () => { cancelled = true }
  }, [session?.user?.id, hydrated, hydrateFromCloud])

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
      const nextStats = { totalRuns: state.totalRuns + 1, totalPerfects: state.totalPerfects + perfects, bestCombo: Math.max(state.bestCombo, bestCombo), bestScore: Math.max(state.bestScore, score) }
      const newlyCompleted = ACHIEVEMENTS.filter((achievement) => achievementProgress(achievement, nextStats) >= achievement.target && !state.claimedAchievements.includes(achievement.id)).map((achievement) => achievement.id)
      submitRun(score, coinsEarned, bestCombo, perfects)
  const today = dailyChallengeKey()
  const challengeScore = state.dailyChallengeKey === today ? Math.max(state.dailyChallengeScore, score) : score
  const missionToday = missionKey()
  const missionProgress = state.dailyMissionKey === missionToday ? Math.min(DAILY_MISSION_TARGET, state.dailyMissionProgress + 1) : 1
  const challengePatch = { dailyChallengeKey: today, dailyChallengeScore: challengeScore, dailyMissionKey: missionToday, dailyMissionProgress: missionProgress }
      if (newlyCompleted.length) update({ ...challengePatch, claimedAchievements: [...state.claimedAchievements, ...newlyCompleted], coins: state.coins + coinsEarned + newlyCompleted.reduce((sum, id) => sum + (ACHIEVEMENTS.find((achievement) => achievement.id === id)?.reward ?? 0), 0) })
      else update(challengePatch)
      void submitGameRunToCloud({ score, combo: bestCombo, perfects, coinsEarned, region: "US" }).catch(() => undefined)
      setLastRun({ score, coinsEarned, bestCombo, perfects, isNewBest })

      // Count runs for interstitial cadence.
      const runCount =
        Number(
          typeof window !== "undefined" ? localStorage.getItem(`${RUN_COUNT_PREFIX}:${session?.user?.id ?? "anonymous"}`) ?? "0" : "0",
        ) + 1
      if (typeof window !== "undefined") localStorage.setItem(`${RUN_COUNT_PREFIX}:${session?.user?.id ?? "anonymous"}`, String(runCount))
      if (runCount % INTERSTITIAL_EVERY === 0) {
        setShowAd(true)
      } else {
        setScreen("gameover")
      }
    },
    [session?.user?.id, state.bestScore, submitRun],
  )

  const startGame = () => {
    setGameMode("classic")
    setMultiplayerResult(null)
    if (!state.tutorialCompleted) {
      setScreen("tutorial")
      return
    }
    setRunKey((k) => k + 1)
    setScreen("game")
  }

  const startTutorialGame = () => {
    const reward = state.tutorialRewardClaimed ? 0 : 25
    updateStorage({ tutorialCompleted: true, tutorialRewardClaimed: true, coins: state.coins + reward })
    setRunKey((k) => k + 1)
    setScreen("game")
  }

  const replayTutorial = () => {
    setScreen("tutorial")
  }

  const updateStorage = (patch: Partial<typeof state>) => {
    // Tutorial completion is persisted through the same account-scoped storage hook.
    update(patch)
  }
  const handleCloudUnlock = async (skinId: typeof state.selectedSkin, cost: number) => {
    try {
      const result = await purchaseSkin({ skinId, price: cost })
      unlockSkin(skinId, cost)
      selectSkin(skinId)
      return result.alreadyOwned || result.coinsBalance >= 0
    } catch {
      return false
    }
  }
  const startDailyChallenge = () => {
    setGameMode("classic")
    setMultiplayerResult(null)
    setRunKey((k) => k + 1)
    setScreen("game")
  }

  const claimDailyMission = () => {
    const today = missionKey()
    if (state.dailyMissionKey === today && state.dailyMissionProgress >= DAILY_MISSION_TARGET && state.dailyMissionClaimedKey !== today) update({ dailyMissionClaimedKey: today, coins: state.coins + DAILY_MISSION_REWARD })
  }

  const claimDailyChallenge = () => {
    const today = dailyChallengeKey()
    if (state.dailyChallengeKey === today && isDailyChallengeComplete(state.dailyChallengeScore) && state.dailyChallengeClaimedKey !== today) {
      update({ dailyChallengeClaimedKey: today, coins: state.coins + DAILY_CHALLENGE_REWARD })
    }
  }

  const handleDailyClaim = () => {
    void claimDailyReward().then((result) => {
      if (result.claimed) claimDaily()
    }).catch(() => undefined)
    return claimDaily()
  }

  if (sessionPending) return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Loading your player profile…</div>
  if (!session?.user) {
    return (
      <main className="min-h-screen bg-[#071957] px-2 py-2 text-[#071957]">
        <div className="relative mx-auto flex min-h-[calc(100vh-1rem)] w-full max-w-md flex-col overflow-hidden rounded-[2rem] bg-[#fff4dc] px-5 py-5 shadow-2xl">
          <div className="pointer-events-none absolute -left-10 top-20 h-28 w-28 rounded-full bg-[#ffcf72]/45" />
          <div className="pointer-events-none absolute -right-12 top-36 h-32 w-32 rounded-full bg-[#ffcf72]/35" />
          <header className="relative z-10 flex items-center justify-between">
            <span className="rounded-full bg-white/75 px-3 py-1.5 text-[11px] font-bold">STACK RUSH</span>
            <span className="rounded-full bg-white/75 px-3 py-1.5 text-[11px] font-semibold">Perfect tower arcade</span>
          </header>
          <section className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-7 flex h-32 w-44 flex-col items-center justify-end gap-1.5" role="img" aria-label="Stacked blue tower illustration">
              {["w-16", "w-24", "w-32", "w-40", "w-28"].map((width, index) => <div key={width} className={`${width} h-4 rounded-md bg-gradient-to-b from-[#31b5ff] to-[#0878f9] shadow-[0_5px_0_#0758c9]`} style={{ transform: `translateX(${index % 2 === 0 ? "-5px" : "5px"})` }} />)}
            </div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[#0878f9]">Build higher</p>
            <h1 className="text-5xl font-black tracking-[-0.06em]">Stack Rush</h1>
            <p className="mt-3 max-w-xs text-sm font-medium leading-5 text-[#071957]/75">Tap to drop. Perfect the stack. Reach the sky.</p>
            <div className="mt-9 flex w-full max-w-xs flex-col gap-3">
              <Link href="/sign-up" className="flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-[#0878f9] to-[#1769ee] text-base font-black text-white shadow-[0_8px_0_#0758c9] transition-transform hover:-translate-y-0.5">PLAY NOW</Link>
              <Link href="/sign-in" className="flex h-12 items-center justify-center rounded-2xl bg-[#ff5548] font-bold text-white shadow-[0_6px_0_#d93631] transition-transform hover:-translate-y-0.5">SIGN IN</Link>
            </div>
            <div className="mt-5 grid w-full max-w-xs grid-cols-3 gap-2 text-[11px] font-bold">
              <div className="rounded-xl bg-[#d9d6ff] px-2 py-3">Daily challenges</div>
              <div className="rounded-xl bg-[#d8efff] px-2 py-3">Timed mode</div>
              <div className="rounded-xl bg-[#ffe0db] px-2 py-3">Multiplayer</div>
            </div>
          </section>
          <footer className="relative z-10 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-[#071957]/45">v1.0 · stack rush</footer>
        </div>
      </main>
    )
  }
  if (!hydrated || screen === "splash") {
    return <SplashScreen onReady={() => setScreen("home")} />
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {screen === "tutorial" && (
          <TutorialScreen
            key="tutorial"
            skinId={state.selectedSkin}
            onBack={() => setScreen("home")}
            onComplete={startTutorialGame}
          />
        )}

        {screen === "achievements" && <AchievementsScreen key="achievements" storage={state} onBack={() => setScreen("home")} />}

        {screen === "home" && (
          <HomeScreen
            key="home"
            storage={state}
            onPlay={startGame}
            onZen={() => { setGameMode("zen"); setRunKey((k) => k + 1); setScreen("game") }}
            onTimed={() => { setGameMode("timed"); setRunKey((k) => k + 1); setScreen("game") }}
            onSkins={() => setScreen("skins")}
            onLeaderboard={() => setScreen("leaderboard")}
            onAchievements={() => setScreen("achievements")}
            onMultiplayer={() => setScreen("multiplayer")}
            onProfile={() => setScreen("profile")}
            onClaimDaily={handleDailyClaim}
            onClaimWelcome={claimWelcome}
            onDailyChallenge={startDailyChallenge}
            onClaimDailyChallenge={claimDailyChallenge}
            onClaimDailyMission={claimDailyMission}
          />
        )}

        {screen === "game" && (
          <GameScreen
            key={`game-${runKey}`}
            skinId={state.selectedSkin}
            mode={gameMode}
            hapticsEnabled={state.hapticsEnabled}
            onExit={() => setScreen("home")}
            onGameOver={handleGameOver}
            onMatchFinish={activeRoomId ? (score) => { void finishRoom(activeRoomId, score).then((result) => { if (result.winner) setMultiplayerResult({ winner: result.winner as "host" | "guest" | "draw", hostScore: result.hostScore, guestScore: result.guestScore, hostName: result.hostName ?? multiplayerNames?.hostName, guestName: result.guestName ?? multiplayerNames?.guestName }) }).catch(() => setMultiplayerResult(null)) } : undefined}
          />
        )}

        {screen === "skins" && (
          <SkinsScreen
            key="skins"
            storage={state}
            onBack={() => setScreen("home")}
            onSelect={selectSkin}
            onUnlock={handleCloudUnlock}
          />
        )}

        {screen === "leaderboard" && (
          <LeaderboardScreen
            key="leaderboard"
            userBest={state.bestScore}
            onBack={() => setScreen("home")}
          />
        )}

        {screen === "multiplayer" && <MultiplayerScreen key="multiplayer" playerId={session.user.id} playerName={session.user.name} onBack={() => setScreen("home")} onMatchStart={(room) => { setActiveRoomId(room.id); setMultiplayerNames({ hostName: room.hostName, guestName: room.guestName ?? undefined }); startGame() }} />}
        {screen === "profile" && <ProfileScreen key="profile" name={session.user.name} onBack={() => setScreen("home")} onReplayTutorial={replayTutorial} />}
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
          onHome={() => { setActiveRoomId(null); setMultiplayerResult(null); setScreen("home") }}
          multiplayerResult={multiplayerResult ?? undefined}
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
