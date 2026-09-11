"use client"

import { useEffect } from "react"

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return
    const unregisterPreviewWorkers = () => {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => { void registration.unregister() })
      })
    }

    if (process.env.NODE_ENV !== "production") {
      unregisterPreviewWorkers()
      return
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* service worker registration failed — ignore */
      })
    }

    if (document.readyState === "complete") register()
    else window.addEventListener("load", register, { once: true })
  }, [])

  return null
}
