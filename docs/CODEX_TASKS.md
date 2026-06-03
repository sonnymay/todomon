# ToDoMon — AI icon prompts + Codex hand-off tasks

Everything left to ship + earn. Generate the icon with an AI image tool (prompts in §1), then
run the Codex tasks (§3) in order. Project root: `/Users/santipapmay/Desktop/todomon`.

---

## 1. App icon — AI image-generation prompt
Use Midjourney / DALL·E 3 / Ideogram / Adobe Firefly. Generate **1024×1024, square, no text,
no transparency, no rounded corners** (Apple adds the rounded mask automatically).

**Primary prompt (baby sun-dragon):**
> A mobile game app icon: an adorable chibi baby sun-dragon hatching from a glowing golden egg.
> Kawaii mascot style, big friendly sparkling eyes, tiny wings, warm and joyful. Background is a
> smooth amber-to-orange radial sunrise gradient with a soft glow. Clean modern vector
> illustration, thick smooth shapes, glossy, bold and simple so it's instantly readable at small
> sizes. Centered composition, full-bleed square, no text, no border. Flat premium iOS game icon.

**Negative / avoid:** text, letters, words, watermark, signature, border, frame, rounded corners,
photorealism, busy background, multiple characters, drop-shadow on a transparent background.

**Alternate prompt (cute dragon egg, simpler):**
> A premium iOS app icon of a single cute golden dragon egg with a friendly face, glossy and
> rounded, sitting in a warm radial sunrise glow (amber to orange). Kawaii, bold, minimal, high
> contrast, centered, no text, full-bleed 1024×1024 square.

Pick the best result, upscale to 1024×1024, export PNG **without transparency**, and save it to:
`/Users/santipapmay/Desktop/todomon/assets/icon.png`  ← (create the `assets/` folder)

## 2. Splash logo (optional — or reuse the icon art)
Generate the same mascot **on a plain solid background `#fdf6e3` (cream)** with lots of padding,
no text, 1024×1024, and save to `/Users/santipapmay/Desktop/todomon/assets/splash.png`. (Capacitor
centers it on the splash; the cream matches the app's background so there's no flash.)

---

## 3. Codex tasks (run in order)

### Task A — Turn the AI art into the iOS icon + splash
> In `/Users/santipapmay/Desktop/todomon`, I placed a 1024×1024 app icon at `assets/icon.png`
> (and a logo at `assets/splash.png`). Capacitor lives at the repo root (`capacitor.config.ts`),
> so install `@capacitor/assets` in the root package (`npm i -D @capacitor/assets`), then run
> `npx @capacitor/assets generate --ios --assetPath assets` so it regenerates
> `ios/App/App/Assets.xcassets/AppIcon.appiconset` and `Splash.imageset`. If the tool needs a
> splash background, use `#fdf6e3`. Then run `npm run build` and from root
> `npm run cap:sync:ios` (uses the repo's Node 22 wrapper for Capacitor). Confirm the new icon
> shows in `AppIcon.appiconset`.
> (You can delete the placeholder generator `scripts/gen-assets.cjs` afterward.)

### Task B — Wire real In-App Purchase (StoreKit) for "ToDoMon Pro"
> In `/Users/santipapmay/Desktop/todomon`, the Pro paywall + entitlement already exist in
> `frontend/src/lib/iap.ts` (with `nativePurchase`/`nativeRestore` TODO seams) and
> `components/Paywall.tsx`. Integrate real StoreKit for a **non-consumable** product id
> `todomon_pro` ($4.99). Recommended: RevenueCat — `cd frontend && npm i @revenuecat/purchases-capacitor`,
> configure with the iOS API key, and implement `nativePurchase` (purchase `todomon_pro`, verify,
> resolve true) and `nativeRestore` (restore + check entitlement) in `iap.ts`. Keep the existing
> web mock for non-native. Then `npx cap sync ios`. Document the exact App Store Connect product
> setup needed. Keep `npm run build` and the 31 Vitest tests green.

### Task C — Build, sign, and ship via Xcode (Apple Developer account is active)
> In `/Users/santipapmay/Desktop/todomon`: ensure Xcode is installed
> (`sudo xcode-select -s /Applications/Xcode.app/Contents/Developer && sudo xcodebuild -license accept`),
> then `cd frontend && npm run build` and from root `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx cap sync ios`.
> Open `ios/App/App.xcworkspace`, set the Signing Team to my Apple Developer account, set version
> 1.0.0 / build 1, select "Any iOS Device", Product → Archive, and upload to App Store Connect /
> TestFlight. Report any signing or build errors.

### Task D — App Store screenshots
> Run ToDoMon in the iOS Simulator on **iPhone 15 Pro Max (6.7")** and **iPhone 8 Plus (5.5")**.
> Capture App-Store-spec screenshots of: the creature scene with the food/grow bars, the task list
> with the difficulty picker, the Quests sheet, the Trophies sheet, and the Shop/paywall. Save them
> to `docs/screenshots/`. (Build the web app first and `cap copy ios`.)

### Task E — Host the privacy policy
> Host `frontend/public/privacy.html` at a public URL (e.g. GitHub Pages or Netlify drop). Replace
> `support@example.com` with my real support email first. Give me the final URL to paste into App
> Store Connect.

### Task F — App Store Connect listing
> Use the copy in `docs/SHIP_PLAN.md` §E (name, subtitle, keywords, description) for the App Store
> Connect listing. Set age rating (likely 4+), category Productivity (secondary: Games), and link
> the privacy policy URL from Task E.

---

## Already done (no action needed)
- Product complete: offline persistence, engagement loop (coins/quests/trophies/cosmetics/feed/
  streaks/celebrations), Pro paywall + entitlement + 2× coins (mock), 31 tests, slim assets.
- Portrait lock (`ios/App/App/Info.plist`), privacy page + in-app link, `viewport-fit=cover`.
- Bundle id `com.sonnymay.todomon`, version 1.0.0.
