import type { GameStats } from './gameTypes'

export interface Achievement {
  id: string
  name: string
  desc: string
  emoji: string
  reward: number
  check: (s: GameStats) => boolean
}

// STAGE_ORDER indices: egg0 hatchling1 baby2 rookie3 champion4 ultimate5 mega6.
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_task', name: 'First Step', desc: 'Complete your first task', emoji: '👣', reward: 10, check: (s) => s.tasksCompletedTotal >= 1 },
  { id: 'tasks_10', name: 'Getting Started', desc: 'Complete 10 tasks', emoji: '🔟', reward: 25, check: (s) => s.tasksCompletedTotal >= 10 },
  { id: 'tasks_50', name: 'Committed', desc: 'Complete 50 tasks', emoji: '⭐', reward: 75, check: (s) => s.tasksCompletedTotal >= 50 },
  { id: 'tasks_100', name: 'Centurion', desc: 'Complete 100 tasks', emoji: '💯', reward: 150, check: (s) => s.tasksCompletedTotal >= 100 },
  { id: 'streak_3', name: 'Warming Up', desc: 'Reach a 3-day streak', emoji: '✨', reward: 30, check: (s) => s.bestStreak >= 3 },
  { id: 'streak_7', name: 'On Fire', desc: 'Reach a 7-day streak', emoji: '🔥', reward: 75, check: (s) => s.bestStreak >= 7 },
  { id: 'streak_30', name: 'Unstoppable', desc: 'Reach a 30-day streak', emoji: '🚀', reward: 300, check: (s) => s.bestStreak >= 30 },
  { id: 'feed_10', name: 'Caretaker', desc: 'Feed your dragon 10 times', emoji: '🍖', reward: 50, check: (s) => s.feedCount >= 10 },
  { id: 'evolve_baby', name: 'Growing Up', desc: 'Evolve to Baby', emoji: '🐣', reward: 50, check: (s) => s.maxStageIdx >= 2 },
  { id: 'evolve_champion', name: 'Champion', desc: 'Evolve to Champion', emoji: '🏆', reward: 150, check: (s) => s.maxStageIdx >= 4 },
  { id: 'evolve_mega', name: 'Legendary', desc: 'Evolve to Mega', emoji: '🐲', reward: 500, check: (s) => s.maxStageIdx >= 6 },
]

export function achievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id)
}

// All achievement ids currently satisfied by the given stats.
export function evaluateAchievements(stats: GameStats): string[] {
  return ACHIEVEMENTS.filter((a) => a.check(stats)).map((a) => a.id)
}

// Newly-unlocked ids = satisfied now but not in the already-unlocked set.
export function newlyUnlocked(stats: GameStats, already: string[]): string[] {
  const set = new Set(already)
  return evaluateAchievements(stats).filter((id) => !set.has(id))
}
