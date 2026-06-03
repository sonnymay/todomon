import { useEffect, useState } from 'react'
import type { Creature, Task } from '../types'

// First-run coach. Interactive: it drives the *real* app handlers (rename → add → complete)
// so the new user lives the core loop once. Anchored to the bottom of Home's column so the
// dragon scene stays visible above and the completion reaction lands. Self-manages its own
// localStorage flag and renders nothing once dismissed.

const STORAGE_KEY = 'todomon_onboarded_v1'
const FIRST_TASK_XP = 20 // a "Quick" task — matches TaskList's SMALL difficulty
const SUGGESTIONS = ['Drink water', 'Make my bed', 'Read 1 page'] as const

function alreadyOnboarded(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

type OnboardingStep = 'meet' | 'add' | 'complete' | 'react'

interface OnboardingProps {
  creature: Creature
  tasks: Task[]
  petName: string
  onRename: (name: string) => void
  onAdd: (title: string, xpReward: number, notes?: string) => Promise<void>
  onComplete: (taskId: string) => Promise<void>
}

export default function Onboarding({
  tasks,
  petName,
  onRename,
  onAdd,
  onComplete,
}: OnboardingProps) {
  const [dismissed, setDismissed] = useState(alreadyOnboarded)
  const [step, setStep] = useState<OnboardingStep>('meet')
  const [nameDraft, setNameDraft] = useState(petName)
  // The title the user chose to add, and the concrete task id once it lands in `tasks`.
  const [pendingTitle, setPendingTitle] = useState<string | null>(null)
  const [addedTaskId, setAddedTaskId] = useState<string | null>(null)

  // add → complete: resolve the title we just added to a concrete task id.
  useEffect(() => {
    if (step !== 'add' || !pendingTitle) return
    const t = tasks.find((task) => task.title === pendingTitle && !task.is_done)
    if (t) {
      setAddedTaskId(t.id)
      setStep('complete')
    }
  }, [step, pendingTitle, tasks])

  // complete → react: detect completion of that task (real state, not optimistic).
  useEffect(() => {
    if (step !== 'complete' || !addedTaskId) return
    if (tasks.find((task) => task.id === addedTaskId)?.is_done) setStep('react')
  }, [step, addedTaskId, tasks])

  if (dismissed) return null

  function finish() {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // storage unavailable — at least don't show it again this session
    }
    setDismissed(true)
  }

  function handleMeetContinue() {
    const next = nameDraft.trim()
    if (next && next !== petName) onRename(next)
    setStep('add')
  }

  function handlePick(title: string) {
    const clean = title.trim()
    if (!clean || pendingTitle) return // guard double-fire (StrictMode / double-tap)
    setPendingTitle(clean)
    void onAdd(clean, FIRST_TASK_XP)
  }

  const stepIndex = { meet: 0, add: 1, complete: 2, react: 3 }[step]
  const addedTitle = pendingTitle ?? 'your task'

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex justify-center">
      <div className="relative w-full max-w-md">
        {/* upward scrim over the lower region only — keeps the dragon scene bright up top */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/45 to-transparent" />

        <div className="pointer-events-auto absolute inset-x-0 bottom-0 rounded-t-3xl bg-[#fdf6e3] p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl">
          {/* step dots */}
          <div className="mb-4 flex justify-center gap-2">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === stepIndex ? 'w-6 bg-orange-500' : 'w-2 bg-slate-300'
                }`}
              />
            ))}
          </div>

          {step === 'meet' && (
            <div className="text-center">
              <div className="mb-2 text-5xl">🐲</div>
              <h2 className="mb-1 text-xl font-black text-slate-800">
                Meet {petName}!
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-slate-600">
                This is your task buddy. Finish real to-dos and {petName} grows. Want to
                give them a name?
              </p>
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                maxLength={20}
                aria-label="Dragon name"
                className="mb-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-base font-bold text-slate-800 shadow-inner focus:border-orange-400 focus:outline-none"
              />
              <button
                onClick={handleMeetContinue}
                className="w-full rounded-2xl bg-orange-500 px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-orange-600 active:scale-95"
              >
                Continue →
              </button>
            </div>
          )}

          {step === 'add' && (
            <div className="text-center">
              <div className="mb-2 text-5xl">✍️</div>
              <h2 className="mb-1 text-xl font-black text-slate-800">
                Add your first task
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-slate-600">
                Pick something tiny — you'll finish it in a second to feed {petName}.
              </p>
              <div className="flex flex-col gap-2">
                {SUGGESTIONS.map((title) => (
                  <button
                    key={title}
                    onClick={() => handlePick(title)}
                    className="rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-orange-50 active:scale-95"
                  >
                    {title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center">
              <div className="mb-2 text-5xl">✅</div>
              <h2 className="mb-1 text-xl font-black text-slate-800">
                Now complete it!
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-slate-600">
                Tap to finish “{addedTitle}” and watch {petName} react.
              </p>
              <button
                onClick={() => addedTaskId && void onComplete(addedTaskId)}
                disabled={!addedTaskId}
                className="w-full rounded-2xl bg-green-500 px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-green-600 active:scale-95 disabled:opacity-40"
              >
                Complete “{addedTitle}” ✓
              </button>
            </div>
          )}

          {step === 'react' && (
            <div className="text-center">
              <div className="mb-2 text-5xl">🎉</div>
              <h2 className="mb-1 text-xl font-black text-slate-800">
                That's the whole game!
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-slate-600">
                {petName} just grew and earned 🪙 coins. The 🍖 Food bar fills when you
                finish tasks and slowly drops over time — keep {petName} fed and watch them
                evolve.
              </p>
              <button
                onClick={finish}
                className="w-full rounded-2xl bg-orange-500 px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-orange-600 active:scale-95"
              >
                Start using ToDoMon 🚀
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
