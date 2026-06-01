import type { Creature, Task } from '../types'
import TopBar from './TopBar'
import CreatureScene from './CreatureScene'
import StatsPanel from './StatsPanel'
import TaskList from './TaskList'

interface Props {
  creature: Creature | null
  tasks: Task[]
  loading: boolean
  error: string | null
  hunger: number
  night: boolean
  leveledTo: string | null
  celebrate: string | null
  greeting: string | null
  onToggleNight: () => void
  onSignOut: () => void
  onRename: (name: string) => void
  onAdd: (title: string, xpReward: number) => Promise<void>
  onComplete: (taskId: string) => Promise<void>
  onUncomplete: (taskId: string) => Promise<void>
  onDelete: (taskId: string) => Promise<void>
  onDevEvolve?: () => void
}

export default function Home({
  creature,
  tasks,
  loading,
  error,
  hunger,
  night,
  leveledTo,
  celebrate,
  greeting,
  onToggleNight,
  onSignOut,
  onRename,
  onAdd,
  onComplete,
  onUncomplete,
  onDelete,
  onDevEvolve,
}: Props) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-[#fdf6e3] shadow-2xl sm:my-4 sm:min-h-[calc(100vh-2rem)] sm:rounded-[2rem]">
      {creature ? (
        <CreatureScene
          creature={creature}
          night={night}
          hunger={hunger}
          justLeveledTo={leveledTo}
          celebration={celebrate}
          greeting={greeting}
          onToggleNight={onToggleNight}
          topBar={
            <TopBar
              petName={creature.name}
              onMenu={onSignOut}
              onRename={onRename}
            />
          }
        />
      ) : (
        <div className="flex h-48 items-center justify-center bg-amber-200 text-slate-600">
          {loading ? 'Waking your dragon…' : 'No creature found'}
        </div>
      )}

      {creature && <StatsPanel creature={creature} hunger={hunger} />}

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

      <div className="flex-1 pt-5 pb-8">
        {error && (
          <p className="mx-3 mb-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <TaskList
          tasks={tasks}
          onAdd={onAdd}
          onComplete={onComplete}
          onUncomplete={onUncomplete}
          onDelete={onDelete}
        />
      </div>
    </div>
  )
}
