# ToDoMon — Ship-to-App-Store-and-Earn Plan

_Status: product-complete, NOT yet submittable. This is the critical path to a paid/earning
listing, with each item tagged **[YOU]** (only you can do it) or **[ME]** (I can build it)._

## Verdict
The app (offline-first, engagement loop, persistence, tests, slim assets) is in good shape.
Remaining work is **submission plumbing + monetization + a few account/identity gates only you
can clear.** Realistic timeline once you have an Apple Developer account + Xcode: ~1–2 focused days.

---

## A. Hard gates — **[YOU]** (no agent can do these)
1. **Enroll in the Apple Developer Program** — $99/year, https://developer.apple.com/programs/.
   Required to build, ship, AND receive payouts (set up banking + tax in App Store Connect →
   Agreements).
2. **Install Xcode** (Mac App Store) and run:
   `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer && sudo xcodebuild -license accept`
3. **Create the app in App Store Connect** (bundle id `com.sonnymay.todomon`), set price/free,
   create the In-App Purchase products (IDs below), fill the **App Privacy** questionnaire, upload
   **screenshots** (6.7" + 6.5"), and **submit for review**.
4. **Host the privacy policy** (see §D) at a public URL; paste it into App Store Connect + link
   it in the app's Settings.

## B. Monetization — decision needed, then **[ME]** builds it
The coins/cosmetics shop is the natural revenue hook. Options (pick one in chat):
- **Coin packs (consumable IAP)** — buy coins → spend in the existing Shop. Best fit; classic
  game economy. Product ids e.g. `coins_small/medium/large`.
- **One-time "Pro" unlock (non-consumable)** — single purchase unlocks all cosmetics / a "Pro"
  badge / removes any caps. Simplest, most user-friendly. Product id `todomon_pro`.
- **Subscription** — Pro monthly/yearly. Highest revenue, most App-Review scrutiny + churn ops.

**DECISION: One-time "ToDoMon Pro" unlock ($4.99) — BUILT ✅** (product id `todomon_pro`).
Grants: all premium cosmetics (Cosmic Aura, Royal Frame, Crown), **2× coins forever**, Pro badge.
Implemented + verified with a dev-mock: `lib/iap.ts` (entitlement + purchase/restore + a native
seam), `components/Paywall.tsx`, Pro gating in `Shop`, a Go-Pro row in `Settings`, the 2× multiplier
in `App.awardCompletion`, `gameStore.grantProCosmetics`. Restore Purchases included.

**Remaining native step (needs Xcode + your App Store Connect):**
1. `npm i @capacitor-community/in-app-purchase` (or `@revenuecat/purchases-capacitor` — recommended
   for receipt validation) and `npx cap sync ios`.
2. Wire the two TODO seams in `lib/iap.ts` (`nativePurchase`/`nativeRestore`) to the plugin for
   product `todomon_pro`.
3. **[YOU]** In App Store Connect: create the non-consumable IAP `todomon_pro` at $4.99, attach it
   to the app, and test the purchase in the sandbox on a device.

## C. Submission prep — mostly **[ME]**, verified on device by **[YOU]**
- **[ME]** App icon (1024²) + splash via `@capacitor/assets`.
- **[ME]** Portrait lock + status-bar style; confirm Dev buttons absent from a prod build
  (already gated by `import.meta.env.DEV`).
- **[ME]** Privacy-policy page (§D) + Settings link; App Store listing copy (§E).
- **[ME]** Final pre-submission audit against `docs/PRE_SUBMISSION_QA.md`.
- **[YOU]** Screenshots from the iOS simulator; age rating; version 1.0.0 / build 1.

---

## D. Privacy policy (offline app + IAP) — draft to host
> **ToDoMon Privacy Policy.** ToDoMon stores all your data — tasks, your dragon, coins, and
> progress — **locally on your device**. We do not collect, transmit, sell, or share any personal
> information, and there are no analytics or ads. If you make an in-app purchase, the transaction
> is handled entirely by Apple; we never see your payment details. Deleting the app removes all
> your data. Questions: <support email>. Last updated: 2026-06-01.

(With IAP, the App Privacy label is "Purchases" handled by Apple; the app itself still collects
nothing. No account = no Sign-in-with-Apple or account-deletion requirement.)

## E. App Store listing — draft
- **Name:** ToDoMon: Pet & To-Do
- **Subtitle:** Grow a dragon by getting things done
- **Keywords:** todo, habit, tamagotchi, pet, productivity, tasks, streak, focus, virtual pet, dragon
- **Description:** Turn your to-do list into a game. Complete real tasks to feed and evolve your
  Sun Dragon from egg to mega. Earn coins, finish daily quests, keep your streak alive, unlock
  trophies, and dress up your dragon. Everything stays on your device — no account, no ads.
- **What's New (1.0.0):** First release.

## Recommended order
1. **[YOU]** Apple Developer enrollment + Xcode (unblocks everything).  2. Pick the money model.
3. **[ME]** icon + splash + IAP/paywall + privacy page + portrait config + audit.
4. **[YOU]** App Store Connect setup (products, privacy, screenshots) → TestFlight → submit.
