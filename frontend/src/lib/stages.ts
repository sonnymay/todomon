import type { Stage } from '../types'

// Ordered evolution chain — must match the public.todomon_stage enum.
export const STAGE_ORDER: Stage[] = [
  'egg',
  'hatchling',
  'baby',
  'rookie',
  'champion',
  'ultimate',
  'mega',
]

// Evolution is LEVEL-driven. Each stage unlocks at this level (0-based; egg = level 0).
export const STAGE_LEVEL: Record<Stage, number> = {
  egg: 0,
  hatchling: 1,
  baby: 15,
  rookie: 30,
  champion: 45,
  ultimate: 60,
  mega: 100,
}

// Cumulative XP required to REACH a level. Ramping curve — cheap early, grindy late:
//   xpForLevel(L) = 5*L^2 + 45*L  (L0=0, L1=50, L15=1800, L45=12150, L60=20700, L100=54500)
export function xpForLevel(level: number): number {
  const l = Math.max(0, Math.floor(level))
  return 5 * l * l + 45 * l
}

// Cumulative XP to ENTER each stage, derived from its unlock level.
// Must match the SQL todomon_stage_for_xp() once the backend migration lands.
export const STAGE_THRESHOLDS: Record<Stage, number> = {
  egg: xpForLevel(STAGE_LEVEL.egg),
  hatchling: xpForLevel(STAGE_LEVEL.hatchling),
  baby: xpForLevel(STAGE_LEVEL.baby),
  rookie: xpForLevel(STAGE_LEVEL.rookie),
  champion: xpForLevel(STAGE_LEVEL.champion),
  ultimate: xpForLevel(STAGE_LEVEL.ultimate),
  mega: xpForLevel(STAGE_LEVEL.mega),
}

export const STAGE_LABEL: Record<Stage, string> = {
  egg: 'Egg',
  hatchling: 'Hatchling',
  baby: 'Baby',
  rookie: 'Rookie',
  champion: 'Champion',
  ultimate: 'Ultimate',
  mega: 'Mega',
}

const SCENE_VIDEO_BY_STAGE: Record<Stage, string> = {
  egg: 'sun_dragon_egg_scene.mp4',
  hatchling: 'sun_dragon_hatchling_scene.mp4',
  baby: 'sun_dragon_baby_scene.mp4',
  rookie: 'sun_dragon_rookie_scene.mp4',
  champion: 'sun_dragon_champion_scene.mp4',
  ultimate: 'sun_dragon_ultimate_scene.mp4',
  mega: 'sun_dragon_mega_scene.mp4',
}

const SLEEP_IMAGE_BY_STAGE: Record<Stage, string> = {
  egg: 'sun_dragon_egg_sleeping.png',
  hatchling: 'sun_dragon_hatchling_sleeping.png',
  baby: 'sun_dragon_baby_sleeping.png',
  rookie: 'sun_dragon_rookie_sleeping.png',
  champion: 'sun_dragon_champion_sleeping.png',
  ultimate: 'sun_dragon_ultimate_sleeping.png',
  mega: 'sun_dragon_mega_sleeping.png',
}

export function creatureSceneVideo(stage: Stage): string {
  return `/assets/creatures/${SCENE_VIDEO_BY_STAGE[stage]}`
}

export function creatureSleepImage(stage: Stage): string {
  return `/assets/creatures/${SLEEP_IMAGE_BY_STAGE[stage]}`
}

// "Very hungry" scene video (shown when hunger < 20 and awake). Generated separately;
// CreatureScene falls back to the normal scene video if the file is missing.
const HUNGRY_VIDEO_BY_STAGE: Record<Stage, string> = {
  egg: 'sun_dragon_egg_hungry.mp4',
  hatchling: 'sun_dragon_hatchling_hungry.mp4',
  baby: 'sun_dragon_baby_hungry.mp4',
  rookie: 'sun_dragon_rookie_hungry.mp4',
  champion: 'sun_dragon_champion_hungry.mp4',
  ultimate: 'sun_dragon_ultimate_hungry.mp4',
  mega: 'sun_dragon_mega_hungry.mp4',
}

export function creatureHungryVideo(stage: Stage): string {
  return `/assets/creatures/${HUNGRY_VIDEO_BY_STAGE[stage]}`
}

// Player level from total XP — inverse of xpForLevel. 0-based (level 0 = egg).
//   L = floor((-45 + sqrt(2025 + 20*xp)) / 10)
export function levelFromXp(xp: number): number {
  if (xp <= 0) return 0
  return Math.max(0, Math.floor((-45 + Math.sqrt(2025 + 20 * xp)) / 10))
}

// Highest stage whose unlock level is <= the given level.
export function stageForLevel(level: number): Stage {
  let result: Stage = 'egg'
  for (const stage of STAGE_ORDER) {
    if (level >= STAGE_LEVEL[stage]) result = stage
  }
  return result
}

// Stage from total XP (level-driven). Kept for existing callers.
export function stageForXp(xp: number): Stage {
  return stageForLevel(levelFromXp(xp))
}

export type Difficulty = 'SMALL' | 'MEDIUM' | 'LARGE'

export const DIFFICULTY_XP: Record<Difficulty, number> = {
  SMALL: 20,
  MEDIUM: 40,
  LARGE: 60,
}

export function difficultyForXp(xp: number): Difficulty {
  if (xp >= DIFFICULTY_XP.LARGE) return 'LARGE'
  if (xp >= DIFFICULTY_XP.MEDIUM) return 'MEDIUM'
  return 'SMALL'
}

export interface LevelInfo {
  level: number
  xpIntoLevel: number
  levelSpan: number
  pct: number
  xpToNext: number
}

// Progress within the current level toward the next level (drives the XP bar).
export function levelInfo(xp: number): LevelInfo {
  const level = levelFromXp(xp)
  const base = xpForLevel(level)
  const next = xpForLevel(level + 1)
  const levelSpan = next - base
  const xpIntoLevel = Math.max(0, xp - base)
  const pct =
    levelSpan > 0
      ? Math.min(100, Math.max(0, Math.round((xpIntoLevel / levelSpan) * 100)))
      : 0
  return { level, xpIntoLevel, levelSpan, pct, xpToNext: Math.max(0, next - xp) }
}

// The next stage the creature evolves into and the level that unlocks it.
export function nextEvolution(stage: Stage): { stage: Stage; level: number } | null {
  const idx = STAGE_ORDER.indexOf(stage)
  const next = STAGE_ORDER[idx + 1]
  if (!next) return null
  return { stage: next, level: STAGE_LEVEL[next] }
}
