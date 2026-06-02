import type { ReactNode } from 'react'

interface Props {
  title: string
  coins?: number
  onClose: () => void
  children: ReactNode
}

// Shared bottom-sheet modal (mirrors Settings.tsx). Optionally shows a coin balance pill.
export default function Sheet({ title, coins, onClose, children }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-3xl bg-[#fdf6e3] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="text-lg font-black text-slate-800">{title}</h2>
          <div className="flex items-center gap-2">
            {coins !== undefined && (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-black text-amber-700">
                🪙 {coins}
              </span>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  )
}
