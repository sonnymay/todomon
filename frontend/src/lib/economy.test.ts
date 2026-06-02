import { describe, it, expect } from 'vitest'
import {
  coinsForCompletion,
  streakBonus,
  luckyBonus,
  LUCKY_CHANCE,
  LUCKY_AMOUNT,
  streakMilestoneReward,
  COINS_BY_DIFFICULTY,
} from './economy'

describe('coinsForCompletion', () => {
  it('uses the difficulty base with no streak', () => {
    expect(coinsForCompletion('SMALL', 0)).toBe(COINS_BY_DIFFICULTY.SMALL)
    expect(coinsForCompletion('LARGE', 0)).toBe(COINS_BY_DIFFICULTY.LARGE)
  })
  it('adds a capped streak bonus', () => {
    expect(coinsForCompletion('SMALL', 3)).toBe(COINS_BY_DIFFICULTY.SMALL + 3)
    expect(streakBonus(100)).toBe(10) // capped
    expect(streakBonus(-5)).toBe(0) // floored
  })
})

describe('luckyBonus', () => {
  it('pays out below the chance threshold and not above', () => {
    expect(luckyBonus(0)).toBe(LUCKY_AMOUNT)
    expect(luckyBonus(LUCKY_CHANCE - 0.001)).toBe(LUCKY_AMOUNT)
    expect(luckyBonus(LUCKY_CHANCE)).toBe(0)
    expect(luckyBonus(0.99)).toBe(0)
  })
})

describe('streakMilestoneReward', () => {
  it('rewards only exact milestone days', () => {
    expect(streakMilestoneReward(3)).toBeGreaterThan(0)
    expect(streakMilestoneReward(7)).toBeGreaterThan(0)
    expect(streakMilestoneReward(30)).toBeGreaterThan(0)
    expect(streakMilestoneReward(4)).toBe(0)
    expect(streakMilestoneReward(0)).toBe(0)
  })
})
