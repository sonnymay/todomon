import { describe, it, expect } from 'vitest'
import {
  currentStreak,
  reconcileFreeze,
  registerCompletion,
  type StreakState,
} from './useStreak'

const DAY = 24 * 60 * 60 * 1000
// A fixed reference "now" (avoids real Date.now in tests). Noon keeps day math off DST edges.
const NOW = new Date('2026-06-01T12:00:00').getTime()
const key = (ms: number) => new Date(ms).toDateString()

describe('registerCompletion', () => {
  it('starts a streak at 1 from empty', () => {
    expect(registerCompletion({ count: 0, lastDate: null }, NOW)).toEqual({
      count: 1,
      lastDate: key(NOW),
    })
  })

  it('is idempotent for multiple completions on the same day', () => {
    const after = registerCompletion({ count: 3, lastDate: key(NOW) }, NOW)
    expect(after).toEqual({ count: 3, lastDate: key(NOW) })
  })

  it('increments when continuing from yesterday', () => {
    const state: StreakState = { count: 3, lastDate: key(NOW - DAY) }
    expect(registerCompletion(state, NOW)).toEqual({ count: 4, lastDate: key(NOW) })
  })

  it('resets to 1 after a gap of 2+ days', () => {
    const state: StreakState = { count: 9, lastDate: key(NOW - 3 * DAY) }
    expect(registerCompletion(state, NOW)).toEqual({ count: 1, lastDate: key(NOW) })
  })
})

describe('currentStreak (display)', () => {
  it('is 0 with no history', () => {
    expect(currentStreak({ count: 0, lastDate: null }, NOW)).toBe(0)
  })

  it('shows the count when last completion was today', () => {
    expect(currentStreak({ count: 5, lastDate: key(NOW) }, NOW)).toBe(5)
  })

  it('still shows the count when last completion was yesterday (not yet lapsed)', () => {
    expect(currentStreak({ count: 5, lastDate: key(NOW - DAY) }, NOW)).toBe(5)
  })

  it('lapses to 0 once two days have passed', () => {
    expect(currentStreak({ count: 5, lastDate: key(NOW - 2 * DAY) }, NOW)).toBe(0)
  })
})

describe('reconcileFreeze (streak-freeze rescue)', () => {
  it('does nothing while the streak is alive', () => {
    const state: StreakState = { count: 5, lastDate: key(NOW - DAY) }
    expect(reconcileFreeze(state, NOW, 2)).toEqual({ state, used: 0 })
  })

  it('does nothing with no freezes held', () => {
    const state: StreakState = { count: 5, lastDate: key(NOW - 2 * DAY) }
    expect(reconcileFreeze(state, NOW, 0)).toEqual({ state, used: 0 })
  })

  it('does nothing with no streak history', () => {
    const state: StreakState = { count: 0, lastDate: null }
    expect(reconcileFreeze(state, NOW, 2)).toEqual({ state, used: 0 })
  })

  it('spends one freeze to cover a single missed day', () => {
    const state: StreakState = { count: 5, lastDate: key(NOW - 2 * DAY) }
    const res = reconcileFreeze(state, NOW, 2)
    expect(res.used).toBe(1)
    expect(res.state).toEqual({ count: 5, lastDate: key(NOW - DAY) })
    // The repaired state reads as a live streak again.
    expect(currentStreak(res.state, NOW)).toBe(5)
  })

  it('spends two freezes to cover two missed days', () => {
    const state: StreakState = { count: 9, lastDate: key(NOW - 3 * DAY) }
    const res = reconcileFreeze(state, NOW, 2)
    expect(res.used).toBe(2)
    expect(currentStreak(res.state, NOW)).toBe(9)
  })

  it('does not partially cover a gap bigger than the freezes held', () => {
    const state: StreakState = { count: 9, lastDate: key(NOW - 4 * DAY) }
    expect(reconcileFreeze(state, NOW, 2)).toEqual({ state, used: 0 })
  })

  it('a rescued streak continues normally on the next completion', () => {
    const lapsed: StreakState = { count: 5, lastDate: key(NOW - 2 * DAY) }
    const rescued = reconcileFreeze(lapsed, NOW, 1).state
    expect(registerCompletion(rescued, NOW)).toEqual({ count: 6, lastDate: key(NOW) })
  })
})
