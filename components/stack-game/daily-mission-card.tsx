import { CheckCircle2, Target } from "lucide-react"
import { DAILY_MISSION_REWARD, DAILY_MISSION_TARGET, missionKey } from "@/lib/missions"
import type { GameStorage } from "@/hooks/use-game-storage"

export function DailyMissionCard({ storage, onClaim }: { storage: GameStorage; onClaim: () => void }) {
  const today = missionKey()
  const progress = storage.dailyMissionKey === today ? Math.min(DAILY_MISSION_TARGET, storage.dailyMissionProgress) : 0
  const complete = progress >= DAILY_MISSION_TARGET
  const claimed = storage.dailyMissionClaimedKey === today
  return <article className="mt-3 rounded-2xl border border-[#f4c842]/20 bg-[#fff0bf] p-4 text-[#071957] shadow-sm"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Target size={17} className="text-amber-300" aria-hidden /><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200">Daily mission</p></div><span className="text-xs font-semibold text-amber-300">+{DAILY_MISSION_REWARD} coins</span></div><p className="mt-2 font-semibold">Complete 3 runs today</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#dce5ff]"><div className="h-full rounded-full bg-amber-300 transition-all" style={{ width: `${(progress / DAILY_MISSION_TARGET) * 100}%` }} /></div><div className="mt-3 flex items-center justify-between text-xs text-[#071957]/60"><span>{progress}/{DAILY_MISSION_TARGET} runs</span>{complete && !claimed ? <button onClick={onClaim} className="rounded-lg bg-amber-300 px-3 py-1.5 font-bold text-amber-950">Claim</button> : claimed ? <span className="flex items-center gap-1 text-amber-200"><CheckCircle2 size={14} /> Claimed</span> : <span>Keep going</span>}</div></article>
}
