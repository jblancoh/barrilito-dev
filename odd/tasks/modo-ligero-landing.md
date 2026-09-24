# Feature: Lite mode for the 3D landing

Locator: `odd/tasks/modo-ligero-landing.md` · Engram mirror: `odd/modo-ligero-landing/tasks`
Branch: `claude/performance-no-animation-d0fc6c` (base `main` @ 5c13f83)

## Objective
Visitors whose devices cannot run the three.js board (no WebGL, reduced motion, low-end hardware,
Save-Data, runtime failure or low FPS) get a visible, natively scrollable classic home with working
navigation. Capable devices keep the board, running cheaper.

## Why
On WebGL failure `new THREE.WebGLRenderer()` throws inside `init()`, the error is swallowed,
`ready` never flips and the user is stuck on "Preparando el tablero…" while wheel/keys/touch stay
hijacked and navbar buttons only dispatch board events. The content exists only as `sr-only`.

## Scope
- `components/game/render-mode.ts` (+ test), `components/game/home-switch.tsx`
- `components/game/seo-fallback.tsx` → visible classic home when lite
- `components/game/board-events.ts`, `components/navbar.tsx`
- `components/game/use-board-scene.ts`, `components/game/board-game.tsx`, `components/site-chrome.tsx`, `app/page.tsx`

## Constraints
- Next.js 14 App Router, React 18, Tailwind 3, shadcn/ui, pnpm. Theme tokens only.
- three.js must stay inside the `next/dynamic({ ssr:false })` chunk; lite mode must not load it.
- SEO DOM stays rendered in both modes. `localStorage` access wrapped in try/catch.
- Out of scope: dead legacy sections (`hero-section.tsx`, `projects-section.tsx`, `skills-section.tsx`, `contact-section.tsx`).

## TDD
Mode: strict (source: user global CLAUDE.md "Strict TDD Mode: enabled"). Runner: `pnpm test` (vitest).
Pure logic (mode detection, nav routing, FPS watchdog) goes RED→GREEN→REFACTOR; DOM/3D verified by build, lint and browser.

## Delivery
Strategy: ask-on-risk. Work-unit commits on the feature branch; push/PR are the user's decision.
Forecast: ~450 authored changed lines.

## Tasks
- [x] T0 Sync branch with `origin/main` (fast-forward to 5c13f83); `pnpm test` 29/29 green — route: inline
- [x] T1 `detectRenderMode` pure function + WebGL/env probe, overrides `?mode=` and stored preference — route: delegated (writer trigger)
- [x] T2 Visible classic home (sections with `id={stop.key}`) + `HomeSwitch` in `app/page.tsx` — route: delegated
- [x] T3 `navigateToStop` (board event if listener, else scrollIntoView) used by navbar — route: delegated
- [x] T4 Runtime fallback: try/catch renderer/init, `webglcontextlost`, `shouldDegrade` FPS watchdog, ready timeout → switch to lite — route: delegated
- [ ] T5 Manual toggle "Versión ligera / Ver en 3D" persisting preference — route: delegated
- [ ] T6 Cheaper full mode: pause RAF when hidden, DPR ≤ 1.5, lighter shadows/antialias on modest devices — route: delegated

## Acceptance criteria
- `/?mode=lite`: visible content, native scroll, navbar scrolls to sections, no three chunk requested.
- Reduced motion or no WebGL → lite automatically.
- WebGL/init failure or sustained low FPS → switches to lite instead of hanging.
- Toggle switches mode and persists across reloads.
- `pnpm test`, `pnpm lint`, `pnpm build` green; 375px viewport without horizontal scroll.

## Progress / evidence
- T0: fast-forward merge of `origin/main`; tests 29 passed.
- T1: commit `2aed8c7`. TDD: RED — `pnpm test` failed with "Cannot find module './render-mode'" (render-mode.test.ts, 11 cases). GREEN — implemented `components/game/render-mode.ts` (`detectRenderMode`, `readRenderEnv`, `storeRenderMode`); `pnpm test` 39/39 passed. `tsc --noEmit` clean.
- Deviation (infra, commit `8a31d31`): `pnpm lint` failed with an ESLint "@next/next plugin conflicted" error caused by this worktree living inside the main checkout's directory tree (ESLint's config search walked up and found the parent repo's `.eslintrc.json` too). Fixed by adding `"root": true` to this worktree's `.eslintrc.json` — one line, no rule changes, unblocks the required `pnpm lint`/`pnpm build` verification.
- T2: commit `d732aba`. Extracted `section-registry.tsx` (shared stop→component map) out of `board-game.tsx`; evolved `seo-fallback.tsx` into `ClassicHome({ visible })` reusing the same section components (kept `SeoFallback` export alias); added `home-switch.tsx` deciding full/lite after mount and mounting the existing `next/dynamic(ssr:false)` `BoardGame` only for full; `app/page.tsx` now just renders `HomeSwitch`. `BoardGame` gained an optional `onFallback` prop (stored in a ref; wired up in T4). Verified: `pnpm test` 39/39, `tsc --noEmit` clean, `pnpm lint` clean (only pre-existing unrelated `<img>` warnings), `pnpm build` green — `/` route First Load JS dropped 244 kB → 105 kB (three.js no longer in the initial bundle). Browser-checked `/?mode=lite` at 375px (no horizontal scroll, `scrollWidth === clientWidth === 375`) and the default full board — both render with no console errors. Navbar doesn't yet scroll the classic home (no board listener and no scroll wiring yet) — that's T3.

- T3: commit `63c8846`. TDD: RED — `pnpm test` failed 4/4 new cases, "decideNavigation is not a function" (board-events.test.ts). GREEN — added `decideNavigation` (pure), `boardListenerCount`/`hasBoardListener` bookkeeping in `onBoardGoTo`, and `navigateToStop` to `board-events.ts`; `navbar.tsx` calls `navigateToStop` instead of `dispatchBoardGoTo`. `pnpm test` 43/43, `tsc --noEmit` clean, `pnpm lint` clean. Browser-verified: `/?mode=lite` navbar click scrolls to the clicked section; default full mode navbar click still drives the board (token animates); no console errors either way.

- T4: commit `e7844aa`. TDD: RED — `pnpm test` failed, "Cannot find module './fps-watchdog'" (fps-watchdog.test.ts, 6 cases). GREEN — implemented `shouldDegrade` (pure); `pnpm test` 49/49. Wired `use-board-scene.ts`: try/catch around `WebGLRenderer` construction and the async `init()` promise, `webglcontextlost` listener, 3s post-ready FPS sampling, 8s ready timeout, all reporting through a new `onError`/`onFallback` at most once; `board-game.tsx`'s `onFallbackRef` (from T2) now actually forwards to `HomeSwitch.handleFallback` (already non-persisting from T2). Verified existing wheel/keydown/touch listener cleanup in `board-game.tsx` unchanged and correct (no edit needed). `tsc --noEmit` clean, `pnpm lint` clean, `pnpm build` green (route size unchanged). Browser-checked the default full board still loads/runs with no console errors and no false-positive degrade. Could not reproduce an actual WebGL failure through the available browser tooling, so the renderer-failed/context-lost/timeout paths rely on code review of the try/catch and listener wiring rather than a live repro — flagged for manual verification.

## Next step
T5.
