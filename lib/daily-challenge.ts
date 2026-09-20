export const DAILY_CHALLENGE_TARGET = 100
export const DAILY_CHALLENGE_REWARD = 40

export function dailyChallengeKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

export function dailyChallengeLabel(date = new Date()) {
  return date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })
}

export function dailyChallengeProgress(score: number) {
  return Math.min(DAILY_CHALLENGE_TARGET, Math.max(0, score))
}

export function isDailyChallengeComplete(score: number) {
  return score >= DAILY_CHALLENGE_TARGET
}

export function challengeRewardClaimed(claimedKey: string | null) {
  return claimedKey === dailyChallengeKey()
}

export function dailyChallengeReward() {
  return DAILY_CHALLENGE_REWARD
}

export function dailyChallengeDescription() {
  return `Reach ${DAILY_CHALLENGE_TARGET} points in one run`
}

export function dailyChallengeRemaining(score: number) {
  return Math.max(0, DAILY_CHALLENGE_TARGET - score)
}

export function dailyChallengeStatus(score: number, claimedKey: string | null) {
  if (challengeRewardClaimed(claimedKey)) return "Claimed"
  if (isDailyChallengeComplete(score)) return "Reward ready"
  return `${dailyChallengeRemaining(score)} points left`
} 
