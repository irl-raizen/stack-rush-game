"use client"

import { useCallback, useEffect, useState } from "react"
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
}

const DEFAULT: GameStorage = { bestScore: 0, bestCombo: 0, totalPerfects: 0, totalRuns: 0, coins: 0, unlockedSkins: ["aurora"], selectedSkin: "aurora", soundEnabled: true, hapticsEnabled: true, welcomeClaimed: false, lastDailyClaim: null, dailyStreak: 0, tutorialCompleted: false, tutorialRewardClaimed: false, claimedAchievements: [] }

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
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => { setHydrated(false); setState(load(userId)); setHydrated(true) }, [userId])
  const update = useCallback((patch: Partial<GameStorage> | ((s: GameStorage) => GameStorage)) => { setState((prev) => { const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch }; save(userId, next); return next }) }, [userId])
  const submitRun = useCallback((score: number, coinsEarned: number, bestCombo: number, perfectsThisRun: number) => { setState((prev) => { const next = { ...prev, bestScore: Math.max(prev.bestScore, score), bestCombo: Math.max(prev.bestCombo, bestCombo), totalPerfects: prev.totalPerfects + perfectsThisRun, totalRuns: prev.totalRuns + 1, coins: prev.coins + coinsEarned }; save(userId, next); return next }) }, [userId])
  const unlockSkin = useCallback((skinId: SkinId, cost: number) => { let success = false; setState((prev) => { if (prev.unlockedSkins.includes(skinId) || prev.coins < cost) return prev; success = true; const next = { ...prev, coins: prev.coins - cost, unlockedSkins: [...prev.unlockedSkins, skinId], selectedSkin: skinId }; save(userId, next); return next }); return success }, [userId])
  const grantSkin = useCallback((skinId: SkinId) => { setState((prev) => { if (prev.unlockedSkins.includes(skinId)) return prev; const next = { ...prev, unlockedSkins: [...prev.unlockedSkins, skinId] }; save(userId, next); return next }) }, [userId])
  const selectSkin = useCallback((skinId: SkinId) => { setState((prev) => { if (!prev.unlockedSkins.includes(skinId)) return prev; const next = { ...prev, selectedSkin: skinId }; save(userId, next); return next }) }, [userId])
  const claimDaily = useCallback(() => { let granted = 0; setState((prev) => { const now = Date.now(); if (prev.lastDailyClaim && now - prev.lastDailyClaim < DAY_MS) return prev; const streak = prev.lastDailyClaim && now - prev.lastDailyClaim < DAY_MS * 2 ? Math.min(7, prev.dailyStreak + 1) : 1; granted = dailyRewardFor(streak); const next = { ...prev, coins: prev.coins + granted, lastDailyClaim: now, dailyStreak: streak }; save(userId, next); return next }); return granted }, [userId])
  const claimWelcome = useCallback(() => { let granted = 0; setState((prev) => { if (prev.welcomeClaimed) return prev; granted = WELCOME_REWARD; const next = { ...prev, coins: prev.coins + WELCOME_REWARD, welcomeClaimed: true }; save(userId, next); return next }); return granted }, [userId])
  return { state, hydrated, update, submitRun, unlockSkin, grantSkin, selectSkin, claimDaily, claimWelcome }
}
