import type { Creature } from '../types'
import { MAX_XP, levelFromXp } from '../lib/stages'

interface Props {
  creature: Creature
  hunger: number // cosmetic placeholder (0-100) until a hunger mechanic exists
}

function Bar({ value, max, className }: { value: number; max: number; className: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="h-3 flex-1 overflow-hidden rounded-full bg-black/10">
      <div
        className={`h-full rounded-full transition-all duration-700 ${className}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function StatsPanel({ creature, hunger }: Props) {
  return (
    <div className="mx-3 -mt-6 rounded-2xl bg-[#fdf3da] p-4 shadow-lg">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-20 shrink-0 text-sm font-bold text-slate-700">🍖 Hunger</span>
          <Bar value={hunger} max={100} className="bg-gradient-to-r from-orange-400 to-orange-500" />
          <span className="w-20 shrink-0 whitespace-nowrap text-right text-sm font-semibold text-slate-600">
            {hunger} / 100
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex w-20 shrink-0 items-center gap-1.5 text-sm font-bold text-slate-700">
            <span className="flex items-center gap-1 rounded-full bg-[#5c6b1e] px-2 py-0.5 text-xs font-extrabold text-white">
              <span className="text-yellow-300">🏅</span>
              {levelFromXp(creature.xp)}
            </span>
            XP
          </span>
          <Bar value={creature.xp} max={MAX_XP} className="bg-gradient-to-r from-sky-400 to-blue-500" />
          <span className="w-20 shrink-0 whitespace-nowrap text-right text-sm font-semibold text-slate-600">
            {creature.xp.toLocaleString()} / {MAX_XP.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
