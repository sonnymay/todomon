import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Task } from '../types'
import { DIFFICULTY_XP, type Difficulty } from '../lib/stages'

interface Props {
  tasks: Task[]
  streak: number
  onAdd: (title: string, xpReward: number, notes?: string) => Promise<void>
  onComplete: (taskId: string) => Promise<void>
  onUncomplete: (taskId: string) => Promise<void>
  onEdit: (taskId: string, title: string, notes: string) => Promise<void>
  onDelete: (taskId: string) => Promise<void>
}

const DIFFICULTIES: { key: Difficulty; label: string; emoji: string }[] = [
  { key: 'SMALL', label: 'Quick', emoji: '🟢' },
  { key: 'MEDIUM', label: 'Medium', emoji: '🟡' },
  { key: 'LARGE', label: 'Big', emoji: '🔴' },
]

export default function TaskList({
  tasks,
  streak,
  onAdd,
  onComplete,
  onUncomplete,
  onEdit,
  onDelete,
}: Props) {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('SMALL')
  const [adding, setAdding] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pop, setPop] = useState(false)
  // Task id currently playing its completion flourish (badge pop + "+XP" float).
  const [celebratingId, setCelebratingId] = useState<string | null>(null)
  // Task being edited inline, plus its draft fields.
  const [editId, setEditId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editNotes, setEditNotes] = useState('')

  function startEdit(t: Task) {
    setEditId(t.id)
    setEditTitle(t.title)
    setEditNotes(t.notes ?? '')
  }

  async function submitEdit(e: FormEvent) {
    e.preventDefault()
    if (!editId) return
    await onEdit(editId, editTitle, editNotes)
    setEditId(null)
  }

  const completedCount = tasks.filter((t) => t.is_done).length

  // "Done today" — counts tasks whose completion happened on the current calendar day.
  const today = new Date().toDateString()
  const doneToday = tasks.filter(
    (t) =>
      t.is_done &&
      t.completed_at &&
      new Date(t.completed_at).toDateString() === today,
  ).length

  // Pop the counter whenever it grows — a little hit of satisfaction.
  const prevDone = useRef(doneToday)
  useEffect(() => {
    if (doneToday > prevDone.current) {
      setPop(true)
      const timer = setTimeout(() => setPop(false), 450)
      prevDone.current = doneToday
      return () => clearTimeout(timer)
    }
    prevDone.current = doneToday
  }, [doneToday])

  async function submit(e: FormEvent) {
    e.preventDefault()
    const t = title.trim()
    if (!t) return
    setAdding(true)
    try {
      await onAdd(t, DIFFICULTY_XP[difficulty], notes.trim() || undefined)
      setTitle('')
      setNotes('')
    } finally {
      setAdding(false)
    }
  }

  // open tasks first, then completed; oldest first within each group, so newly added
  // tasks queue to the BOTTOM and you work through them top-to-bottom.
  const ordered = [...tasks].sort(
    (a, b) =>
      Number(a.is_done) - Number(b.is_done) ||
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )

  // Permanent per-task number: ranked by creation order (not list position), so a
  // task keeps its own number when others are completed — completing #1 never lets
  // another task take "1". New tasks always get the next-highest number.
  const numberById = new Map(
    [...tasks]
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime() ||
          // Numeric-aware tiebreak so dev ids (local-8 vs local-10) and any
          // same-millisecond creations rank by true creation order, not lexically.
          a.id.localeCompare(b.id, undefined, { numeric: true }),
      )
      .map((t, i) => [t.id, i + 1] as const),
  )

  return (
    <section className="min-w-0 px-2">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <h3 className="min-w-0 flex items-center gap-2 text-lg font-extrabold text-slate-800">
          🌞 Today
        </h3>
        <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-slate-500">
          <span className="text-green-600">{completedCount}</span>/{tasks.length}
        </span>
      </div>

      {/* big satisfying "done today" counter */}
      <div className="mt-3 flex min-w-0 items-center gap-3 rounded-3xl bg-green-100 px-4 py-3">
        <span
          className={`text-5xl font-black leading-none text-green-600 ${
            pop ? 'count-pop' : ''
          }`}
        >
          {doneToday}
        </span>
        <span className="text-sm font-extrabold leading-tight text-green-700">
          done
          <br />
          today ✅
        </span>
        {streak > 0 && (
          <span className="ml-auto flex items-center gap-1.5 rounded-2xl bg-orange-100 px-3 py-2 text-orange-600">
            <span className="text-2xl leading-none">🔥</span>
            <span className="text-sm font-black leading-tight">
              {streak}
              <br />
              <span className="text-[11px] font-extrabold">
                day{streak === 1 ? '' : 's'}
              </span>
            </span>
          </span>
        )}
      </div>

      <form onSubmit={submit} className="mt-3 space-y-2">
        <div className="flex min-w-0 gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a task…"
            className="w-0 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
          />
          <button
            type="submit"
            disabled={adding}
            className="shrink-0 rounded-2xl bg-orange-500 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-orange-600 active:scale-95 disabled:opacity-60"
          >
            Add
          </button>
        </div>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add a note… (optional)"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
        />
        <div className="flex gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => setDifficulty(d.key)}
              className={`flex-1 rounded-xl px-2 py-1.5 text-xs font-bold transition ${
                difficulty === d.key
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-white text-slate-500 ring-1 ring-slate-200'
              }`}
            >
              {d.emoji} {d.label} · {DIFFICULTY_XP[d.key]}xp
            </button>
          ))}
        </div>
      </form>

      <ul className="mt-3 space-y-2.5">
        {ordered.length === 0 && (
          <li className="rounded-3xl bg-white py-8 text-center text-sm text-slate-400 shadow-sm">
            No tasks yet — add one to feed your dragon! 🐣
          </li>
        )}
        {ordered.map((t) => {
          return (
            <li
              key={t.id}
              className={`group row-in flex items-center gap-3 rounded-3xl bg-white p-3.5 shadow-sm transition ${
                t.is_done ? 'opacity-60' : ''
              }`}
            >
              <div className="relative shrink-0">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-black text-white ${
                    t.is_done ? 'bg-green-500' : 'bg-amber-400'
                  } ${celebratingId === t.id ? 'pop-check' : ''}`}
                >
                  {t.seq ?? numberById.get(t.id)}
                </div>
                {celebratingId === t.id && (
                  <span className="xp-float pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm font-black text-amber-500">
                    +{t.xp_reward} ⭐
                  </span>
                )}
              </div>

              {editId === t.id ? (
                <form onSubmit={submitEdit} className="min-w-0 flex-1 space-y-2">
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Escape' && setEditId(null)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                  />
                  <input
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    onKeyDown={(e) => e.key === 'Escape' && setEditId(null)}
                    placeholder="Note (optional)"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditId(null)}
                      className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-extrabold text-white active:scale-95"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => !t.is_done && startEdit(t)}
                  disabled={t.is_done}
                  className="min-w-0 flex-1 text-left"
                  aria-label={t.is_done ? undefined : `Edit ${t.title}`}
                >
                  <p
                    className={`truncate font-bold text-slate-800 ${
                      t.is_done ? 'line-through' : ''
                    }`}
                  >
                    {t.title}
                  </p>
                  {t.notes && (
                    <p className="truncate text-xs text-slate-500">{t.notes}</p>
                  )}
                  <div className="mt-1 flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                      ⭐ +{t.xp_reward}
                    </span>
                  </div>
                </button>
              )}

              {editId === t.id ? null : t.is_done ? (
                <button
                  aria-label="Undo (mark not done)"
                  disabled={busyId === t.id}
                  onClick={async () => {
                    setBusyId(t.id)
                    try {
                      await onUncomplete(t.id)
                    } finally {
                      setBusyId(null)
                    }
                  }}
                  className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-200 active:scale-95 disabled:opacity-50"
                >
                  ↩︎ Undo
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    aria-label="Complete task"
                    disabled={busyId === t.id}
                    onClick={async () => {
                      setBusyId(t.id)
                      setCelebratingId(t.id)
                      setTimeout(() => setCelebratingId(null), 900)
                      try {
                        await onComplete(t.id)
                      } finally {
                        setBusyId(null)
                      }
                    }}
                    className="h-8 w-8 rounded-full border-2 border-slate-300 transition hover:border-green-500 hover:bg-green-50 disabled:opacity-50"
                  />
                  <button
                    aria-label="Delete task"
                    onClick={() => onDelete(t.id)}
                    className="px-1 text-lg text-slate-300 transition hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
