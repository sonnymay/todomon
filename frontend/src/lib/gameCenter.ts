import { Capacitor, registerPlugin } from '@capacitor/core'

export const GAME_CENTER_ACHIEVEMENTS = {
  firstTask: 'toDoMon.firstTask',
  streak3: 'toDoMon.streak3',
  streak7: 'toDoMon.streak7',
  petEvolved: 'toDoMon.petEvolved',
  streakFreeze: 'toDoMon.streakFreeze',
} as const

export type GameCenterAchievementIdentifier =
  (typeof GAME_CENTER_ACHIEVEMENTS)[keyof typeof GAME_CENTER_ACHIEVEMENTS]

interface GameCenterPlugin {
  reportAchievement(options: { identifier: string }): Promise<{ reported: boolean; reason?: string }>
  resetAchievements(): Promise<void>
}

const GameCenter = registerPlugin<GameCenterPlugin>('GameCenter')
const STORAGE_KEY = 'todomon_game_center_reported_v1'

function readReported(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as string[])
  } catch {
    return new Set()
  }
}

function markReported(identifier: string): void {
  try {
    const reported = readReported()
    reported.add(identifier)
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...reported]))
  } catch {
    // storage unavailable; native GameKit still guards repeated reports
  }
}

export async function reportGameCenterAchievement(
  identifier: GameCenterAchievementIdentifier,
): Promise<void> {
  if (!Capacitor.isNativePlatform() || readReported().has(identifier)) return
  try {
    const result = await GameCenter.reportAchievement({ identifier })
    if (result.reported || result.reason === 'alreadyReported') markReported(identifier)
  } catch {
    // Game Center unavailable, user not signed in, or plugin missing; never block gameplay.
  }
}

export async function resetGameCenterAchievementsForDebug(): Promise<void> {
  if (!import.meta.env.DEV || !Capacitor.isNativePlatform()) return
  await GameCenter.resetAchievements()
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
