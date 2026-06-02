import type { DailyQuests, Quest, QuestKind, QuestState } from './gameTypes'

// Daily quests — 3 rolled deterministically per calendar day, advanced by gameplay events.

const CATALOG: Quest[] = [
  { id: 'complete3', label: 'Complete 3 tasks', emoji: '✅', kind: 'complete', target: 3, reward: 20 },
  { id: 'complete5', label: 'Complete 5 tasks', emoji: '💪', kind: 'complete', target: 5, reward: 35 },
  { id: 'feed1', label: 'Feed your dragon', emoji: '🍖', kind: 'feed', target: 1, reward: 15 },
  { id: 'big1', label: 'Finish a Big task', emoji: '🔥', kind: 'completeBig', target: 1, reward: 25 },
  { id: 'earn60', label: 'Earn 60 coins', emoji: '🪙', kind: 'earnCoins', target: 60, reward: 30 },
]

// Tiny deterministic PRNG seeded from the date string, so the same day always rolls the
// same 3 quests (stable across reloads) but different days differ.
function seedFrom(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function rollDailyQuests(dateKey: string): DailyQuests {
  const pool = [...CATALOG]
  const quests: Quest[] = []
  let h = seedFrom(dateKey)
  while (quests.length < 3 && pool.length) {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0
    const idx = h % pool.length
    quests.push({ ...pool.splice(idx, 1)[0] })
  }
  const state: Record<string, QuestState> = {}
  quests.forEach((q) => {
    state[q.id] = { progress: 0, claimed: false }
  })
  return { date: dateKey, quests, state }
}

export interface QuestEvent {
  kind: QuestKind
  amount: number
}

export function advanceQuests(daily: DailyQuests, event: QuestEvent): DailyQuests {
  let changed = false
  const state = { ...daily.state }
  for (const q of daily.quests) {
    if (q.kind !== event.kind) continue
    const cur = state[q.id]
    if (cur && !cur.claimed && cur.progress < q.target) {
      state[q.id] = { ...cur, progress: Math.min(q.target, cur.progress + event.amount) }
      changed = true
    }
  }
  return changed ? { ...daily, state } : daily
}

export function questClaimable(daily: DailyQuests, id: string): boolean {
  const q = daily.quests.find((x) => x.id === id)
  const s = daily.state[id]
  return !!q && !!s && s.progress >= q.target && !s.claimed
}

export function anyClaimable(daily: DailyQuests): boolean {
  return daily.quests.some((q) => questClaimable(daily, q.id))
}
