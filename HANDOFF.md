# ToDoMon — Session Handoff

> Read this first when starting a new session. It captures the full state of the
> project so you can continue without re-discovering everything.

_Last updated: 2026-06-01 (monetization: ToDoMon Pro one-time unlock — code complete)_

---

## 0. Recent fixes (most recent first)

### (2026-06-02) Task A unblocked — assets/ source folder created ✅
`assets/icon.png` + `assets/splash.png` (1024²) now exist, copied from the existing
`frontend/public/icon-1024.png`. Note: the iOS `AppIcon.appiconset` was already populated
with a byte-identical 1024² icon, so the app already ships a valid icon — Task A was only
"blocked" on the missing `@capacitor/assets` *source* folder. `splash.png` is a placeholder
(icon copy); for a proper splash use the mascot on cream `#fdf6e3` with padding.
Did NOT run `npx @capacitor/assets generate` (appiconset already correct). Re-run it after
dropping in final art: `cd frontend && npm i -D @capacitor/assets && cd .. && npx @capacitor/assets generate --ios --assetPath assets`.

### (2026-06-02) Task A (prior) blocked; Task B RevenueCat IAP wired ⚠️
Task A from `docs/CODEX_TASKS.md` was blocked because `assets/icon.png` was not present yet.
Moved to Task B as requested.

Task B progress:
- Installed `@revenuecat/purchases-capacitor`.
- Upgraded root Capacitor packages to 8.4.0 so native plugins match Capacitor 8.
- Added `scripts/run-capacitor.sh`; root `npm run cap:sync:ios` now uses Node >=22 when
  available (Codex bundled Node 24 works on this Mac). System `node` is v20 and cannot run
  Capacitor 8 CLI directly.
- Raised iOS deployment target to 15.0 because RevenueCat's pod requires iOS 15+.
- `frontend/src/lib/iap.ts` now wires native purchase/restore through RevenueCat:
  `getProducts({ productIdentifiers: ['todomon_pro'], type: NON_SUBSCRIPTION })`,
  `purchaseStoreProduct`, and `restorePurchases`.
- Product remains exactly `todomon_pro`; price display remains `$4.99`.
- Native RevenueCat config reads `VITE_REVENUECAT_IOS_API_KEY`.
- Pro unlock succeeds if RevenueCat reports product `todomon_pro` purchased or active
  entitlement `pro`/`todomon_pro`.
- Web/dev mock path remains unchanged.
- Added `docs/IAP_SETUP.md` with exact App Store Connect + RevenueCat setup.
- Updated `docs/SHIP_PLAN.md` to point at the new IAP setup doc.

Verification:
- `cd frontend && npm run build` passes.
- `cd frontend && npm test` passes: 31 tests.
- `npm run cap:sync:ios` copies web assets and iOS config, sees the RevenueCat native plugin,
  and passes the iOS 15 pod compatibility check. It then fails at `pod install` because full
  Xcode is still not installed/selected:
  `xcode-select: error: tool 'xcodebuild' requires Xcode, but active developer directory
  '/Library/Developer/CommandLineTools' is a command line tools instance`.

Need user action before continuing Task B/C:
- Place generated icon at `assets/icon.png` to unblock Task A.
- Install full Xcode and run:
  `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`
- Create App Store Connect non-consumable IAP `todomon_pro` at `$4.99`.
- Create RevenueCat entitlement `pro`, attach `todomon_pro`, and add the iOS public SDK key to
  `frontend/.env` as `VITE_REVENUECAT_IOS_API_KEY`.

### (2026-06-01) Monetization: ToDoMon Pro one-time unlock ($4.99) — code complete ✅
Chosen model (recommended for a solo first launch): **one-time non-consumable "Pro" unlock**
(`todomon_pro`, $4.99) → all premium cosmetics + **2× coins forever** + Pro badge. Built + verified
in preview with a dev-mock purchase.
- `lib/iap.ts` — entitlement (`isPro`, localStorage `todomon_pro_v1`), `purchasePro`/`restorePurchases`
  with a **web mock** (instant grant, fully testable) and **native StoreKit seams**
  (`nativePurchase`/`nativeRestore` — TODO, wired during the on-device IAP step).
- `components/Paywall.tsx` (benefits + Unlock + **Restore**), Pro banner + 🔒 Pro gating in `Shop`,
  Go-Pro row in `Settings`, premium cosmetics flagged `pro` in `cosmetics.ts` (`PRO_COSMETIC_IDS`),
  `gameStore.grantProCosmetics`, and a coin multiplier arg on `recordCompletion` (App passes ×2 when Pro).
- Verified: paywall → mock buy → `todomon_pro_v1='1'` + the 3 premium cosmetics granted + a SMALL
  task paid 14 (=2×5 base + 4 streak vs 9 non-Pro). `npm run build` green (110 modules); 31 tests
  pass; clean reload 0 runtime errors.
- **To actually charge money (needs your Xcode + App Store Connect):** install a Capacitor IAP
  plugin (RevenueCat recommended) + `cap sync`, wire the two `iap.ts` seams to product `todomon_pro`,
  and create that non-consumable IAP at $4.99 in App Store Connect (sandbox-test on device).
  See `docs/SHIP_PLAN.md`. You ARE enrolled in the Apple Developer Program (the main gate is cleared).
- **Still required before submit (separate):** app icon + splash, hosted privacy-policy URL,
  screenshots, portrait lock — then Xcode build → TestFlight → submit.

### (2026-06-01) Engagement update: coins, quests, achievements, cosmetics, feed, celebrations ✅
A full habit-loop layer, all offline/client-side, persisted to `todomon_game_v1`. Verified live.
- **Pure logic + tests** (Vitest, now **31 pass**): `lib/economy.ts` (coin rewards by difficulty +
  streak, lucky bonus, feed cost, streak-milestone rewards, daily bonus), `lib/quests.ts`
  (deterministic daily roll + advance + claimable), `lib/achievements.ts` (11 trophies + evaluate/
  newlyUnlocked), `lib/cosmetics.ts` (auras/frames/flair catalog), `lib/gameTypes.ts` (shared types).
  Each with a `.test.ts`.
- **Store**: `lib/gameStore.ts` — `useGameStore(today)` owns coins/stats/quests/achievements/owned+
  equipped cosmetics, persists one blob, exposes `recordCompletion/recordEvolve/feed/claimQuest/
  claimDailyBonus/buy/equip/markAchievementsSeen`, returns reward events for the UI.
- **Wiring** (`App.tsx`): `awardCompletion()` (coins+lucky+milestone+quests+achievements) in both
  complete branches; `handleFeed` (spend coins → +hunger + happy reaction); daily-bonus effect;
  evolution celebration + `recordEvolve` in `applyLevelUp`; transient coin-gain + achievement-toast
  overlays; `useStreak.registerCompletion` now returns the new streak. Restart clears the game blob.
- **UI**: coin counter + coin-float + name flair in `TopBar`; **Feed button + mood + evolve nudge**
  in `StatsPanel`; **difficulty picker** (Quick/Medium/Big) + (existing) per-task animations in
  `TaskList`; equipped **aura (vignette glow) + frame** in `CreatureScene` + feed-bounce; an icon
  **action row** (🛒 Shop / 🎯 Quests / 🏆 Trophies / 📊 Stats with claim/unseen dots) in `Home`;
  new bottom-sheets `Shop/Quests/Achievements/Stats` (+ shared `Sheet.tsx`); full-screen
  `EvolutionCelebration`. New CSS keyframes: coin-float, toast-in, celebrate-pop, feed-bounce
  (all reduced-motion gated).
- Verified live: complete → coins + quest progress + first_task trophy (+reward); feed spends 12🪙,
  feedCount+quest advance, hunger clamps at 100; Shop buy auto-equips an aura that renders on the
  scene; Trophies "1/11 unlocked"; Dev: Evolve → full-screen "Evolution!" + maxStageIdx recorded;
  daily bonus +20 on open. `npm run build` green (108 modules); console clean.

### (2026-06-01) Offline-first v1 foundation: on-device persistence, edit, settings, asset diet ✅
Decision: ship a **free, offline / on-device v1** (no login). `DEV_NO_AUTH=true` is the shipping
engine; the Supabase real-mode code becomes a v1.1 sync feature. Xcode is only needed for the final
build/upload. Round 1 (all web layer, verified live):
- **Durable on-device state** (the #1 offline gap — tasks/creature used to reset every launch):
  new `lib/localStore.ts` (load/save creature + tasks to `todomon_creature_v1`/`todomon_tasks_v1`).
  `App` loads persisted state or starts **fresh (egg, 0 XP, empty list)** on first launch via new
  `freshCreature()`; a `useEffect([creature,tasks])` saves on every change. Verified: add/complete/
  edit → reload → state intact; completing gave +20 XP persisted.
- **Edit task**: tap an open task's title → inline title/notes edit form (Save/Cancel);
  `App.handleEdit` + `api.updateTask` (real mode). `TaskList` gained the edit state.
- **Settings sheet** (new `components/Settings.tsx`): replaces the ☰ dropdown — Sound + Haptics
  toggles (new `haptics.isHapticsOn/setHapticsOn`), rename, **Restart pet** (confirm → wipes state
  + reload), "everything stays on your device" note, v1.0.0. `TopBar` simplified (☰ →
  `onOpenSettings`; Sign out removed — meaningless offline).
- **Native feel**: `viewport-fit=cover` + `env(safe-area-inset-*)` padding on TopBar/task area/
  Settings sheet so content clears the notch + home indicator.
- **Asset diet — 70 MB → ~13 MB**: deleted unused legacy bare `*.mp4` + abandoned `*.webm`; ffmpeg
  re-encoded every `sun_dragon_*` video (H.264 crf28, ≤720w, 24fps, no audio, faststart);
  `sips`-downscaled the sleeping PNGs. Originals backed up to `/tmp/todomon_*_orig`.
- `npm test` 18 pass; `npm run build` green (97 modules); console clean on a fresh load.
- **Round 2 (next, see plan):** app icon + splash, privacy-policy URL, screenshots, portrait lock,
  optional depth (difficulty/due-dates/dark mode), then Xcode → TestFlight → submit.

### (2026-06-01) Real-mode persistence built (dev mode still default) ✅
Implemented full Supabase-backed persistence so state survives reinstall when
`DEV_NO_AUTH=false`. **`DEV_NO_AUTH` stays `true`** (per user) — the new code is dormant until
flipped, so the running app is byte-for-byte the same experience (verified: dev complete →
streak/hunger/confetti all work, 0 runtime errors).
- **Migrations applied** to Supabase project `tlswbznepnmtvrlmegzd` (name "dividend", the one in
  `frontend/.env`):
  1. `todomon_fix_stage_curve` — rewrote `todomon_stage_for_xp` to the frontend's ramping
     thresholds (0/50/1800/5850/12150/20700/54500). The old 0/50/120/250/450/700/1000 would
     have mis-evolved creatures in real mode. **§8 item resolved.** Verified at boundaries
     (12149→rookie, 12150→champion, 54500→mega).
  2. `todomon_add_hunger_streak_columns` — `todomon_creatures.hunger int default 100` +
     `hunger_updated_at timestamptz default now()`; `todomon_profiles.streak_count int
     default 0` + `last_active_date date`. (Additive/defaulted — safe.)
  3. `todomon_complete_task_hunger_streak` — the complete RPC now also applies hunger decay
     (−1/30 min) then +1, and advances the daily streak (same-day no-op / yesterday +1 /
     older reset to 1). Return type unchanged.
  4. `todomon_uncomplete_task(uuid)` — new SECURITY DEFINER RPC: reopen task, subtract XP
     (clamp ≥0), recompute stage, hunger −1. **§8 uncomplete-RPC item resolved.**
- **API** (`lib/api.ts`): added `uncompleteTask`, `updateCreatureName`, `fetchProfile`.
- **Hooks** seed from server in real mode (optional arg; dev path untouched):
  `useHunger(serverSeed?)` re-seeds from `creature.hunger`/`hunger_updated_at`;
  `useStreak(serverSeed?)` re-seeds from the profile (date format normalized). localStorage
  writes are gated to dev only.
- **App** (`App.tsx`): added `profile` state; `loadData` also `fetchProfile()`; real branches
  wired — `handleUncomplete` calls the RPC (TODO removed), `handleRename` persists via
  `updateCreatureName` (TODO removed), `handleComplete` refreshes the profile for the
  server streak. `types.ts`: `Creature.hunger?/hunger_updated_at?` + new `Profile`.
- `npm test` 18 pass; `npm run build` green.
- **NOT done (needs you):** to actually go live, set `DEV_NO_AUTH=false` AND turn off
  "Confirm email" in Supabase → Auth → Providers → Email (or wire confirmation), then sign up.
  Full real-mode E2E couldn't be auto-tested here (needs a real authenticated session).

### (2026-06-01) Delight pass: juicy completion (sound + haptics + confetti) ✅
Made the core loop feel great. All frontend, reduced-motion-aware, mutable.
- **Sound (zero assets)**: `lib/sfx.ts` — Web Audio API synth, lazy `AudioContext` on first
  gesture. `playComplete()` (two-note ding), `playLevelUp()` (rising arpeggio), `playTap()`.
  Gated by `localStorage['todomon_sound_v1']` (default on) via `isSoundOn`/`setSoundOn`.
- **Haptics**: installed `@capacitor/haptics`; `lib/haptics.ts` wraps `tapLight()` /
  `success()` in try/catch (no-op on web).
- **Confetti**: installed `canvas-confetti` (+ types); `lib/confetti.ts` — `celebrate()` small
  pop, `evolveBurst()` bigger. Both skip when `prefers-reduced-motion`.
- **Wiring** (`App.tsx`): `cheer()` now also fires complete chime + light haptic + confetti;
  `applyLevelUp` (on real stage change) fires the level-up fanfare + success haptic + big burst.
- **Micro-anims** (`TaskList.tsx` + `index.css`): completing a task pops the badge (`pop-check`)
  and floats "+{xp} ⭐" (`xp-float`); new rows enter with `row-in`; a hungry pet gently pulses
  (`hungry-pulse` on a new inner wrapper in `CreatureScene`, so it composes with the tap bounce).
  Pet-tap now plays `playTap()` + light haptic.
- **Controls/a11y** (`TopBar.tsx`): ☰ menu gained a 🔊/🔇 **Sound: On/Off** toggle. `index.css`
  has a `prefers-reduced-motion` block neutralizing the non-essential flourishes.
- **iOS**: `cap sync ios` (with `LANG=en_US.UTF-8` to dodge a CocoaPods ASCII-8BIT crash) copied
  web assets → **all 7 hungry videos now in `ios/App/App/public`** + the new bundle. `pod install`
  still blocked by the Xcode-not-installed issue (Command Line Tools only) — haptics native pod
  needs full Xcode to finish (see §"Capacitor iOS shell" below).
- Verified live: completing a task → confetti canvas + "+20 ⭐" float + badge pop, console clean;
  Dev: Evolve → bigger confetti + "Evolved to …" banner; 🔇 toggle persists and silences sound.
  `npm test` 18 pass; `npm run build` green (95 modules).

### (2026-06-01) Robustness + streak + onboarding + evolution preview ✅
Batch of improvements (all frontend, dev mode):
- **Error boundary**: new `components/ErrorBoundary.tsx` (class component) wraps `<App>` in
  `main.tsx`. A render-time crash now shows a friendly "Sunny tripped — Reload" card instead
  of blanking to a white screen.
- **Delete-proof task numbers**: added optional `seq?: number` to `Task` (`types.ts`).
  `seedTasks` assigns 1..5; `handleAdd` (dev) assigns `nextTaskSeq(prev)` = max seq + 1
  (computed from the live list, StrictMode-safe). Badge renders `t.seq ?? <creation-rank>`
  (`TaskList.tsx`), so numbers now survive **deletion** too, not just completion. Real
  (Supabase) rows have no `seq` yet → graceful fallback to the created_at rank from before.
- **Daily streak**: new `lib/useStreak.ts` (pure `currentStreak`/`registerCompletion` +
  hook, persisted to `localStorage['todomon_streak_v1']`). `App.handleComplete` calls
  `registerStreak()` alongside `onTaskCompleted()`. A 🔥 chip renders in the "done today"
  block (`TaskList`) when streak > 0. Streak stays alive through "yesterday", lapses after a
  2-day gap.
- **Onboarding**: new `components/Onboarding.tsx` — 3-step first-run overlay (self-contained,
  gated by `localStorage['todomon_onboarded_v1']`), mounted unconditionally in `App`.
- **Evolution preview**: `StatsPanel` replaced the bare "Next: Ultimate" line with a card —
  next-stage sleeping-PNG thumbnail (`creatureSleepImage(evo.stage)`) + label + an
  "N lvls to go" badge (`STAGE_LEVEL[evo.stage] - levelFromXp(xp)`).
- **Tests**: added Vitest (`npm test` → `vitest run`). `lib/stages.test.ts` (xp/level
  inverse, stage mapping, levelInfo, nextEvolution) + `lib/useStreak.test.ts` (streak
  continue/reset/lapse). **18 tests pass.** `npm run build` green (86 modules).
- Verified live: onboarding steps + dismiss persist; completing a task → 🔥 1 day chip;
  evolution card shows "Ultimate / 10 lvls to go"; console clean.

### (2026-06-01) Review fixes: working ☰ menu + add-task notes field ✅
Acted on the two genuinely-valid items from an external app review (the rest were dev-build
artifacts or hallucinations: no Web3/wagmi exists, the dev buttons are already prod-gated via
`import.meta.env.DEV`, the "empty Food bar" was the reviewer pressing Starve, and a Supabase
backend for cross-device sync already exists behind `DEV_NO_AUTH`).
- **☰ menu now opens a dropdown**: `TopBar` previously wired `onMenu` straight to sign-out,
  which no-ops under `DEV_NO_AUTH`, so the button did nothing. It now toggles a popover
  (`menuOpen` + outside-click `mousedown` listener via `menuRef`) with two real items —
  **✏️ Rename dragon** (reuses the existing `setEditing(true)` rename flow) and **🚪 Sign out**
  (`onMenu`).
- **Add-task notes/subtitle**: `addTask` (`api.ts`) already accepted `notes`; threaded it
  through `localTask` (`localGame.ts`), `handleAdd` (`App.tsx`), and the `onAdd` prop type in
  `Home`/`TaskList`. `TaskList` gained a `notes` state + an optional "Add a note… (optional)"
  input under the title row, cleared on submit.
- Verified live: ☰ opens/closes (outside-click + item-click); Rename focuses the name field;
  adding "Walk the dog" + a note created task **#6** with its subtitle, queued at the bottom.
  `npm run build` green; no new console errors.

### (2026-06-01) Dev food test buttons + permanent task numbers ✅
- **Dev food test buttons**: added `devAdjustHunger(delta)` to `useHunger` (applies decay
  then clamps, mirroring `onTaskCompleted`). `App` wires two dev-only handlers (guarded by
  `DEV_NO_AUTH && import.meta.env.DEV`, same as Dev: Evolve): `onDevFeed` → `+20`,
  `onDevStarve` → `-20`. `Home` renders `😋 Starve −20` and `🍖 Feed +20` pills in the same
  dev-button row. Lets you drive hunger below the `HUNGRY_THRESHOLD` (20) on demand to test
  the hungry-state videos. Verified live: Starve → hunger 0 → the stage's `*_hungry.mp4`
  overlay renders (confirmed champion + the new **mega_hungry** with no media error); Feed
  → hunger 20 → overlay gone.
- **Permanent per-task numbers**: badges no longer use list position (`i + 1`), which made
  open tasks renumber when one completed. `TaskList` now builds `numberById` ranking **all**
  tasks by `created_at` ascending, tie-broken by `id.localeCompare(b.id, { numeric: true })`
  (the numeric flag matters in dev mode where seeded tasks share a `created_at` ms and ids
  are `local-N`). Each task keeps its own number for life — completing #2 keeps it "2" and
  open tasks stay 3,4,5 (no shift to fill 1/2). Done tasks now show their number (on green)
  instead of `✓`. Verified live + `npm run build` green.
- Note: a *deleted* task still causes a one-time renumber of later tasks (numbers are
  derived, not stored). Delete-proof numbering would need a stored `seq` column — deferred.

### (2026-06-01) Ultimate + Mega hungry videos added ✅
Moved the final hungry-state MP4s from `~/Downloads/` into
`frontend/public/assets/creatures/`:
- `sun_dragon_ultimate_hungry.mp4`
- `sun_dragon_mega_hungry.mp4`

Updated `frontend/src/lib/stages.ts` so `HUNGRY_VIDEO_BY_STAGE` now covers all 7 stages.
Verification:
- `npm run build` passes.
- Vite serves both new files at `/assets/creatures/...` with HTTP 200.

### (2026-06-01) Undo completion + Sleep button relocated ✅
- **Undo an accidental "done"**: completed tasks now show an "↩︎ Undo" button (replaces
  the static ✓). `App.handleUncomplete` reopens the task (`is_done:false`,
  `completed_at:null`), subtracts its XP (recomputes stage via `stageForXp`), and reverses
  the +1 hunger via a new `onTaskUndone` in `useHunger`. Threaded App→Home→TaskList.
  Verified: count 2→1, XP bar 4%→0%, task returns to the open queue. (Real-mode needs an
  "uncomplete" RPC — TODO noted; dev path is full.)
- **Sleep button moved**: removed the bottom Sleep bar (`BottomNav.tsx` deleted). The
  Sleep/Wake toggle is now a round 🌙/☀️ button in the **upper-right of the scene, below
  the ☰ menu** (`CreatureScene` gained an `onToggleNight` prop; `right-3 top-16 z-30`).
  Home's task area lost the bottom padding it no longer needs (`pb-24`→`pb-8`).
- Verified live: undo reverses everything; sleep toggle from the new spot still shows the
  sleeping image + dim; `npm run build` green; console clean.

### (2026-06-01) New tasks queue to the bottom ✅
Flipped the `TaskList` open-task ordering from newest-first to **oldest-first**
(`created_at` ascending) so newly added tasks append to the **bottom** of the open list
(work them top-to-bottom like a queue). Completed tasks still sort after open ones; the
1,2,3… numbering follows the same order. Verified: a freshly added task renders last among
open tasks (#5, above the done task); `npm run build` green; console clean.

### (2026-06-01) Numbered tasks + big "done today" counter ✅
- **Numbered task badges**: removed the `taskIcon()` emoji/color helper in `TaskList.tsx`.
  Open tasks now show their position number (1, 2, 3, … — `i + 1` over the open-first
  `ordered` list) on an amber badge; completed tasks show a green ✓. Numbers renumber with
  no gaps as tasks complete.
- **Big satisfying counter**: replaced the small "done today" pill with a hero block — a
  `text-5xl font-black` green number + "done today ✅" label. It **pops** (scale 1→1.45→1)
  whenever the count increases (`count-pop` keyframe in `index.css`, triggered via a
  `prevDone` ref + `useEffect`; auto-clears after 450ms).
- Verified live: open tasks 1–4 + ✓ for done; hero number large (48px); completing a task
  increments 1→2, pops once then clears, and remaining tasks renumber 1–3; `npm run build`
  green; fresh-server console clean.

### (2026-06-01) Hungry Sun Dragon videos added for 5 stages ✅
Moved existing hungry-state MP4s from `~/Downloads/` into
`frontend/public/assets/creatures/`:
- `sun_dragon_egg_hungry.mp4`
- `sun_dragon_hatchling_hungry.mp4`
- `sun_dragon_baby_hungry.mp4`
- `sun_dragon_rookie_hungry.mp4`
- `sun_dragon_champion_hungry.mp4`

`frontend/src/lib/stages.ts` now maps hungry videos only for stages with shipped assets.
`ultimate` and `mega` intentionally return `null`, so `CreatureScene` keeps the normal
idle video immediately instead of requesting missing files. When the missing files arrive,
add them to `HUNGRY_VIDEO_BY_STAGE`.

Verification:
- `npm run build` passes.
- Vite serves all five hungry MP4s at `/assets/creatures/...` with HTTP 200.
- `ultimate`/`mega` hungry files remain absent as expected; fallback path stays idle video.

### (2026-06-01) Cute polish — rename, hide level, bigger pet, daily greeting ✅
- **Tap-to-rename the pet**: TopBar name is now an inline editable field (tap → input,
  Enter/blur to save, Esc to cancel, 16-char cap). `App.handleRename` updates state and
  persists to `localStorage` (`todomon_pet_name`); `seedCreature` reads it
  (`getStoredPetName`/`setStoredPetName` in `localGame.ts`) so it survives refresh.
  Real-mode Supabase persistence is a TODO (noted in code).
- **Level number hidden**: `StatsPanel` dropped the 🏅 level badge and the numeric
  XP readout. Now just two friendly bars — **🍖 Food** (hunger) and **🌟 Grow** (level
  progress) — plus a "Next: <Stage>" caption (no "Lv N").
- **Bigger pet**: `CreatureScene` `SCENE_HEIGHT` 440 → 500 so the dragon dominates.
- **Daily greeting**: `App` shows "<Name> missed you! 🐲" once per calendar day for
  returning users (localStorage `todomon_last_seen`), rendered as a welcome bubble in
  `CreatureScene` (new `greeting` prop), auto-clears after 4.5s. First-ever visit: none.
- **Seed tasks** normalized to 20 XP each (all "small").
- Verified live: rename → "Blaze" persists across reload; greeting shows on a
  new-day reload; no level number; bigger scene; `npm run build` green; console clean.

### (2026-06-01) Simplify & cute-ify (strip clutter) ✅
Plan: `~/.claude/plans/the-level-should-start-validated-metcalfe.md`. Goal: kid-friendly,
simple, cute.
- **TopBar**: now just avatar + pet name ("🐲 Sunny") + ☰ menu. Removed coins, gems (💎),
  gift (🎁), and the + button. Props reduced to `{ petName, onMenu }`.
- **Economy removed from UI**: dropped `coins`/`gems` state in `App.tsx` and props through
  `Home`. (Level/XP/hunger mechanic untouched.)
- **BottomNav**: removed the dead Inventory/Quests/Stats tabs; now a slim sticky bar with a
  single cute Sleep/Wake pill. Removed the coming-soon toast machinery from `Home` (no
  longer needed). Home is hooks-free again; task-list `pb-28`→`pb-24`.
- **Tasks**: removed the Small/Medium/Large `<select>` and the difficulty chip. Every task
  is 20 XP silently (`TASK_XP = DIFFICULTY_XP.SMALL`); cards show a cute `⭐ +20`. Seed
  tasks normalized to 20 XP each.
- **Cute extras**: friendlier copy ("🌞 Today", "Add ✨", "No tasks yet — add one to feed
  your dragon! 🐣"); **one-tap add** (autofocused input + Enter); **tap-the-pet delight**
  (tap the dragon in the day → it bounces + a ❤️ floats up; `heart-float` keyframes in
  `index.css`; sleeping = no tap); **softer look** (rounded-3xl cards/inputs/buttons,
  bigger tap targets, active:scale press states).
- Verified live: no gems/gift/coins; "Sunny" shown; no difficulty picker/chip; no
  placeholder tabs; Sleep pill works; input autofocused; pet-tap spawns hearts that
  auto-clear; `npm run build` green; fresh-server console clean.

### (2026-06-01) Level-driven evolution + real hunger mechanic ✅
Plan: `~/.claude/plans/the-level-should-start-validated-metcalfe.md`.
- **Evolution is now LEVEL-driven, 0-based.** `STAGE_LEVEL` in `lib/stages.ts`:
  egg 0, hatchling 1, baby 15, rookie 30, champion 45, ultimate 60, mega 100.
- **Ramping XP curve** (harder to level): `xpForLevel(L) = 5L² + 45L`
  (L1=50, L15=1800, L45=12150, L60=20700, L100=54500). `levelFromXp` is the inverse;
  `stageForLevel`/`stageForXp` go through it. `STAGE_THRESHOLDS` is now derived from
  `xpForLevel(STAGE_LEVEL[...])`. Removed old `nextStageInfo`/`MAX_XP`; added
  `levelInfo(xp)` (within-level bar) and `nextEvolution(stage)`.
- **StatsPanel**: badge shows the 0-based level; XP bar shows within-level progress
  (`xpIntoLevel / levelSpan`); added "Next evolution: <Stage> at Lv N" caption.
- **Real hunger** (`lib/useHunger.ts`, new): −1 every 30 min (real clock, even while
  closed), +1 per task completed, persisted to `localStorage` key `todomon_hunger_v1`
  (carries decay remainder; live 60s tick). Wired in `App.tsx` (replaces the placeholder
  `useState(72)`; `onTaskCompleted()` called in both complete paths).
- **Very-hungry state**: when `hunger < 20` and awake, `CreatureScene` plays
  `sun_dragon_<stage>_hungry.mp4` (z above base, below sleep). Sleep wins at night
  (day-only). Missing asset → `onError` falls back to the normal scene (verified clean).
- **Seed** `seedCreature` xp bumped 620 → 14750 (≈ Lv 50 → champion) so the dev seed
  still shows an evolved pet under the new curve.
- Verified live: all 7 stages map to their milestone levels via Dev-Evolve (egg 0 …
  mega 100); task complete = +40 XP / +1 hunger; decay 15→11 after 2h; very-hungry
  fallback clean; `npm run build` green; fresh-server console clean.
- **TODO (assets):** user to generate `sun_dragon_<stage>_hungry.mp4` ×7 into
  `frontend/public/assets/creatures/` (falls back gracefully until then).
- **DEFERRED (needs approval):** matching Supabase migration — `todomon_stage_for_xp()`
  to the new curve/levels + real `todomon_creatures.hunger`/`hunger_updated_at` columns
  with decay (roadmap Epic 2.3). Dev mode (TS + localStorage) is authoritative until then.

### (2026-06-01) Pre-submission QA checklist added 📋
Wrote `docs/PRE_SUBMISSION_QA.md` — the verification/hardening pass to run BEFORE App Store
submission (complement to the build roadmap). Framed around the confirmed product vision:
**ToDoMon = Tamagotchi virtual pet × to-do list** (real tasks feed/evolve the Sun Dragon;
neglect makes it hungry/sad). Covers: the core pet-care loop feeling alive, regression of all
session fixes, to-do + creature feature test matrices, economy/anti-cheat integrity, auth +
**account deletion**, loading/empty/error/offline states, cross-device/safe-areas, perf,
a11y, security/RLS, notifications, IAP, App Store compliance gates, and a final-pre-flight
playthrough. Each item is a testable check with a severity guide. Hand Codex this after the
features in `docs/APP_STORE_ROADMAP.md` are built.

### (2026-06-01) Capacitor iOS shell added — Xcode blocker ⚠️
Started Epic 0.1 from `docs/APP_STORE_ROADMAP.md`.
- Added root Capacitor tooling: `@capacitor/core`, `@capacitor/ios`, `@capacitor/cli`,
  root `package.json` scripts, and `capacitor.config.ts`.
- Config: app name `ToDoMon`, bundle id `com.sonnymay.todomon`, web dir `frontend/dist`.
- Generated the native iOS project at `ios/App/App.xcodeproj`.
- `npm run build` from the repo root passes and builds the Vite app.

Current blocker:
- `npx cap sync ios` copies web assets and writes iOS config, then fails at CocoaPods/Xcode:
  `xcode-select: error: tool 'xcodebuild' requires Xcode, but active developer directory
  '/Library/Developer/CommandLineTools' is a command line tools instance`.
- `/Applications/Xcode.app` was not present during this run, so simulator build/open could
  not be verified yet.

Next step:
- Install full Xcode, open it once to finish setup, then run:
  `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`
- After that, verify with `npm run cap:sync:ios`, then `npm run ios:open` and build the
  app in an iOS simulator.

### (2026-06-01) App Store readiness roadmap added 📋
Wrote `docs/APP_STORE_ROADMAP.md` — a detailed, Codex-ready task list (Epics 0–18) to take
ToDoMon from dev-mode web prototype to a sellable iOS app. Key framing: **it's a web app and
cannot ship on the App Store without native wrapping (Capacitor = Epic 0, the blocker).** Other
hard gates captured: remove `DEV_NO_AUTH`, real auth + Supabase data, account deletion (Apple
requirement), StoreKit IAP for gems (no web payments), privacy policy/ToS, video asset
compression, RLS audit, tests/CI, TestFlight. Hand Codex that file to execute top-to-bottom.

### (2026-06-01) Interaction fixes — touch delete + dead-control feedback ✅
- **Delete was unusable on touch** — the task ✕ was `opacity-0 group-hover:opacity-100`,
  so on a mobile app (no hover) you could never delete a task. Made it always visible
  (`text-slate-300 hover:text-red-500`). Verified: ✕ shows and removes the task (5→4).
- **Dead placeholder controls now give feedback** — TopBar `+`/`🎁` and the
  Inventory/Quests/Stats nav tabs looked tappable but did nothing. Added a lightweight
  "… — coming soon ✨" toast (owned by `Home` via `comingSoon(label)`, auto-clears 1.8s,
  fixed + centered above the nav). Wired into `TopBar` (`onComingSoon`) and `BottomNav`
  (`onComingSoon`, non-home tabs; Home tab marked `aria-current="page"`). The `☰` menu
  still calls `onSignOut` (real in prod) — left as-is.
- Confirmed the core loop is healthy: completing a task adds XP, advances the in-band XP
  bar + "done today" + "X/N completed", and fires the "Great job!" bubble (3.5s).
- `npm run build` green; console clean.

### (2026-06-01) Visual polish — occlusion & overflow fixes ✅
Three obvious "not beautiful" bugs found and fixed (all verified live, console clean):
- **Hunger bar was occluded** — `StatsPanel` was `position: static` while the scene is
  `position: relative`; positioned elements paint above static ones, so the scene
  covered the card's top row (Hunger) where `-mt-6` tucks it under. Fix: added
  `relative z-10` to the StatsPanel card so it paints above the scene. Tuck/shadow look
  preserved; full Hunger + XP rows now visible.
- **"Add" button was clipped** — the add-task `form` is `flex`; the `<input>` has an
  intrinsic min-width so it wouldn't shrink, pushing the select + button past the row
  edge (button rendered ~28px of its 60px). Fix in `TaskList.tsx`: `min-w-0 flex-1` on
  input, `shrink-0` on the select and the Add button. Button now fully visible.
- **Floating SLEEP button overlapped the last task** — the FAB (`absolute bottom-16`
  in the sticky `BottomNav`) floated over the bottom of the scrolling task list. Fix in
  `Home.tsx`: bumped the task-list wrapper to `pb-28` so the last task always clears the
  FAB + nav (also tightened `pt-8`→`pt-5` to close a loose gap under the stats card).
- **Coins/Gems/Hunger lifted to state** — were module-level constants in `Home.tsx`;
  now `useState` in `App.tsx` (`coins`/`gems`/`hunger`, placeholder values) passed down
  as props through `Home` → `TopBar`/`StatsPanel`. Ownership now sits with the data owner
  so they can be wired to real profile/creature data later. Still cosmetic for now.
- **StatsPanel no longer cuts off the dragon** — the `-mt-6` tuck overlapped the bottom
  of the (380px) scene and clipped the creature's lower body. Raised `SCENE_HEIGHT`
  380→440 in `CreatureScene.tsx`; the dragon now sits fully above the card while the
  polished tucked-card look (negative margin + shadow) is preserved. Verified day + sleep.
- Verified live (fresh dev server, console clean): coins 1,250 / gems 45 / hunger 72/100
  render from props; full dragon visible; sleep PNG + dim overlay still scale to 440.
- Items 1 (epoch `now()`) and 4 (XP bar within-stage) from the prior review confirmed
  still in place — no changes needed.

### (2026-06-01) Dev-mode logic bug fixes ✅
Reviewed a 5-bug report; verified each against the code before acting.
- **FIXED — "done today" always 0** (`lib/localGame.ts`): `now()` was
  `new Date(0)` (the Unix epoch, 1970), so every seeded `completed_at` landed in 1970
  and the today-filter excluded them. Changed to `new Date()`. Verified: badge now
  shows `1 done today` (was `0`).
- **NOT A SEPARATE BUG — "X / N completed" vs "done today"**: a symptom of the epoch
  bug. The two are different metrics by design (all-done vs done-today); they align once
  timestamps are correct. No code change.
- **LEFT AS-IS — hardcoded coins/gems/hunger** (`Home.tsx`): documented placeholder
  (see TODO list), not a bug. Wiring real currency/hunger is out of scope.
- **FIXED — XP bar showed cumulative-to-mega, not within-stage** (`StatsPanel.tsx`):
  per user decision, switched from `xp / MAX_XP` to `nextStageInfo(stage, xp)` band
  progress. Bar fills 0→100% within the current stage; label shows band XP
  (e.g. champion `170 / 250`, ultimate `0 / 300`) and `MAX` at mega. Verified live.
- **FIXED — new-task order relied on sort stability** (`TaskList.tsx`): added a
  secondary `created_at` desc tiebreaker so prepended tasks render first deterministically.
  Verified: a freshly-added task renders at the top of the open list.
- `npm run build` green after all edits.

### 0a. Sun Dragon full-scene media — REVIEWED & VERIFIED ✅
The app has switched away from transparent creature WebMs for the main scene. Idle
state uses **opaque full-scene MP4 per stage**; sleep/night state uses **full-scene
static PNG per stage**. `CreatureScene.tsx` renders both full-bleed with
`object-fit: cover`.

Current scene assets live in `frontend/public/assets/creatures/`:
- `sun_dragon_egg_scene.mp4`
- `sun_dragon_hatchling_scene.mp4`
- `sun_dragon_baby_scene.mp4`
- `sun_dragon_rookie_scene.mp4`
- `sun_dragon_champion_scene.mp4`
- `sun_dragon_ultimate_scene.mp4`
- `sun_dragon_mega_scene.mp4`
- `sun_dragon_egg_sleeping.png`
- `sun_dragon_hatchling_sleeping.png`
- `sun_dragon_baby_sleeping.png`
- `sun_dragon_rookie_sleeping.png`
- `sun_dragon_champion_sleeping.png`
- `sun_dragon_ultimate_sleeping.png`
- `sun_dragon_mega_sleeping.png`

Implementation notes:
- `frontend/src/lib/stages.ts` maps every evolution stage to its exact
  `sun_dragon_*_scene.mp4` file via `creatureSceneVideo(stage)` and its exact
  `sun_dragon_*_sleeping.png` file via `creatureSleepImage(stage)`.
- `CreatureScene.tsx` always renders the idle video underneath; when `night=true`, it
  overlays the matching sleeping PNG. If the PNG fails to load, the image hides and
  the idle video remains visible as fallback.
- Existing app overlays remain above media: top bar, speech bubble, level badge,
  controls, and the night/sleep dim overlay.
- CSS background images and transparent WebM/keying/blend-mode logic are bypassed
  for the visible creature scene.

Important git state:
- Remote `origin/main` may still be behind this local full-scene MP4 work.
- The previous transparent-WebM pipeline files and generated clips may still be dirty
  in the local worktree from earlier attempts. Do not revert them without checking
  whether the user wants to keep or discard that old pipeline work.

Verification loop:
- Run `npm run build` in `frontend/`.
- Run or reload `http://localhost:5173/`.
- Click `Dev: Evolve →` through all 7 stages with sleep off: confirm each stage loads
  matching `sun_dragon_*_scene.mp4` with computed `object-fit: cover`.
- Toggle `SLEEP`, click `Dev: Evolve →` through all 7 stages again, and confirm each
  stage displays matching `sun_dragon_*_sleeping.png` with computed `object-fit: cover`.

**Review result (2026-06-01):** all checks pass.
- All 7 `sun_dragon_*_scene.mp4` present, plus all 7 `sun_dragon_*_sleeping.png`.
- `CreatureScene.tsx` renders full-bleed idle `<video object-fit:cover>` and sleep
  `<img object-fit:cover>`; idle video remains fallback if a sleep PNG is missing.
- Dev-Evolve swept all 7 stages → each loads its exact matching file, zero errors.
- Top bar / XP / speech bubble / level badge overlays sit above the video; sleep toggle
  applies the `rgba(30,27,75,0.40)` night dim above sleeping images.
- No green/white/keying/alpha/blend-mode in the visible scene path. `grep` finds no
  `creatureSources`/`.webm`/`chromakey`/`mix-blend` in `src/` (the only `day.png` ref is
  the Auth/login screen, not the creature scene).
- Fresh dev-server start → console clean. (Earlier `creatureSources` HMR errors were
  stale buffer from a mid-edit state; gone after restart. Build is authoritative & green.)
- The old transparent-WebM/keying pipeline (`encode-creatures.sh`,
  `key-creature-background.mjs`, `*.webm`) is now UNUSED by the app but still on disk —
  safe to delete in a later cleanup if desired.

### 0b. Creature opacity + GitHub publish ✅
The creature still looked see-through after the first transparent-WebM pass. Root
cause: global `colorkey` removed white creature details (eyes, claws, chest highlights)
as well as the white background, creating transparent holes inside the dragon.

Fix: `frontend/scripts/encode-creatures.sh` now pipes raw RGBA frames through
`frontend/scripts/key-creature-background.mjs`, which flood-fills only white pixels
connected to the frame border. Internal white highlights remain fully opaque. All
existing `.webm` creature clips were re-encoded from source `.mp4`s with this method.
Follow-up cleanup: `THRESHOLD` was lowered from `235` to `195` to remove the remaining
off-white/blue-white compression fringe around the creature edges.

Verification:
- Chrome reload at `http://localhost:5173/`: `champion.webm` playing, `opacity: 1`,
  `mix-blend-mode: normal`, no black bars, and alpha mask has no holes inside the
  creature silhouette.
- `npm run build` passed in `frontend/`.

GitHub publish complete: `https://github.com/sonnymay/todomon.git` on `main`.

### 0c. UI review — 9 ranked issues all fixed ✅
A full UI review flagged 9 issues (3 critical). All resolved and verified in the
browser (computed styles + magenta-composite frame checks; the preview MCP's
screenshots were flaky, so trust DOM/`preview_inspect` over them):

1. **Creature "ghost" effect (was `mix-blend-mode: multiply`)** — removed. See 0d.
2. **Black letterbox bars on champion/ultimate/mega** — these clips were a 720×720
   dragon-on-white letterboxed to 720×1280; now cropped + keyed. See 0d.
3. **SLEEP button covered the Stats tab** — `BottomNav.tsx` now floats the button
   ABOVE the nav row (`bottom-16 right-4`), clear of all 4 tabs.
4. **No tasks-done counter** — added a "✅ N done today" pill in `TaskList.tsx`
   (counts tasks whose `completed_at` is the current calendar day). _Scope chosen by
   user: today-only, not all-time._
5. **Large creatures clipped at top** — square `.webm` in a 320×320 `object-contain`
   box; verified `withinScene` for all 7 stages.
6. **XP label wrapped to two lines** — `StatsPanel.tsx` uses `whitespace-nowrap` +
   wider readout columns; "660 / 1,000" stays on one line.
7. **Dev: Evolve button shown in prod** — gated with `DEV_NO_AUTH && import.meta.env.DEV`.
8. **"Great job!" popup on load** — now driven by transient `celebrate` state in
   `App.tsx` (`cheer()`), set ONLY on a real completion, auto-clears after 3.5s.
9. **Level badge isolated** — moved into the XP row as an inline pill in `StatsPanel.tsx`.

### 0d. Creature videos re-encoded to transparent WebM (alpha) ✅
The source `.mp4`s have a **flat baked-in background** and were NOT uniform:
- egg / hatchling / rookie: **544×544**, dragon on **WHITE**.
- champion / ultimate / mega: **720×1280** = a **720×720 dragon-on-WHITE** square with
  **BLACK letterbox bars** top+bottom (cropdetect → `crop=720:720:0:280`).

Historical fix: `frontend/scripts/encode-creatures.sh` crops the bars (portrait clips only)
then flood-fill keys WHITE background → transparency, outputting VP9 `.webm` with
alpha beside the originals. The `.mp4`s are **kept as a `<source>` fallback**.
This transparent-WebM rendering path is now bypassed by the full-scene MP4 approach
described in 0a.
Re-run after changing assets: `bash scripts/encode-creatures.sh` (needs `ffmpeg`
with `libvpx-vp9`; verified present, v8.0.1).
- Tuning lives in the script: `THRESHOLD=150`. Lower it only if a source clip still
  has off-white background left around the edge; raise it if edge-connected highlights
  get cut too aggressively. Per-stage `grade` (4th `JOBS` field) deepens washed-out art
  AFTER keying in the legacy pipeline.
- `lib/stages.ts` now exports `creatureSceneVideo(stage)` for the full-scene MP4s.

### 0e. Tailwind was generating NO CSS ✅
The Home screen rendered unstyled (transparent cards, no colors) because **Tailwind
v4 emitted only its theme layer and ZERO utilities** (built CSS frozen at ~4 KB).
Root cause: Tailwind v4 auto-detects sources via the **git repo root**; this is **not
a git repo**, so it found nothing. A `**` globstar `@source` did NOT recurse into
`src/components/`. Fix in `frontend/src/index.css` — explicit **flat per-directory**
globs (do NOT collapse back to `**`):
```css
@import "tailwindcss";
@source "../index.html";
@source "./*.{ts,tsx}";
@source "./components/*.{ts,tsx}";
@source "./lib/*.{ts,tsx}";
```
Built CSS is now ~25 KB with all utilities. **Add a new `@source` line for any new
`src/` subdirectory.**

---

## 1. What ToDoMon is

A Tamagotchi-style productivity web app. Users complete real-life tasks to earn XP,
which **feeds and evolves a Sun Dragon** through 7 stages
(egg → hatchling → baby → rookie → champion → ultimate → mega).

UI target: a mobile game screen — top bar with currency, the creature on a day/night
scene with a speech bubble, Hunger + XP bars + a Level badge, a "Today's Tasks" feed,
a floating SLEEP button, and a bottom nav.

## 2. Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite 5 + **TypeScript** + **Tailwind v4** (`@tailwindcss/vite`, CSS-first via `@import "tailwindcss"`) |
| Backend | FastAPI + Python (venv, `python3` resolves to **3.9.6**) |
| DB + Auth | Supabase (project ID `tlswbznepnmtvrlmegzd`) |

> ⚠️ **Shared Supabase project.** This project ALSO hosts the user's separate
> "Dividend Tracker" app (`holdings`, `goal`, `dividend_history` tables). All ToDoMon
> objects are namespaced `todomon_*` to coexist. Don't touch the dividend tables. The
> signup trigger fires for ALL users in this project.

## 2.5 ⚠️ DEV MODE IS CURRENTLY ON (no auth)

`frontend/src/lib/localGame.ts` exports **`DEV_NO_AUTH = true`**. While on:
- Skips Supabase auth, opens straight to Home — no sign-up/sign-in.
- Creature + tasks come from **in-memory seed data** (`seedCreature`/`seedTasks`):
  champion-stage "Sunny" at 620 XP + 5 sample tasks.
- Add / complete / delete and XP→evolution work locally (`stageForXp` in `lib/stages.ts`).
- Opens on the **day** scene; SLEEP/WAKE toggles day/night.
- A 🧪 **Dev: Evolve** button cycles all 7 stages (also requires `import.meta.env.DEV`).
- **Nothing persists** — refresh resets to the seed. RLS/auth not exercised.

**To restore real auth + Supabase data:** set `DEV_NO_AUTH = false`. All Supabase-backed
code (Sections 5/6) is intact and was verified before dev mode was added.

## 3. Current status

- Full vertical slice built + verified: email auth → protected app; auto-provisioned
  creature+profile on signup (DB trigger); create/complete/delete tasks (RLS per user);
  completing a task awards XP + evolves the creature atomically (RPC).
- Mockup-matching UI: full-scene looping creature MP4, SLEEP dim toggle,
  Hunger/XP bars, inline Level badge, "done today" counter, styled task cards.
- `npm run build` passes clean (tsc + vite, 83 modules; CSS ~25 KB).
- Python E2E passed earlier: signup → auto creature → RLS → XP → evolution → double-complete rejection.

## 4. How to run

```bash
# Backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload          # http://localhost:8000  (/health, /docs)

# Frontend
cd frontend
npm run dev                            # http://localhost:5173
```

`.env` files exist with real Supabase creds (gitignored).
- `frontend/.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL`
- `backend/.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_ORIGIN`

Stop servers: `lsof -tiTCP:8000,5173 | xargs kill`

> **Email confirmation is likely ON** (Supabase default). A real browser sign-up needs
> confirmation before login. For quick testing: Supabase dashboard → Authentication →
> Providers → Email → turn off "Confirm email". (E2E bypasses via the admin API.)

> **Preview MCP note:** `Claude_Preview` screenshots were unreliable all session
> (corrupt/squished frames, occasional stale modules). Verify with `preview_inspect`
> computed styles, `preview_eval` DOM geometry, or by grepping the built CSS — not
> screenshots. Restart the dev server clean if it serves stale modules.

## 5. Database schema (migration `todomon_initial_schema`, already applied)

- `public.todomon_stage` — enum: egg, hatchling, baby, rookie, champion, ultimate, mega
- `public.todomon_profiles(id→auth.users, display_name, created_at)`
- `public.todomon_creatures(id, user_id unique→auth.users, name='Sunny', stage, xp, timestamps)`
- `public.todomon_tasks(id, user_id, title, notes, xp_reward, is_done, created_at, completed_at)`
- **RLS** on all three: `auth.uid() = user_id` (own rows only).
- `todomon_stage_for_xp(int)` — XP→stage. Thresholds: 0/50/120/250/450/700/1000.
- `todomon_handle_new_user()` + trigger `todomon_on_auth_user_created` on `auth.users`
  — auto-creates profile + creature on signup.
- `todomon_complete_task(uuid)` — SECURITY DEFINER RPC: marks task done, adds XP,
  recomputes stage, returns updated creature. Rejects already-done tasks.

Inspect/change schema via the Supabase MCP (`mcp__cbf77234-…__apply_migration` /
`execute_sql`). **Schema changes require explicit user approval** (the auto-mode
classifier blocks agent-authored migrations on this shared DB).

## 6. Frontend architecture

```
src/
  App.tsx              # session gating + data owner (creature, tasks, night,
                       #   leveledTo, celebrate) + handlers; cheer() on completion
  types.ts             # Stage, Creature, Task
  lib/
    supabaseClient.ts  # browser client (anon key)
    api.ts             # fetchCreature, fetchTasks, addTask, completeTask(rpc), deleteTask
    localGame.ts       # DEV_NO_AUTH flag + seed data (dev mode)
    stages.ts          # STAGE_ORDER/THRESHOLDS/LABEL, creatureSceneVideo(), creatureSleepImage(),
                       #   nextStageInfo(), levelFromXp(), MAX_XP, DIFFICULTY_XP, stageForXp()
  components/
    Auth.tsx           # email/password sign in + sign up
    Home.tsx           # screen layout; COSMETIC placeholder constants (COINS/GEMS/HUNGER)
    TopBar.tsx         # avatar, coins, gems, +, gift, ☰ (☰ currently = sign out)
    CreatureScene.tsx  # full-scene MP4 idle, full-scene PNG sleep, overlays, night dim
    StatsPanel.tsx     # Hunger bar (cosmetic), XP bar (real) with inline Level pill
    TaskList.tsx       # add form + "done today" counter + task feed
    BottomNav.tsx      # Home/Inventory/Quests/Stats tabs + floating SLEEP button (above nav)
scripts/
  encode-creatures.sh  # mp4 → transparent webm (crop + flood-fill key); see 0d
public/assets/creatures # sun_dragon_*_scene.mp4 idle videos + sun_dragon_*_sleeping.png sleep images
```

Data flow: `App` owns state, passes to `Home` (presentational). Auth via `supabase.auth`
+ `onAuthStateChange`; game data loaded on session.

**Creature rendering:** idle state uses `<video autoPlay loop muted playsInline key={stage}>`
with one opaque full-scene MP4 source. Sleep/night state overlays the matching static
PNG. Both fill the scene area with `object-fit: cover`; UI overlays and the night dim
layer sit above them.

## 7. Design decisions & data mappings

- **XP bar** = `creature.xp / 1000` (mega threshold = the mockup's "/1,000").
- **Level badge** = `levelFromXp = floor(xp/50)+1` — cosmetic; real progression is stage-based.
- **Difficulty chips** map to XP: SMALL=20, MEDIUM=40, LARGE=60 (`DIFFICULTY_XP`).
- **"Done today"** counts tasks with `completed_at` on the current calendar day.
- **Task icons** chosen by keyword (workout/study/email/plan/write), fallback ⭐.
- **SLEEP button** toggles day/night manually (overrides time-of-day default).
- **Backend** stays minimal (just `/health`). All data access is frontend→Supabase with
  RLS; the service-role client (`app/supabase_client.py`) is reserved for future server logic.

## 8. Known gaps / TODO (pick up here)

1. **Old transparent-creature pipeline is currently bypassed.** The visible scene now
   uses full-scene opaque MP4s, so do not spend more time on green-screen/alpha/keying
   unless the user explicitly asks to revive transparent creature compositing.
2. **Cosmetic-only stats** in `Home.tsx`: `COINS=1250`, `GEMS=45`, `HUNGER=72` — NOT
   persisted. To make real: add columns (`todomon_profiles.coins/gems`; a decaying
   hunger mechanic) + API + UI.
3. **"Done today" is dev-only / session-derived** — it reads from the in-memory task
   list. For real mode, derive from `todomon_tasks.completed_at` via a query (and
   consider an all-time total column if desired later).
4. **Bottom nav tabs** Inventory/Quests/Stats are placeholders (no routing). Only Home
   works. Add `react-router-dom` or tab state.
5. **Hamburger menu** (`☰`) currently just signs out. Replace with a real menu.
6. **No realtime** — no cross-tab sync. Could add Supabase realtime subscriptions.
7. **No tests in the repo** — the E2E was an ad-hoc script (`/tmp/todomon_e2e.py`, not
   committed). Add a proper test setup.
8. **Not a git repo** — `git init` for version control. (Bonus: once it's a git repo,
   Tailwind auto content-detection works without the `@source` lines — but keep them,
   they're harmless.)

## 9. Conventions (from `todomon/CLAUDE.md`)

Think before coding; surface tradeoffs/assumptions; simplicity first; surgical changes
(touch only what's needed, don't refactor unrelated code); goal-driven execution
(define success criteria, verify before claiming done).
