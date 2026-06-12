import type { Difficulty } from './stages'

// Coin economy — all pure so it's easy to test and reason about.

// Base coins per task by difficulty.
export const COINS_BY_DIFFICULTY: Record<Difficulty, number> = {
  SMALL: 5,
  MEDIUM: 10,
  LARGE: 18,
}

// A small streak kicker so longer streaks pay more (capped so it stays fair).
export function streakBonus(streakDays: number): number {
  return Math.min(Math.max(0, streakDays), 10)
}

export function coinsForCompletion(difficulty: Difficulty, streakDays: number): number {
  return COINS_BY_DIFFICULTY[difficulty] + streakBonus(streakDays)
}

// Variable reward: a rare bonus drop on completion (the "one more task" hook).
export const LUCKY_CHANCE = 0.15
export const LUCKY_AMOUNT = 25

// `rand` is a [0,1) value (Math.random in app code; fixed in tests).
export function luckyBonus(rand: number): number {
  return rand < LUCKY_CHANCE ? LUCKY_AMOUNT : 0
}

// Feeding the pet.
export const FEED_COST = 12
export const FEED_RESTORE = 30 // hunger points restored per feed

// Daily login reward.
export const DAILY_BONUS = 20

// Streak Freeze: covers one missed day so the streak survives. Capped so it stays a
// safety net, not a way to stop playing.
export const STREAK_FREEZE_COST = 60
export const MAX_STREAK_FREEZES = 2

// Streak milestones → bonus coins (returned when the streak first reaches the day).
export const STREAK_MILESTONES: Record<number, number> = {
  3: 30,
  7: 75,
  14: 150,
  30: 400,
}

export function streakMilestoneReward(streakDays: number): number {
  return STREAK_MILESTONES[streakDays] ?? 0
}
