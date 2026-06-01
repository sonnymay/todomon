import { useCallback, useEffect, useState } from 'react'

// Real, time-based hunger for the pet:
//   - decays −1 every 30 minutes (even while the app is closed)
//   - +1 each time a task is completed
//   - persisted to localStorage so decay is "real" across refreshes (dev mode).
// When real Supabase mode lands, hunger moves to todomon_creatures (see roadmap 2.3);
// this hook is the dev-mode stopgap.

const STORAGE_KEY = 'todomon_hunger_v1'
const DECAY_STEP_MS = 30 * 60 * 1000 // −1 per 30 minutes
const TICK_MS = 60 * 1000 // recompute once a minute so the bar updates live
const MAX_HUNGER = 100
const MIN_HUNGER = 0

interface HungerState {
  value: number
  updatedAt: number // epoch ms
}

function clamp(n: number): number {
  return Math.min(MAX_HUNGER, Math.max(MIN_HUNGER, n))
}

function readState(): HungerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<HungerState>
      if (typeof parsed.value === 'number' && typeof parsed.updatedAt === 'number') {
        return { value: clamp(parsed.value), updatedAt: parsed.updatedAt }
      }
    }
  } catch {
    // ignore malformed storage and reset below
  }
  return { value: MAX_HUNGER, updatedAt: Date.now() }
}

function writeState(state: HungerState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage unavailable (private mode etc.) — degrade to in-memory only
  }
}

// Apply elapsed decay, carrying the sub-step remainder forward in updatedAt.
function applyDecay(state: HungerState, now: number): HungerState {
  const steps = Math.floor((now - state.updatedAt) / DECAY_STEP_MS)
  if (steps <= 0) return state
  return {
    value: clamp(state.value - steps),
    updatedAt: state.updatedAt + steps * DECAY_STEP_MS,
  }
}

export interface UseHunger {
  hunger: number
  onTaskCompleted: () => void
  onTaskUndone: () => void
}

export function useHunger(): UseHunger {
  const [state, setState] = useState<HungerState>(() => {
    const decayed = applyDecay(readState(), Date.now())
    writeState(decayed)
    return decayed
  })

  // Live decay tick.
  useEffect(() => {
    const id = setInterval(() => {
      setState((prev) => {
        const next = applyDecay(prev, Date.now())
        if (next === prev) return prev
        writeState(next)
        return next
      })
    }, TICK_MS)
    return () => clearInterval(id)
  }, [])

  const onTaskCompleted = useCallback(() => {
    setState((prev) => {
      const decayed = applyDecay(prev, Date.now())
      const next = { value: clamp(decayed.value + 1), updatedAt: decayed.updatedAt }
      writeState(next)
      return next
    })
  }, [])

  // Reverse of onTaskCompleted, for undoing an accidental completion.
  const onTaskUndone = useCallback(() => {
    setState((prev) => {
      const decayed = applyDecay(prev, Date.now())
      const next = { value: clamp(decayed.value - 1), updatedAt: decayed.updatedAt }
      writeState(next)
      return next
    })
  }, [])

  return { hunger: state.value, onTaskCompleted, onTaskUndone }
}
