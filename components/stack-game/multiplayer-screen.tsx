"use client"

import { useState } from "react"
import { Copy, Radio, Users, X } from "lucide-react"
import { createRoom, joinRoom } from "@/app/actions/multiplayer"

export function MultiplayerScreen({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<"live" | "async">("live")
  const [code, setCode] = useState("")
  const [invite, setInvite] = useState("")
  const [message, setMessage] = useState("")
  async function host() { const result = await createRoom(mode); const url = `${window.location.origin}/challenge/${result.slug}`; setInvite(url); await navigator.clipboard?.writeText(url); setMessage(`Room ${result.roomCode} created. Invite copied.`) }
  async function join() { try { await joinRoom(code); setMessage("Joined. Your opponent can start the race.") } catch { setMessage("That room is unavailable or already started.") } }
  return <main className="min-h-screen bg-background px-5 py-8 text-foreground"><div className="mx-auto w-full max-w-lg"><button onClick={onBack} className="mb-8 flex items-center gap-2 text-sm text-muted-foreground"><X size={16} /> Back</button><p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">COMPETE</p><h1 className="mt-3 text-4xl font-bold">Play against a friend</h1><p className="mt-3 text-muted-foreground">Create a live room or send an async challenge. Friends already in the game join directly; new players land on registration first.</p><div className="mt-8 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">{(["live", "async"] as const).map(value => <button key={value} onClick={() => setMode(value)} className={`rounded-xl px-4 py-3 text-sm font-semibold ${mode === value ? "bg-card shadow" : "text-muted-foreground"}`}>{value === "live" ? "Live race" : "Async challenge"}</button>)}</div><div className="mt-5 rounded-3xl border border-border bg-card p-5"><button onClick={host} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground"><Radio size={18} /> Create invite</button>{invite && <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted p-3 text-xs"><span className="min-w-0 flex-1 truncate">{invite}</span><Copy size={16} /></div>}</div><div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground"><span className="h-px flex-1 bg-border" />or join<span className="h-px flex-1 bg-border" /></div><div className="flex gap-2"><input value={code} onChange={event => setCode(event.target.value)} placeholder="Room code" className="min-w-0 flex-1 rounded-xl border border-border bg-card px-4 py-3" /><button onClick={join} className="rounded-xl border border-border px-4 py-3 font-semibold"><Users size={18} /></button></div>{message && <p role="status" className="mt-4 rounded-xl bg-primary/10 p-3 text-sm text-primary">{message}</p>}</div></main>
}
