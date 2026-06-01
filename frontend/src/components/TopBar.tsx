interface Props {
  petName: string
  onMenu: () => void
}

export default function TopBar({ petName, onMenu }: Props) {
  return (
    <div className="flex items-center gap-2 px-3 pt-3">
      {/* avatar */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white bg-amber-100 text-xl shadow">
        🧒
      </div>

      {/* pet name */}
      <div className="flex flex-1 items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow">
        <span className="text-base">🐲</span>
        <span className="truncate text-sm font-extrabold text-slate-800">
          {petName}
        </span>
      </div>

      {/* menu */}
      <button
        aria-label="Menu"
        onClick={onMenu}
        className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-xl text-slate-600 shadow hover:bg-white"
      >
        ☰
      </button>
    </div>
  )
}
