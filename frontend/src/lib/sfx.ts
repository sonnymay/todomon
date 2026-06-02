// Tiny, asset-free sound effects via the Web Audio API. Short sine-wave envelopes —
// pleasant little chimes, nothing to download. Respects a persisted mute flag and only
// creates the AudioContext on first use (after a user gesture) to avoid autoplay warnings.

const SOUND_KEY = 'todomon_sound_v1'

export function isSoundOn(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== '0'
  } catch {
    return true
  }
}

export function setSoundOn(on: boolean): void {
  try {
    localStorage.setItem(SOUND_KEY, on ? '1' : '0')
  } catch {
    // storage unavailable — preference stays in-memory only
  }
}

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      ctx = new Ctor()
    }
    // A gesture-triggered call can resume a context the browser suspended.
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

// Play one short note. `start` is seconds from now (lets us sequence arpeggios).
function note(freq: number, start: number, duration: number, gain = 0.12): void {
  const ac = audio()
  if (!ac) return
  const osc = ac.createOscillator()
  const env = ac.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  const t0 = ac.currentTime + start
  env.gain.setValueAtTime(0, t0)
  env.gain.linearRampToValueAtTime(gain, t0 + 0.012) // fast attack
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration) // smooth decay
  osc.connect(env).connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

// A soft two-note "ding" when a task is completed.
export function playComplete(): void {
  if (!isSoundOn()) return
  note(659.25, 0, 0.18) // E5
  note(987.77, 0.08, 0.22) // B5
}

// A short rising arpeggio fanfare for an evolution.
export function playLevelUp(): void {
  if (!isSoundOn()) return
  ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(f, i * 0.09, 0.3, 0.13))
}

// A gentle blip when the dragon is petted.
export function playTap(): void {
  if (!isSoundOn()) return
  note(880, 0, 0.1, 0.07)
}
