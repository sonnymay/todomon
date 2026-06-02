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
  registerCompletion: () => void
}

// Normalize a Postgres `date` ("2026-06-01") to the toDateString() form the streak logic
// compares against ("Mon Jun 01 2026"). Noon avoids any timezone day-shift.
function normalizeServerDate(d: string | null): string | null {
  if (!d) return null
  return new Date(`${d}T12:00:00`).toDateString()
}

// `serverSeed` (real mode) makes the streak server-authoritative so it survives reinstall;
// without it (dev mode) the streak is localStorage-backed exactly as before. Same rules
// both sides, so the optimistic client update agrees with the server.
export function useStreak(serverSeed?: {
  count: number
  lastDate: string | null
}): UseStreak {
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

  const register = useCallback(() => {
    setState((prev) => {
      const next = registerCompletion(prev, Date.now())
      if (next === prev) return prev
      if (!controlled) write(next)
      return next
    })
  }, [controlled])

  return { streak: currentStreak(state, Date.now()), registerCompletion: register }
}
