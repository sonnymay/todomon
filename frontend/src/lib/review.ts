import { InAppReview } from '@capacitor-community/in-app-review'

// Native App Store rating prompt, asked at peak-happiness moments. iOS hard-caps the
// real dialog at 3/year per user, so we spend requests carefully: once per trigger kind
// for the lifetime of the install.

const STORAGE_KEY = 'todomon_review_v1'

export type ReviewTrigger = 'evolution' | 'streak_milestone'

export interface ReviewState {
  asked: ReviewTrigger[]
}

// Pure: should we ask now, and the state to persist if we do.
export function nextReviewState(
  state: ReviewState,
  trigger: ReviewTrigger,
): { ask: boolean; state: ReviewState } {
  if (state.asked.includes(trigger)) return { ask: false, state }
  return { ask: true, state: { asked: [...state.asked, trigger] } }
}

function read(): ReviewState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ReviewState>
      if (Array.isArray(parsed.asked)) return { asked: parsed.asked }
    }
  } catch {
    // ignore malformed storage
  }
  return { asked: [] }
}

export async function maybeRequestReview(trigger: ReviewTrigger): Promise<void> {
  const { ask, state } = nextReviewState(read(), trigger)
  if (!ask) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage unavailable — still try the prompt
  }
  try {
    // Delay so the prompt lands after the celebration, not on top of it.
    setTimeout(() => {
      void InAppReview.requestReview().catch(() => {})
    }, 2500)
  } catch {
    // plugin unavailable (web/dev) — no-op
  }
}
