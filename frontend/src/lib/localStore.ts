import type { Creature, Task } from '../types'

// Offline-first on-device store: the creature + task list persist to localStorage so the
// pet and your tasks survive app restarts (the whole point of a Tamagotchi). Synchronous,
// try/catch-guarded — mirrors the useHunger storage pattern. (A later hardening can move to
// @capacitor/preferences for durability under iOS storage pressure.)

const CREATURE_KEY = 'todomon_creature_v1'
const TASKS_KEY = 'todomon_tasks_v1'

export function loadCreature(): Creature | null {
  try {
    const raw = localStorage.getItem(CREATURE_KEY)
    return raw ? (JSON.parse(raw) as Creature) : null
  } catch {
    return null
  }
}

export function saveCreature(creature: Creature): void {
  try {
    localStorage.setItem(CREATURE_KEY, JSON.stringify(creature))
  } catch {
    // storage unavailable — degrade to in-memory only
  }
}

export function loadTasks(): Task[] | null {
  try {
    const raw = localStorage.getItem(TASKS_KEY)
    return raw ? (JSON.parse(raw) as Task[]) : null
  } catch {
    return null
  }
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
  } catch {
    // storage unavailable — degrade to in-memory only
  }
}

// Wipe persisted pet/task state (used by the "Restart pet" setting). Hunger/streak/onboarding
// keys are cleared by their own owners when relevant.
export function clearGameState(): void {
  try {
    localStorage.removeItem(CREATURE_KEY)
    localStorage.removeItem(TASKS_KEY)
  } catch {
    // ignore
  }
}
