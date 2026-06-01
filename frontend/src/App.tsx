import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabaseClient'
import {
  addTask as apiAddTask,
  completeTask as apiCompleteTask,
  deleteTask as apiDeleteTask,
  fetchCreature,
  fetchTasks,
} from './lib/api'
import {
  DEV_NO_AUTH,
  localTask,
  seedCreature,
  seedTasks,
} from './lib/localGame'
import type { Creature, Task } from './types'
import {
  STAGE_LABEL,
  STAGE_ORDER,
  STAGE_THRESHOLDS,
  stageForXp,
} from './lib/stages'
import Auth from './components/Auth'
import Home from './components/Home'

const ENCOURAGEMENTS = [
  "You're building amazing habits!",
  'Keep the streak alive! 🔥',
  'Your dragon believes in you.',
  'One quest at a time.',
]

function isNight(): boolean {
  const h = new Date().getHours()
  return h < 6 || h >= 18
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)

  const [creature, setCreature] = useState<Creature | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [leveledTo, setLeveledTo] = useState<string | null>(null)
  // Transient "Great job!" message — set only on a real completion, then cleared.
  const [celebrate, setCelebrate] = useState<string | null>(null)
  // Dev mode opens on the bright day scene (matches the mockup); real mode
  // follows local time.
  const [night, setNight] = useState(DEV_NO_AUTH ? false : isNight())

  useEffect(() => {
    if (DEV_NO_AUTH) {
      setCreature(seedCreature())
      setTasks(seedTasks())
      setAuthReady(true)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [c, t] = await Promise.all([fetchCreature(), fetchTasks()])
      setCreature(c)
      setTasks(t)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (DEV_NO_AUTH) return
    if (session) {
      void loadData()
    } else {
      setCreature(null)
      setTasks([])
    }
  }, [session, loadData])

  function applyLevelUp(prevStage: string | undefined, nextStage: string) {
    if (prevStage && nextStage !== prevStage) {
      setLeveledTo(STAGE_LABEL[nextStage as keyof typeof STAGE_LABEL])
      setTimeout(() => setLeveledTo(null), 3500)
    }
  }

  function cheer() {
    setCelebrate(ENCOURAGEMENTS[Math.floor(Date.now() / 1000) % ENCOURAGEMENTS.length])
    setTimeout(() => setCelebrate(null), 3500)
  }

  async function handleAdd(title: string, xpReward: number) {
    if (DEV_NO_AUTH) {
      setTasks((prev) => [localTask(title, xpReward), ...prev])
      return
    }
    const task = await apiAddTask(title, xpReward)
    setTasks((prev) => [task, ...prev])
  }

  async function handleComplete(taskId: string) {
    const prevStage = creature?.stage

    if (DEV_NO_AUTH) {
      const task = tasks.find((t) => t.id === taskId)
      if (!task || task.is_done || !creature) return
      const newXp = creature.xp + task.xp_reward
      const newStage = stageForXp(newXp)
      setCreature({ ...creature, xp: newXp, stage: newStage })
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, is_done: true, completed_at: new Date().toISOString() }
            : t,
        ),
      )
      cheer()
      applyLevelUp(prevStage, newStage)
      return
    }

    const updated = await apiCompleteTask(taskId)
    setCreature(updated)
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, is_done: true, completed_at: new Date().toISOString() }
          : t,
      ),
    )
    cheer()
    applyLevelUp(prevStage, updated.stage)
  }

  async function handleDelete(taskId: string) {
    if (DEV_NO_AUTH) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
      return
    }
    await apiDeleteTask(taskId)
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  // Dev-only: jump the creature to the next evolution stage to preview each video.
  function handleDevEvolve() {
    if (!creature) return
    const idx = STAGE_ORDER.indexOf(creature.stage)
    const next = STAGE_ORDER[(idx + 1) % STAGE_ORDER.length]
    const newXp = STAGE_THRESHOLDS[next]
    const prevStage = creature.stage
    setCreature({ ...creature, xp: newXp, stage: next })
    applyLevelUp(prevStage, next)
  }

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-300 text-slate-700">
        Loading…
      </div>
    )
  }

  if (!DEV_NO_AUTH && !session) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-amber-300 bg-cover bg-center p-4"
        style={{ backgroundImage: "url('/assets/backgrounds/day.png')" }}
      >
        <Auth />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-amber-300">
      <Home
        creature={creature}
        tasks={tasks}
        loading={loading}
        error={error}
        night={night}
        leveledTo={leveledTo}
        celebrate={celebrate}
        onToggleNight={() => setNight((n) => !n)}
        onSignOut={() => {
          if (!DEV_NO_AUTH) void supabase.auth.signOut()
        }}
        onAdd={handleAdd}
        onComplete={handleComplete}
        onDelete={handleDelete}
        onDevEvolve={
          DEV_NO_AUTH && import.meta.env.DEV ? handleDevEvolve : undefined
        }
      />
    </div>
  )
}
