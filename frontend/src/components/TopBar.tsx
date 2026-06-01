interface Props {
  coins: number
  gems: number
  onMenu: () => void
}

export default function TopBar({ coins, gems, onMenu }: Props) {
  return (
    <div className="flex items-center gap-2 px-3 pt-3">
      {/* avatar */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white bg-amber-100 text-xl shadow">
        🧒
      </div>

      {/* coins + gems pill */}
      <div className="flex flex-1 items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 shadow">
        <span className="flex items-center gap-1 text-sm font-bold text-slate-800">
          <span className="text-yellow-500">🪙</span>
          {coins.toLocaleString()}
        </span>
        <span className="h-4 w-px bg-slate-200" />
        <span className="flex items-center gap-1 text-sm font-bold text-slate-800">
          <span className="text-sky-500">💎</span>
          {gems}
        </span>
        <button
          aria-label="Add currency"
          className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
        >
          +
        </button>
      </div>

      {/* gift */}
      <button
        aria-label="Rewards"
        className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-xl shadow hover:bg-white"
      >
        🎁
      </button>

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
