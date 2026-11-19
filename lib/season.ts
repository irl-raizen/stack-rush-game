export const SEASON_MILESTONES = [
  { tier: 1, targetXp: 200, rewardCoins: 25, title: "First Sparks", description: "Start your season strong." },
  { tier: 2, targetXp: 750, rewardCoins: 50, title: "Skyline Builder", description: "Keep stacking toward the skyline." },
  { tier: 3, targetXp: 1800, rewardCoins: 100, title: "Neon Architect", description: "A season of precise drops." },
  { tier: 4, targetXp: 3500, rewardCoins: 200, title: "Tower Legend", description: "Reach the top of this season track." },
] as const

export type SeasonMilestone = {
  tier: number
  targetXp: number
  rewardCoins: number
  title: string
  description: string
  unlocked: boolean
  claimed: boolean
}

export type SeasonProgress = {
  seasonId: string
  label: string
  xp: number
  milestones: SeasonMilestone[]
}

export function getCurrentSeason(now = new Date()) {
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  const start = new Date(Date.UTC(year, month, 1))
  const end = new Date(Date.UTC(year, month + 1, 1))
  const seasonId = `${year}-${String(month + 1).padStart(2, "0")}`
  const label = `${new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(start)} Season`

  return { seasonId, label, start, end }
}
