interface Props {
  night: boolean
  onToggleNight: () => void
}

// Intentionally minimal: a single cute Sleep/Wake control. (Inventory/Quests/Stats
// placeholders were removed to keep the app simple.)
export default function BottomNav({ night, onToggleNight }: Props) {
  return (
    <div className="sticky bottom-0 z-10 flex justify-center rounded-t-3xl border-t border-amber-100 bg-[#fdf6e3] px-4 py-3">
      <button
        onClick={onToggleNight}
        aria-label={night ? 'Wake (switch to day)' : 'Sleep (switch to night)'}
        className="flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-extrabold text-white shadow-lg transition hover:bg-indigo-700 active:scale-95"
      >
        <span className="text-lg leading-none">{night ? '☀️' : '🌙'}</span>
        {night ? 'Wake up' : 'Sleep'}
      </button>
    </div>
  )
}
