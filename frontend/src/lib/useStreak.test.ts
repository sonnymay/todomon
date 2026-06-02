import { describe, it, expect } from 'vitest'
import { currentStreak, registerCompletion, type StreakState } from './useStreak'

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
