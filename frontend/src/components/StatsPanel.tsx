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
  // XP bar shows progress WITHIN the current level (0 → next level). Evolution is a
  // milestone of leveling (see STAGE_LEVEL), surfaced as the "next evolution" caption.
  const lvl = levelInfo(creature.xp)
  const evo = nextEvolution(creature.stage)

  return (
    <div className="relative z-10 mx-3 -mt-6 rounded-2xl bg-[#fdf3da] p-4 shadow-lg">
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
              {lvl.level}
            </span>
            XP
          </span>
          <Bar value={lvl.pct} max={100} className="bg-gradient-to-r from-sky-400 to-blue-500" />
          <span className="w-20 shrink-0 whitespace-nowrap text-right text-sm font-semibold text-slate-600">
            {lvl.xpIntoLevel.toLocaleString()} / {lvl.levelSpan.toLocaleString()}
          </span>
        </div>
        {evo && (
          <p className="text-right text-[11px] font-semibold text-slate-400">
            Next evolution: {STAGE_LABEL[evo.stage]} at Lv {evo.level}
          </p>
        )}
      </div>
    </div>
  )
}
