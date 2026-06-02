import Sheet from './Sheet'
import type { UseGameStore } from '../lib/gameStore'
import { questClaimable } from '../lib/quests'

interface Props {
  game: UseGameStore
  onClose: () => void
}

export default function Quests({ game, onClose }: Props) {
  const { coins, daily } = game.state

  return (
    <Sheet title="🎯 Daily Quests" coins={coins} onClose={onClose}>
      <p className="mb-3 text-xs text-slate-500">Resets every day. Claim your coins!</p>
      <div className="space-y-2 pb-2">
        {daily.quests.map((q) => {
          const st = daily.state[q.id]
          const pct = Math.min(100, Math.round((st.progress / q.target) * 100))
          const claimable = questClaimable(daily, q.id)
          return (
            <div key={q.id} className="rounded-2xl bg-white p-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{q.emoji}</span>
                <p className="flex-1 text-sm font-bold text-slate-800">{q.label}</p>
                {st.claimed ? (
                  <span className="text-xs font-bold text-green-600">Done ✓</span>
                ) : claimable ? (
                  <button
                    onClick={() => game.claimQuest(q.id)}
                    className="rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-extrabold text-white active:scale-95"
                  >
                    Claim 🪙 {q.reward}
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-amber-600">🪙 {q.reward}</span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-400">
                  {st.progress}/{q.target}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </Sheet>
  )
}
