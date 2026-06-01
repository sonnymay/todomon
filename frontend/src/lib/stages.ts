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

// Cumulative XP required to ENTER each stage — must match todomon_stage_for_xp().
export const STAGE_THRESHOLDS: Record<Stage, number> = {
  egg: 0,
  hatchling: 50,
  baby: 120,
  rookie: 250,
  champion: 450,
  ultimate: 700,
  mega: 1000,
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

// baby assets are not present yet — fall back to hatchling until added.
// Drop baby.mp4 + baby.webm in /assets/creatures/ and remove this entry.
const ASSET_FALLBACK: Partial<Record<Stage, Stage>> = {
  baby: 'hatchling',
}

// Each creature is served as a transparent-background .webm (alpha, preferred)
// with the original .mp4 as a fallback <source>. The .webm files are generated
// from the .mp4s by frontend/scripts/encode-creatures.sh.
export interface CreatureSources {
  webm: string
  mp4: string
}

export function creatureSources(stage: Stage): CreatureSources {
  const file = ASSET_FALLBACK[stage] ?? stage
  return {
    webm: `/assets/creatures/${file}.webm`,
    mp4: `/assets/creatures/${file}.mp4`,
  }
}

// Mega threshold doubles as the "full" XP for the headline XP bar.
export const MAX_XP = STAGE_THRESHOLDS.mega

// Cosmetic level number for the badge (the real progression is stage-based).
export function levelFromXp(xp: number): number {
  return Math.floor(xp / 50) + 1
}

// TS port of the SQL todomon_stage_for_xp() — used by the in-memory dev mode.
export function stageForXp(xp: number): Stage {
  let result: Stage = 'egg'
  for (const stage of STAGE_ORDER) {
    if (xp >= STAGE_THRESHOLDS[stage]) result = stage
  }
  return result
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

export interface NextStageInfo {
  next: Stage | null
  toNext: number
  bandStart: number
  bandEnd: number
  pct: number
}

// Progress within the current stage band toward the next stage.
export function nextStageInfo(stage: Stage, xp: number): NextStageInfo {
  const idx = STAGE_ORDER.indexOf(stage)
  const next = STAGE_ORDER[idx + 1] ?? null
  const bandStart = STAGE_THRESHOLDS[stage]
  if (!next) {
    return { next: null, toNext: 0, bandStart, bandEnd: bandStart, pct: 100 }
  }
  const bandEnd = STAGE_THRESHOLDS[next]
  const pct = Math.min(
    100,
    Math.max(0, Math.round(((xp - bandStart) / (bandEnd - bandStart)) * 100)),
  )
  return { next, toNext: Math.max(0, bandEnd - xp), bandStart, bandEnd, pct }
}
