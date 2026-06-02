import { useState } from 'react'
import type { Creature, Task } from '../types'
import type { UseGameStore } from '../lib/gameStore'
import { cosmeticById } from '../lib/cosmetics'
import { FEED_COST } from '../lib/economy'
import { anyClaimable } from '../lib/quests'
import TopBar from './TopBar'
import CreatureScene from './CreatureScene'
import StatsPanel from './StatsPanel'
import TaskList from './TaskList'
import Shop from './Shop'
import Quests from './Quests'
import Achievements from './Achievements'
import Stats from './Stats'

interface Props {
  creature: Creature | null
  tasks: Task[]
  loading: boolean
  error: string | null
  hunger: number
  streak: number
  night: boolean
  leveledTo: string | null
  celebrate: string | null
  greeting: string | null
  game: UseGameStore
  coinGain: number | null
  feedSignal: number
  isPro: boolean
  onOpenPaywall: () => void
  onFeed: () => void
  onToggleNight: () => void
  onOpenSettings: () => void
  onRename: (name: string) => void
  onAdd: (title: string, xpReward: number, notes?: string) => Promise<void>
  onComplete: (taskId: string) => Promise<void>
  onUncomplete: (taskId: string) => Promise<void>
  onEdit: (taskId: string, title: string, notes: string) => Promise<void>
  onDelete: (taskId: string) => Promise<void>
  onDevEvolve?: () => void
  onDevFeed?: () => void
  onDevStarve?: () => void
}

type SheetName = 'shop' | 'quests' | 'trophies' | 'stats' | null

export default function Home({
  creature,
  tasks,
  loading,
  error,
  hunger,
  streak,
  night,
  leveledTo,
  celebrate,
  greeting,
  game,
  coinGain,
  feedSignal,
  isPro,
  onOpenPaywall,
  onFeed,
  onToggleNight,
  onOpenSettings,
  onRename,
  onAdd,
  onComplete,
  onUncomplete,
  onEdit,
  onDelete,
  onDevEvolve,
  onDevFeed,
  onDevStarve,
}: Props) {
  const [sheet, setSheet] = useState<SheetName>(null)

  const { equipped, coins, achievements, seenAchievements, daily } = game.state
  const aura = cosmeticById(equipped.aura)?.value ?? null
  const frame = cosmeticById(equipped.frame)?.value ?? null
  const flair = cosmeticById(equipped.flair)?.value ?? null
  const questDot = anyClaimable(daily)
  const trophyDot = achievements.length > seenAchievements.length

  const actions: { key: Exclude<SheetName, null>; emoji: string; label: string; dot?: boolean }[] = [
    { key: 'shop', emoji: '🛒', label: 'Shop' },
    { key: 'quests', emoji: '🎯', label: 'Quests', dot: questDot },
    { key: 'trophies', emoji: '🏆', label: 'Trophies', dot: trophyDot },
    { key: 'stats', emoji: '📊', label: 'Stats' },
  ]

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-[#fdf6e3] shadow-2xl sm:my-4 sm:min-h-[calc(100vh-2rem)] sm:rounded-[2rem]">
      {creature ? (
        <CreatureScene
          creature={creature}
          night={night}
          hunger={hunger}
          justLeveledTo={leveledTo}
          celebration={celebrate}
          greeting={greeting}
          aura={aura}
          frame={frame}
          feedSignal={feedSignal}
          onToggleNight={onToggleNight}
          topBar={
            <TopBar
              petName={creature.name}
              coins={coins}
              coinGain={coinGain}
              nameFlair={flair}
              onOpenSettings={onOpenSettings}
              onRename={onRename}
            />
          }
        />
      ) : (
        <div className="flex h-48 items-center justify-center bg-amber-200 text-slate-600">
          {loading ? 'Waking your dragon…' : 'No creature found'}
        </div>
      )}

      {creature && (
        <StatsPanel
          creature={creature}
          hunger={hunger}
          canFeed={coins >= FEED_COST}
          feedCost={FEED_COST}
          onFeed={onFeed}
        />
      )}

      {/* engagement action row */}
      <div className="mt-3 flex justify-center gap-2 px-3">
        {actions.map((a) => (
          <button
            key={a.key}
            onClick={() => setSheet(a.key)}
            className="relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl bg-white py-2 text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95"
          >
            <span className="text-xl">{a.emoji}</span>
            <span className="text-[10px] font-bold">{a.label}</span>
            {a.dot && (
              <span className="absolute right-2 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500" />
            )}
          </button>
        ))}
      </div>

      {(onDevEvolve || onDevFeed || onDevStarve) && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {onDevEvolve && (
            <button
              onClick={onDevEvolve}
              className="rounded-full bg-slate-800/80 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
            >
              🧪 Dev: Evolve →
            </button>
          )}
          {onDevStarve && (
            <button
              onClick={onDevStarve}
              className="rounded-full bg-slate-800/80 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
            >
              😋 Starve −20
            </button>
          )}
          {onDevFeed && (
            <button
              onClick={onDevFeed}
              className="rounded-full bg-slate-800/80 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
            >
              🍖 Feed +20
            </button>
          )}
        </div>
      )}

      <div className="flex-1 pt-5 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        {error && (
          <p className="mx-3 mb-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <TaskList
          tasks={tasks}
          streak={streak}
          onAdd={onAdd}
          onComplete={onComplete}
          onUncomplete={onUncomplete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>

      {sheet === 'shop' && (
        <Shop
          game={game}
          isPro={isPro}
          onOpenPaywall={onOpenPaywall}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'quests' && <Quests game={game} onClose={() => setSheet(null)} />}
      {sheet === 'trophies' && <Achievements game={game} onClose={() => setSheet(null)} />}
      {sheet === 'stats' && <Stats game={game} streak={streak} onClose={() => setSheet(null)} />}
    </div>
  )
}
