interface Props {
  night: boolean
  onToggleNight: () => void
  onComingSoon: (label: string) => void
}

const TABS = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'inventory', label: 'Inventory', icon: '🎒' },
  { key: 'quests', label: 'Quests', icon: '🏆' },
  { key: 'stats', label: 'Stats', icon: '📊' },
]

// Home is the only functional tab today; the others are placeholders.
export default function BottomNav({ night, onToggleNight, onComingSoon }: Props) {
  return (
    <div className="sticky bottom-0 z-10">
      {/* SLEEP toggle — floats ABOVE the nav row (right-aligned) so it no longer
          overlaps the Stats tab. */}
      <button
        onClick={onToggleNight}
        aria-label={night ? 'Wake (switch to day)' : 'Sleep (switch to night)'}
        className="absolute bottom-16 right-4 flex h-14 w-14 flex-col items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl ring-4 ring-white transition hover:bg-indigo-700"
      >
        <span className="text-lg leading-none">{night ? '☀️' : '🌙'}</span>
        <span className="text-[9px] font-bold tracking-wide">
          {night ? 'WAKE' : 'SLEEP'}
        </span>
      </button>

      <nav className="flex items-center justify-around rounded-t-2xl border-t border-amber-100 bg-[#fdf6e3] px-2 py-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() =>
              tab.key === 'home' ? undefined : onComingSoon(tab.label)
            }
            aria-current={tab.key === 'home' ? 'page' : undefined}
            className={`flex flex-1 flex-col items-center gap-0.5 py-1 text-xs font-semibold transition ${
              tab.key === 'home'
                ? 'text-orange-500'
                : 'text-slate-400 hover:text-slate-500'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
