import type { Creature } from '../types'
import { levelInfo, nextEvolution, STAGE_LABEL } from '../lib/stages'

interface Props {
  creature: Creature
  hunger: number // real 0-100 hunger (decays over time, +1 per task)
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
  // Two simple bars: how hungry the pet is, and how close it is to growing. The level
  // number is intentionally hidden — progress is shown as a bar, not a number.
  const lvl = levelInfo(creature.xp)
  const evo = nextEvolution(creature.stage)

  return (
    <div className="relative z-10 mx-3 -mt-6 rounded-3xl bg-[#fdf3da] p-4 shadow-lg">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-sm font-bold text-slate-700">🍖 Food</span>
          <Bar value={hunger} max={100} className="bg-gradient-to-r from-orange-400 to-orange-500" />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-sm font-bold text-slate-700">🌟 Grow</span>
          <Bar value={lvl.pct} max={100} className="bg-gradient-to-r from-sky-400 to-blue-500" />
        </div>
        {evo && (
          <p className="text-right text-[11px] font-semibold text-slate-400">
            Next: {STAGE_LABEL[evo.stage]}
          </p>
        )}
      </div>
    </div>
  )
}
