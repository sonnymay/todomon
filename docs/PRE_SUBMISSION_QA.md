# ToDoMon — Pre-Submission QA & Hardening Checklist (Codex)

> **Product vision:** ToDoMon is a **Tamagotchi-style virtual pet fused with a to-do list.**
> You complete *real* tasks → earn XP/coins → **feed and evolve your Sun Dragon.** Neglect it
> (don't complete tasks / don't feed it) → it gets hungry and sad. The pet is the reward and
> the emotional hook; the to-do list is the gameplay input.
>
> **Purpose of this doc:** the verification pass to run BEFORE App Store submission. Every
> item is a testable check with an expected result. Treat unchecked/failed items as release
> blockers unless explicitly deferred. Build the features first (`docs/APP_STORE_ROADMAP.md`),
> then harden with this list.
>
> **How Codex should use it:** go area by area. For each `[ ]` item, reproduce the test, fix
> any defect, re-verify, check it off, and note the result. After each area: `cd frontend &&
> npm run build`, update `HANDOFF.md`, commit, push. Test on real iOS devices, not just web.

---

## 0. The core Tamagotchi loop MUST feel alive (highest priority)
The #1 reason this app succeeds or fails. Verify the pet feels like a living thing tied to
real productivity, not a static mascot.

- [ ] Completing a real task visibly **feeds/rewards** the pet (XP + coins + happy reaction).
- [ ] The pet **gets hungry over time** (hunger decays on a real clock, even while app closed)
      and shows it (hungry sprite/mood, nudge copy).
- [ ] **Feeding** the pet (spending food/coins) restores hunger and changes mood to happy.
- [ ] Sustained neglect (no tasks, no feeding) makes the pet **sad/hungry** but is never cruel
      (no permadeath at launch; if "sick" states exist, they're recoverable).
- [ ] **Evolution** happens from real XP milestones and feels like a moment (animation, haptic,
      persists). Each of the 7 stages is reachable through normal play, not just the dev button.
- [ ] **Day/night sleep**: pet sleeps at night / when toggled; sleeping art + dim render; it
      "wakes" correctly. State survives app restart.
- [ ] The pet's **state persists** across app kills, reinstalls (server-backed), and devices.
- [ ] Time-based logic is **timezone- and clock-correct** (hunger decay, streaks, daily resets,
      "done today") — test across midnight, DST, and device-time changes.

---

## 1. Regression — re-verify everything fixed this session
These were fixed in dev; confirm they hold in the production build on device.

- [ ] **"Done today" counter** increments on completion and is date-correct (was the
      `new Date(0)` epoch bug). Crosses midnight correctly.
- [ ] **XP bar shows within-stage progress** (`nextStageInfo`), `MAX` at mega; never `/1000`.
- [ ] **New tasks sort to the top** of the open list deterministically (secondary `created_at`).
- [ ] **Delete (✕) is tappable on touch** (was hover-only) and actually removes the task.
- [ ] **Hunger bar not occluded** by the scene; full StatsPanel visible (z-index fix).
- [ ] **Add button not clipped** at any width (flex `min-w-0`/`shrink-0`).
- [ ] **Floating SLEEP button never covers the last task** (bottom padding).
- [ ] **No "coming soon" placeholders ship** — every TopBar/nav control is a real feature.
- [ ] **DEV_NO_AUTH is removed**; no seed/in-memory path in the production bundle.

---

## 2. To-do list feature — functional test matrix
- [ ] **Add task**: empty title rejected; whitespace trimmed; very long titles truncate
      gracefully; emoji/unicode/RTL accepted; difficulty selectable; appears immediately.
- [ ] **Complete task**: awards correct XP + coins (by difficulty × streak); marks done;
      moves to completed section; can't be double-completed; updates counts.
- [ ] **Delete task**: removes it; confirm-on-delete if destructive; can't delete twice.
- [ ] **Edit task** (if shipped): title/notes/difficulty/due update and persist.
- [ ] **Due dates**: set/clear; overdue styling; reminder scheduled/cancelled with the task.
- [ ] **Recurring tasks**: next occurrence spawns on completion; editing the rule works.
- [ ] **Categories/filtering**: assign, filter, persists; icon/color reflects category.
- [ ] **Reorder/sort**: manual drag persists; sort options correct.
- [ ] **Counts**: "X / N completed" and "done today" are consistent and correct after every
      add/complete/delete/undo.
- [ ] **Large lists**: 100+ tasks scroll smoothly; no layout jank; list virtualization if needed.

---

## 3. Pet / creature feature — test matrix
- [ ] All 7 stages render their correct scene asset (egg→mega); sleeping variant for each.
- [ ] No black/flash before video plays (poster frame); video loops seamlessly.
- [ ] Stage transition on real evolution is smooth; no wrong-stage flash.
- [ ] Rename pet (if shipped): persists, profanity-filtered, length-limited.
- [ ] Mood reflects hunger + time (happy / hungry / sleepy) and updates live.
- [ ] Cosmetics/equip (if shipped) render on the pet and persist.
- [ ] Creature + XP + hunger reload identically after app restart and on a second device.

---

## 4. Economy & progression integrity (anti-cheat + correctness)
- [ ] XP thresholds (0/50/120/250/450/700/1000) map to the right stage at exact boundaries.
- [ ] `difficultyForXp` and the difficulty picker agree (SMALL 20 / MEDIUM 40 / LARGE 60).
- [ ] Coins/gems can never go negative; purchases blocked when insufficient.
- [ ] Currency/XP mutations are **server-authoritative** (RPC); a tampered client request
      cannot grant currency or skip cost.
- [ ] Every economy change writes an audit row; balances reconcile.
- [ ] Streak increments once/day, resets after a gap, survives timezone/DST; streak freeze
      (if shipped) consumes correctly.
- [ ] Hunger decay math is bounded [0,100] and consistent server/client.

---

## 5. Auth & account lifecycle
- [ ] Sign up → email confirm → sign in works end-to-end on device.
- [ ] Sign in with Apple works (native flow) if any social login is offered.
- [ ] Forgot/reset password works; bad credentials show clear errors.
- [ ] Session persists across app restarts; expired session re-prompts gracefully.
- [ ] New user is auto-provisioned (profile + creature) exactly once (no dupes).
- [ ] **Account deletion** removes auth user + ALL `todomon_*` rows for that user and signs
      out (Apple requirement). Verified in Supabase that nothing remains.
- [ ] Sign out clears local state; no other user's data leaks after switching accounts.

---

## 6. States: loading / empty / error / offline
- [ ] First load shows a skeleton/spinner, not a flash of empty or wrong data.
- [ ] Empty task list shows a friendly empty state, not a blank area.
- [ ] Network failure on load → friendly retry, never white screen or crash.
- [ ] Mutations are optimistic and **roll back + toast** on failure.
- [ ] Offline: app opens, shows last data, queues changes, syncs on reconnect (if offline is
      in scope); otherwise a clear "you're offline" state.
- [ ] Slow network (throttle) doesn't double-submit (buttons disable while pending).
- [ ] Global error boundary catches render errors with a friendly recovery screen.

---

## 7. Cross-device, responsive & native shell
- [ ] iPhone SE (small), 15/15 Pro, 15 Pro Max (large): no clipping, no overlap, no cut text.
- [ ] **Safe areas**: nothing under the notch/Dynamic Island or home indicator.
- [ ] Portrait lock honored; rotation doesn't break layout (if portrait-only).
- [ ] No web rubber-band/overscroll white gaps; status bar style readable on the scene.
- [ ] iPad (if supported) layout is intentional, not a stretched phone.
- [ ] Keyboard: opening the add-task field doesn't cover the input; dismisses on submit/scroll.
- [ ] Dark mode: entire app legible; scene night-dim distinct from app dark theme.
- [ ] Dynamic Type: large text sizes don't break layouts.

---

## 8. Performance & stability
- [ ] **Creature videos compressed** (<~500KB each; total media small); smooth on older iPhones.
- [ ] Only current (+ next) stage media preloaded; others lazy; video pauses when backgrounded.
- [ ] Cold start is fast; no long white screen after splash.
- [ ] No memory growth/leak over 10+ min of use (Instruments); no battery/GPU pinning from
      looping video.
- [ ] No console errors/warnings in a production build; no dropped frames on key animations.
- [ ] App resumes correctly from background (pet state, timers, video).

---

## 9. Accessibility
- [ ] VoiceOver can complete the whole core loop (add → complete → feed → see evolution).
- [ ] All controls have labels; meaning never conveyed by emoji/color alone.
- [ ] Tap targets ≥ 44pt; focus order logical; Dynamic Type supported.
- [ ] Color contrast meets AA on text and bars.
- [ ] `prefers-reduced-motion` path disables non-essential animation.

---

## 10. Security & data
- [ ] RLS enforced on every `todomon_*` table (`auth.uid() = user_id`); verified by attempting
      cross-user reads/writes (should fail).
- [ ] Supabase `get_advisors` (security + performance) shows no high-severity issues.
- [ ] No service-role key or secrets in the client bundle; only the anon key.
- [ ] Shared-DB safety: ToDoMon code never reads/writes the dividend tables.
- [ ] Inputs sanitized (task title/notes/pet name); no injection via notes; XSS-safe rendering.

---

## 11. Notifications (if shipped in v1)
- [ ] Permission requested after priming, not on cold launch; denial handled.
- [ ] "Your dragon is hungry" / task-due / streak reminders fire at correct times.
- [ ] Reminders cancel when the task is completed/deleted; toggles in Settings work.
- [ ] No notification spam; quiet hours respected.

---

## 12. Monetization (if IAP ships in v1)
- [ ] Gem packs / premium purchasable via **StoreKit** (sandbox), credited server-side after
      receipt validation; no double-credit on replay.
- [ ] **Restore purchases** works; entitlements re-granted.
- [ ] Paywall shows price, what's included, restore, and links to terms (App Review checks).
- [ ] No digital goods sold via web payment; no external-purchase links.

---

## 13. App Store compliance gate (must all pass before submit)
- [ ] In-app **account deletion** present and working (Guideline 8.2/5.1.1(v)).
- [ ] **Sign in with Apple** offered if other social logins exist.
- [ ] **Privacy Policy + Terms** hosted, linked in-app and in App Store Connect.
- [ ] App Privacy "nutrition labels" match the SDKs actually used; ATT prompt only if tracking.
- [ ] No placeholder/broken features, no "coming soon," no dev tools (no Dev: Evolve button).
- [ ] Age rating set; if appealing to kids, COPPA/Kids-category rules satisfied (parental gate
      on purchases, no behavioral ads).
- [ ] Minimum functionality / not "just a website" — native feel, offline-tolerant.
- [ ] Metadata + screenshots accurate to real screens (no mocked-up features).
- [ ] App builds, installs, and runs from a clean **TestFlight** build on a real device.

---

## 14. Final pre-flight (the day-of checklist)
- [ ] Bump version + build number; release notes written.
- [ ] All automated tests green in CI (unit + component + E2E).
- [ ] Crash reporting (Sentry) live with this release tagged; analytics events firing.
- [ ] One full **manual playthrough on a real device**: sign up → onboarding → add tasks →
      complete → pet eats/grows → feed → sleep/wake → evolve → buy (sandbox) → settings →
      delete account. Zero crashes, zero dead ends.
- [ ] Smoke test the 3 worst-case users: brand-new (empty), power user (100+ tasks/long
      streak), returning-after-2-weeks (hungry pet, broken streak) — all handled gracefully.
- [ ] Roll-back/hotfix plan noted; support email monitored.

---

### Severity guide for triage
- **Blocker:** crashes, data loss, economy exploit, auth/RLS hole, missing account deletion,
  IAP not crediting, core loop broken. → must fix before submit.
- **High:** wrong counts/XP, layout breakage on a supported device, notification mis-fire,
  offline data loss. → fix before submit.
- **Medium:** polish, minor a11y, slow asset. → fix or explicitly defer to v1.1.
- **Low:** copy tweaks, nice-to-haves. → backlog.

> Codex: after each area, `npm run build`, update `HANDOFF.md`, commit, push. Draft DB
> migrations but STOP for human approval before applying (shared Supabase DB).
