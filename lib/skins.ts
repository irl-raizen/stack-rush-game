/**
 * Skin system — each skin produces a block color from a stack index,
 * plus a background gradient for the game scene.
 *
 * Backgrounds are kept as inline CSS gradient strings (not Tailwind classes)
 * so they always render regardless of JIT class detection — this guarantees
 * selecting a new skin actually changes the scene.
 *
 * A skin may be gated by:
 *   - `cost` (coins), or
 *   - `skillLock` (must meet a bestScore / bestCombo milestone).
 */

export type SkinId = "aurora" | "sunset" | "ocean" | "forest" | "neon" | "gold"

export interface SkillLock {
  bestScore?: number
  bestCombo?: number
}

export interface Skin {
  id: SkinId
  name: string
  cost: number
  colors: string[]
  /** Inline CSS gradient applied via `style={{ background }}`. */
  background: string
  preview: [string, string]
  skillLock?: SkillLock
}

export const SKINS: Record<SkinId, Skin> = {
  aurora: {
    id: "aurora",
    name: "Aurora",
    cost: 0,
    colors: ["#14b8a6", "#06b6d4", "#0ea5e9", "#22d3ee", "#2dd4bf"],
    background: "linear-gradient(180deg, #020617 0%, #0f172a 45%, #042f2e 100%)",
    preview: ["#14b8a6", "#0ea5e9"],
  },
  sunset: {
    id: "sunset",
    name: "Sunset",
    cost: 50,
    colors: ["#f59e0b", "#f97316", "#ef4444", "#f43f5e", "#fb7185"],
    background: "linear-gradient(180deg, #1a0b0b 0%, #3f1d1d 45%, #431407 100%)",
    preview: ["#f59e0b", "#ef4444"],
  },
  ocean: {
    id: "ocean",
    name: "Ocean",
    cost: 100,
    colors: ["#1e40af", "#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa"],
    background: "linear-gradient(180deg, #020617 0%, #0c1e3f 45%, #082f49 100%)",
    preview: ["#1d4ed8", "#60a5fa"],
  },
  forest: {
    id: "forest",
    name: "Forest",
    cost: 150,
    colors: ["#15803d", "#16a34a", "#22c55e", "#4ade80", "#84cc16"],
    background: "linear-gradient(180deg, #020617 0%, #022c22 45%, #052e16 100%)",
    preview: ["#16a34a", "#84cc16"],
  },
  neon: {
    id: "neon",
    name: "Neon",
    cost: 250,
    colors: ["#ec4899", "#d946ef", "#a855f7", "#8b5cf6", "#22d3ee"],
    background: "linear-gradient(180deg, #09061a 0%, #3b0764 50%, #0a0a1a 100%)",
    preview: ["#ec4899", "#22d3ee"],
  },
  gold: {
    id: "gold",
    name: "Gold",
    cost: 0,
    colors: ["#f59e0b", "#fbbf24", "#fde047", "#facc15", "#eab308"],
    background: "linear-gradient(180deg, #130c02 0%, #3a2a07 45%, #1a1005 100%)",
    preview: ["#fbbf24", "#f59e0b"],
    skillLock: { bestScore: 100, bestCombo: 5 },
  },
}

export const SKIN_IDS: SkinId[] = ["aurora", "sunset", "ocean", "forest", "neon", "gold"]

export function getBlockColor(skinId: SkinId, index: number): string {
  const skin = SKINS[skinId]
  return skin.colors[index % skin.colors.length]
}

/** Returns true when the current stats meet a skin's skill requirements. */
export function meetsSkillLock(
  lock: SkillLock | undefined,
  stats: { bestScore: number; bestCombo: number },
): boolean {
  if (!lock) return true
  if (lock.bestScore !== undefined && stats.bestScore < lock.bestScore) return false
  if (lock.bestCombo !== undefined && stats.bestCombo < lock.bestCombo) return false
  return true
}
