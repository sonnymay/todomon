import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabaseClient'
import {
  addTask as apiAddTask,
  completeTask as apiCompleteTask,
  uncompleteTask as apiUncompleteTask,
  deleteTask as apiDeleteTask,
  updateTask as apiUpdateTask,
  updateCreatureName as apiUpdateCreatureName,
  fetchCreature,
  fetchProfile,
  fetchTasks,
} from './lib/api'
import {
  DEV_NO_AUTH,
  freshCreature,
  getStoredPetName,
  localTask,
  nextTaskSeq,
  setStoredPetName,
} from './lib/localGame'
import {
  clearGameState,
  loadCreature,
  loadTasks,
  saveCreature,
  saveTasks,
} from './lib/localStore'
import type { Creature, Profile, Stage, Task } from './types'
import {
  STAGE_LABEL,
  STAGE_ORDER,
  stageForXp,
  difficultyForXp,
} from './lib/stages'
import { useGameStore } from './lib/gameStore'
import { FEED_RESTORE } from './lib/economy'
import { achievementById } from './lib/achievements'
import { isPro as iapIsPro, purchasePro, restorePurchases } from './lib/iap'
import { useHunger } from './lib/useHunger'
import { useStreak } from './lib/useStreak'
import * as sfx from './lib/sfx'
import * as haptics from './lib/haptics'
import { celebrate as confettiCelebrate, evolveBurst, proCelebrate } from './lib/confetti'
import Auth from './components/Auth'
import Home from './components/Home'
import Onboarding from './components/Onboarding'
import Settings from './components/Settings'
import EvolutionCelebration from './components/EvolutionCelebration'
import Paywall from './components/Paywall'

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
  const [settingsOpen, setSettingsOpen] = useState(false)
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

  // Engagement economy: coins, quests, achievements, cosmetics, stats (persisted).
  const today = new Date().toDateString()
  const game = useGameStore(today)

  // ToDoMon Pro entitlement (one-time IAP). Mocked on web; StoreKit on device (see lib/iap).
  const [pro, setPro] = useState(iapIsPro)
  const [paywallOpen, setPaywallOpen] = useState(false)

  async function handleBuyPro() {
    const ok = await purchasePro()
    if (ok) {
      setPro(true)
      game.grantProCosmetics()
    }
    return ok
  }

  async function handleRestorePro() {
    const ok = await restorePurchases()
    if (ok) {
      setPro(true)
      game.grantProCosmetics()
    }
    return ok
  }

  // Transient feedback for the engagement layer.
  const [coinGain, setCoinGain] = useState<number | null>(null)
  const [feedSignal, setFeedSignal] = useState(0)
  const [evolveStage, setEvolveStage] = useState<Stage | null>(null)
  const [achToast, setAchToast] = useState<{ emoji: string; name: string } | null>(null)

  const showCoins = useCallback((amount: number) => {
    if (amount <= 0) return
    setCoinGain(amount)
    setTimeout(() => setCoinGain(null), 1000)
  }, [])

  const showUnlocked = useCallback((ids: string[]) => {
    const first = ids.map(achievementById).find(Boolean)
    if (!first) return
    setAchToast({ emoji: first.emoji, name: first.name })
    setTimeout(() => setAchToast(null), 3000)
  }, [])

  useEffect(() => {
    if (DEV_NO_AUTH) {
      // Offline mode: load the on-device pet + tasks, or start fresh (an egg, no tasks)
      // on first launch. Onboarding nudges the first task.
      setCreature(loadCreature() ?? freshCreature())
      setTasks(loadTasks() ?? [])
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

  // Offline mode: persist the pet + tasks on every change so they survive app restarts.
  useEffect(() => {
    if (!DEV_NO_AUTH || !authReady || !creature) return
    saveCreature(creature)
    saveTasks(tasks)
  }, [creature, tasks, authReady])

  // Daily login bonus — granted once per day on first open (idempotent in the store).
  useEffect(() => {
    if (!authReady) return
    const granted = game.claimDailyBonus()
    if (granted > 0) showCoins(granted)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady])

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
      // Evolution fanfare: full-screen celebration, sound, success haptic, big confetti.
      setEvolveStage(nextStage as Stage)
      sfx.playLevelUp()
      haptics.success()
      evolveBurst()
      const unlocked = game.recordEvolve(STAGE_ORDER.indexOf(nextStage as Stage))
      if (unlocked.length) showUnlocked(unlocked)
      // Diary: evolution is the biggest event — recorded after awardCompletion so it wins.
      game.noteMemory({
        kind: 'evolution',
        emoji: '🐲',
        text: `Evolved to ${STAGE_LABEL[nextStage as keyof typeof STAGE_LABEL]}!`,
      })
    }
  }

  // The dragon reacts to the *specific* task you finished — the reaction is the prize.
  // We also fire the feed signal so the completion visibly feeds/grows the dragon
  // (floating heart + happy bounce), making coins feel secondary.
  function cheer(taskTitle: string) {
    const name = creature?.name ?? getStoredPetName()
    setCelebrate(`${name} loved that you finished “${taskTitle}”!`)
    setTimeout(() => setCelebrate(null), 3500)
    setFeedSignal((s) => s + 1)
    // Satisfying completion feedback: chime, light haptic, confetti pop.
    sfx.playComplete()
    haptics.tapLight()
    confettiCelebrate()
    // Pro delight: an extra golden star shower on every completion.
    if (pro) proCelebrate()
  }

  // Engagement rewards for a completed task: coins (by difficulty + streak), a rare lucky
  // bonus, streak-milestone bonus, quest progress, and any newly-unlocked achievements.
  function awardCompletion(xpReward: number, taskTitle?: string) {
    const newStreak = registerStreak()
    const res = game.recordCompletion(difficultyForXp(xpReward), newStreak, pro ? 2 : 1)
    const total = res.coins + res.lucky + res.milestone
    showCoins(total)
    if (res.lucky > 0 || res.milestone > 0) sfx.playLevelUp()
    if (res.unlocked.length) showUnlocked(res.unlocked)
    // Diary: a streak milestone outranks a plain completion. Evolution (if any) overrides
    // this later in applyLevelUp.
    if (res.milestone > 0) {
      game.noteMemory({ kind: 'streak', emoji: '🔥', text: `Reached a ${newStreak}-day streak!` })
    } else {
      game.noteMemory({
        kind: 'completion',
        emoji: '✅',
        text: taskTitle ? `Finished “${taskTitle}”` : 'Finished a task',
      })
    }
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
      cheer(task.title)
      onTaskCompleted()
      awardCompletion(task.xp_reward, task.title)
      applyLevelUp(prevStage, newStage)
      return
    }

    const task = tasks.find((t) => t.id === taskId)
    const updated = await apiCompleteTask(taskId)
    setCreature(updated)
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, is_done: true, completed_at: new Date().toISOString() }
          : t,
      ),
    )
    cheer(task?.title ?? 'that task')
    onTaskCompleted()
    awardCompletion(task?.xp_reward ?? 20, task?.title)
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

  async function handleEdit(taskId: string, title: string, notes: string) {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return
    const trimmedNotes = notes.trim() || null
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, title: trimmedTitle, notes: trimmedNotes } : t,
      ),
    )
    if (!DEV_NO_AUTH) {
      try {
        await apiUpdateTask(taskId, trimmedTitle, trimmedNotes)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save task')
      }
    }
  }

  async function handleDelete(taskId: string) {
    if (DEV_NO_AUTH) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
      return
    }
    await apiDeleteTask(taskId)
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  // Spend coins to feed the pet → restore hunger + a happy reaction.
  function handleFeed() {
    const r = game.feed()
    if (!r.ok) return
    devAdjustHunger(FEED_RESTORE)
    setFeedSignal((s) => s + 1)
    sfx.playTap()
    haptics.tapLight()
    if (r.unlocked.length) showUnlocked(r.unlocked)
  }

  // "Restart pet": wipe all on-device game state and reload to a clean egg.
  function handleRestartPet() {
    clearGameState()
    try {
      localStorage.removeItem('todomon_hunger_v1')
      localStorage.removeItem('todomon_streak_v1')
      localStorage.removeItem('todomon_pet_name')
      localStorage.removeItem('todomon_game_v1')
    } catch {
      // ignore storage errors
    }
    window.location.reload()
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
      {creature && (
        <Onboarding
          creature={creature}
          tasks={tasks}
          petName={creature.name}
          onRename={handleRename}
          onAdd={handleAdd}
          onComplete={handleComplete}
        />
      )}
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
        game={game}
        coinGain={coinGain}
        feedSignal={feedSignal}
        isPro={pro}
        onOpenPaywall={() => setPaywallOpen(true)}
        onFeed={handleFeed}
        onRename={handleRename}
        onToggleNight={() => setNight((n) => !n)}
        onOpenSettings={() => setSettingsOpen(true)}
        onAdd={handleAdd}
        onComplete={handleComplete}
        onUncomplete={handleUncomplete}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      {settingsOpen && creature && (
        <Settings
          petName={creature.name}
          isPro={pro}
          onGoPro={() => {
            setSettingsOpen(false)
            setPaywallOpen(true)
          }}
          onRename={handleRename}
          onRestart={handleRestartPet}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {paywallOpen && (
        <Paywall
          isPro={pro}
          onBuy={handleBuyPro}
          onRestore={handleRestorePro}
          onClose={() => setPaywallOpen(false)}
        />
      )}
      {evolveStage && (
        <EvolutionCelebration stage={evolveStage} onClose={() => setEvolveStage(null)} />
      )}
      {achToast && (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex justify-center">
          <div className="toast-in flex items-center gap-2 rounded-2xl bg-slate-900/90 px-4 py-2.5 text-white shadow-xl">
            <span className="text-2xl">{achToast.emoji}</span>
            <div className="text-left leading-tight">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-300">
                Trophy unlocked
              </p>
              <p className="text-sm font-extrabold">{achToast.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
