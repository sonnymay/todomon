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
  petName: string
  hunger: number // real 0-100 hunger (decays over time, +1 per task)
  canFeed: boolean
  feedCost: number
  onFeed: () => void
}

function mood(hunger: number): string {
  if (hunger >= 60) return '😄'
  if (hunger >= 20) return '🙂'
  return '😟'
}

// One plain-English sentence that turns the whole app into an obvious loop:
// task → care → growth. Always nudges the next action.
function statusLine(name: string, hunger: number): string {
  if (hunger < 20) return `${name} is hungry. Finish one quick task to feed them. 🍖`
  if (hunger < 60) return `${name} is doing okay — finish a task to make them happy. 💛`
  return `${name} is happy and full. Keep finishing tasks to help them grow! 🌟`
}

function Bar({ value, max, className }: { value: number; max: number; className: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-black/10">
      <div
        className={`h-full rounded-full transition-all duration-700 ${className}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function StatsPanel({ creature, petName, hunger, canFeed, feedCost, onFeed }: Props) {
  // Two simple bars: how hungry the pet is, and how close it is to growing. The level
  // number is intentionally hidden — progress is shown as a bar, not a number.
  const lvl = levelInfo(creature.xp)
  const evo = nextEvolution(creature.stage)
  const levelsToGo = evo ? Math.max(0, evo.level - levelFromXp(creature.xp)) : 0

  return (
    <div className="relative z-10 mx-2 -mt-6 min-w-0 rounded-3xl bg-[#fdf3da] p-3 shadow-lg">
      <p className="mb-3 text-center text-[13px] font-bold leading-snug text-slate-700">
        {statusLine(petName, hunger)}
      </p>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-12 shrink-0 text-xs font-bold text-slate-700">🍖 Food</span>
          <Bar value={hunger} max={100} className="bg-gradient-to-r from-orange-400 to-orange-500" />
          <button
            onClick={onFeed}
            disabled={!canFeed}
            className="shrink-0 rounded-full bg-orange-500 px-3 py-1.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-orange-600 active:scale-95 disabled:opacity-40"
          >
            <span className="hidden min-[400px]:inline">Feed 🪙{feedCost}</span>
            <span className="min-[400px]:hidden">Feed</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-12 shrink-0 text-xs font-bold text-slate-700">🌟 Grow</span>
          <Bar value={lvl.pct} max={100} className="bg-gradient-to-r from-sky-400 to-blue-500" />
          <span className="shrink-0 text-base leading-none">{mood(hunger)}</span>
        </div>
        {evo && (
          <div className="flex min-w-0 items-center gap-2 rounded-2xl bg-black/[0.03] px-2 py-2">
            <img
              src={creatureSleepImage(evo.stage)}
              alt={`${STAGE_LABEL[evo.stage]} preview`}
              className="h-9 w-9 shrink-0 rounded-xl object-cover opacity-80"
            />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Next evolution
              </p>
              <p className="text-sm font-extrabold text-slate-700">
                {STAGE_LABEL[evo.stage]}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-center text-[10px] font-bold text-amber-700">
              {levelsToGo === 0 ? 'Ready!' : `${levelsToGo} lvl${levelsToGo === 1 ? '' : 's'} to go`}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
