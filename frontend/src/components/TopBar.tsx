import { useEffect, useRef, useState, type FormEvent } from 'react'

interface Props {
  petName: string
  onMenu: () => void
  onRename: (name: string) => void
}

const MAX_NAME = 16

export default function TopBar({ petName, onMenu, onRename }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(petName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      setDraft(petName)
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing, petName])

  function save(e: FormEvent) {
    e.preventDefault()
    const name = draft.trim().slice(0, MAX_NAME)
    if (name) onRename(name)
    setEditing(false)
  }

  return (
    <div className="flex items-center gap-2 px-3 pt-3">
      {/* avatar */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white bg-amber-100 text-xl shadow">
        🧒
      </div>

      {/* pet name — tap to rename */}
      {editing ? (
        <form
          onSubmit={save}
          className="flex flex-1 items-center gap-2 rounded-full bg-white px-4 py-2 shadow ring-2 ring-orange-300"
        >
          <span className="text-base">🐲</span>
          <input
            ref={inputRef}
            value={draft}
            maxLength={MAX_NAME}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setEditing(false)
            }}
            className="min-w-0 flex-1 bg-transparent text-sm font-extrabold text-slate-800 outline-none"
            aria-label="Pet name"
          />
        </form>
      ) : (
        <button
          onClick={() => setEditing(true)}
          aria-label="Rename your dragon"
          className="flex flex-1 items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-left shadow transition hover:bg-white"
        >
          <span className="text-base">🐲</span>
          <span className="truncate text-sm font-extrabold text-slate-800">
            {petName}
          </span>
          <span className="ml-auto text-xs text-slate-300">✎</span>
        </button>
      )}

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
