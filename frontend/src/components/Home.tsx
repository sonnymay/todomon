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
  streak: number
  night: boolean
  leveledTo: string | null
  celebrate: string | null
  greeting: string | null
  onToggleNight: () => void
  onSignOut: () => void
  onRename: (name: string) => void
  onAdd: (title: string, xpReward: number, notes?: string) => Promise<void>
  onComplete: (taskId: string) => Promise<void>
  onUncomplete: (taskId: string) => Promise<void>
  onDelete: (taskId: string) => Promise<void>
  onDevEvolve?: () => void
  onDevFeed?: () => void
  onDevStarve?: () => void
}

export default function Home({
  creature,
  tasks,
  loading,
  error,
  hunger,
  streak,
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
  onDevFeed,
  onDevStarve,
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

      {(onDevEvolve || onDevFeed || onDevStarve) && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {onDevEvolve && (
            <button
              onClick={onDevEvolve}
              className="rounded-full bg-slate-800/80 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
            >
              🧪 Dev: Evolve →
            </button>
          )}
          {onDevStarve && (
            <button
              onClick={onDevStarve}
              className="rounded-full bg-slate-800/80 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
            >
              😋 Starve −20
            </button>
          )}
          {onDevFeed && (
            <button
              onClick={onDevFeed}
              className="rounded-full bg-slate-800/80 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
            >
              🍖 Feed +20
            </button>
          )}
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
          streak={streak}
          onAdd={onAdd}
          onComplete={onComplete}
          onUncomplete={onUncomplete}
          onDelete={onDelete}
        />
      </div>
    </div>
  )
}
