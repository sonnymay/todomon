// Confetti bursts for satisfying moments. Skips entirely when the user prefers reduced
// motion. Uses canvas-confetti (tiny, self-cleaning canvas).
import confetti from 'canvas-confetti'

function reducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  )
}

const SUNNY_COLORS = ['#fb923c', '#f59e0b', '#fde047', '#34d399', '#60a5fa']

// Small cheerful pop — for completing a task. `origin` is normalized {x,y} (0-1).
export function celebrate(origin?: { x: number; y: number }): void {
  if (reducedMotion()) return
  confetti({
    particleCount: 60,
    spread: 70,
    startVelocity: 32,
    gravity: 0.9,
    scalar: 0.9,
    ticks: 120,
    origin: origin ?? { x: 0.5, y: 0.7 },
    colors: SUNNY_COLORS,
    disableForReducedMotion: true,
  })
}

// Bigger, longer celebration — for an evolution.
export function evolveBurst(): void {
  if (reducedMotion()) return
  const fire = (particleCount: number, opts: confetti.Options) =>
    confetti({
      particleCount,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      colors: SUNNY_COLORS,
      disableForReducedMotion: true,
      ...opts,
    })
  fire(80, { startVelocity: 45, scalar: 1.1 })
  fire(50, { startVelocity: 30, decay: 0.92, scalar: 1.3 })
  fire(40, { spread: 140, startVelocity: 25 })
}
