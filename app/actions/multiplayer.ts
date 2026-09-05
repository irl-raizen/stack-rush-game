"use server"

import { headers } from "next/headers"
import { eq, or } from "drizzle-orm"
import { randomUUID, randomBytes } from "node:crypto"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { multiplayerRooms, shareLinks } from "@/lib/db/schema"

async function userId() { const session = await auth.api.getSession({ headers: await headers() }); if (!session?.user) throw new Error("Unauthorized"); return session.user.id }
function code() { return randomBytes(3).toString("hex").toUpperCase() }
export async function createRoom(mode: "live" | "async", score = 0) { const hostUserId = await userId(); const roomCode = code(); const id = randomUUID(); await db.insert(multiplayerRooms).values({ id, roomCode, mode, hostUserId, status: "waiting", expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }); const slug = randomBytes(8).toString("base64url"); await db.insert(shareLinks).values({ id: randomUUID(), slug, creatorUserId: hostUserId, score, roomId: id, challengeId: mode === "async" ? id : undefined, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }); return { roomCode, slug } }
export async function joinRoom(roomCode: string) { const guestUserId = await userId(); const room = await db.select().from(multiplayerRooms).where(eq(multiplayerRooms.roomCode, roomCode.trim().toUpperCase())).limit(1); if (!room[0] || room[0].status !== "waiting") throw new Error("Room unavailable"); await db.update(multiplayerRooms).set({ guestUserId, status: "ready" }).where(eq(multiplayerRooms.id, room[0].id)); return { roomId: room[0].id, mode: room[0].mode } }
export async function getMyRooms() { const id = await userId(); return db.select().from(multiplayerRooms).where(or(eq(multiplayerRooms.hostUserId, id), eq(multiplayerRooms.guestUserId, id))).limit(10) }
