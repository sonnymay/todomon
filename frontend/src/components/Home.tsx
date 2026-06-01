import { useEffect, useRef, useState } from 'react'
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
  coins: number
  gems: number
  hunger: number
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

export default function Home({
  creature,
  tasks,
  loading,
  error,
  coins,
  gems,
  hunger,
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
  // Lightweight feedback for controls that aren't built yet, so they don't feel broken.
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])
  function comingSoon(label: string) {
    setToast(`${label} — coming soon ✨`)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 1800)
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-[#fdf6e3] shadow-2xl sm:my-4 sm:min-h-[calc(100vh-2rem)] sm:rounded-[2rem]">
      {creature ? (
        <CreatureScene
          creature={creature}
          night={night}
          justLeveledTo={leveledTo}
          celebration={celebrate}
          topBar={
            <TopBar
              coins={coins}
              gems={gems}
              onMenu={onSignOut}
              onComingSoon={comingSoon}
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

      {/* pb leaves room so the floating SLEEP button + bottom nav never cover the last task */}
      <div className="flex-1 pt-5 pb-28">
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

      {toast && (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-4"
          role="status"
        >
          <span className="rounded-full bg-slate-900/90 px-4 py-2 text-sm font-semibold text-white shadow-lg">
            {toast}
          </span>
        </div>
      )}

      <BottomNav
        night={night}
        onToggleNight={onToggleNight}
        onComingSoon={comingSoon}
      />
    </div>
  )
}
