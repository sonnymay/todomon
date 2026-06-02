import { useEffect } from 'react'
import Sheet from './Sheet'
import type { UseGameStore } from '../lib/gameStore'
import { ACHIEVEMENTS } from '../lib/achievements'

interface Props {
  game: UseGameStore
  onClose: () => void
}

export default function Achievements({ game, onClose }: Props) {
  const { coins, achievements } = game.state
  const unlocked = new Set(achievements)

  // Viewing the sheet clears the "new" badge.
  useEffect(() => {
    game.markAchievementsSeen()
  }, [game])

  return (
    <Sheet title="🏆 Trophies" coins={coins} onClose={onClose}>
      <p className="mb-3 text-xs text-slate-500">
        {unlocked.size} / {ACHIEVEMENTS.length} unlocked
      </p>
      <div className="grid grid-cols-2 gap-2 pb-2">
        {ACHIEVEMENTS.map((a) => {
          const got = unlocked.has(a.id)
          return (
            <div
              key={a.id}
              className={`rounded-2xl p-3 text-center ${
                got ? 'bg-white' : 'bg-white/50 opacity-60'
              }`}
            >
              <div className={`text-3xl ${got ? '' : 'grayscale'}`}>{got ? a.emoji : '🔒'}</div>
              <p className="mt-1 text-xs font-bold text-slate-800">{a.name}</p>
              <p className="text-[11px] leading-tight text-slate-500">{a.desc}</p>
              <p className="mt-1 text-[11px] font-bold text-amber-600">🪙 {a.reward}</p>
            </div>
          )
        })}
      </div>
    </Sheet>
  )
}
