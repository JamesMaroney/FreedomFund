# Contributing to Freedom Fund

Thanks for your interest in contributing! This doc covers technical setup, project architecture, and the deploy process.

---

## Tech stack

| Layer | Tool |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Animations | Framer Motion |
| PWA | vite-plugin-pwa (Workbox) |
| Hosting | GitHub Pages (`gh-pages` branch) |
| Fonts | Plus Jakarta Sans, DM Mono (Google Fonts) |

---

## Local development

```bash
npm install
npm run dev -- --host   # --host exposes on LAN for mobile testing
```

The dev server uses a self-signed SSL cert (`@vitejs/plugin-basic-ssl`) so the PWA service worker and audio context work correctly on local network devices.

---

## Project structure

```
src/
  components/
    ActivityRings.tsx     # SVG ring animation, memo'd for perf
    AmountSelector.tsx    # Chip picker overlay
    CelebrationScreen.tsx # Post-deposit celebration + laser burst
    DepositHistory.tsx    # Scrollable list of past deposits
    HomeScreen.tsx        # Main screen — rings, carousel, history
    SettingsPanel.tsx     # Slide-out settings drawer
    TransferButton.tsx    # "Send to Ally" flow
  constants/
    presets.ts            # Default tip presets, goals, weekly targets, milestones
  hooks/
    useOrientation.ts     # isLandscape detection
    useStreak.ts          # Streak calculation
  utils/
    audio.ts              # Web Audio API — persistent AudioContext singleton
    currency.ts           # formatCents helper
    id.ts                 # generateId (uuid-lite)
  types.ts                # Shared TypeScript interfaces
  App.tsx                 # Root — state machine, routing between screens
  App.css                 # All styles (single flat file)
  main.tsx                # Entry point
```

---

## State management

All app state lives in a single `FreedomFundState` object persisted to `localStorage`. There is no external state library — updates flow through a `useReducer`-style pattern in `App.tsx`.

The UI cycles through four screens managed by `appScreen: AppScreen`:

```
IDLE → SELECTING_AMOUNT → CELEBRATING → TRANSFER_PROMPT → IDLE
```

---

## Audio

`src/utils/audio.ts` maintains a single persistent `AudioContext` singleton (`_ctx`). To avoid the first-play cut-off on mobile, `primeAudio()` is called on the very first user gesture (ring tap) to resume the context before any sound is scheduled. All notes are scheduled with a small lookahead (`currentTime + 0.03`) to prevent scheduling before the context is fully running.

---

## Activity rings

`ActivityRings.tsx` is wrapped in `React.memo` and receives a stable `rings` array (via `useMemo` in `HomeScreen`). This prevents the SVG from re-rendering and re-triggering stroke animations on unrelated state changes.

Lap rings (when progress > 1.0) are wrapped in a `<g key="lap-rings">` stable container to avoid React positional reconciliation drift resetting animations.

---

## Build & deploy

```bash
npm run build    # tsc + vite build → dist/
npm run deploy   # build + gh-pages -d dist -b gh-pages
```

The production build injects `__GIT_HASH__` (first 8 chars of HEAD) at compile time via `vite.config.ts`'s `define` block. It's displayed at the bottom of the Settings panel.

The `base` path is `/FreedomFund/` in production and `/` in development, controlled by the `isProd` flag in `vite.config.ts`.

---

## ESLint

```bash
npm run lint
```

Type-aware lint rules are enabled via `tseslint.configs.recommendedTypeChecked`.
