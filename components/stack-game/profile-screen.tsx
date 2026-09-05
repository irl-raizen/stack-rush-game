"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { savePlayerPreferences } from "@/app/actions/game"

const regions = ["US", "CA", "GB", "IN", "AU", "DE", "FR", "JP", "BR", "MX"]
export function ProfileScreen({ name, onBack }: { name: string; onBack: () => void }) {
  const [region, setRegion] = useState("US")
  const [saved, setSaved] = useState(false)
  async function save() { await savePlayerPreferences({ region, selectedSkinId: "neon" }); setSaved(true) }
  async function signOut() { await authClient.signOut(); window.location.href = "/sign-in" }
  return <main className="min-h-screen bg-background px-5 py-8 text-foreground"><div className="mx-auto max-w-lg"><button onClick={onBack} className="text-sm text-muted-foreground">Back</button><p className="mt-8 font-mono text-xs uppercase tracking-[0.24em] text-primary">PLAYER PROFILE</p><h1 className="mt-3 text-4xl font-bold">{name}</h1><div className="mt-8 rounded-3xl border border-border bg-card p-5"><label className="block text-sm font-semibold">Regional leaderboard country<select value={region} onChange={event => { setRegion(event.target.value); setSaved(false) }} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3">{regions.map(item => <option key={item} value={item}>{item}</option>)}</select></label><button onClick={save} className="mt-4 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground">{saved ? "Saved" : "Save profile"}</button></div><button onClick={signOut} className="mt-6 w-full rounded-xl border border-destructive/40 px-4 py-3 font-semibold text-destructive">Sign out</button></div></main>
}
