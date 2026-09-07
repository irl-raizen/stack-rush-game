import { NextResponse } from "next/server"
import { headers } from "next/headers"
import Ably from "ably"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const key = process.env.ABLY_API_KEY
  if (!key) return NextResponse.json({ error: "Realtime is not configured" }, { status: 503 })
  const client = new Ably.Rest(key)
  const tokenRequest = await client.auth.createTokenRequest({ clientId: session.user.id, capability: { "stack-rush:*": ["publish", "subscribe", "presence"] } })
  return NextResponse.json(tokenRequest)
}

export const dynamic = "force-dynamic"
