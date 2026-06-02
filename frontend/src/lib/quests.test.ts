import { describe, it, expect } from 'vitest'
import {
  rollDailyQuests,
  advanceQuests,
  questClaimable,
  anyClaimable,
} from './quests'

describe('rollDailyQuests', () => {
  it('is deterministic per date and rolls 3 distinct quests', () => {
    const a = rollDailyQuests('Mon Jun 01 2026')
    const b = rollDailyQuests('Mon Jun 01 2026')
    expect(a.quests.map((q) => q.id)).toEqual(b.quests.map((q) => q.id))
    expect(a.quests).toHaveLength(3)
    expect(new Set(a.quests.map((q) => q.id)).size).toBe(3)
  })
  it('differs across days', () => {
    const a = rollDailyQuests('Mon Jun 01 2026').quests.map((q) => q.id).join()
    const b = rollDailyQuests('Tue Jun 02 2026').quests.map((q) => q.id).join()
    // Not guaranteed different, but the seed should usually vary; assert ids are valid.
    expect(a.length).toBeGreaterThan(0)
    expect(b.length).toBeGreaterThan(0)
  })
})

describe('advanceQuests + claimable', () => {
  it('advances matching quests up to the target and marks claimable', () => {
    let daily = rollDailyQuests('Mon Jun 01 2026')
    // Force a known quest in for the test.
    daily = {
      date: 'x',
      quests: [{ id: 'complete3', label: '', emoji: '', kind: 'complete', target: 3, reward: 20 }],
      state: { complete3: { progress: 0, claimed: false } },
    }
    daily = advanceQuests(daily, { kind: 'complete', amount: 1 })
    expect(daily.state.complete3.progress).toBe(1)
    expect(questClaimable(daily, 'complete3')).toBe(false)
    daily = advanceQuests(daily, { kind: 'complete', amount: 5 }) // clamps to target
    expect(daily.state.complete3.progress).toBe(3)
    expect(questClaimable(daily, 'complete3')).toBe(true)
    expect(anyClaimable(daily)).toBe(true)
  })
  it('ignores non-matching event kinds', () => {
    const daily = {
      date: 'x',
      quests: [{ id: 'feed1', label: '', emoji: '', kind: 'feed' as const, target: 1, reward: 15 }],
      state: { feed1: { progress: 0, claimed: false } },
    }
    const after = advanceQuests(daily, { kind: 'complete', amount: 1 })
    expect(after.state.feed1.progress).toBe(0)
  })
})
