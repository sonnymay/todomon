import { describe, it, expect } from 'vitest'
import {
  xpForLevel,
  levelFromXp,
  stageForLevel,
  stageForXp,
  STAGE_LEVEL,
  levelInfo,
  nextEvolution,
} from './stages'

describe('xpForLevel / levelFromXp are inverse', () => {
  it('matches the documented anchor points', () => {
    expect(xpForLevel(0)).toBe(0)
    expect(xpForLevel(1)).toBe(50)
    expect(xpForLevel(15)).toBe(1800)
    expect(xpForLevel(60)).toBe(20700)
    expect(xpForLevel(100)).toBe(54500)
  })

  it('levelFromXp inverts xpForLevel at level boundaries', () => {
    for (const lvl of [0, 1, 5, 15, 30, 45, 60, 100]) {
      expect(levelFromXp(xpForLevel(lvl))).toBe(lvl)
    }
  })

  it('levelFromXp clamps non-positive xp to level 0', () => {
    expect(levelFromXp(0)).toBe(0)
    expect(levelFromXp(-100)).toBe(0)
  })

  it('stays one level below until the next threshold is reached', () => {
    expect(levelFromXp(xpForLevel(15) - 1)).toBe(14)
  })
})

describe('stage mapping', () => {
  it('stageForLevel returns the highest unlocked stage', () => {
    expect(stageForLevel(0)).toBe('egg')
    expect(stageForLevel(1)).toBe('hatchling')
    expect(stageForLevel(14)).toBe('hatchling')
    expect(stageForLevel(15)).toBe('baby')
    expect(stageForLevel(59)).toBe('champion')
    expect(stageForLevel(60)).toBe('ultimate')
    expect(stageForLevel(1000)).toBe('mega')
  })

  it('stageForXp composes levelFromXp + stageForLevel', () => {
    expect(stageForXp(xpForLevel(STAGE_LEVEL.ultimate))).toBe('ultimate')
    expect(stageForXp(xpForLevel(STAGE_LEVEL.mega))).toBe('mega')
  })
})

describe('levelInfo progress bar', () => {
  it('is 0% exactly at a level boundary', () => {
    expect(levelInfo(xpForLevel(15)).pct).toBe(0)
  })

  it('reports xpToNext and a clamped 0-100 pct mid-level', () => {
    const info = levelInfo(xpForLevel(5) + 10)
    expect(info.level).toBe(5)
    expect(info.pct).toBeGreaterThan(0)
    expect(info.pct).toBeLessThanOrEqual(100)
    expect(info.xpToNext).toBeGreaterThan(0)
  })
})

describe('nextEvolution', () => {
  it('returns the next stage and its unlock level', () => {
    expect(nextEvolution('champion')).toEqual({ stage: 'ultimate', level: 60 })
  })
  it('returns null at the final stage', () => {
    expect(nextEvolution('mega')).toBeNull()
  })
})
