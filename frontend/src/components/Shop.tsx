import Sheet from './Sheet'
import { COSMETICS, type Cosmetic } from '../lib/cosmetics'
import { STREAK_FREEZE_COST, MAX_STREAK_FREEZES } from '../lib/economy'
import type { UseGameStore } from '../lib/gameStore'
import type { CosmeticKind } from '../lib/gameTypes'

interface Props {
  game: UseGameStore
  isPro: boolean
  onOpenPaywall: () => void
  onClose: () => void
}

const SECTIONS: { kind: CosmeticKind; title: string }[] = [
  { kind: 'aura', title: 'Auras' },
  { kind: 'frame', title: 'Frames' },
  { kind: 'flair', title: 'Name flair' },
]

export default function Shop({ game, isPro, onOpenPaywall, onClose }: Props) {
  const { coins, owned, equipped, streakFreezes } = game.state

  function Item({ c }: { c: Cosmetic }) {
    const isOwned = owned.includes(c.id)
    const isEquipped = equipped[c.kind] === c.id
    const canAfford = coins >= c.cost
    // A premium cosmetic the user hasn't unlocked via Pro yet.
    const proLocked = !!c.pro && !isOwned && !isPro
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-white p-3">
        <span className="text-2xl">{c.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-800">{c.name}</p>
          {!isOwned && !c.pro && (
            <p className="text-xs font-semibold text-amber-600">🪙 {c.cost}</p>
          )}
          {c.pro && !isOwned && (
            <p className="text-xs font-bold text-amber-600">✨ Pro</p>
          )}
        </div>
        {isOwned ? (
          <button
            onClick={() => game.equip(c.id)}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-extrabold active:scale-95 ${
              isEquipped ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {isEquipped ? 'Equipped ✓' : 'Equip'}
          </button>
        ) : proLocked ? (
          <button
            onClick={onOpenPaywall}
            className="shrink-0 rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-extrabold text-white active:scale-95"
          >
            🔒 Pro
          </button>
        ) : (
          <button
            onClick={() => game.buy(c.id)}
            disabled={!canAfford}
            className="shrink-0 rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-extrabold text-white active:scale-95 disabled:opacity-40"
          >
            Buy
          </button>
        )}
      </div>
    )
  }

  return (
    <Sheet title="🛒 Shop" coins={coins} onClose={onClose}>
      {!isPro && (
        <button
          onClick={onOpenPaywall}
          className="mb-3 flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 p-3 text-left active:scale-[0.99]"
        >
          <span className="text-2xl">✨</span>
          <div className="flex-1">
            <p className="text-sm font-black text-white">Optional Supporter Pack</p>
            <p className="text-xs font-semibold text-white/90">
              Extra cosmetics and golden celebrations
            </p>
          </div>
          <span className="text-sm font-black text-white">→</span>
        </button>
      )}
      <p className="mb-3 text-xs text-slate-500">
        Earn coins by completing tasks. Dress up your dragon!
      </p>
      <div className="space-y-4 pb-2">
        {/* Streak Freeze — care item, not a cosmetic: covers one missed day automatically */}
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
            Care
          </h3>
          <div className="flex items-center gap-3 rounded-2xl bg-white p-3">
            <span className="text-2xl">🧊</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-800">Streak Freeze</p>
              <p className="text-xs text-slate-500">
                Covers one missed day — your 🔥 streak survives.
              </p>
              <p className="text-xs font-semibold text-amber-600">
                🪙 {STREAK_FREEZE_COST}
                {streakFreezes > 0 && (
                  <span className="ml-2 text-sky-600">
                    Held: {streakFreezes}/{MAX_STREAK_FREEZES}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => game.buyStreakFreeze()}
              disabled={coins < STREAK_FREEZE_COST || streakFreezes >= MAX_STREAK_FREEZES}
              className="shrink-0 rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-extrabold text-white active:scale-95 disabled:opacity-40"
            >
              {streakFreezes >= MAX_STREAK_FREEZES ? 'Max ✓' : 'Buy'}
            </button>
          </div>
        </div>
        {SECTIONS.map((sec) => (
          <div key={sec.kind}>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              {sec.title}
            </h3>
            <div className="space-y-2">
              {COSMETICS.filter((c) => c.kind === sec.kind).map((c) => (
                <Item key={c.id} c={c} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Sheet>
  )
}
