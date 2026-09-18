export type AchievementId = "first-run" | "perfect-10" | "combo-5" | "score-100" | "tower-builder"

export interface Achievement {
  id: AchievementId
  title: string
  description: string
  reward: number
  target: number
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-run", title: "First Drop", description: "Complete your first run", reward: 25, target: 1 },
  { id: "perfect-10", title: "Precision", description: "Land 10 perfect blocks", reward: 50, target: 10 },
  { id: "combo-5", title: "On Fire", description: "Reach a 5x combo", reward: 50, target: 5 },
  { id: "score-100", title: "Skyline", description: "Score 100 points in one run", reward: 75, target: 100 },
  { id: "tower-builder", title: "Tower Builder", description: "Complete 10 runs", reward: 100, target: 10 },
]

export function achievementProgress(achievement: Achievement, stats: { totalRuns: number; totalPerfects: number; bestCombo: number; bestScore: number }) {
  const value = achievement.id === "first-run" || achievement.id === "tower-builder" ? stats.totalRuns : achievement.id === "perfect-10" ? stats.totalPerfects : achievement.id === "combo-5" ? stats.bestCombo : stats.bestScore
  return Math.min(achievement.target, value)
}
