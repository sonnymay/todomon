import type { CosmeticKind } from './gameTypes'

export interface Cosmetic {
  id: string
  name: string
  emoji: string
  kind: CosmeticKind
  cost: number
  // For auras: a CSS radial-gradient color. For frames: a border style. For flair: a
  // prefix emoji + text color class applied to the pet name.
  value: string
  // Premium cosmetics are granted by the one-time ToDoMon Pro unlock (not buyable with coins).
  pro?: boolean
}

// The full cosmetics catalog. Auras glow behind the pet, frames border the scene, flair
// styles the name. No body-pinned art needed (the creature is a full-scene video).
export const COSMETICS: Cosmetic[] = [
  // Auras (radial glow color behind the video)
  { id: 'aura_sun', name: 'Sunny Glow', emoji: '🌞', kind: 'aura', cost: 80, value: 'rgba(251,191,36,0.55)' },
  { id: 'aura_rose', name: 'Rose Aura', emoji: '🌸', kind: 'aura', cost: 120, value: 'rgba(244,114,182,0.55)' },
  { id: 'aura_mint', name: 'Mint Aura', emoji: '🍃', kind: 'aura', cost: 120, value: 'rgba(52,211,153,0.55)' },
  { id: 'aura_violet', name: 'Cosmic Aura', emoji: '🔮', kind: 'aura', cost: 0, value: 'rgba(167,139,250,0.6)', pro: true },

  // Frames (border around the scene)
  { id: 'frame_gold', name: 'Gold Frame', emoji: '🟨', kind: 'frame', cost: 150, value: '6px solid #f59e0b' },
  { id: 'frame_emerald', name: 'Emerald Frame', emoji: '🟩', kind: 'frame', cost: 150, value: '6px solid #10b981' },
  { id: 'frame_royal', name: 'Royal Frame', emoji: '🟪', kind: 'frame', cost: 0, value: '6px solid #8b5cf6', pro: true },

  // Name flair (emoji prefix on the pet name)
  { id: 'flair_crown', name: 'Crown', emoji: '👑', kind: 'flair', cost: 0, value: '👑', pro: true },
  { id: 'flair_star', name: 'Star', emoji: '⭐', kind: 'flair', cost: 60, value: '⭐' },
  { id: 'flair_fire', name: 'Fire', emoji: '🔥', kind: 'flair', cost: 100, value: '🔥' },
]

// Cosmetics granted by ToDoMon Pro.
export const PRO_COSMETIC_IDS = COSMETICS.filter((c) => c.pro).map((c) => c.id)

export function cosmeticById(id: string | null): Cosmetic | undefined {
  if (!id) return undefined
  return COSMETICS.find((c) => c.id === id)
}
