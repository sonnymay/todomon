import type { Stage } from '../types'
import { STAGE_LABEL, creatureSleepImage } from '../lib/stages'

interface Props {
  stage: Stage
  onClose: () => void
}

// Full-screen "your dragon evolved!" moment. Tap anywhere to dismiss.
export default function EvolutionCelebration({ stage, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/70 p-8 text-center"
      onClick={onClose}
    >
      <div className="celebrate-pop flex flex-col items-center">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">
          Evolution!
        </p>
        <img
          src={creatureSleepImage(stage)}
          alt={STAGE_LABEL[stage]}
          className="my-4 h-44 w-44 rounded-3xl object-cover shadow-2xl ring-4 ring-amber-300"
        />
        <h1 className="text-3xl font-black text-white">
          {STAGE_LABEL[stage]}!
        </h1>
        <p className="mt-2 max-w-xs text-sm text-white/80">
          Your dragon grew stronger from all your hard work. Keep it up!
        </p>
        <span className="mt-6 rounded-full bg-white/15 px-4 py-2 text-xs font-bold text-white/90">
          Tap to continue
        </span>
      </div>
    </div>
  )
}
