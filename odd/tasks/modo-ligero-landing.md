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
- [ ] T2 Visible classic home (sections with `id={stop.key}`) + `HomeSwitch` in `app/page.tsx` — route: delegated
- [ ] T3 `navigateToStop` (board event if listener, else scrollIntoView) used by navbar — route: delegated
- [ ] T4 Runtime fallback: try/catch renderer/init, `webglcontextlost`, `shouldDegrade` FPS watchdog, ready timeout → switch to lite — route: delegated
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

## Next step
T2.
