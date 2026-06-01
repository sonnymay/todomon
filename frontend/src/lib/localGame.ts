import type { Creature, Task } from '../types'
import { stageForXp } from './stages'

// ── DEV / TESTING MODE ──────────────────────────────────────────────────────
// When true, the app skips Supabase auth and runs entirely on in-memory state
// seeded below. Nothing persists (a refresh resets to the seed). Flip to false
// to restore real authentication + Supabase-backed data.
export const DEV_NO_AUTH = true

let counter = 0
const localId = (): string => `local-${++counter}`

const DEV_USER = 'dev-user'
const now = (): string => new Date().toISOString()

// Seeded so the screen looks like the mockup (an evolved creature mid-progress).
// Under the ramping curve, 14,750 XP ≈ level 50 → champion stage.
export function seedCreature(): Creature {
  const xp = 14750
  return {
    id: localId(),
    user_id: DEV_USER,
    name: 'Sunny',
    stage: stageForXp(xp),
    xp,
    created_at: now(),
    updated_at: now(),
  }
}

export function seedTasks(): Task[] {
  const t = (
    title: string,
    notes: string,
    xp_reward: number,
    is_done = false,
  ): Task => ({
    id: localId(),
    user_id: DEV_USER,
    title,
    notes,
    xp_reward,
    is_done,
    created_at: now(),
    completed_at: is_done ? now() : null,
  })

  return [
    t('Plan my day', 'Review top 3 priorities', 20, true),
    t('Finish project outline', 'Complete the first draft', 40),
    t('Workout for 30 minutes', 'Stay healthy and strong', 60),
    t('Study new topic', 'Learn something new', 40),
    t('Reply to important emails', 'Clear inbox and follow up', 20),
  ]
}

export function localTask(title: string, xpReward: number): Task {
  return {
    id: localId(),
    user_id: DEV_USER,
    title,
    notes: null,
    xp_reward: xpReward,
    is_done: false,
    created_at: new Date().toISOString(),
    completed_at: null,
  }
}
