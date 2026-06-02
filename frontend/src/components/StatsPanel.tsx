import type { Creature } from '../types'
import {
  levelInfo,
  levelFromXp,
  nextEvolution,
  creatureSleepImage,
  STAGE_LABEL,
} from '../lib/stages'

interface Props {
  creature: Creature
  hunger: number // real 0-100 hunger (decays over time, +1 per task)
  canFeed: boolean
  feedCost: number
  onFeed: () => void
}

function mood(hunger: number): string {
  if (hunger >= 60) return '😄 Happy'
  if (hunger >= 20) return '🙂 Content'
  return '😟 Hungry'
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

export default function StatsPanel({ creature, hunger, canFeed, feedCost, onFeed }: Props) {
  // Two simple bars: how hungry the pet is, and how close it is to growing. The level
  // number is intentionally hidden — progress is shown as a bar, not a number.
  const lvl = levelInfo(creature.xp)
  const evo = nextEvolution(creature.stage)
  const levelsToGo = evo ? Math.max(0, evo.level - levelFromXp(creature.xp)) : 0

  return (
    <div className="relative z-10 mx-3 -mt-6 rounded-3xl bg-[#fdf3da] p-4 shadow-lg">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-sm font-bold text-slate-700">🍖 Food</span>
          <Bar value={hunger} max={100} className="bg-gradient-to-r from-orange-400 to-orange-500" />
          <button
            onClick={onFeed}
            disabled={!canFeed}
            className="shrink-0 rounded-full bg-orange-500 px-3 py-1.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-orange-600 active:scale-95 disabled:opacity-40"
          >
            Feed 🪙{feedCost}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-sm font-bold text-slate-700">🌟 Grow</span>
          <Bar value={lvl.pct} max={100} className="bg-gradient-to-r from-sky-400 to-blue-500" />
          <span className="shrink-0 text-xs font-bold text-slate-500">{mood(hunger)}</span>
        </div>
        {evo && (
          <div className="flex items-center gap-3 rounded-2xl bg-black/[0.03] px-3 py-2">
            <img
              src={creatureSleepImage(evo.stage)}
              alt={`${STAGE_LABEL[evo.stage]} preview`}
              className="h-10 w-10 shrink-0 rounded-xl object-cover opacity-80"
            />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Next evolution
              </p>
              <p className="text-sm font-extrabold text-slate-700">
                {STAGE_LABEL[evo.stage]}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
              {levelsToGo === 0 ? 'Ready!' : `${levelsToGo} lvl${levelsToGo === 1 ? '' : 's'} to go`}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
