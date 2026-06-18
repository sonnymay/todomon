import { useState } from 'react'
import Sheet from './Sheet'
import { PRO_PRICE_DISPLAY } from '../lib/iap'

interface Props {
  isPro: boolean
  onBuy: () => Promise<boolean>
  onRestore: () => Promise<boolean>
  onClose: () => void
}

const BENEFITS = [
  { emoji: '👑', text: 'Dress up your dragon with supporter-only cosmetics — Cosmic Aura, Royal Frame & Crown' },
  { emoji: '🎉', text: 'A golden star shower every time you finish a task' },
  { emoji: '💛', text: 'Optional upgrade that helps ToDoMon keep growing' },
]

export default function Paywall({ isPro, onBuy, onRestore, onClose }: Props) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function buy() {
    setBusy(true)
    setMsg(null)
    try {
      const ok = await onBuy()
      setMsg(ok ? "🎉 You're Pro! Enjoy." : 'Purchase did not complete.')
    } finally {
      setBusy(false)
    }
  }

  async function restore() {
    setBusy(true)
    setMsg(null)
    try {
      const ok = await onRestore()
      setMsg(ok ? '✅ Pro restored.' : 'No purchase to restore.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet title="✨ Supporter Pack" onClose={onClose}>
      <div className="pb-2 text-center">
        <div className="text-5xl">🐲👑</div>
        <p className="mt-2 text-sm text-slate-600">
          ToDoMon is fully playable. This one-time pack adds extra delight.
        </p>

        <div className="mt-4 space-y-2 text-left">
          {BENEFITS.map((b) => (
            <div key={b.text} className="flex items-center gap-3 rounded-2xl bg-white p-3">
              <span className="text-2xl">{b.emoji}</span>
              <span className="text-sm font-semibold text-slate-700">{b.text}</span>
            </div>
          ))}
        </div>

        <p className="mt-2 text-center text-xs text-slate-400">Plus a little perk: 2× coins on every task.</p>

        {isPro ? (
          <div className="mt-5 rounded-2xl bg-green-100 py-3 text-sm font-extrabold text-green-700">
            You're Pro ✓ — thank you!
          </div>
        ) : (
          <button
            onClick={buy}
            disabled={busy}
            className="mt-5 w-full rounded-2xl bg-orange-500 py-3.5 text-base font-black text-white shadow-sm transition hover:bg-orange-600 active:scale-95 disabled:opacity-60"
          >
            {busy ? 'Please wait…' : `Get Supporter Pack · ${PRO_PRICE_DISPLAY}`}
          </button>
        )}

        {!isPro && (
          <button
            onClick={restore}
            disabled={busy}
            className="mt-2 text-xs font-semibold text-slate-400 hover:text-slate-600"
          >
            Restore purchase
          </button>
        )}

        {msg && <p className="mt-3 text-sm font-bold text-slate-600">{msg}</p>}
      </div>
    </Sheet>
  )
}
