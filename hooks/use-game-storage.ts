"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { SkinId } from "@/lib/skins"

const STORAGE_KEY_PREFIX = "stack-rush-v2"
const DAY_MS = 24 * 60 * 60 * 1000

export interface GameStorage {
  bestScore: number
  bestCombo: number
  totalPerfects: number
  totalRuns: number
  coins: number
  unlockedSkins: SkinId[]
  selectedSkin: SkinId
  soundEnabled: boolean
  hapticsEnabled: boolean
  welcomeClaimed: boolean
  lastDailyClaim: number | null
  dailyStreak: number
  tutorialCompleted: boolean
  tutorialRewardClaimed: boolean
  claimedAchievements: string[]
  dailyChallengeKey: string | null
  dailyChallengeScore: number
  dailyChallengeClaimedKey: string | null
  dailyMissionKey: string | null
  dailyMissionProgress: number
  dailyMissionClaimedKey: string | null
  interstitialRunCount: number
}

const DEFAULT: GameStorage = { bestScore: 0, bestCombo: 0, totalPerfects: 0, totalRuns: 0, coins: 0, unlockedSkins: ["aurora"], selectedSkin: "aurora", soundEnabled: true, hapticsEnabled: true, welcomeClaimed: false, lastDailyClaim: null, dailyStreak: 0, tutorialCompleted: false, tutorialRewardClaimed: false, claimedAchievements: [], dailyChallengeKey: null, dailyChallengeScore: 0, dailyChallengeClaimedKey: null, dailyMissionKey: null, dailyMissionProgress: 0, dailyMissionClaimedKey: null, interstitialRunCount: 0 }

function storageKey(userId: string | null) { return userId ? `${STORAGE_KEY_PREFIX}:${userId}` : null }
function load(userId: string | null): GameStorage {
  if (typeof window === "undefined") return DEFAULT
  try { const key = storageKey(userId); if (!key) return DEFAULT; const raw = window.localStorage.getItem(key); if (!raw) return DEFAULT; const parsed = JSON.parse(raw) as Partial<GameStorage>; return { ...DEFAULT, ...parsed, unlockedSkins: parsed.unlockedSkins ?? DEFAULT.unlockedSkins, claimedAchievements: parsed.claimedAchievements ?? [] } } catch { return DEFAULT }
}
function save(userId: string | null, data: GameStorage) { const key = storageKey(userId); if (typeof window === "undefined" || !key) return; try { window.localStorage.setItem(key, JSON.stringify(data)) } catch { /* ignore quota errors */ } }
export function dailyRewardFor(streak: number) { return 15 + Math.max(1, Math.min(7, streak)) * 10 }
export const WELCOME_REWARD = 50
export function dailyCooldownMs(last: number | null) { return last ? Math.max(0, DAY_MS - (Date.now() - last)) : 0 }

export function useGameStorage(userId: string | null) {
  const [state, setState] = useState<GameStorage>(DEFAULT)
  const [hydratedUserId, setHydratedUserId] = useState<string | null | undefined>(undefined)
  const userIdRef = useRef(userId)
  const hydratedUserIdRef = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    userIdRef.current = userId
    setState(load(userId))
    hydratedUserIdRef.current = userId
    setHydratedUserId(userId)
  }, [userId])

  const hydrated = hydratedUserId === userId
  const visibleState = hydrated ? state : DEFAULT
  const updateForUser = useCallback((transform: (previous: GameStorage) => GameStorage) => {
    const expectedUserId = userIdRef.current
    setState((previous) => {
      if (expectedUserId !== userIdRef.current || hydratedUserIdRef.current !== expectedUserId) return previous
      const next = transform(previous)
      if (next !== previous) save(expectedUserId, next)
      return next
    })
  }, [])

  const update = useCallback((patch: Partial<GameStorage> | ((current: GameStorage) => GameStorage)) => {
    updateForUser((previous) => typeof patch === "function" ? patch(previous) : { ...previous, ...patch })
  }, [updateForUser])
  const submitRun = useCallback((score: number, coinsEarned: number, bestCombo: number, perfectsThisRun: number) => {
    updateForUser((previous) => ({ ...previous, bestScore: Math.max(previous.bestScore, score), bestCombo: Math.max(previous.bestCombo, bestCombo), totalPerfects: previous.totalPerfects + perfectsThisRun, totalRuns: previous.totalRuns + 1, coins: previous.coins + coinsEarned }))
  }, [updateForUser])
  const unlockSkin = useCallback((skinId: SkinId, cost: number) => {
    let unlocked = false
    updateForUser((previous) => {
      if (previous.unlockedSkins.includes(skinId) || previous.coins < cost) return previous
      unlocked = true
      return { ...previous, coins: previous.coins - cost, unlockedSkins: [...previous.unlockedSkins, skinId], selectedSkin: skinId }
    })
    return unlocked
  }, [updateForUser])
  const grantSkin = useCallback((skinId: SkinId) => {
    updateForUser((previous) => previous.unlockedSkins.includes(skinId) ? previous : { ...previous, unlockedSkins: [...previous.unlockedSkins, skinId] })
  }, [updateForUser])
  const selectSkin = useCallback((skinId: SkinId) => {
    updateForUser((previous) => previous.unlockedSkins.includes(skinId) ? { ...previous, selectedSkin: skinId } : previous)
  }, [updateForUser])
  const claimDaily = useCallback(() => {
    let granted = 0
    updateForUser((previous) => {
      const now = Date.now()
      if (previous.lastDailyClaim && now - previous.lastDailyClaim < DAY_MS) return previous
      const streak = previous.lastDailyClaim && now - previous.lastDailyClaim < DAY_MS * 2 ? Math.min(7, previous.dailyStreak + 1) : 1
      granted = dailyRewardFor(streak)
      return { ...previous, coins: previous.coins + granted, lastDailyClaim: now, dailyStreak: streak }
    })
    return granted
  }, [updateForUser])
  const hydrateFromCloud = useCallback((cloud: { bestScore: number; bestCombo: number; totalPerfects: number; totalRuns: number; coinsBalance: number; selectedSkinId: SkinId; purchasedSkinIds: SkinId[] }) => {
    updateForUser((previous) => ({ ...previous, bestScore: Math.max(previous.bestScore, cloud.bestScore), bestCombo: Math.max(previous.bestCombo, cloud.bestCombo), totalPerfects: Math.max(previous.totalPerfects, cloud.totalPerfects), totalRuns: Math.max(previous.totalRuns, cloud.totalRuns), coins: Math.max(previous.coins, cloud.coinsBalance), selectedSkin: cloud.selectedSkinId, unlockedSkins: Array.from(new Set([...previous.unlockedSkins, ...cloud.purchasedSkinIds, cloud.selectedSkinId])) }))
  }, [updateForUser])
  const claimWelcome = useCallback(() => {
    let granted = 0
    updateForUser((previous) => {
      if (previous.welcomeClaimed) return previous
      granted = WELCOME_REWARD
      return { ...previous, coins: previous.coins + WELCOME_REWARD, welcomeClaimed: true }
    })
    return granted
  }, [updateForUser])

  return { state: visibleState, hydrated, update, submitRun, hydrateFromCloud, unlockSkin, grantSkin, selectSkin, claimDaily, claimWelcome }
}
