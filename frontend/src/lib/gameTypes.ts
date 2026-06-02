// Shared types for the engagement layer (coins, quests, achievements, cosmetics).
// Pure types only — no imports — so economy/quests/achievements/gameStore can all reuse
// them without circular dependencies.

export interface GameStats {
  tasksCompletedTotal: number
  todayDate: string // toDateString() the todayCount belongs to
  todayCount: number
  bestStreak: number
  maxStageIdx: number // highest STAGE_ORDER index reached
  coinsEarnedTotal: number
  feedCount: number
}

export type QuestKind = 'complete' | 'completeBig' | 'feed' | 'earnCoins'

export interface Quest {
  id: string
  label: string
  emoji: string
  kind: QuestKind
  target: number
  reward: number
}

export interface QuestState {
  progress: number
  claimed: boolean
}

export interface DailyQuests {
  date: string // toDateString()
  quests: Quest[]
  state: Record<string, QuestState>
}

export type CosmeticKind = 'aura' | 'frame' | 'flair'

export interface EquippedCosmetics {
  aura: string | null
  frame: string | null
  flair: string | null
}

export interface GameState {
  coins: number
  stats: GameStats
  daily: DailyQuests
  achievements: string[] // unlocked ids
  seenAchievements: string[] // ids the user has viewed (for the "new" badge)
  owned: string[] // owned cosmetic ids
  equipped: EquippedCosmetics
  streakFreezes: number
  lastDailyBonus: string | null // toDateString()
}
