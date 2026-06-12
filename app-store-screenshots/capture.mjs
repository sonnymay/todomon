// Capture App Store screenshots from the REAL app (Vite dev server) with seeded state.
// iPhone 6.5": 428×926 CSS px @ 3x = 1284×2778. iPad 13": 1024×1366 @ 2x = 2048×2732.
// Usage: NODE_PATH=<playwright dir> node capture.mjs [ipad]
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

const BASE = 'http://localhost:5173'
const OUT = new URL('.', import.meta.url).pathname
const IPAD = process.argv.includes('ipad')

const viewport = IPAD ? { width: 1024, height: 1366 } : { width: 428, height: 926 }
const scale = IPAD ? 2 : 3
const suffix = IPAD ? 'ipad-13' : 'iphone-65'

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport, deviceScaleFactor: scale })
const page = await ctx.newPage()

// Skip onboarding before first load.
await page.addInitScript(() => {
  localStorage.setItem('todomon_onboarded_v1', '1')
  localStorage.setItem('todomon_pet_name', 'Sunny')
})

await page.goto(BASE)
await page.waitForTimeout(2500) // let the app seed fresh state

// Patch the seeded state into a flattering "great week" snapshot, then reload.
await page.evaluate(() => {
  const now = Date.now()
  const today = new Date().toDateString()

  // Streak: 7 days, alive today.
  localStorage.setItem('todomon_streak_v1', JSON.stringify({ count: 7, lastDate: today }))
  // Hunger: well fed.
  localStorage.setItem('todomon_hunger_v1', JSON.stringify({ value: 86, updatedAt: now }))

  // Creature: keep the seeded champion, just make sure the name is Sunny.
  const creature = JSON.parse(localStorage.getItem('todomon_creature_v1'))
  creature.name = 'Sunny'
  creature.stage = 'champion'
  creature.xp = 16000 // mid-champion (enters at L45 = 12150)
  localStorage.setItem('todomon_creature_v1', JSON.stringify(creature))

  // Tasks: a believable productive day — 3 done today, 3 open.
  const mk = (seq, title, notes, xp, done) => ({
    id: `local-${seq}`,
    user_id: 'dev',
    title,
    notes,
    xp_reward: xp,
    is_done: done,
    created_at: new Date(now - (10 - seq) * 60_000).toISOString(),
    completed_at: done ? new Date(now - (7 - seq) * 30_000).toISOString() : null,
    seq,
  })
  localStorage.setItem(
    'todomon_tasks_v1',
    JSON.stringify([
      mk(1, 'Morning workout', '30 min run', 20, true),
      mk(2, 'Plan my day', 'Top 3 priorities', 10, true),
      mk(3, 'Finish project outline', 'First draft done!', 35, true),
      mk(4, 'Reply to emails', 'Inbox zero', 10, false),
      mk(5, 'Read 20 pages', 'Before bed', 20, false),
      mk(6, 'Call mom', '', 10, false),
    ]),
  )

  // Game state: coins, trophies, quest progress, diary memory, streak freezes.
  const game = JSON.parse(localStorage.getItem('todomon_game_v1'))
  game.coins = 145
  game.streakFreezes = 2
  game.stats = {
    ...game.stats,
    tasksCompletedTotal: 57,
    bestStreak: 7,
    feedCount: 14,
    maxStageIdx: 4,
    coinsEarnedTotal: 820,
  }
  game.achievements = [
    'first_task', 'tasks_10', 'tasks_50',
    'streak_3', 'streak_7', 'feed_10',
    'evolve_baby', 'evolve_champion',
  ]
  game.seenAchievements = game.achievements
  // Quest progress: first quest complete (claimable), others partial.
  const qs = game.daily.quests
  if (qs[0]) game.daily.state[qs[0].id].progress = qs[0].target
  if (qs[1]) game.daily.state[qs[1].id].progress = Math.max(1, Math.floor(qs[1].target / 2))
  game.lastMemory = {
    kind: 'evolution',
    emoji: '🐲',
    text: 'Sunny evolved into a Champion because you kept showing up!',
    at: now - 3600_000,
  }
  localStorage.setItem('todomon_game_v1', JSON.stringify(game))
})

await page.reload()
await page.waitForTimeout(3000) // creature video + UI settle

async function shot(name) {
  await page.screenshot({ path: `${OUT}${name}-${suffix}.png` })
  console.log(`captured ${name}-${suffix}.png`)
}

// 1. Home — happy champion dragon, streak, tasks.
await shot('01-home')

// 2. Tasks close-up — scroll the task list into view.
await page.evaluate(() => document.querySelector('section.min-w-0')?.scrollIntoView({ block: 'start' }))
await page.waitForTimeout(600)
await shot('02-tasks')
await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(400)

// 3–5. Bottom-nav sheets: Shop, Quests, Trophies.
const sheets = [
  ['Shop', '03-shop'],
  ['Quests', '04-quests'],
  ['Trophies', '05-trophies'],
]
for (const [label, name] of sheets) {
  await page.click(`nav button:has-text("${label}")`)
  await page.waitForTimeout(900)
  await shot(name)
  await page.click('button[aria-label="Close"]')
  await page.waitForTimeout(600)
}

// 6. Night mode — toggle sleep.
const nightBtn = page.locator('button[aria-label*="ight"], button:has-text("🌙")').first()
if (await nightBtn.isVisible().catch(() => false)) {
  await nightBtn.click()
  await page.waitForTimeout(2000)
  await shot('06-night')
}

await browser.close()
