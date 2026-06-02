import { supabase } from './supabaseClient'
import type { Creature, Profile, Task } from '../types'

export async function fetchCreature(): Promise<Creature> {
  const { data, error } = await supabase
    .from('todomon_creatures')
    .select('*')
    .single()
  if (error) throw error
  return data as Creature
}

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('todomon_tasks')
    .select('*')
    .order('is_done', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Task[]
}

export async function addTask(
  title: string,
  xpReward = 10,
  notes?: string,
): Promise<Task> {
  const { data: userData } = await supabase.auth.getUser()
  const uid = userData.user?.id
  if (!uid) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('todomon_tasks')
    .insert({
      title,
      xp_reward: xpReward,
      notes: notes ?? null,
      user_id: uid,
    })
    .select()
    .single()
  if (error) throw error
  return data as Task
}

// Atomic: marks the task done, awards XP, evolves the creature. Returns the
// updated creature so the UI can react to stage-ups.
export async function completeTask(taskId: string): Promise<Creature> {
  const { data, error } = await supabase.rpc('todomon_complete_task', {
    p_task_id: taskId,
  })
  if (error) throw error
  return data as Creature
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase.from('todomon_tasks').delete().eq('id', taskId)
  if (error) throw error
}

// Atomic reverse of completeTask: reopens the task, subtracts its XP, de-evolves if
// needed, nudges hunger down. Returns the updated creature.
export async function uncompleteTask(taskId: string): Promise<Creature> {
  const { data, error } = await supabase.rpc('todomon_uncomplete_task', {
    p_task_id: taskId,
  })
  if (error) throw error
  return data as Creature
}

export async function updateCreatureName(name: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser()
  const uid = userData.user?.id
  if (!uid) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('todomon_creatures')
    .update({ name })
    .eq('user_id', uid)
  if (error) throw error
}

export async function fetchProfile(): Promise<Profile> {
  const { data, error } = await supabase
    .from('todomon_profiles')
    .select('*')
    .single()
  if (error) throw error
  return data as Profile
}
