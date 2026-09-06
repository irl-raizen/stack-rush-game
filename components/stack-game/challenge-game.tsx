"use client"

import { useState } from "react"
import { GameScreen } from "@/components/stack-game/game-screen"
import type { SkinId } from "@/lib/skins"
import { submitChallengeResult } from "@/app/actions/multiplayer"

export function ChallengeGame({ slug, skinId = "neon" }: { slug: string; skinId?: SkinId }) {
  const [result, setResult] = useState<{ score: number; creatorScore: number; won: boolean } | null>(null)
  if (result) return <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground"><div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center"><p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">CHALLENGE COMPLETE</p><h1 className="mt-3 text-4xl font-bold">{result.won ? "You took the lead" : "Nice run"}</h1><p className="mt-3 text-muted-foreground">You scored {result.score}. Your friend scored {result.creatorScore}.</p><a href="/" className="mt-6 block rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground">Back to Stack Rush</a></div></main>
  return <GameScreen skinId={skinId} hapticsEnabled onExit={() => { window.location.href = "/" }} onGameOver={(score) => { void submitChallengeResult(slug, score).then(setResult).catch(() => { window.location.href = "/" }) }} />
}
