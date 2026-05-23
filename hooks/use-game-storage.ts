"use client"

import { useCallback, useEffect, useState } from "react"
import type { SkinId } from "@/lib/skins"

const STORAGE_KEY = "stack-rush-v2"
const LEGACY_KEY = "stack-rush-v1"
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
  /** ms timestamp of last daily claim, or null. */
  lastDailyClaim: number | null
  /** consecutive-day streak, bumped when claim falls within 24–48h. */
  dailyStreak: number
}

const DEFAULT: GameStorage = {
  bestScore: 0,
  bestCombo: 0,
  totalPerfects: 0,
  totalRuns: 0,
  coins: 0,
  unlockedSkins: ["aurora"],
  selectedSkin: "aurora",
  soundEnabled: true,
  hapticsEnabled: true,
  welcomeClaimed: false,
  lastDailyClaim: null,
  dailyStreak: 0,
}

function load(): GameStorage {
  if (typeof window === "undefined") return DEFAULT
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_KEY)
    if (!raw) return DEFAULT
    const parsed = JSON.parse(raw) as Partial<GameStorage>
    return {
      ...DEFAULT,
      ...parsed,
      unlockedSkins: parsed.unlockedSkins ?? DEFAULT.unlockedSkins,
    }
  } catch {
    return DEFAULT
  }
}

function save(data: GameStorage) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* ignore quota errors */
  }
}

/** Daily gift coin amount for a given streak (caps at 7). */
export function dailyRewardFor(streak: number): number {
  const day = Math.max(1, Math.min(7, streak))
  return 15 + day * 10 // 25, 35, 45, … 85
}

export const WELCOME_REWARD = 50

/** How much time remains until the next daily claim is available. */
export function dailyCooldownMs(last: number | null): number {
  if (!last) return 0
  const elapsed = Date.now() - last
  return Math.max(0, DAY_MS - elapsed)
}

export function useGameStorage() {
  const [state, setState] = useState<GameStorage>(DEFAULT)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setState(load())
    setHydrated(true)
  }, [])

  const update = useCallback(
    (patch: Partial<GameStorage> | ((s: GameStorage) => GameStorage)) => {
      setState((prev) => {
        const next =
          typeof patch === "function"
            ? (patch as (s: GameStorage) => GameStorage)(prev)
            : { ...prev, ...patch }
        save(next)
        return next
      })
    },
    [],
  )

  const submitRun = useCallback(
    (score: number, coinsEarned: number, bestCombo: number, perfectsThisRun: number) => {
      setState((prev) => {
        const next: GameStorage = {
          ...prev,
          bestScore: Math.max(prev.bestScore, score),
          bestCombo: Math.max(prev.bestCombo, bestCombo),
          totalPerfects: prev.totalPerfects + perfectsThisRun,
          totalRuns: prev.totalRuns + 1,
          coins: prev.coins + coinsEarned,
        }
        save(next)
        return next
      })
    },
    [],
  )

  const unlockSkin = useCallback((skinId: SkinId, cost: number) => {
    let success = false
    setState((prev) => {
      if (prev.unlockedSkins.includes(skinId)) return prev
      if (prev.coins < cost) return prev
      success = true
      const next: GameStorage = {
        ...prev,
        coins: prev.coins - cost,
        unlockedSkins: [...prev.unlockedSkins, skinId],
        selectedSkin: skinId,
      }
      save(next)
      return next
    })
    return success
  }, [])

  /** Grant a skin for free after a skill milestone is reached. */
  const grantSkin = useCallback((skinId: SkinId) => {
    setState((prev) => {
      if (prev.unlockedSkins.includes(skinId)) return prev
      const next: GameStorage = {
        ...prev,
        unlockedSkins: [...prev.unlockedSkins, skinId],
      }
      save(next)
      return next
    })
  }, [])

  const selectSkin = useCallback((skinId: SkinId) => {
    setState((prev) => {
      if (!prev.unlockedSkins.includes(skinId)) return prev
      const next = { ...prev, selectedSkin: skinId }
      save(next)
      return next
    })
  }, [])

  /** Returns coins granted (0 if unavailable). */
  const claimDaily = useCallback((): number => {
    let granted = 0
    setState((prev) => {
      const now = Date.now()
      if (prev.lastDailyClaim && now - prev.lastDailyClaim < DAY_MS) return prev
      // Streak only continues if claimed within 48h of last claim.
      const streak =
        prev.lastDailyClaim && now - prev.lastDailyClaim < DAY_MS * 2
          ? Math.min(7, prev.dailyStreak + 1)
          : 1
      granted = dailyRewardFor(streak)
      const next: GameStorage = {
        ...prev,
        coins: prev.coins + granted,
        lastDailyClaim: now,
        dailyStreak: streak,
      }
      save(next)
      return next
    })
    return granted
  }, [])

  const claimWelcome = useCallback((): number => {
    let granted = 0
    setState((prev) => {
      if (prev.welcomeClaimed) return prev
      granted = WELCOME_REWARD
      const next: GameStorage = {
        ...prev,
        coins: prev.coins + WELCOME_REWARD,
        welcomeClaimed: true,
      }
      save(next)
      return next
    })
    return granted
  }, [])

  return {
    state,
    hydrated,
    update,
    submitRun,
    unlockSkin,
    grantSkin,
    selectSkin,
    claimDaily,
    claimWelcome,
  }
}
