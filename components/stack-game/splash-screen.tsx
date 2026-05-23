"use client"

import { motion } from "framer-motion"
import { useEffect } from "react"

interface SplashScreenProps {
  onReady: () => void
}

export function SplashScreen({ onReady }: SplashScreenProps) {
  useEffect(() => {
    const t = setTimeout(onReady, 1600)
    return () => clearTimeout(t)
  }, [onReady])

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center gap-6"
      >
        {/* Stacked blocks logo */}
        <div className="relative h-24 w-32">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 * i, type: "spring", stiffness: 200, damping: 16 }}
              className="absolute left-1/2 h-5 -translate-x-1/2 rounded-md shadow-lg"
              style={{
                bottom: `${i * 20}px`,
                width: `${120 - i * 18}px`,
                background: `linear-gradient(180deg, ${
                  ["#2dd4bf", "#14b8a6", "#06b6d4", "#0ea5e9"][i]
                } 0%, ${["#14b8a6", "#0d9488", "#0891b2", "#0369a1"][i]} 100%)`,
              }}
            />
          ))}
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-balance">Stack Rush</h1>
          <p className="mt-1 text-sm font-medium text-teal-300/80">Perfect Tower</p>
        </div>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 140 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="h-1 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400"
        />
      </motion.div>

      <p className="absolute bottom-8 text-xs font-medium uppercase tracking-widest text-white/40">
        Tap to stack. Nail the rhythm.
      </p>
    </div>
  )
}
