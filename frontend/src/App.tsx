import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabaseClient'
import {
  addTask as apiAddTask,
  completeTask as apiCompleteTask,
  uncompleteTask as apiUncompleteTask,
  deleteTask as apiDeleteTask,
  updateCreatureName as apiUpdateCreatureName,
  fetchCreature,
  fetchProfile,
  fetchTasks,
} from './lib/api'
import {
  DEV_NO_AUTH,
  getStoredPetName,
  localTask,
  nextTaskSeq,
  seedCreature,
  seedTasks,
  setStoredPetName,
} from './lib/localGame'
import type { Creature, Profile, Task } from './types'
import {
  STAGE_LABEL,
  STAGE_ORDER,
  STAGE_THRESHOLDS,
  stageForXp,
} from './lib/stages'
import { useHunger } from './lib/useHunger'
import { useStreak } from './lib/useStreak'
import * as sfx from './lib/sfx'
import * as haptics from './lib/haptics'
import { celebrate as confettiCelebrate, evolveBurst } from './lib/confetti'
import Auth from './components/Auth'
import Home from './components/Home'
import Onboarding from './components/Onboarding'

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
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [leveledTo, setLeveledTo] = useState<string | null>(null)
  // Transient "Great job!" message — set only on a real completion, then cleared.
  const [celebrate, setCelebrate] = useState<string | null>(null)
  // "Your dragon missed you!" greeting — shown once when returning on a new day.
  const [greeting, setGreeting] = useState<string | null>(null)
  // Dev mode opens on the bright day scene (matches the mockup); real mode
  // follows local time.
  const [night, setNight] = useState(DEV_NO_AUTH ? false : isNight())

  // In real mode, hunger/streak are server-authoritative (seed from the creature/profile so
  // they survive reinstall). In dev mode the seeds are undefined → localStorage-backed.
  const hungerSeed =
    !DEV_NO_AUTH && creature?.hunger != null && creature.hunger_updated_at
      ? {
          value: creature.hunger,
          updatedAt: new Date(creature.hunger_updated_at).getTime(),
        }
      : undefined
  const streakSeed =
    !DEV_NO_AUTH && profile
      ? { count: profile.streak_count, lastDate: profile.last_active_date }
      : undefined

  // Hunger is real: decays over time, +1 per task (see useHunger).
  const { hunger, onTaskCompleted, onTaskUndone, devAdjustHunger } = useHunger(hungerSeed)
  // Daily completion streak (persisted; see useStreak).
  const { streak, registerCompletion: registerStreak } = useStreak(streakSeed)

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
      const [c, t, p] = await Promise.all([
        fetchCreature(),
        fetchTasks(),
        fetchProfile(),
      ])
      setCreature(c)
      setTasks(t)
      setProfile(p)
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
      setProfile(null)
    }
  }, [session, loadData])

  // Daily "missed you" greeting — once per calendar day for returning users.
  useEffect(() => {
    const KEY = 'todomon_last_seen'
    try {
      const today = new Date().toDateString()
      const last = localStorage.getItem(KEY)
      localStorage.setItem(KEY, today)
      if (last && last !== today) {
        setGreeting(`${getStoredPetName()} missed you! 🐲`)
        const timer = setTimeout(() => setGreeting(null), 4500)
        return () => clearTimeout(timer)
      }
    } catch {
      // storage unavailable — skip the greeting
    }
  }, [])

  function handleRename(name: string) {
    setStoredPetName(name)
    setCreature((c) => (c ? { ...c, name } : c))
    // Real mode: persist to Supabase (fire-and-forget; the optimistic update already showed it).
    if (!DEV_NO_AUTH) {
      void apiUpdateCreatureName(name).catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to save name'),
      )
    }
  }

  function applyLevelUp(prevStage: string | undefined, nextStage: string) {
    if (prevStage && nextStage !== prevStage) {
      setLeveledTo(STAGE_LABEL[nextStage as keyof typeof STAGE_LABEL])
      setTimeout(() => setLeveledTo(null), 3500)
      // Evolution fanfare: louder sound, success haptic, big confetti.
      sfx.playLevelUp()
      haptics.success()
      evolveBurst()
    }
  }

  function cheer() {
    setCelebrate(ENCOURAGEMENTS[Math.floor(Date.now() / 1000) % ENCOURAGEMENTS.length])
    setTimeout(() => setCelebrate(null), 3500)
    // Satisfying completion feedback: chime, light haptic, confetti pop.
    sfx.playComplete()
    haptics.tapLight()
    confettiCelebrate()
  }

  async function handleAdd(title: string, xpReward: number, notes?: string) {
    if (DEV_NO_AUTH) {
      setTasks((prev) => [
        localTask(title, xpReward, notes, nextTaskSeq(prev)),
        ...prev,
      ])
      return
    }
    const task = await apiAddTask(title, xpReward, notes)
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
      onTaskCompleted()
      registerStreak()
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
    onTaskCompleted()
    registerStreak()
    applyLevelUp(prevStage, updated.stage)
    // The RPC advanced the server-side streak; refresh the authoritative count.
    void fetchProfile().then(setProfile).catch(() => {})
  }

  // Undo an accidental completion: reopen the task and reverse the XP + hunger it gave.
  async function handleUncomplete(taskId: string) {
    if (DEV_NO_AUTH) {
      const task = tasks.find((t) => t.id === taskId)
      if (!task || !task.is_done || !creature) return
      const newXp = Math.max(0, creature.xp - task.xp_reward)
      setCreature({ ...creature, xp: newXp, stage: stageForXp(newXp) })
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, is_done: false, completed_at: null } : t,
        ),
      )
      onTaskUndone()
      return
    }
    // Real mode: atomic server reversal (XP + stage + hunger), then mark the task open.
    const updated = await apiUncompleteTask(taskId)
    setCreature(updated)
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, is_done: false, completed_at: null } : t,
      ),
    )
    onTaskUndone()
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
      <Onboarding />
      <Home
        creature={creature}
        tasks={tasks}
        loading={loading}
        error={error}
        hunger={hunger}
        streak={streak}
        night={night}
        leveledTo={leveledTo}
        celebrate={celebrate}
        greeting={greeting}
        onRename={handleRename}
        onToggleNight={() => setNight((n) => !n)}
        onSignOut={() => {
          if (!DEV_NO_AUTH) void supabase.auth.signOut()
        }}
        onAdd={handleAdd}
        onComplete={handleComplete}
        onUncomplete={handleUncomplete}
        onDelete={handleDelete}
        onDevEvolve={
          DEV_NO_AUTH && import.meta.env.DEV ? handleDevEvolve : undefined
        }
        onDevFeed={
          DEV_NO_AUTH && import.meta.env.DEV
            ? () => devAdjustHunger(20)
            : undefined
        }
        onDevStarve={
          DEV_NO_AUTH && import.meta.env.DEV
            ? () => devAdjustHunger(-20)
            : undefined
        }
      />
    </div>
  )
}
