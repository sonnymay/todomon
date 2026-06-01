# ToDoMon — Session Handoff

> Read this first when starting a new session. It captures the full state of the
> project so you can continue without re-discovering everything.

_Last updated: 2026-06-01_

---

## 0. Recent fixes (most recent first)

### 0a. Creature opacity + GitHub publish prep ✅
The creature still looked slightly see-through after the first transparent-WebM pass.
Fix: `frontend/scripts/encode-creatures.sh` now uses hard alpha
(`colorkey=0xFFFFFF:0.14:0`) instead of blended alpha. All existing `.webm` creature
clips were re-encoded from the source `.mp4`s with this setting, so the creature stays
fully opaque while the keyed white background remains transparent.

Verification:
- Chrome reload at `http://localhost:5173/`: `champion.webm` playing, `opacity: 1`,
  `mix-blend-mode: normal`, no black bars.
- `npm run build` passed in `frontend/`.

GitHub target for first publish: `https://github.com/sonnymay/todomon.git` on `main`.
Root `.gitignore` added so `.env`, `.venv`, `node_modules`, `dist`, caches, and
`.DS_Store` files stay out of Git.

### 0b. UI review — 9 ranked issues all fixed ✅
A full UI review flagged 9 issues (3 critical). All resolved and verified in the
browser (computed styles + magenta-composite frame checks; the preview MCP's
screenshots were flaky, so trust DOM/`preview_inspect` over them):

1. **Creature "ghost" effect (was `mix-blend-mode: multiply`)** — removed. See 0c.
2. **Black letterbox bars on champion/ultimate/mega** — these clips were a 720×720
   dragon-on-white letterboxed to 720×1280; now cropped + keyed. See 0c.
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

### 0c. Creature videos re-encoded to transparent WebM (alpha) ✅
The source `.mp4`s have a **flat baked-in background** and were NOT uniform:
- egg / hatchling / rookie: **544×544**, dragon on **WHITE**.
- champion / ultimate / mega: **720×1280** = a **720×720 dragon-on-WHITE** square with
  **BLACK letterbox bars** top+bottom (cropdetect → `crop=720:720:0:280`).

Fix: `frontend/scripts/encode-creatures.sh` crops the bars (portrait clips only)
then color-keys WHITE → transparency, outputting VP9 `.webm` with alpha beside the
originals. The `.mp4`s are **kept as a `<source>` fallback**. `CreatureScene.tsx`
now renders `<video><source …webm><source …mp4></video>` with **no mix-blend-mode**.
Re-run after changing assets: `bash scripts/encode-creatures.sh` (needs `ffmpeg`
with `libvpx-vp9`; verified present, v8.0.1).
- Tuning lives in the script: `colorkey=0xFFFFFF:0.14:0`. `blend=0` is intentional:
  it keeps the creature opaque instead of semi-transparent. If the dragon's own
  near-white highlights get nicked (halos/holes), LOWER the similarity (0.14).
- `lib/stages.ts` now exports `creatureSources(stage) → {webm, mp4}` (replaced the
  old single-URL `creatureAsset()`); the `baby→hatchling` fallback still applies.

### 0d. Tailwind was generating NO CSS ✅
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
- Mockup-matching UI: transparent looping creature video, day/night scene, SLEEP toggle,
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
    stages.ts          # STAGE_ORDER/THRESHOLDS/LABEL, creatureSources()→{webm,mp4},
                       #   nextStageInfo(), levelFromXp(), MAX_XP, DIFFICULTY_XP, stageForXp()
  components/
    Auth.tsx           # email/password sign in + sign up
    Home.tsx           # screen layout; COSMETIC placeholder constants (COINS/GEMS/HUNGER)
    TopBar.tsx         # avatar, coins, gems, +, gift, ☰ (☰ currently = sign out)
    CreatureScene.tsx  # day/night bg, speech bubble (celebration-gated), transparent <video>
    StatsPanel.tsx     # Hunger bar (cosmetic), XP bar (real) with inline Level pill
    TaskList.tsx       # add form + "done today" counter + task feed
    BottomNav.tsx      # Home/Inventory/Quests/Stats tabs + floating SLEEP button (above nav)
scripts/
  encode-creatures.sh  # mp4 → transparent webm (crop + colorkey white); see 0b
public/assets/creatures # egg/hatchling/rookie/champion/ultimate/mega .mp4 + .webm (baby missing)
```

Data flow: `App` owns state, passes to `Home` (presentational). Auth via `supabase.auth`
+ `onAuthStateChange`; game data loaded on session.

**Creature rendering:** `<video autoPlay loop muted playsInline key={stage}>` with
`<source webm>` + `<source mp4>`. `muted` is required for autoplay. Transparent webm
composites directly on the scene — no mix-blend-mode (see 0b for why/how).

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

1. **`baby` assets MISSING** — no `baby.mp4`/`baby.webm`. Falls back to hatchling via
   `ASSET_FALLBACK` in `lib/stages.ts`. Add both files (run `encode-creatures.sh`),
   then remove the fallback entry.
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
