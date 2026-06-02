import { useState } from 'react'

// First-run intro. Self-contained: reads/writes its own localStorage flag and renders
// nothing once dismissed, so App can mount it unconditionally.

const STORAGE_KEY = 'todomon_onboarded_v1'

function alreadyOnboarded(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

interface Step {
  emoji: string
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    emoji: '🐲',
    title: 'Meet your dragon',
    body: 'This is Sunny. Sunny grows and evolves as you get things done — your very own task buddy.',
  },
  {
    emoji: '✅',
    title: 'Finish tasks to feed it',
    body: 'Add your to-dos and check them off. Each completed task earns ⭐ XP and feeds Sunny.',
  },
  {
    emoji: '📊',
    title: 'Watch the bars',
    body: '🍖 Food is how full Sunny is — it slowly drops, so keep completing tasks. 🌟 Grow fills toward the next evolution.',
  },
]

export default function Onboarding() {
  const [dismissed, setDismissed] = useState(alreadyOnboarded)
  const [step, setStep] = useState(0)

  if (dismissed) return null

  const isLast = step === STEPS.length - 1
  const s = STEPS[step]

  function finish() {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // storage unavailable — at least don't show it again this session
    }
    setDismissed(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
      <div className="w-full max-w-sm rounded-3xl bg-[#fdf6e3] p-6 text-center shadow-2xl">
        <div className="mb-4 text-6xl">{s.emoji}</div>
        <h2 className="mb-2 text-xl font-black text-slate-800">{s.title}</h2>
        <p className="mb-6 text-sm leading-relaxed text-slate-600">{s.body}</p>

        {/* step dots */}
        <div className="mb-5 flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? 'w-6 bg-orange-500' : 'w-2 bg-slate-300'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={finish}
            className="text-sm font-semibold text-slate-400 hover:text-slate-600"
          >
            Skip
          </button>
          <button
            onClick={() => (isLast ? finish() : setStep((n) => n + 1))}
            className="rounded-2xl bg-orange-500 px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-orange-600 active:scale-95"
          >
            {isLast ? "Let's go! 🚀" : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}
