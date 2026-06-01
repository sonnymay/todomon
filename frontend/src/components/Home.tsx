import type { Creature, Task } from '../types'
import TopBar from './TopBar'
import CreatureScene from './CreatureScene'
import StatsPanel from './StatsPanel'
import TaskList from './TaskList'
import BottomNav from './BottomNav'

interface Props {
  creature: Creature | null
  tasks: Task[]
  loading: boolean
  error: string | null
  night: boolean
  leveledTo: string | null
  celebrate: string | null
  onToggleNight: () => void
  onSignOut: () => void
  onAdd: (title: string, xpReward: number) => Promise<void>
  onComplete: (taskId: string) => Promise<void>
  onDelete: (taskId: string) => Promise<void>
  onDevEvolve?: () => void
}

// Cosmetic placeholders — not yet persisted (see HANDOFF.md).
const COINS = 1250
const GEMS = 45
const HUNGER = 72

export default function Home({
  creature,
  tasks,
  loading,
  error,
  night,
  leveledTo,
  celebrate,
  onToggleNight,
  onSignOut,
  onAdd,
  onComplete,
  onDelete,
  onDevEvolve,
}: Props) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-[#fdf6e3] shadow-2xl sm:my-4 sm:min-h-[calc(100vh-2rem)] sm:rounded-[2rem]">
      {creature ? (
        <CreatureScene
          creature={creature}
          night={night}
          justLeveledTo={leveledTo}
          celebration={celebrate}
          topBar={<TopBar coins={COINS} gems={GEMS} onMenu={onSignOut} />}
        />
      ) : (
        <div className="flex h-48 items-center justify-center bg-amber-200 text-slate-600">
          {loading ? 'Waking your dragon…' : 'No creature found'}
        </div>
      )}

      {creature && <StatsPanel creature={creature} hunger={HUNGER} />}

      {onDevEvolve && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={onDevEvolve}
            className="rounded-full bg-slate-800/80 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
          >
            🧪 Dev: Evolve →
          </button>
        </div>
      )}

      <div className="flex-1 pt-8 pb-4">
        {error && (
          <p className="mx-3 mb-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <TaskList
          tasks={tasks}
          onAdd={onAdd}
          onComplete={onComplete}
          onDelete={onDelete}
        />
      </div>

      <BottomNav night={night} onToggleNight={onToggleNight} />
    </div>
  )
}
