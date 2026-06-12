import { useCallback, useEffect, useState } from 'react'

// Daily streak: how many consecutive calendar days the user has completed at least one
// task, ending today (or yesterday — a streak stays "alive" until the day after lapses).
// Persisted to localStorage so it survives refreshes in dev mode (where tasks reset).

const STORAGE_KEY = 'todomon_streak_v1'
const DAY_MS = 24 * 60 * 60 * 1000

export interface StreakState {
  count: number
  lastDate: string | null // toDateString() of the most recent completion day
}

const dayKey = (ms: number): string => new Date(ms).toDateString()

// The streak to SHOW right now: the stored count if the last completion was today or
// yesterday, otherwise 0 (it lapsed). Pure — pass `nowMs` for deterministic tests.
export function currentStreak(state: StreakState, nowMs: number): number {
  if (!state.lastDate) return 0
  if (state.lastDate === dayKey(nowMs) || state.lastDate === dayKey(nowMs - DAY_MS)) {
    return state.count
  }
  return 0
}

// New state after a task is completed: +1 if continuing from yesterday, reset to 1 if the
// streak had lapsed, unchanged if already counted today. Pure.
export function registerCompletion(state: StreakState, nowMs: number): StreakState {
  const today = dayKey(nowMs)
  if (state.lastDate === today) return state
  const continuing = state.lastDate === dayKey(nowMs - DAY_MS)
  return { count: continuing ? state.count + 1 : 1, lastDate: today }
}

// Streak-freeze rescue: if the streak lapsed but the user holds enough freezes to cover
// every missed day, "repair" the state as if the last completion were yesterday — the
// streak survives. Returns how many freezes were spent (0 = nothing to do / not enough).
// Pure — pass `nowMs` for deterministic tests.
export function reconcileFreeze(
  state: StreakState,
  nowMs: number,
  freezes: number,
): { state: StreakState; used: number } {
  if (!state.lastDate || state.count === 0 || freezes <= 0) return { state, used: 0 }
  if (currentStreak(state, nowMs) > 0) return { state, used: 0 } // still alive
  const lastMs = new Date(state.lastDate).getTime()
  if (Number.isNaN(lastMs)) return { state, used: 0 }
  // Whole days between the last completion day and today (both at local midnight).
  const days = Math.round((new Date(dayKey(nowMs)).getTime() - lastMs) / DAY_MS)
  const missed = days - 1 // days with no completion, excluding today
  if (missed < 1 || missed > freezes) return { state, used: 0 }
  return { state: { count: state.count, lastDate: dayKey(nowMs - DAY_MS) }, used: missed }
}

function read(): StreakState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StreakState>
      if (typeof parsed.count === 'number') {
        return { count: parsed.count, lastDate: parsed.lastDate ?? null }
      }
    }
  } catch {
    // ignore malformed storage
  }
  return { count: 0, lastDate: null }
}

function write(state: StreakState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage unavailable — degrade to in-memory only
  }
}

export interface UseStreak {
  streak: number
  registerCompletion: () => number
}

// Normalize a Postgres `date` ("2026-06-01") to the toDateString() form the streak logic
// compares against ("Mon Jun 01 2026"). Noon avoids any timezone day-shift.
function normalizeServerDate(d: string | null): string | null {
  if (!d) return null
  return new Date(`${d}T12:00:00`).toDateString()
}

// Lets the streak spend the game store's held freezes when it lapsed: `available` is how
// many the user holds, `consume` is called once with how many were spent + the rescued count.
export interface FreezeBridge {
  available: number
  consume: (used: number, keptStreak: number) => void
}

// `serverSeed` (real mode) makes the streak server-authoritative so it survives reinstall;
// without it (dev mode) the streak is localStorage-backed exactly as before. Same rules
// both sides, so the optimistic client update agrees with the server.
// `freezeBridge` enables streak-freeze rescue (offline mode only — the server streak is
// authoritative in real mode, so freezes are skipped there).
export function useStreak(
  serverSeed?: {
    count: number
    lastDate: string | null
  },
  freezeBridge?: FreezeBridge,
): UseStreak {
  const controlled = serverSeed != null
  const seeded: StreakState | null = serverSeed
    ? { count: serverSeed.count, lastDate: normalizeServerDate(serverSeed.lastDate) }
    : null

  const [state, setState] = useState<StreakState>(() => seeded ?? read())

  // Re-seed from the server when its value changes (real mode only).
  useEffect(() => {
    if (!seeded) return
    setState(seeded)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverSeed?.count, serverSeed?.lastDate])

  // Streak-freeze rescue — once, on mount. Both stores load synchronously from
  // localStorage, so the freeze count available at mount is authoritative.
  useEffect(() => {
    if (controlled || !freezeBridge || freezeBridge.available <= 0) return
    const res = reconcileFreeze(state, Date.now(), freezeBridge.available)
    if (res.used > 0) {
      write(res.state)
      setState(res.state)
      freezeBridge.consume(res.used, res.state.count)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const register = useCallback((): number => {
    const now = Date.now()
    const next = registerCompletion(state, now)
    if (next !== state) {
      if (!controlled) write(next)
      setState(next)
    }
    return currentStreak(next, now)
  }, [controlled, state])

  return { streak: currentStreak(state, Date.now()), registerCompletion: register }
}
