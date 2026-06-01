# ToDoMon — App Store Readiness Roadmap (Codex task list)

> **Audience:** Codex (autonomous coding agent) working in this repo.
> **Goal:** Take ToDoMon from a dev-mode web prototype to a sellable iOS App Store product.
> **How to use:** Work top-to-bottom. Epics are ordered by dependency. Each task has
> **Context → Do → Acceptance**. Do NOT start a later epic if it depends on an earlier one.
> After each task: run `cd frontend && npm run build`, keep the app working, update
> `HANDOFF.md`, and commit with a conventional-commit message.

## Current state (read first)
- `frontend/`: React 18 + Vite 5 + TypeScript + Tailwind v4.
- Backend: FastAPI stub (`/health` only) + Supabase (project `tlswbznepnmtvrlmegzd`, shared
  with a separate "Dividend Tracker" app — all ToDoMon tables are `todomon_*`; never touch
  the dividend tables).
- **`frontend/src/lib/localGame.ts` has `DEV_NO_AUTH = true`** → the app skips auth and runs
  on in-memory seed data. Nothing persists. This MUST be removed for production.
- Creature scene = full-bleed opaque `sun_dragon_*_scene.mp4` per stage + `*_sleeping.png`.
- Cosmetic-only placeholders: coins/gems/hunger; Inventory/Quests/Stats tabs; TopBar `+`/`🎁`.
- It is a **web app** — there is no native iOS project yet.

---

## EPIC 0 — Native packaging (BLOCKER: nothing ships without this)

A Vite web app cannot be sold on the App Store. Wrap it with **Capacitor** (keeps all React
code, produces a real Xcode project). React Native is NOT chosen — it would mean a rewrite.

### 0.1 Add Capacitor + iOS platform
- **Do:** Install `@capacitor/core @capacitor/cli @capacitor/ios`. `npx cap init "ToDoMon"
  "com.<yourteam>.todomon" --web-dir=frontend/dist`. Add a root `capacitor.config.ts`. Run
  `npm run build` then `npx cap add ios`. Commit the generated `ios/` Xcode project.
- **Acceptance:** `npx cap sync ios` succeeds; `ios/App/App.xcodeproj` opens in Xcode and
  builds to the simulator showing the app.

### 0.2 App identity & icons & splash
- **Do:** Generate a 1024×1024 app icon + adaptive icon set and a splash screen
  (`@capacitor/assets`). Set display name, bundle id, version (1.0.0), build number (1).
- **Acceptance:** Custom icon + splash appear on the simulator; no default Capacitor logo.

### 0.3 Safe areas, status bar, viewport
- **Do:** Add `@capacitor/status-bar`; respect iOS safe-area insets
  (`env(safe-area-inset-*)`) so the TopBar isn't under the notch and BottomNav isn't under
  the home indicator. Lock orientation to portrait. Disable text-selection/callout and
  overscroll bounce where it looks non-native.
- **Acceptance:** On an iPhone 15 / SE simulator, no content under the notch or home bar;
  portrait-locked; no rubber-band white gap.

### 0.4 Native config plumbing
- **Do:** Move runtime config (Supabase URL/anon key, API base) to build-time env handled by
  Vite; document `.env` and an `.env.example`. Ensure deep-link URL scheme + universal links
  placeholder for auth redirects.
- **Acceptance:** App boots on device with prod env; no secrets in the bundle beyond the
  anon key.

---

## EPIC 1 — Production hardening (remove the prototype)

### 1.1 Remove DEV_NO_AUTH
- **Context:** `localGame.ts` short-circuits the whole app.
- **Do:** Delete `DEV_NO_AUTH`/seed paths from `App.tsx`, `localGame.ts`. App must run on real
  Supabase data only. Keep a `import.meta.env.DEV`-gated test hook ONLY if needed for local
  dev, never shipped.
- **Acceptance:** Production build never imports seed data; first launch shows auth, not Home.

### 1.2 Real auth UX
- **Do:** Polish `Auth.tsx`: email/password + **Sign in with Apple** (App Store strongly
  prefers it when other social logins exist; required if you add Google/Facebook). Add
  forgot-password, email-confirmation handling, loading/error states, and resend.
- **Acceptance:** Can sign up, confirm, sign in, reset password on a device; Apple sign-in
  works through the native flow.

### 1.3 Session & error handling
- **Do:** Centralize Supabase errors into user-friendly toasts; handle expired sessions,
  offline, and rate limits. Add a global error boundary with a friendly fallback screen.
- **Acceptance:** Killing network shows a graceful message, not a white screen or crash.

### 1.4 Remove all dead/placeholder UI or make it real (tracked across Epics 3–5)
- **Do:** Inventory/Quests/Stats tabs, TopBar `+`/`🎁`, hamburger menu must either become real
  features or be hidden for v1 (don't ship "coming soon" toasts in a paid app).
- **Acceptance:** Every visible control does something real; no placeholder affordances.

---

## EPIC 2 — Data model & backend (Supabase)

> All migrations need explicit user approval (shared DB). Codex: draft migrations as SQL
> files under `supabase/migrations/` and STOP for review before applying.

### 2.1 Expand schema
- **Do:** Add columns/tables for the economy and gameplay:
  - `todomon_profiles`: `coins int default 0`, `gems int default 0`, `streak_count int`,
    `last_active_date date`, `onboarded bool`, `settings jsonb`.
  - `todomon_creatures`: `hunger int default 100`, `hunger_updated_at timestamptz`,
    `name text`, `cosmetics jsonb`.
  - `todomon_tasks`: `due_at timestamptz`, `repeat_rule text`, `category text`,
    `sort_order int`, `priority int`.
  - New: `todomon_inventory(user_id, item_id, qty)`, `todomon_items(id, kind, name, cost,
    currency, metadata)`, `todomon_quests(...)`, `todomon_quest_progress(...)`,
    `todomon_transactions(user_id, delta, currency, reason, created_at)` (audit).
- **Acceptance:** Migration SQL written, RLS policies for every new table (`auth.uid() =
  user_id`), reviewed and applied; `generate_typescript_types` regenerated into the app.

### 2.2 Server-authoritative economy (anti-cheat)
- **Do:** Move coin/gem/XP/hunger mutations into SECURITY DEFINER RPCs (like
  `todomon_complete_task`) so the client can't grant itself currency. Validate costs server
  side for purchases.
- **Acceptance:** A tampered client request cannot inflate currency; all economy changes
  write a `todomon_transactions` row.

### 2.3 Hunger decay
- **Do:** Compute hunger as a function of `hunger_updated_at` (decay N points/hour, floored at
  0) either in an RPC on read or a scheduled function. Feeding consumes food items/coins.
- **Acceptance:** Hunger visibly decreases over time and is consistent across devices.

---

## EPIC 3 — Core gameplay loop (make it a game worth paying for)

### 3.1 Hunger mechanic (wire the real bar)
- **Do:** Replace cosmetic `hunger` with real state from 2.3. Add a "Feed" action that spends
  coins/food and restores hunger; low hunger slows XP or makes the creature look sad
  (swap to a sad sprite/scene variant). Add gentle nudges, not punitive mechanics.
- **Acceptance:** Feeding changes hunger + creature mood; persists; reflected in StatsPanel.

### 3.2 Coin economy
- **Do:** Award coins on task completion (scaled by difficulty + streak). Spend on food,
  cosmetics, name changes. Show coin deltas with animation. Server-authoritative (2.2).
- **Acceptance:** Completing tasks grants coins; balance persists; spend flows work.

### 3.3 Gems (premium currency)
- **Do:** Gems are earned slowly (quests/streaks) or bought via IAP (Epic 9). Spend on premium
  cosmetics / speed-ups. Keep fair (no pay-to-win that breaks the productivity theme).
- **Acceptance:** Gem balance persists; earn + spend paths exist; IAP top-up stubbed for Epic 9.

### 3.4 Shop (TopBar `+` / 🎁)
- **Do:** Build a Shop sheet: food, cosmetics (hats/colors/backgrounds), gem packs. Buy with
  coins/gems. Use a modal/bottom-sheet pattern.
- **Acceptance:** Items purchasable; inventory updates; insufficient-funds handled.

### 3.5 Inventory tab
- **Do:** Real Inventory screen listing owned items, equip/use actions (equip cosmetics on the
  creature; use food to feed).
- **Acceptance:** Owned items show; equipping changes the creature; using food feeds it.

### 3.6 Quests tab (daily/weekly goals)
- **Do:** Daily quests ("complete 3 tasks", "feed your dragon", "add a task with a due date")
  granting coins/gems/XP. Track progress server-side; reset daily/weekly.
- **Acceptance:** Quests show progress, complete, grant rewards, and reset on schedule.

### 3.7 Stats tab
- **Do:** Real stats screen: tasks completed (today/week/all-time), current/best streak, XP
  history chart, evolution timeline, hunger trend. Use a lightweight chart lib.
- **Acceptance:** Numbers match the DB; charts render; no placeholder.

### 3.8 Daily streaks
- **Do:** Track consecutive active days; streak multiplies coin rewards; show a streak flame
  in TopBar; "streak freeze" item to forgive one missed day.
- **Acceptance:** Streak increments/resets correctly across day boundaries (timezone-safe).

---

## EPIC 4 — Tasks feature completeness

### 4.1 Edit task
- **Do:** Tap a task to edit title/notes/difficulty/due date. (Today only complete/delete.)
- **Acceptance:** Edits persist and re-render.

### 4.2 Due dates & reminders
- **Do:** Optional due date/time per task; overdue styling; schedule a local notification
  (Epic 10) at the due time.
- **Acceptance:** Due date saves; overdue tasks marked; reminder fires.

### 4.3 Recurring tasks
- **Do:** Repeat rules (daily/weekdays/weekly). On completion, spawn the next occurrence.
- **Acceptance:** A daily task reappears the next day; rules editable.

### 4.4 Categories / tags & filtering
- **Do:** Assign a category (Work/Health/Study/Personal/custom); filter the list; category
  icon/color drives the task icon (replace the keyword-guess `taskIcon`).
- **Acceptance:** Filtering works; categories persist; icons reflect category.

### 4.5 Manual reorder & sort options
- **Do:** Drag-to-reorder (persist `sort_order`); sort by due/priority/created.
- **Acceptance:** Order persists across reloads/devices.

### 4.6 Empty/loading/skeleton states
- **Do:** Friendly empty state, skeleton loaders, optimistic UI with rollback on error.
- **Acceptance:** No layout jump; failures roll back and toast.

---

## EPIC 5 — Creature system

### 5.1 Verify all 7 stage assets + sleeping variants on device
- **Do:** Confirm every `sun_dragon_*_scene.mp4` and `*_sleeping.png` loads and is sized for
  retina. Add a poster frame so there's no black flash before video plays.
- **Acceptance:** No missing/!flashing assets at any stage, day or night, on device.

### 5.2 Creature naming & mood
- **Do:** Let users rename the dragon (costs coins, profanity filter). Mood states (happy/
  hungry/sleepy) swap scene/overlay.
- **Acceptance:** Name persists and shows; mood reflects hunger/night.

### 5.3 Evolution celebration
- **Do:** Full-screen evolution animation/confetti + haptic when a stage is reached (not the
  dev button). Share-card option.
- **Acceptance:** Real evolution triggers the celebration once, persists new stage.

---

## EPIC 6 — Onboarding & first-run

### 6.1 Onboarding flow
- **Do:** 3–4 intro screens (what ToDoMon is, name your dragon, add your first task, allow
  notifications). Set `profiles.onboarded`.
- **Acceptance:** Shown once on first launch; skippable; not shown again.

### 6.2 First-task & permission priming
- **Do:** Pre-permission explainer before the iOS notification prompt; request at the right
  moment (after they see value), not on launch.
- **Acceptance:** Notification prompt appears post-priming; denial handled gracefully.

---

## EPIC 7 — UI/UX polish & design system

### 7.1 Design tokens
- **Do:** Extract colors/spacing/radii/shadows/typography into Tailwind theme tokens; replace
  ad-hoc hex (`#fdf3da`, `#fdf6e3`, etc.) with semantic tokens.
- **Acceptance:** One source of truth; no stray hex in components.

### 7.2 Component library pass
- **Do:** Standardize Button/Card/Sheet/Toast/Modal/Bar components; consistent press states,
  disabled states, and 44pt min tap targets (Apple HIG).
- **Acceptance:** All interactive elements ≥44pt; consistent styling.

### 7.3 Animations & haptics
- **Do:** Add tasteful transitions (task complete, coin gain, evolve) and `@capacitor/haptics`
  on key actions. Respect `prefers-reduced-motion`.
- **Acceptance:** Smooth 60fps interactions; haptics on complete/evolve/purchase.

### 7.4 Dark mode
- **Do:** Full dark theme (separate from the in-scene night dim). Follow system setting +
  manual override in Settings.
- **Acceptance:** Entire app readable in dark mode; no contrast failures.

### 7.5 Accessibility (required-ish for quality + some App Review)
- **Do:** VoiceOver labels on all controls, Dynamic Type support, color-contrast AA, focus
  order, reduce-motion paths. Don't rely on emoji alone for meaning.
- **Acceptance:** VoiceOver can complete the core loop; text scales; contrast AA.

---

## EPIC 8 — Settings & account management

### 8.1 Settings screen (replace hamburger=signout)
- **Do:** Profile, notifications toggles, theme, sound/haptics, sign out, restore purchases,
  links to Privacy Policy & Terms, support email, app version.
- **Acceptance:** Real settings screen reachable from the menu.

### 8.2 Account deletion (APPLE REQUIREMENT)
- **Do:** In-app "Delete account" that deletes the auth user + all `todomon_*` rows for that
  user (RPC/edge function), with confirmation. Apple rejects apps with sign-up but no in-app
  delete.
- **Acceptance:** Deleting wipes the user's data and signs out; verified in Supabase.

### 8.3 Data export (nice-to-have, GDPR-friendly)
- **Do:** Export tasks to JSON/CSV.
- **Acceptance:** Export produces a shareable file.

---

## EPIC 9 — Monetization (In-App Purchases)

> App Store requires StoreKit for digital goods; you cannot use Stripe/web payment for gems.

### 9.1 Choose model & wire StoreKit
- **Do:** Decide: one-time "Premium" unlock and/or consumable gem packs and/or an optional
  subscription (e.g., Pro themes). Integrate via a Capacitor IAP plugin
  (`@capacitor-community/in-app-purchases` or RevenueCat — RevenueCat strongly recommended for
  receipt validation + analytics). Configure products in App Store Connect.
- **Acceptance:** Sandbox purchase of a gem pack credits gems after server-side receipt
  validation; restore purchases works.

### 9.2 Paywall & entitlements
- **Do:** Build a paywall screen; gate premium cosmetics/themes behind entitlement; store
  entitlement server-side. Clear pricing, restore, and terms links (App Review checks these).
- **Acceptance:** Non-premium users are gated; purchase unlocks; restore re-grants.

### 9.3 Receipt validation & ledger
- **Do:** Validate receipts (RevenueCat or an edge function) and credit currency server-side
  into `todomon_transactions`. Never trust the client.
- **Acceptance:** Replaying a client purchase event can't double-credit.

---

## EPIC 10 — Notifications

### 10.1 Local notifications
- **Do:** `@capacitor/local-notifications`: task due reminders, "your dragon is hungry",
  daily streak reminder. User-configurable in Settings; cancel on task complete/delete.
- **Acceptance:** Reminders fire at the right time; toggles work; no spam.

### 10.2 Push (optional v1.1)
- **Do:** APNs via Supabase/edge or a provider for re-engagement. Defer if scope-tight.
- **Acceptance:** A test push arrives on device.

---

## EPIC 11 — Offline, sync & realtime

### 11.1 Offline-first
- **Do:** Cache creature/tasks locally (IndexedDB/Preferences); queue mutations offline and
  reconcile on reconnect. Optimistic UI with conflict handling.
- **Acceptance:** Airplane-mode add/complete works and syncs when back online.

### 11.2 Realtime / multi-device
- **Do:** Supabase realtime subscriptions so changes on one device reflect on another.
- **Acceptance:** Two sessions stay in sync.

---

## EPIC 12 — Performance & assets

### 12.1 Video weight (CRITICAL — current clips are multi-MB)
- **Do:** The `sun_dragon_*_scene.mp4` are large (champion 1.4MB … mega 3.1MB). Compress
  (H.264/HEVC, target <500KB each, 24fps, sane bitrate), generate poster JPEGs, lazy-load
  non-active stages, and preload only the current + next stage. Consider pausing video when
  the app is backgrounded.
- **Acceptance:** Total creature media < ~4MB; smooth playback; no jank on stage change.

### 12.2 Bundle & startup
- **Do:** Code-split routes/screens; analyze bundle (`rollup-plugin-visualizer`); tree-shake;
  defer heavy libs. Target fast cold start on device.
- **Acceptance:** JS bundle meaningfully smaller; TTI acceptable on a mid iPhone.

### 12.3 Battery & memory
- **Do:** Ensure looping videos don't pin the GPU; stop animations off-screen; profile memory.
- **Acceptance:** No runaway battery/memory in Instruments over 10 min.

---

## EPIC 13 — Quality: testing & CI

### 13.1 Unit/logic tests
- **Do:** Vitest for `stages.ts` (thresholds, `nextStageInfo`, `difficultyForXp`), economy
  math, hunger decay, streak rollover (timezone edge cases).
- **Acceptance:** ≥80% coverage on `lib/`; tests run in CI.

### 13.2 Component/integration tests
- **Do:** React Testing Library for TaskList (add/complete/delete/sort), StatsPanel, Shop.
- **Acceptance:** Core flows covered; CI green.

### 13.3 E2E
- **Do:** Playwright web E2E for signup→onboarding→add→complete→evolve→buy→sign out. Manual
  device test matrix (SE, 15, 15 Pro Max) documented.
- **Acceptance:** E2E passes in CI; device checklist filled.

### 13.4 CI/CD
- **Do:** GitHub Actions: typecheck + lint + test + build on PR. Optional Fastlane/Xcode Cloud
  for TestFlight builds.
- **Acceptance:** PRs blocked on red; main produces a build artifact.

---

## EPIC 14 — Privacy, security, legal (gates App Review)

### 14.1 RLS & security audit
- **Do:** Verify RLS on every `todomon_*` table; run Supabase `get_advisors` security lint;
  ensure no service-role key in the client; rotate any exposed keys.
- **Acceptance:** Advisor shows no high-sev issues; no privileged keys shipped.

### 14.2 Privacy policy & ToS
- **Do:** Host a Privacy Policy + Terms (what data, why, third parties: Supabase/RevenueCat/
  analytics). Link in-app (Settings) and in App Store Connect.
- **Acceptance:** Both reachable URLs; linked in-app.

### 14.3 App Privacy "nutrition label" & ATT
- **Do:** Fill App Store Connect data-collection disclosures accurately. If you add analytics/
  ads that track, implement App Tracking Transparency prompt; otherwise declare no tracking.
- **Acceptance:** Disclosures match actual SDKs; ATT only if truly tracking.

### 14.4 Age rating & kids rules
- **Do:** Set an age rating. If you target/҂appeal to kids, COPPA/Kids Category rules apply
  (no behavioral ads, parental gate on purchases). Decide and document.
- **Acceptance:** Rating set; if kid-directed, compliance tasks added.

---

## EPIC 15 — Analytics & monitoring

### 15.1 Product analytics
- **Do:** Privacy-respecting analytics (e.g., PostHog/Amplitude or RevenueCat events): funnel
  (install→onboard→first task→D1/D7 retention), economy events. Disclose in privacy label.
- **Acceptance:** Key events fire; dashboard shows funnel.

### 15.2 Crash & error reporting
- **Do:** Sentry (web + native) for crashes/JS errors with release tagging.
- **Acceptance:** A forced test crash appears in Sentry with symbolication.

---

## EPIC 16 — App Store submission

### 16.1 Store listing assets
- **Do:** App name, subtitle, keywords, description, promotional text; 6.7" + 6.5" + 5.5"
  screenshots (and iPad if supported); optional preview video; localized if Epic 17.
- **Acceptance:** All required assets uploaded in App Store Connect.

### 16.2 TestFlight beta
- **Do:** Ship a TestFlight build; recruit testers; fix top crash/feedback before submission.
- **Acceptance:** ≥1 successful external TestFlight round.

### 16.3 Review-guideline pre-flight
- **Do:** Self-audit vs. App Review Guidelines: account deletion (8.2), IAP for digital goods
  (3.1.1), restore purchases, no broken/placeholder features, privacy links, sign-in-with-Apple
  if other social logins, minimum functionality, no web-only payment for gems.
- **Acceptance:** Checklist all green; submit for review.

---

## EPIC 17 — Localization (optional v1, strong for sales)
- **Do:** Externalize strings (i18n lib); translate to 2–3 launch languages; localize store
  listing; handle date/number formats and RTL if applicable.
- **Acceptance:** App + listing switch languages cleanly.

---

## EPIC 18 — Backend decision (FastAPI)
- **Context:** `backend/` is a near-empty FastAPI stub; the app talks to Supabase directly.
- **Do:** Decide: (a) delete the FastAPI stub and go Supabase-only (recommended for v1), or
  (b) keep it for server logic (IAP receipts, push, cron) as edge functions instead.
- **Acceptance:** One clear backend story; no dead service in the repo.

---

## Suggested execution order (critical path to a submittable v1)
1. Epic 0 (Capacitor) → 1 (remove dev mode, real auth) → 2 (schema) → 18 (backend decision).
2. Epic 3 (gameplay) + 4 (tasks) + 5 (creature) + 6 (onboarding) — the product.
3. Epic 7 (polish) + 8 (settings/**account deletion**) + 10 (notifications) + 12 (perf).
4. Epic 9 (IAP) + 14 (privacy/legal) + 15 (analytics/crash).
5. Epic 13 (tests/CI) throughout; Epic 16 (submission) last; 11/17 as time allows.

## Definition of done for v1 submission
- No dev/seed/placeholder code paths. Account deletion works. IAP sandbox-verified server-side.
- Privacy policy + ToS live and linked. Notifications + onboarding done. Crash + analytics live.
- Creature media optimized. RLS audited. TestFlight round complete. Review checklist green.

> Codex: after each task, `npm run build`, update `HANDOFF.md`, commit, and (per the repo
> convention) push. Draft DB migrations but STOP for human approval before applying them.
