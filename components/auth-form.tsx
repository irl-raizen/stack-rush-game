"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setPending(true)
    const data = new FormData(event.currentTarget)
    const result = mode === "sign-up" ? await authClient.signUp.email({ email: String(data.get("email")), password: String(data.get("password")), name: String(data.get("name")) }) : await authClient.signIn.email({ email: String(data.get("email")), password: String(data.get("password")) })
    setPending(false)
    if (result.error) { setError("We couldn't complete that request. Check your details and try again."); return }
    router.push("/"); router.refresh()
  }
  return <main className="flex min-h-screen items-center justify-center bg-background px-5 text-foreground"><form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-3xl border border-border bg-card p-8 shadow-2xl"><div><p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">STACK RUSH</p><h1 className="mt-3 text-3xl font-bold text-balance">{mode === "sign-up" ? "Create your player account" : "Welcome back, player"}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Save your streak, compete with friends, and climb your region.</p></div>{mode === "sign-up" && <label className="block text-sm font-medium">Display name<input name="name" required minLength={2} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3" /></label>}<label className="block text-sm font-medium">Email<input name="email" type="email" required className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3" /></label><label className="block text-sm font-medium">Password<input name="password" type="password" required minLength={8} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3" /></label>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<button disabled={pending} className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-50">{pending ? "Loading…" : mode === "sign-up" ? "Register" : "Sign in"}</button><p className="text-center text-sm text-muted-foreground">{mode === "sign-up" ? "Already registered? " : "Need an account? "}<a className="font-semibold text-primary underline" href={mode === "sign-up" ? "/sign-in" : "/sign-up"}>{mode === "sign-up" ? "Sign in" : "Register"}</a></p></form></main>
}
