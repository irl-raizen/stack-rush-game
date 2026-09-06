import { headers } from "next/headers"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { shareLinks } from "@/lib/db/schema"
import { ChallengeGame } from "@/components/stack-game/challenge-game"

export default async function ChallengePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const link = await db.select({ score: shareLinks.score, expiresAt: shareLinks.expiresAt, creatorUserId: shareLinks.creatorUserId }).from(shareLinks).where(eq(shareLinks.slug, slug)).limit(1)
  if (!link[0] || link[0].expiresAt < new Date()) return <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground"><div className="rounded-3xl border border-border bg-card p-8 text-center"><h1 className="text-2xl font-bold">Challenge expired</h1><p className="mt-2 text-muted-foreground">Ask your friend for a new score link.</p></div></main>
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect(`/sign-up?challenge=${encodeURIComponent(slug)}`)
  return <ChallengeGame slug={slug} />
}
