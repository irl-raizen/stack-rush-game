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
  const initials = name.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "P"
  return <main className="min-h-screen bg-background px-5 py-8 text-foreground"><div className="mx-auto max-w-lg"><button onClick={onBack} className="text-sm text-muted-foreground">Back</button><div className="mt-8 flex items-center gap-4"><div aria-label={`${name} profile initials`} className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/40 bg-primary/15 font-mono text-xl font-bold text-primary">{initials}</div><div><p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">PLAYER PROFILE</p><h1 className="mt-2 text-4xl font-bold">{name}</h1></div></div><div className="mt-8 rounded-3xl border border-border bg-card p-5"><label className="block text-sm font-semibold">Regional leaderboard country<select value={region} onChange={event => { setRegion(event.target.value); setSaved(false) }} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3">{regions.map(item => <option key={item} value={item}>{item}</option>)}</select></label><button onClick={save} className="mt-4 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground">{saved ? "Saved" : "Save profile"}</button></div><button onClick={signOut} className="mt-6 w-full rounded-xl border border-destructive/40 px-4 py-3 font-semibold text-destructive">Sign out</button></div></main>
}
