"use client"

import { useEffect, useState } from "react"
import Ably from "ably"
import { Copy, Radio, RefreshCw, X } from "lucide-react"
import { createRoom, getRoomStatus, joinRoom, setRoomReady } from "@/app/actions/multiplayer"

type Room = { id: string; roomCode: string; mode: string; status: string; hostScore: number; guestScore: number; hostReady?: boolean; guestReady?: boolean; hostUserId?: string | null; guestUserId?: string | null }

export function MultiplayerScreen({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<"live" | "async">("live")
  const [code, setCode] = useState("")
  const [invite, setInvite] = useState("")
  const [room, setRoom] = useState<Room | null>(null)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function refresh() {
    if (!room) return
    try { setRoom(await getRoomStatus(room.roomCode)); setMessage("Room status refreshed.") } catch { setMessage("This room is no longer available.") }
  }

  useEffect(() => {
    if (!room) return
    const realtime = new Ably.Realtime({ authUrl: "/api/ably/token", authMethod: "GET" })
    const channel = realtime.channels.get(`stack-rush:${room.id}`)
    void channel.subscribe((event) => {
      if (event.name === "room.ready") setRoom((current) => current ? { ...current, status: "ready", guestUserId: String((event.data as { guestUserId?: string }).guestUserId ?? current.guestUserId) } : current)
      if (event.name === "player.ready") setMessage("Opponent is ready. Get set.")
      if (event.name === "match.started") { setRoom((current) => current ? { ...current, status: "playing" } : current); setMessage("Match starting in 3…") }
      if (event.name === "score.updated") { const data = event.data as { score?: number; side?: "host" | "guest" }; if (typeof data.score !== "number") return; setRoom((current) => current ? { ...current, hostScore: data.side === "host" && typeof data.score === "number" ? data.score : current.hostScore, guestScore: data.side === "guest" && typeof data.score === "number" ? data.score : current.guestScore } : current) }
    })
    return () => { void channel.unsubscribe(); realtime.close() }
  }, [room?.id])

  async function host() { setLoading(true); try { const result = await createRoom(mode); const url = `${window.location.origin}/challenge/${result.slug}`; setInvite(url); setCode(result.roomCode); await navigator.clipboard?.writeText(url); setMessage(`Room ${result.roomCode} created. Invite copied.`); setRoom(await getRoomStatus(result.roomCode)) } catch { setMessage("Unable to create the room right now.") } finally { setLoading(false) } }
  async function join() { setLoading(true); try { const result = await joinRoom(code); setRoom(await getRoomStatus(code)); setMessage(`Joined ${result.mode === "live" ? "live race" : "async challenge"}.`) } catch { setMessage("That room is unavailable or already started.") } finally { setLoading(false) } }
  async function ready() { if (!room) return; setLoading(true); try { const updated = await setRoomReady(room.id); setRoom((current) => current ? { ...current, ...updated, status: updated.hostReady && updated.guestReady ? "playing" : "ready" } : current); setMessage(updated.hostReady && updated.guestReady ? "Match starting in 3…" : "Ready. Waiting for your opponent.") } catch { setMessage("Unable to ready up right now.") } finally { setLoading(false) } }

  return <main className="min-h-screen bg-background px-5 py-8 text-foreground"><div className="mx-auto w-full max-w-lg"><button onClick={onBack} className="mb-8 flex items-center gap-2 text-sm text-muted-foreground"><X size={16} /> Back</button><p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">COMPETE</p><h1 className="mt-3 text-4xl font-bold">Play against a friend</h1><p className="mt-3 text-muted-foreground">Both players ready up, then the live match begins.</p><div className="mt-8 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">{(["live", "async"] as const).map(value => <button key={value} onClick={() => setMode(value)} className={`rounded-xl px-4 py-3 text-sm font-semibold ${mode === value ? "bg-card shadow" : "text-muted-foreground"}`}>{value === "live" ? "Live race" : "Async challenge"}</button>)}</div><div className="mt-5 rounded-3xl border border-border bg-card p-5"><button disabled={loading} onClick={() => void host()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60"><Radio size={18} />{loading ? "Creating…" : "Create invite"}</button>{invite && <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted p-3 text-xs"><span className="min-w-0 flex-1 truncate">{invite}</span><button aria-label="Copy invite" onClick={() => navigator.clipboard?.writeText(invite)}><Copy size={16} /></button></div>}</div><div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground"><span className="h-px flex-1 bg-border" />or join<span className="h-px flex-1 bg-border" /></div><div className="flex gap-2"><input value={code} onChange={event => setCode(event.target.value.toUpperCase())} placeholder="Room code" className="min-w-0 flex-1 rounded-xl border border-border bg-card px-4 py-3" /><button disabled={loading || code.length < 4} onClick={() => void join()} className="rounded-xl border border-border px-5 py-3 font-semibold disabled:opacity-50">Join</button></div>{room && <div className="mt-5 rounded-3xl border border-primary/30 bg-primary/5 p-5"><div className="mb-4 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-border bg-card p-3"><p className="text-xs text-muted-foreground">Player 1</p><p className="mt-1 font-semibold">{room.hostUserId ? "Connected" : "Waiting"}</p><p className={room.hostReady ? "text-xs text-emerald-400" : "text-xs text-muted-foreground"}>{room.hostReady ? "READY" : "NOT READY"}</p></div><div className="rounded-2xl border border-border bg-card p-3"><p className="text-xs text-muted-foreground">Player 2</p><p className="mt-1 font-semibold">{room.guestUserId ? "Connected" : "Waiting"}</p><p className={room.guestReady ? "text-xs text-emerald-400" : "text-xs text-muted-foreground"}>{room.guestReady ? "READY" : "NOT READY"}</p></div></div><button disabled={loading || room.status === "playing"} onClick={() => void ready()} className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60">{room.status === "playing" ? "Match starting…" : "Ready up"}</button><div className="mt-4 flex items-center justify-between text-sm"><span>Scores: {room.hostScore} — {room.guestScore}</span><button onClick={() => void refresh()} className="flex items-center gap-2 text-muted-foreground"><RefreshCw size={14} /> Refresh</button></div></div>}<p className="mt-4 text-sm text-muted-foreground">{message}</p></div></main>
}
