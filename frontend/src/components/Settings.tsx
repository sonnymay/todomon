import { useState, type FormEvent } from 'react'
import { isSoundOn, setSoundOn } from '../lib/sfx'
import { isHapticsOn, setHapticsOn } from '../lib/haptics'

const APP_VERSION = '1.0.0'
const MAX_NAME = 16

interface Props {
  petName: string
  isPro: boolean
  onGoPro: () => void
  onRename: (name: string) => void
  onRestart: () => void
  onClose: () => void
}

function Toggle({
  label,
  on,
  onChange,
}: {
  label: string
  on: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      className="flex w-full items-center justify-between py-3"
    >
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <span
        className={`relative h-7 w-12 rounded-full transition-colors ${
          on ? 'bg-orange-500' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
            on ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  )
}

export default function Settings({
  petName,
  isPro,
  onGoPro,
  onRename,
  onRestart,
  onClose,
}: Props) {
  const [sound, setSound] = useState(isSoundOn)
  const [haptics, setHaptics] = useState(isHapticsOn)
  const [name, setName] = useState(petName)
  const [confirmReset, setConfirmReset] = useState(false)

  function saveName(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim().slice(0, MAX_NAME)
    if (trimmed && trimmed !== petName) onRename(trimmed)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-[#fdf6e3] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-800">Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300"
          >
            ✕
          </button>
        </div>

        {/* rename */}
        <form onSubmit={saveName} className="mb-3">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">
            Dragon name
          </label>
          <div className="flex gap-2">
            <input
              value={name}
              maxLength={MAX_NAME}
              onChange={(e) => setName(e.target.value)}
              className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
            />
            <button
              type="submit"
              className="shrink-0 rounded-2xl bg-orange-500 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-orange-600 active:scale-95"
            >
              Save
            </button>
          </div>
        </form>

        {/* Pro */}
        <button
          onClick={isPro ? undefined : onGoPro}
          disabled={isPro}
          className={`mb-3 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left ${
            isPro
              ? 'bg-green-100'
              : 'bg-gradient-to-r from-amber-400 to-orange-500 active:scale-[0.99]'
          }`}
        >
          <span className="text-2xl">{isPro ? '👑' : '✨'}</span>
          <div className="flex-1">
            <p className={`text-sm font-black ${isPro ? 'text-green-700' : 'text-white'}`}>
              {isPro ? "You're Pro" : 'Unlock ToDoMon Pro'}
            </p>
            {!isPro && (
              <p className="text-xs font-semibold text-white/90">
                Exclusive accessories & extra delight, one-time
              </p>
            )}
          </div>
          {!isPro && <span className="text-sm font-black text-white">→</span>}
        </button>

        {/* toggles */}
        <div className="divide-y divide-slate-200 rounded-2xl bg-white px-4">
          <Toggle
            label="🔊 Sound"
            on={sound}
            onChange={(next) => {
              setSoundOn(next)
              setSound(next)
            }}
          />
          <Toggle
            label="📳 Haptics"
            on={haptics}
            onChange={(next) => {
              setHapticsOn(next)
              setHaptics(next)
            }}
          />
        </div>

        {/* restart */}
        <div className="mt-3">
          {confirmReset ? (
            <div className="rounded-2xl bg-red-50 p-3 text-center">
              <p className="mb-2 text-sm font-semibold text-red-700">
                Start over? Your dragon resets to an egg and all tasks are cleared.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 rounded-2xl bg-slate-200 py-2.5 text-sm font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={onRestart}
                  className="flex-1 rounded-2xl bg-red-500 py-2.5 text-sm font-extrabold text-white active:scale-95"
                >
                  Reset
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="w-full rounded-2xl py-2.5 text-sm font-bold text-red-500 hover:bg-red-50"
            >
              🥚 Restart pet
            </button>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Everything stays on your device — nothing is collected.
        </p>
        <p className="mt-1 text-center text-[11px] text-slate-300">
          <a
            href="/privacy.html"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-400"
          >
            Privacy Policy
          </a>
          {' · '}v{APP_VERSION}
        </p>
      </div>
    </div>
  )
}
