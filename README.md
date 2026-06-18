# ToDoMon

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![Capacitor](https://img.shields.io/badge/Capacitor-iOS-119EFF.svg)](https://capacitorjs.com/)

ToDoMon is a pet-care productivity app: finish real tasks to feed, grow, and evolve a Sun Dragon.

## Screenshots

| Home | Tasks | Evolution |
|---|---|---|
| ![Home screen](app-store-screenshots/01-home-iphone-65.png) | ![Task list](app-store-screenshots/04-tasks-iphone-65.png) | ![Evolution](app-store-screenshots/09-evolution-iphone-65.png) |

## What this code shows

- React/Vite frontend packaged for iOS with Capacitor.
- Offline-first task and creature state stored locally for the App Store build.
- Game loop with hunger, mood, sleep, XP, stages, streaks, quests, trophies, diary memories, cosmetics, haptics, sound, and share cards.
- RevenueCat-backed one-time Pro unlock path for premium cosmetics and bonus celebrations.
- Focused unit tests around game economy, quests, stage progression, notifications, review prompts, sharing, and streaks.

## Stack

| Layer | Tech |
|---|---|
| App | React, TypeScript, Vite, Tailwind CSS |
| Native shell | Capacitor iOS |
| Persistence | Local device storage |
| IAP | RevenueCat / StoreKit, product `todomon_pro` |
| QA | Vitest, App Store screenshot capture scripts |

## Local development

```bash
cd frontend
npm install
npm run dev
```

## Quality checks

```bash
cd frontend
npm run build
npm test
```

## iOS release notes

- Bundle ID: `com.sonnymay.todomon`
- App Store Connect app ID: `6776013029`
- Screenshot sets live in `app-store-screenshots/`.
- Shipping notes live in `HANDOFF.md`, `docs/SHIP_PLAN.md`, and `docs/IAP_SETUP.md`.
