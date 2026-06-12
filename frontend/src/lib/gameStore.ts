import { useCallback, useState } from 'react'
import type { Difficulty } from './stages'
import type { DiaryMemory, GameState, GameStats } from './gameTypes'
import {
  coinsForCompletion,
  luckyBonus,
  streakMilestoneReward,
  FEED_COST,
  DAILY_BONUS,
  STREAK_FREEZE_COST,
  MAX_STREAK_FREEZES,
} from './economy'
import { rollDailyQuests, advanceQuests, questClaimable } from './quests'
import { newlyUnlocked, achievementById } from './achievements'
import { cosmeticById, PRO_COSMETIC_IDS } from './cosmetics'

const KEY = 'todomon_game_v1'

function freshStats(today: string): GameStats {
  return {
    tasksCompletedTotal: 0,
    todayDate: today,
    todayCount: 0,
    bestStreak: 0,
    maxStageIdx: 0,
    coinsEarnedTotal: 0,
    feedCount: 0,
  }
}

function freshState(today: string): GameState {
  return {
    coins: 0,
    stats: freshStats(today),
    daily: rollDailyQuests(today),
    achievements: [],
    seenAchievements: [],
    owned: [],
    equipped: { aura: null, frame: null, flair: null },
    streakFreezes: 0,
    lastDailyBonus: null,
    lastMemory: null,
  }
}

// Apply day rollover: re-roll quests on a new day and reset the per-day task count.
function rollover(state: GameState, today: string): GameState {
  let next = state
  if (state.daily.date !== today) {
    next = { ...next, daily: rollDailyQuests(today) }
  }
  if (state.stats.todayDate !== today) {
    next = { ...next, stats: { ...next.stats, todayDate: today, todayCount: 0 } }
  }
  return next
}

function read(today: string): GameState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as GameState
      if (typeof parsed.coins === 'number' && parsed.stats && parsed.daily) {
        return rollover(parsed, today)
      }
    }
  } catch {
    // malformed — fall through to fresh
  }
  return freshState(today)
}

function write(state: GameState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // storage unavailable — in-memory only
  }
}

export interface CompletionResult {
  coins: number
  lucky: number
  milestone: number
  unlocked: string[] // achievement ids newly unlocked
}

export interface UseGameStore {
  state: GameState
  recordCompletion: (difficulty: Difficulty, streak: number, coinMult?: number) => CompletionResult
  recordEvolve: (stageIdx: number) => string[]
  feed: () => { ok: boolean; unlocked: string[] }
  claimQuest: (id: string) => number
  claimDailyBonus: () => number
  buy: (cosmeticId: string) => boolean
  equip: (cosmeticId: string) => void
  grantProCosmetics: () => void
  markAchievementsSeen: () => void
  noteMemory: (m: Omit<DiaryMemory, 'at'>) => void
  buyStreakFreeze: () => boolean
  consumeStreakFreezes: (n: number) => void
}

export function useGameStore(today: string): UseGameStore {
  const [state, setState] = useState<GameState>(() => read(today))

  // Award the rewards from satisfying new achievements; returns ids + total coins.
  const applyAchievements = useCallback((s: GameState): { state: GameState; unlocked: string[] } => {
    const fresh = newlyUnlocked(s.stats, s.achievements)
    if (fresh.length === 0) return { state: s, unlocked: [] }
    const reward = fresh.reduce((sum, id) => sum + (achievementById(id)?.reward ?? 0), 0)
    return {
      state: {
        ...s,
        achievements: [...s.achievements, ...fresh],
        coins: s.coins + reward,
        stats: { ...s.stats, coinsEarnedTotal: s.stats.coinsEarnedTotal + reward },
      },
      unlocked: fresh,
    }
  }, [])

  const recordCompletion = useCallback(
    (difficulty: Difficulty, streak: number, coinMult = 1): CompletionResult => {
      const base = coinsForCompletion(difficulty, streak) * coinMult
      const lucky = luckyBonus(Math.random())
      let result: CompletionResult = { coins: base, lucky, milestone: 0, unlocked: [] }
      setState((prev) => {
        let s = rollover(prev, today)
        // Streak milestone fires once, when bestStreak first reaches the milestone day.
        const milestone =
          streak > s.stats.bestStreak ? streakMilestoneReward(streak) : 0
        const earned = base + lucky + milestone
        const stats = {
          ...s.stats,
          tasksCompletedTotal: s.stats.tasksCompletedTotal + 1,
          todayCount: s.stats.todayCount + 1,
          bestStreak: Math.max(s.stats.bestStreak, streak),
          coinsEarnedTotal: s.stats.coinsEarnedTotal + earned,
        }
        let daily = advanceQuests(s.daily, { kind: 'complete', amount: 1 })
        if (difficulty === 'LARGE') daily = advanceQuests(daily, { kind: 'completeBig', amount: 1 })
        daily = advanceQuests(daily, { kind: 'earnCoins', amount: base + lucky })
        s = { ...s, coins: s.coins + earned, stats, daily }
        const ach = applyAchievements(s)
        result = { coins: base, lucky, milestone, unlocked: ach.unlocked }
        write(ach.state)
        return ach.state
      })
      return result
    },
    [today, applyAchievements],
  )

  const recordEvolve = useCallback(
    (stageIdx: number): string[] => {
      let unlocked: string[] = []
      setState((prev) => {
        const s = { ...prev, stats: { ...prev.stats, maxStageIdx: Math.max(prev.stats.maxStageIdx, stageIdx) } }
        const ach = applyAchievements(s)
        unlocked = ach.unlocked
        write(ach.state)
        return ach.state
      })
      return unlocked
    },
    [applyAchievements],
  )

  const feed = useCallback((): { ok: boolean; unlocked: string[] } => {
    let res = { ok: false, unlocked: [] as string[] }
    setState((prev) => {
      if (prev.coins < FEED_COST) {
        res = { ok: false, unlocked: [] }
        return prev
      }
      let s = rollover(prev, today)
      s = {
        ...s,
        coins: s.coins - FEED_COST,
        stats: { ...s.stats, feedCount: s.stats.feedCount + 1 },
        daily: advanceQuests(s.daily, { kind: 'feed', amount: 1 }),
      }
      const ach = applyAchievements(s)
      res = { ok: true, unlocked: ach.unlocked }
      write(ach.state)
      return ach.state
    })
    return res
  }, [today, applyAchievements])

  const claimQuest = useCallback((id: string): number => {
    let reward = 0
    setState((prev) => {
      if (!questClaimable(prev.daily, id)) return prev
      const q = prev.daily.quests.find((x) => x.id === id)
      if (!q) return prev
      reward = q.reward
      const next = {
        ...prev,
        coins: prev.coins + q.reward,
        stats: { ...prev.stats, coinsEarnedTotal: prev.stats.coinsEarnedTotal + q.reward },
        daily: {
          ...prev.daily,
          state: { ...prev.daily.state, [id]: { ...prev.daily.state[id], claimed: true } },
        },
      }
      write(next)
      return next
    })
    return reward
  }, [])

  const claimDailyBonus = useCallback((): number => {
    let granted = 0
    setState((prev) => {
      if (prev.lastDailyBonus === today) return prev
      granted = DAILY_BONUS
      const next = {
        ...prev,
        coins: prev.coins + DAILY_BONUS,
        stats: { ...prev.stats, coinsEarnedTotal: prev.stats.coinsEarnedTotal + DAILY_BONUS },
        lastDailyBonus: today,
      }
      write(next)
      return next
    })
    return granted
  }, [today])

  const buy = useCallback((cosmeticId: string): boolean => {
    let ok = false
    setState((prev) => {
      const c = cosmeticById(cosmeticId)
      if (!c || prev.owned.includes(cosmeticId) || prev.coins < c.cost) return prev
      ok = true
      const next = {
        ...prev,
        coins: prev.coins - c.cost,
        owned: [...prev.owned, cosmeticId],
        equipped: { ...prev.equipped, [c.kind]: cosmeticId },
      }
      write(next)
      return next
    })
    return ok
  }, [])

  const equip = useCallback((cosmeticId: string): void => {
    setState((prev) => {
      const c = cosmeticById(cosmeticId)
      if (!c || !prev.owned.includes(cosmeticId)) return prev
      const current = prev.equipped[c.kind]
      const next = {
        ...prev,
        equipped: { ...prev.equipped, [c.kind]: current === cosmeticId ? null : cosmeticId },
      }
      write(next)
      return next
    })
  }, [])

  // Grant all Pro cosmetics into `owned` (called after a successful Pro purchase/restore).
  const grantProCosmetics = useCallback((): void => {
    setState((prev) => {
      const toAdd = PRO_COSMETIC_IDS.filter((id) => !prev.owned.includes(id))
      if (toAdd.length === 0) return prev
      const next = { ...prev, owned: [...prev.owned, ...toAdd] }
      write(next)
      return next
    })
  }, [])

  // Buy a Streak Freeze 🧊 (covers one missed day; held count is capped).
  const buyStreakFreeze = useCallback((): boolean => {
    let ok = false
    setState((prev) => {
      if (prev.coins < STREAK_FREEZE_COST || prev.streakFreezes >= MAX_STREAK_FREEZES) {
        return prev
      }
      ok = true
      const next = {
        ...prev,
        coins: prev.coins - STREAK_FREEZE_COST,
        streakFreezes: prev.streakFreezes + 1,
      }
      write(next)
      return next
    })
    return ok
  }, [])

  // Spend held freezes (called by the streak rescue in useStreak).
  const consumeStreakFreezes = useCallback((n: number): void => {
    setState((prev) => {
      if (n <= 0 || prev.streakFreezes <= 0) return prev
      const next = { ...prev, streakFreezes: Math.max(0, prev.streakFreezes - n) }
      write(next)
      return next
    })
  }, [])

  // Record the latest Dragon Diary memory (completion / streak / evolution).
  const noteMemory = useCallback((m: Omit<DiaryMemory, 'at'>): void => {
    setState((prev) => {
      const next = { ...prev, lastMemory: { ...m, at: Date.now() } }
      write(next)
      return next
    })
  }, [])

  const markAchievementsSeen = useCallback((): void => {
    setState((prev) => {
      if (prev.seenAchievements.length === prev.achievements.length) return prev
      const next = { ...prev, seenAchievements: [...prev.achievements] }
      write(next)
      return next
    })
  }, [])

  return {
    state,
    recordCompletion,
    recordEvolve,
    feed,
    claimQuest,
    claimDailyBonus,
    buy,
    equip,
    grantProCosmetics,
    markAchievementsSeen,
    noteMemory,
    buyStreakFreeze,
    consumeStreakFreezes,
  }
}
