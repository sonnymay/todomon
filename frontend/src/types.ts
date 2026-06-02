export type Stage =
  | 'egg'
  | 'hatchling'
  | 'baby'
  | 'rookie'
  | 'champion'
  | 'ultimate'
  | 'mega'

export interface Creature {
  id: string
  user_id: string
  name: string
  stage: Stage
  xp: number
  created_at: string
  updated_at: string
  // Server-persisted hunger (real mode). Optional because dev-seed creatures omit them.
  hunger?: number
  hunger_updated_at?: string
}

// Per-user profile row (real mode) — carries the persisted daily streak.
export interface Profile {
  id: string
  display_name: string | null
  streak_count: number
  last_active_date: string | null
}

export interface Task {
  id: string
  user_id: string
  title: string
  notes: string | null
  xp_reward: number
  is_done: boolean
  created_at: string
  completed_at: string | null
  // Permanent display number, assigned once at creation and never reused — so a task
  // keeps its badge number even when earlier tasks are completed or deleted. Optional
  // because real (Supabase) rows don't carry it yet; TaskList falls back to creation
  // rank when absent. See seedTasks/localTask in lib/localGame.ts.
  seq?: number
}
