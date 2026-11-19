"use server"

import { headers } from "next/headers"
import { and, asc, eq, gte, lt, lte, sql } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { gameRuns, gameStats, seasonRewardClaims, skinPurchases, user } from "@/lib/db/schema"
import { getCurrentSeason, SEASON_MILESTONES } from "@/lib/season"
import { randomUUID } from "node:crypto"

async function getUserId() { const session = await auth.api.getSession({ headers: await headers() }); if (!session?.user) throw new Error("Unauthorized"); return session.user.id }
export async function getPlayerCloudProfile() { const userId = await getUserId(); const [stats] = await db.select().from(gameStats).where(eq(gameStats.userId, userId)).limit(1); const purchases = await db.select({ skinId: skinPurchases.skinId }).from(skinPurchases).where(eq(skinPurchases.userId, userId)); return { stats: stats ?? null, purchasedSkinIds: purchases.map((purchase) => purchase.skinId) } }
export async function getPlayerStats() { const userId = await getUserId(); const rows = await db.select().from(gameStats).where(eq(gameStats.userId, userId)).limit(1); if (rows[0]) return rows[0]; const [created] = await db.insert(gameStats).values({ userId }).returning(); return created }
export async function savePlayerPreferences(input: { region: string; selectedSkinId: string }) { const userId = await getUserId(); await db.insert(gameStats).values({ userId, region: input.region, selectedSkinId: input.selectedSkinId }).onConflictDoUpdate({ target: gameStats.userId, set: { region: input.region, selectedSkinId: input.selectedSkinId, updatedAt: new Date() } }); }
export async function submitGameRun(input: { score: number; combo: number; perfects: number; coinsEarned: number; region: string; roomId?: string; challengeId?: string }) { const userId = await getUserId(); const [stats] = await db.select().from(gameStats).where(eq(gameStats.userId, userId)).limit(1); const [run] = await db.insert(gameRuns).values({ id: randomUUID(), userId, score: Math.max(0, Math.floor(input.score)), combo: Math.max(0, Math.floor(input.combo)), perfects: Math.max(0, Math.floor(input.perfects)), coinsEarned: Math.max(0, Math.floor(input.coinsEarned)), region: input.region, roomId: input.roomId, challengeId: input.challengeId }).returning(); await db.insert(gameStats).values({ userId, region: input.region, bestScore: run.score, bestCombo: run.combo, totalPerfects: run.perfects, coinsBalance: run.coinsEarned, totalRuns: 1 }).onConflictDoUpdate({ target: gameStats.userId, set: { region: input.region, bestScore: Math.max(stats?.bestScore ?? 0, run.score), bestCombo: Math.max(stats?.bestCombo ?? 0, run.combo), totalPerfects: (stats?.totalPerfects ?? 0) + run.perfects, coinsBalance: (stats?.coinsBalance ?? 0) + run.coinsEarned, totalRuns: (stats?.totalRuns ?? 0) + 1, updatedAt: new Date() } }); return run }
async function getSeasonXp(userId: string, start: Date, end: Date) {
  const [result] = await db
    .select({ xp: sql<number>`coalesce(sum(${gameRuns.score}), 0)::int` })
    .from(gameRuns)
    .where(and(eq(gameRuns.userId, userId), gte(gameRuns.createdAt, start), lt(gameRuns.createdAt, end)))
  return result?.xp ?? 0
}

export async function getSeasonProgress() {
  const userId = await getUserId()
  const season = getCurrentSeason()
  const [xp, claims] = await Promise.all([
    getSeasonXp(userId, season.start, season.end),
    db.select({ tier: seasonRewardClaims.tier }).from(seasonRewardClaims).where(and(eq(seasonRewardClaims.userId, userId), eq(seasonRewardClaims.seasonId, season.seasonId))),
  ])
  const claimedTiers = new Set(claims.map((claim) => claim.tier))

  return {
    seasonId: season.seasonId,
    label: season.label,
    xp,
    milestones: SEASON_MILESTONES.map((milestone) => ({
      ...milestone,
      unlocked: xp >= milestone.targetXp,
      claimed: claimedTiers.has(milestone.tier),
    })),
  }
}

export async function claimSeasonReward(tier: number) {
  const milestone = SEASON_MILESTONES.find((candidate) => candidate.tier === tier)
  if (!Number.isInteger(tier) || !milestone) throw new Error("Invalid season reward")

  const userId = await getUserId()
  const season = getCurrentSeason()
  const xp = await getSeasonXp(userId, season.start, season.end)
  if (xp < milestone.targetXp) throw new Error("Season reward is still locked")

  return db.transaction(async (transaction) => {
    const [claim] = await transaction
      .insert(seasonRewardClaims)
      .values({ id: randomUUID(), userId, seasonId: season.seasonId, tier, rewardCoins: milestone.rewardCoins })
      .onConflictDoNothing({ target: [seasonRewardClaims.userId, seasonRewardClaims.seasonId, seasonRewardClaims.tier] })
      .returning({ id: seasonRewardClaims.id })

    if (!claim) {
      const [stats] = await transaction.select({ coinsBalance: gameStats.coinsBalance }).from(gameStats).where(eq(gameStats.userId, userId)).limit(1)
      return { claimed: false, coinsBalance: stats?.coinsBalance ?? 0 }
    }

    const [stats] = await transaction
      .insert(gameStats)
      .values({ userId, coinsBalance: 50 + milestone.rewardCoins })
      .onConflictDoUpdate({
        target: gameStats.userId,
        set: { coinsBalance: sql`${gameStats.coinsBalance} + ${milestone.rewardCoins}`, updatedAt: new Date() },
      })
      .returning({ coinsBalance: gameStats.coinsBalance })

    return { claimed: true, coinsBalance: stats.coinsBalance, rewardCoins: milestone.rewardCoins }
  })
}
export async function getLeaderboard(region: string, period: "weekly" | "all-time") {
  const userId = await getUserId()
  const regions = ["US", "IN", "GB", "CA", "AU", "DE", "JP", "BR"]
  if (!regions.includes(region)) throw new Error("Unsupported leaderboard region")
  if (period !== "weekly" && period !== "all-time") throw new Error("Unsupported leaderboard period")

  if (period === "weekly") {
    const weekStart = new Date()
    const daysSinceMonday = (weekStart.getUTCDay() + 6) % 7
    weekStart.setUTCDate(weekStart.getUTCDate() - daysSinceMonday)
    weekStart.setUTCHours(0, 0, 0, 0)

    const ranked = db
      .select({
        id: user.id,
        userId: user.id,
        name: user.name,
        score: sql<number>`max(${gameRuns.score})::int`.as("score"),
        combo: sql<number>`max(${gameRuns.combo})::int`.as("combo"),
        rank: sql<number>`rank() over (order by max(${gameRuns.score}) desc)::int`.as("rank"),
      })
      .from(gameRuns)
      .innerJoin(user, eq(gameRuns.userId, user.id))
      .where(and(eq(gameRuns.region, region), gte(gameRuns.createdAt, weekStart)))
      .groupBy(user.id, user.name)
      .as("weekly_leaderboard")

    const [entries, personal] = await Promise.all([
      db.select().from(ranked).where(lte(ranked.rank, 10)).orderBy(asc(ranked.rank), asc(ranked.name)),
      db.select().from(ranked).where(eq(ranked.userId, userId)).limit(1),
    ])
    return { entries, personal: personal[0] ?? null }
  }

  const ranked = db
    .select({
      id: user.id,
      userId: user.id,
      name: user.name,
      score: gameStats.bestScore,
      combo: gameStats.bestCombo,
      rank: sql<number>`rank() over (order by ${gameStats.bestScore} desc)::int`.as("rank"),
    })
    .from(gameStats)
    .innerJoin(user, eq(gameStats.userId, user.id))
    .where(eq(gameStats.region, region))
    .as("all_time_leaderboard")

  const [entries, personal] = await Promise.all([
    db.select().from(ranked).where(lte(ranked.rank, 10)).orderBy(asc(ranked.rank), asc(ranked.name)),
    db.select().from(ranked).where(eq(ranked.userId, userId)).limit(1),
  ])
  return { entries, personal: personal[0] ?? null }
}
export async function purchaseSkin(input: { skinId: string; price: number }) { const userId = await getUserId(); const price = Math.max(0, Math.floor(input.price)); const [stats] = await db.select().from(gameStats).where(eq(gameStats.userId, userId)).limit(1); if (!stats || stats.coinsBalance < price) throw new Error("Not enough coins"); const [owned] = await db.select({ id: skinPurchases.id }).from(skinPurchases).where(and(eq(skinPurchases.userId, userId), eq(skinPurchases.skinId, input.skinId))).limit(1); if (!owned) await db.insert(skinPurchases).values({ id: randomUUID(), userId, skinId: input.skinId, price }); await db.update(gameStats).set({ coinsBalance: stats.coinsBalance - (owned ? 0 : price), selectedSkinId: input.skinId, updatedAt: new Date() }).where(eq(gameStats.userId, userId)); return { skinId: input.skinId, coinsBalance: stats.coinsBalance - (owned ? 0 : price), alreadyOwned: Boolean(owned) } }
export async function claimDailyReward() { const userId = await getUserId(); const [stats] = await db.select().from(gameStats).where(eq(gameStats.userId, userId)).limit(1); if (!stats) throw new Error("Player profile unavailable"); const today = new Date().toISOString().slice(0, 10); if (stats.lastDailyClaim && new Date(stats.lastDailyClaim).toISOString().slice(0, 10) === today) return { claimed: false, coinsBalance: stats.coinsBalance, streak: stats.streak }; const previous = stats.lastDailyClaim ? new Date(stats.lastDailyClaim) : null; const yesterday = new Date(); yesterday.setUTCDate(yesterday.getUTCDate() - 1); const nextStreak = previous && previous.toISOString().slice(0, 10) === yesterday.toISOString().slice(0, 10) ? stats.streak + 1 : 1; const reward = 25 + Math.min(nextStreak, 7) * 5; const [updated] = await db.update(gameStats).set({ coinsBalance: stats.coinsBalance + reward, streak: nextStreak, lastDailyClaim: new Date().toISOString().slice(0, 10), updatedAt: new Date() }).where(eq(gameStats.userId, userId)).returning({ coinsBalance: gameStats.coinsBalance, streak: gameStats.streak }); return { claimed: true, reward, coinsBalance: updated.coinsBalance, streak: updated.streak } }
