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

// Pet name persists in dev mode so a rename survives refresh.
const PET_NAME_KEY = 'todomon_pet_name'
export const DEFAULT_PET_NAME = 'Sunny'

export function getStoredPetName(): string {
  try {
    return localStorage.getItem(PET_NAME_KEY) || DEFAULT_PET_NAME
  } catch {
    return DEFAULT_PET_NAME
  }
}

export function setStoredPetName(name: string): void {
  try {
    localStorage.setItem(PET_NAME_KEY, name)
  } catch {
    // storage unavailable — name stays in memory only
  }
}

// Seeded so the screen looks like the mockup (an evolved creature mid-progress).
// Under the ramping curve, 14,750 XP ≈ level 50 → champion stage.
export function seedCreature(): Creature {
  const xp = 14750
  return {
    id: localId(),
    user_id: DEV_USER,
    name: getStoredPetName(),
    stage: stageForXp(xp),
    xp,
    created_at: now(),
    updated_at: now(),
  }
}

export function seedTasks(): Task[] {
  let seq = 0
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
    seq: ++seq,
  })

  // Every task is worth the same (kept simple — no difficulty).
  return [
    t('Plan my day', 'Review top 3 priorities', 20, true),
    t('Finish project outline', 'Complete the first draft', 20),
    t('Workout for 30 minutes', 'Stay healthy and strong', 20),
    t('Study new topic', 'Learn something new', 20),
    t('Reply to important emails', 'Clear inbox and follow up', 20),
  ]
}

export function localTask(
  title: string,
  xpReward: number,
  notes?: string,
  seq?: number,
): Task {
  return {
    id: localId(),
    user_id: DEV_USER,
    title,
    notes: notes?.trim() ? notes.trim() : null,
    xp_reward: xpReward,
    is_done: false,
    created_at: new Date().toISOString(),
    completed_at: null,
    seq,
  }
}

// Next permanent task number: one past the highest seq currently in use. Computed from
// the live list (not a module counter) so it survives StrictMode double-invokes.
export function nextTaskSeq(tasks: Task[]): number {
  return tasks.reduce((max, t) => Math.max(max, t.seq ?? 0), 0) + 1
}
