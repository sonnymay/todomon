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
}
