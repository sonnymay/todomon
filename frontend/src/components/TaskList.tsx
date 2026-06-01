import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Task } from '../types'
import { DIFFICULTY_XP } from '../lib/stages'

interface Props {
  tasks: Task[]
  onAdd: (title: string, xpReward: number) => Promise<void>
  onComplete: (taskId: string) => Promise<void>
  onDelete: (taskId: string) => Promise<void>
}

// Every task is worth the same (kept simple — no difficulty picker shown to the user).
const TASK_XP = DIFFICULTY_XP.SMALL

export default function TaskList({ tasks, onAdd, onComplete, onDelete }: Props) {
  const [title, setTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pop, setPop] = useState(false)

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
      await onAdd(t, TASK_XP)
      setTitle('')
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

  return (
    <section className="px-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-800">
          🌞 Today
        </h3>
        <span className="text-sm font-semibold text-slate-500">
          <span className="text-green-600">{completedCount}</span> / {tasks.length} done
        </span>
      </div>

      {/* big satisfying "done today" counter */}
      <div className="mt-3 flex items-center gap-3 rounded-3xl bg-green-100 px-5 py-3">
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
      </div>

      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          value={title}
          autoFocus
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task…"
          className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
        />
        <button
          type="submit"
          disabled={adding}
          className="shrink-0 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-orange-600 active:scale-95 disabled:opacity-60"
        >
          Add ✨
        </button>
      </form>

      <ul className="mt-3 space-y-2.5">
        {ordered.length === 0 && (
          <li className="rounded-3xl bg-white py-8 text-center text-sm text-slate-400 shadow-sm">
            No tasks yet — add one to feed your dragon! 🐣
          </li>
        )}
        {ordered.map((t, i) => {
          return (
            <li
              key={t.id}
              className={`group flex items-center gap-3 rounded-3xl bg-white p-3.5 shadow-sm transition ${
                t.is_done ? 'opacity-60' : ''
              }`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-black text-white ${
                  t.is_done ? 'bg-green-500' : 'bg-amber-400'
                }`}
              >
                {t.is_done ? '✓' : i + 1}
              </div>

              <div className="min-w-0 flex-1">
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
              </div>

              {t.is_done ? (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-white">
                  ✓
                </span>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    aria-label="Complete task"
                    disabled={busyId === t.id}
                    onClick={async () => {
                      setBusyId(t.id)
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
