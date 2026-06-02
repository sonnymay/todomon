import { describe, it, expect } from 'vitest'
import { evaluateAchievements, newlyUnlocked } from './achievements'
import type { GameStats } from './gameTypes'

const base: GameStats = {
  tasksCompletedTotal: 0,
  todayDate: '',
  todayCount: 0,
  bestStreak: 0,
  maxStageIdx: 0,
  coinsEarnedTotal: 0,
  feedCount: 0,
}

describe('evaluateAchievements', () => {
  it('unlocks nothing at zero stats', () => {
    expect(evaluateAchievements(base)).toEqual([])
  })
  it('unlocks first_task at one completion', () => {
    expect(evaluateAchievements({ ...base, tasksCompletedTotal: 1 })).toContain('first_task')
  })
  it('unlocks tiered task achievements cumulatively', () => {
    const ids = evaluateAchievements({ ...base, tasksCompletedTotal: 100 })
    expect(ids).toEqual(expect.arrayContaining(['first_task', 'tasks_10', 'tasks_50', 'tasks_100']))
  })
  it('unlocks evolution + streak + feed achievements', () => {
    const ids = evaluateAchievements({
      ...base,
      maxStageIdx: 6,
      bestStreak: 30,
      feedCount: 10,
    })
    expect(ids).toEqual(
      expect.arrayContaining(['evolve_baby', 'evolve_champion', 'evolve_mega', 'streak_30', 'feed_10']),
    )
  })
})

describe('newlyUnlocked', () => {
  it('returns only ids not already unlocked', () => {
    const stats = { ...base, tasksCompletedTotal: 10 }
    const fresh = newlyUnlocked(stats, ['first_task'])
    expect(fresh).toContain('tasks_10')
    expect(fresh).not.toContain('first_task')
  })
})
