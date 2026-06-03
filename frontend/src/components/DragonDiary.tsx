import type { DiaryMemory } from '../lib/gameTypes'

interface DragonDiaryProps {
  memory: DiaryMemory | null
  petName: string
  onOpen: () => void
}

// Short relative time for the latest memory ("just now", "2h ago", "yesterday").
function ago(at: number): string {
  const s = Math.floor((Date.now() - at) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d === 1 ? 'yesterday' : `${d}d ago`
}

// A small "memory" card that turns stats into story — shows the single latest meaningful
// moment. Tapping opens the full Stats sheet.
export default function DragonDiary({ memory, petName, onOpen }: DragonDiaryProps) {
  return (
    <button
      onClick={onOpen}
      className="mx-3 mt-3 block w-[calc(100%-1.5rem)] rounded-3xl bg-[#fdf3da] p-4 text-left shadow-lg transition active:scale-[0.98]"
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
          📖 Dragon Diary
        </span>
        {memory && (
          <span className="text-[11px] font-semibold text-slate-400">{ago(memory.at)}</span>
        )}
      </div>
      {memory ? (
        <div className="flex items-center gap-2">
          <span className="text-2xl">{memory.emoji}</span>
          <p className="text-sm font-extrabold leading-tight text-slate-700">{memory.text}</p>
        </div>
      ) : (
        <p className="text-sm font-semibold leading-snug text-slate-500">
          Finish a task to write {petName}'s first memory.
        </p>
      )}
    </button>
  )
}
