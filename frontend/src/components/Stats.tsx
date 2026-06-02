import Sheet from './Sheet'
import type { UseGameStore } from '../lib/gameStore'
import { STAGE_LABEL, STAGE_ORDER } from '../lib/stages'

interface Props {
  game: UseGameStore
  streak: number
  onClose: () => void
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <span className="text-sm font-black text-slate-800">{value}</span>
    </div>
  )
}

export default function Stats({ game, streak, onClose }: Props) {
  const { coins, stats, achievements } = game.state
  const stageReached = STAGE_LABEL[STAGE_ORDER[stats.maxStageIdx] ?? 'egg']

  return (
    <Sheet title="📊 Stats" coins={coins} onClose={onClose}>
      <div className="divide-y divide-slate-200 rounded-2xl bg-white px-4 pb-1">
        <Row label="✅ Tasks completed (all time)" value={stats.tasksCompletedTotal} />
        <Row label="📅 Completed today" value={stats.todayCount} />
        <Row label="🔥 Current streak" value={`${streak} day${streak === 1 ? '' : 's'}`} />
        <Row label="🏅 Best streak" value={`${stats.bestStreak} day${stats.bestStreak === 1 ? '' : 's'}`} />
        <Row label="🐲 Highest evolution" value={stageReached} />
        <Row label="🍖 Times fed" value={stats.feedCount} />
        <Row label="🪙 Coins earned (all time)" value={stats.coinsEarnedTotal} />
        <Row label="🏆 Trophies" value={achievements.length} />
      </div>
    </Sheet>
  )
}
