# Feature: Share page with QR code

Locator: `odd/tasks/share-page-qr.md` · Engram mirror: `odd/share-page-qr/tasks`
Branch: `claude/page-share-qr-module-1f086f` (base `main` @ f65a194)

## Objective
Visitors can share the site from a "Compartir" button: the native share sheet on devices that
support it, otherwise a dialog with a QR code, "copy link" and "download QR". The shared URL points
to the section being viewed (`/#projects`), in both the 3D board and lite mode.

## Why
There is no share affordance today, and the URL never reflects the current board stop, so a shared
link always lands on the first stop. `app/layout.tsx` has no `metadataBase`/`openGraph`, so link
previews in chat apps are poor.

## Scope
- New pure module `lib/share.ts` (+ test): share URL, share strategy, stop-hash parsing.
- `components/game/board-game.tsx`: start at the stop in `location.hash`; keep the hash in sync via `history.replaceState`.
- New `components/share/share-qr.tsx`, `components/share/share-dialog.tsx`, `components/share/share-button.tsx`.
- New `components/ui/dialog.tsx` (shadcn, `@radix-ui/react-dialog`), dependency `qrcode`.
- `components/navbar.tsx` (desktop + mobile menu), `app/layout.tsx` (metadata).

## Constraints
- Next.js 14 App Router, React 18, Tailwind 3, shadcn/ui, pnpm. Theme tokens only.
- Use `#hash`, not `?stop=`: lite mode already renders `<section id={stopKey}>`, and the page stays static.
- `history.replaceState`, never `pushState` (no history spam); unknown hashes are ignored.
- QR is always dark-on-light, including dark mode (scanner reliability). Generated client-side, no network.
- Navbar hidden under `NEXT_PUBLIC_MAINTENANCE_MODE === "true"` stays as is.
- three.js stays in the `next/dynamic({ ssr:false })` chunk.

## TDD
Mode: strict (source: user global CLAUDE.md "Strict TDD Mode: enabled"). Runner: `pnpm test` (vitest).
Pure logic goes RED→GREEN→REFACTOR; DOM/3D wiring verified by `tsc`, lint, build and browser.

## Delivery
Strategy: ask-on-risk. Forecast: ~560 authored changed lines (lockfile/binary excluded) → exceeds the
~400 budget; chain strategy: `stacked-to-main` (user choice). Work-unit commits on the feature branch; push/PR are the user's decision.
Slices (planned): PR1 deep link = T1–T2 · PR2 share + QR = T3–T5 · PR3 OG metadata = T6 (T7 verifies each slice).

## Tasks
- [x] T1 `lib/share.ts`: `buildShareUrl`, `getShareStrategy`, `parseStopHash` with vitest (RED→GREEN) — route: delegated (writer trigger: 2+ files, preparation reading)
- [x] T2 Board deep link: initial stop from `location.hash`, `replaceState` on stop change, invalid hash ignored; verify lite `/#projects` — route: delegated (same writer as T1)
- [ ] T3 `qrcode` dependency + `<ShareQr>` SVG (dark-on-light) with tests for the QR options helper — route: pending
- [ ] T4 shadcn `dialog` + `<ShareDialog>`: copy link with feedback, download QR (PNG/SVG), a11y — route: pending
- [ ] T5 `<ShareButton>` in navbar desktop + mobile menu; native share when available, dialog otherwise — route: pending
- [ ] T6 `metadataBase` + `openGraph`/`twitter` metadata and OG image — route: pending
- [ ] T7 Browser verification: light/dark, 375px/desktop, `/#projects` in full and lite, QR scans, console clean — route: pending

## Acceptance criteria
- Opening `/#projects` starts the board at Projects (full) and scrolls to it (lite).
- Moving through the board updates the hash without adding history entries.
- Share button: native sheet where `navigator.share` exists; otherwise dialog with QR of the current URL, copy and download.
- QR is readable in light and dark theme.
- `pnpm test`, `pnpm lint`, `pnpm build`, `tsc --noEmit` green; 375px without horizontal scroll.

## Progress / evidence

### T1 — `lib/share.ts` (`3c5b95f feat(share): add share url, strategy and stop hash helpers`)
- RED: `pnpm test -- lib/share.test.ts` failed with
  `Error: Cannot find module './share' imported from .../lib/share.test.ts` (test file written
  first, no implementation yet).
- GREEN: after implementing `parseStopHash`, `buildShareUrl`, `getShareStrategy` — `71 passed (71)`
  (54 pre-existing + 17 new). Full `pnpm test` also green at `71 passed (71)`.
- Deviation: `lib/share.ts` imports `board-config` via a relative path (`../components/game/board-config`)
  instead of the `@/` alias, because vitest here has no path-alias resolution configured (no
  `vitest.config.*`, no `vite-tsconfig-paths`) — confirmed by reproducing
  `Cannot find package '@/components/game/board-config'` when the alias was used. All existing
  `*.test.ts` files in `components/game/` already use relative imports for the same reason.
  `board-game.tsx` and `seo-fallback.tsx` (T2), which are never imported by a test file, use the
  `@/lib/share` alias per repo convention; `board-events.ts` (reached by `board-events.test.ts`)
  uses the relative path like `lib/share.ts` does.

### T2 — Board deep link (`afd8420 feat(game): deep link board stops through the url hash`)
- Added a 4th pure helper to `lib/share.ts`, TDD'd the same way as T1:
  - RED: `withStopHash` test added — `3 failed | 71 passed (74)`, all three failures
    `TypeError: withStopHash is not a function`.
  - GREEN: implemented `withStopHash(href, stopKey)` — `74 passed (74)`.
- DOM/React wiring (not unit-tested per task instructions; verified by `tsc`/lint/build):
  - `components/game/use-board-scene.ts`: `UseBoardSceneOptions.initialStopIndex` places the
    token/die directly on that stop's square in `init()` (no animated walk, no dice roll) and
    seeds both the class field `state` and the hook's `useState` from it, via a new
    `clampStopIndex` helper.
  - `components/game/board-game.tsx`: reads `location.hash` once at mount
    (`initialStopIndexFromHash`) into `useState`, passes it as `initialStopIndex`; syncs the hash
    via `window.history.replaceState(window.history.state, "", withStopHash(...))` whenever
    `state.stop` changes, skipping the very first effect run (mount) so no hash is added when none
    was present; listens for `hashchange` and calls `nav.goTo(stopKey)` for a valid new hash,
    cleaned up on unmount.
  - `components/game/seo-fallback.tsx` (`ClassicHome`): now a client component (`"use client"`
    added — it uses `useEffect`); after mount, if `visible` (lite mode) and the hash matches a
    stop, `scrollIntoView`s that section, honoring `prefers-reduced-motion` via the exported
    `board-events.ts#prefersReducedMotion`.
  - `components/game/board-events.ts`: exported `prefersReducedMotion` (was private); the `scroll`
    branch of `navigateToStop` now also syncs the hash via `withStopHash` + `replaceState`, so
    lite-mode navbar clicks keep the URL shareable.
- Deviation from Scope: `components/game/use-board-scene.ts` was not listed in the feature
  document's Scope, but T2's "set the initial state directly — no animated walk from stop 0, no
  extra dice roll" requirement lives entirely in that module (it owns the `BoardScene` class and
  token/die placement in `init()`); `board-game.tsx` alone has no way to set the initial square
  without it. Change there is additive and backward compatible: `initialStopIndex` is optional and
  defaults to 0 (current behavior) via `clampStopIndex`.
- `components/game/seo-fallback.tsx` was in Scope only implicitly (via "lite mode" acceptance
  criteria, not listed under Scope's bullet list); touched to satisfy "After the classic home
  mounts... scrollIntoView" from the task description.

### Verification (both tasks, run together after T2)
- `pnpm test`: **PASS** — `Test Files 7 passed (7)`, `Tests 74 passed (74)`.
- `npx tsc --noEmit`: **PASS** — no output, exit clean.
- `pnpm lint`: **PASS** — only the pre-existing `<img>` warnings in `app/maintenance/page.tsx`,
  `components/footer.tsx`, `components/hero-section.tsx`, `components/navbar.tsx`,
  `components/projects-section.tsx` (all outside this feature's scope, listed as a known
  environmental failure). No errors, no warnings in files touched by T1/T2.
- `pnpm build`: **PASS** — `✓ Compiled successfully`, static pages generated, same `<img>` lint
  warnings surfaced again during the build's lint pass, no build errors.

### Line counts
`git diff --stat f65a194..HEAD`:
```
 components/game/board-events.ts    |  7 ++-
 components/game/board-game.tsx     | 41 ++++++++++++++++-
 components/game/seo-fallback.tsx   | 18 ++++++++
 components/game/use-board-scene.ts | 63 +++++++++++++++++++-------
 lib/share.test.ts                  | 93 ++++++++++++++++++++++++++++++++++++++
 lib/share.ts                       | 71 +++++++++++++++++++++++++++++
 6 files changed, 274 insertions(+), 19 deletions(-)
```
(This slice, T1+T2 together, landed under the ~400-line advisory budget.)

### Parent verification + fix (`d8ecd27 fix(game): keep hash-less loads clean under strict mode double effects`) — route: inline (3 small, understood files)
- Browser check found a defect: loading `/` with no hash left the URL at `/#about`. Cause: the
  "skip first run" ref does not survive React StrictMode's dev double-invoked effects (ref stays
  `false` after the first pass, second pass writes the hash).
- Fix: pure `shouldSyncStopHash({ currentHash, stopKey, onInitialStop })` in `lib/share.ts`
  derived from the URL instead of a ref. RED: 4 new tests failed with
  `TypeError: shouldSyncStopHash is not a function`; GREEN: `78 passed (78)`.
- `npx tsc --noEmit` clean; `pnpm lint` only pre-existing `<img>` warnings; `pnpm build` green (`/` 105 kB, static).
- Browser (dev server, full mode): `/` stays hash-less; ArrowDown → `/#skills` with `history.length`
  unchanged (1); fresh `/?x=1#projects` opens the board directly on Projects (square 12) and keeps
  `?x=1`; `/#skills` reload opens on Skills. Lite `/?mode=lite#contact`: no canvas, `#contact` scrolled
  to `top: 80px` (below the fixed navbar). Console clean after a fresh load (earlier
  `shouldSyncStopHash is not defined` errors were the HMR window between two edits).

## Next step
T3 (slice PR2).
