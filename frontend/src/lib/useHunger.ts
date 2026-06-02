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
  devAdjustHunger: (delta: number) => void
}

// `serverSeed` (real mode) makes hunger server-authoritative: the bar seeds from the
// creature row and re-seeds whenever the server returns a new value. Without it (dev mode)
// hunger is localStorage-backed exactly as before. Local +/- nudges stay for instant
// feedback; in real mode the next server re-seed reconciles them.
export function useHunger(serverSeed?: {
  value: number
  updatedAt: number
}): UseHunger {
  const controlled = serverSeed != null

  const [state, setState] = useState<HungerState>(() => {
    const decayed = applyDecay(serverSeed ?? readState(), Date.now())
    if (!controlled) writeState(decayed)
    return decayed
  })

  // Re-seed from the server when the authoritative value changes (real mode only).
  useEffect(() => {
    if (!serverSeed) return
    setState(applyDecay(serverSeed, Date.now()))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverSeed?.value, serverSeed?.updatedAt])

  // Live decay tick.
  useEffect(() => {
    const id = setInterval(() => {
      setState((prev) => {
        const next = applyDecay(prev, Date.now())
        if (next === prev) return prev
        if (!controlled) writeState(next)
        return next
      })
    }, TICK_MS)
    return () => clearInterval(id)
  }, [controlled])

  const nudge = useCallback(
    (delta: number) => {
      setState((prev) => {
        const decayed = applyDecay(prev, Date.now())
        const next = { value: clamp(decayed.value + delta), updatedAt: decayed.updatedAt }
        if (!controlled) writeState(next)
        return next
      })
    },
    [controlled],
  )

  const onTaskCompleted = useCallback(() => nudge(1), [nudge])
  // Reverse of onTaskCompleted, for undoing an accidental completion.
  const onTaskUndone = useCallback(() => nudge(-1), [nudge])
  // Dev/testing helper: nudge hunger by an arbitrary delta (e.g. food test buttons).
  const devAdjustHunger = useCallback((d: number) => nudge(d), [nudge])

  return { hunger: state.value, onTaskCompleted, onTaskUndone, devAdjustHunger }
}
