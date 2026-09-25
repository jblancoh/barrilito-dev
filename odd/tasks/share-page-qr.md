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
- If a custom domain differs from the Vercel project's own production domain, set
  `NEXT_PUBLIC_SITE_URL` in Vercel (Project Settings → Environment Variables) so `metadataBase`
  and the OG/Twitter image URLs resolve to the real public domain instead of the Vercel-assigned one.
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
- [x] T2b Keep foreign fragments (skip links, auth callbacks) intact on mount; test `navigateToStop` replaceState — added from RDD review R3 advisories — route: inline (2 small, understood files)
- [x] T3 `qrcode` dependency + `<ShareQr>` SVG (dark-on-light) with tests for the QR options helper — route: delegated (writer trigger: 2+ non-trivial files)
- [x] T4 shadcn `dialog` + `<ShareDialog>`: copy link with feedback, download QR (PNG/SVG), a11y — route: delegated (writer trigger: 2+ non-trivial files)
- [x] T5 `<ShareButton>` in navbar desktop + mobile menu; native share when available, dialog otherwise — route: delegated (writer trigger: 2+ non-trivial files)
- [x] T5b Board ignores input while a dialog is open; standalone SVG export — added from parent browser verification — route: delegated (same writer)
- [x] T5c Touch guard symmetric: an ignored touchstart cannot pair with a later touchend (`4703ab4`) — added from RDD review R3 warning — route: inline (1 mechanical edit)
- [x] T6 `metadataBase` + `openGraph`/`twitter` metadata and OG image — route: delegated (writer trigger: 3 new/changed non-trivial files)
- [x] T7 Browser verification: light/dark, 375px/desktop, `/#projects` in full and lite, QR scans, console clean — route: inline (parent verification)

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

### T2b — foreign fragments (`60cc9ef fix(game): leave foreign url fragments intact on board mount`)
- RED: new `shouldSyncStopHash` cases (`#main-content`, `#` on the initial stop) failed —
  `AssertionError: expected true to be false`, `1 failed | 80 passed (81)`. The new `navigateToStop`
  scroll-branch test (stubbed `window`/`document`: replaceState called with `history.state` and
  `/?mode=lite#projects`, pushState never) passed on first run — characterization of existing behavior.
- GREEN: `current === null && onInitialStop` → no write; `81 passed (81)`. `tsc --noEmit` clean; `pnpm lint` 0 errors.

### T3 — QR rendering (`9030dac feat(share): render qr codes as theme-independent svg`)
- `pnpm add qrcode` + `pnpm add -D @types/qrcode`. New pure helper `lib/qr.ts`:
  `buildQrMatrixPath(value)` calls `QRCode.create(value, { errorCorrectionLevel: "M" })` and
  walks its `BitMatrix` (`modules.get(row, col)`) into an SVG path `d` string of 1×1 squares, each
  offset by a 4-module quiet zone; also exports the fixed `QR_DARK`/`QR_LIGHT` colors.
- RED: `pnpm test -- lib/qr.test.ts` → `Error: Cannot find module './qr' imported from
  .../lib/qr.test.ts` (test file written first).
- GREEN: after implementing `buildQrMatrixPath` — `86 passed (86)` (81 pre-existing + 5 new).
- `components/share/share-qr.tsx`: `forwardRef<SVGSVGElement, ...>` renders
  `<svg viewBox="0 0 N N" role="img" aria-label=… shapeRendering="crispEdges">` with a `QR_LIGHT`
  background `<rect>` and a `QR_DARK` `<path>` — no `dangerouslySetInnerHTML`. Always dark-on-light
  even in dark mode (scanner reliability), commented in both `lib/qr.ts` and the component as a
  deliberate exception to "theme tokens only".
- Deviation: the test asserting the quiet zone uses `Array.from(path.matchAll(...))` instead of
  `[...path.matchAll(...)]` — this tsconfig has no explicit `target`, so spread-iterating a
  `RegExpStringIterator` fails `tsc --noEmit` with TS2802 (needs `--downlevelIteration` or
  ES2015+ target); `Array.from` over the same iterable compiles cleanly under any target.

### T4 — Share dialog (`5607375 feat(share): add share dialog with copy and download`)
- `pnpm add @radix-ui/react-dialog`. New pure helper `shareFileName(url)` in `lib/share.ts`:
  `barrilitodev-<stopKey>` when the URL's hash matches a real stop (via `parseStopHash`), else
  plain `barrilitodev`.
  - RED: `pnpm test -- lib/share.test.ts` → `4 failed | 86 passed (90)`, all
    `TypeError: shareFileName is not a function`.
  - GREEN: `90 passed (90)`.
- `components/ui/dialog.tsx`: standard shadcn/ui dialog primitives (`Dialog`, `DialogTrigger`,
  `DialogPortal`, `DialogOverlay`, `DialogClose`, `DialogContent` with a lucide `X` close button
  and sr-only "Cerrar", `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`) built on
  `@radix-ui/react-dialog`, `cn` and `tailwindcss-animate` — not run through the shadcn CLI.
- `components/share/share-dialog.tsx` (`ShareDialog({ open, onOpenChange, url })`): title
  "Compartir esta página" + description; `<ShareQr>` in a white rounded padded box sized `h-52 w-52`
  (fits comfortably inside the dialog's `w-[calc(100%-2rem)] max-w-sm` at 375px); read-only `Input`
  with the URL + "Copiar enlace" using `navigator.clipboard.writeText`, "¡Enlace copiado!" feedback
  for 2s through an `aria-live="polite"` region, falling back to `input.select()` +
  "Copia el enlace manualmente" when the Clipboard API is missing or the write rejects;
  "Descargar PNG"/"Descargar SVG" (`XMLSerializer` + namespaced clone for SVG; an offscreen
  `Image` + 1024×1024 `<canvas>` + `toBlob` for PNG; every `URL.createObjectURL` is revoked after
  use); "Más opciones" shown only when `navigator.share` exists, calling
  `navigator.share({ title: document.title, url })` and ignoring `AbortError`.

### T5 — Share button (`4b1fcbd feat(share): add share button to the navbar`)
- `components/share/share-button.tsx`: on click, `url = buildShareUrl(window.location.href)` read
  at click time (so it includes the current `#stop`), then
  `getShareStrategy({ hasNativeShare: typeof navigator.share === "function", isCoarsePointer:
  window.matchMedia("(pointer: coarse)").matches })`. `"native"` calls `navigator.share`, ignores
  `AbortError`, and falls back to the dialog on any other error; `"dialog"` opens it directly.
  `ShareDialog` is loaded via `next/dynamic(..., { ssr: false })` and only mounted after the first
  open (`hasOpenedDialog` state), so its chunk (qrcode + Radix Dialog) is fetched on demand, not on
  page load.
- One component serves both navbar surfaces via a `variant` prop: `"icon"` renders the
  `Share2`/ghost/icon button (`aria-label`/`title="Compartir"`) placed next to `ModeToggle` in the
  desktop action group; `"menu-item"` renders a plain text entry styled like the other mobile-menu
  links, added to `components/navbar.tsx`'s mobile menu with `onBeforeShare={() => setIsMenuOpen(false)}`.
- No unit tests for this task (DOM/React wiring only, per task instructions) — verified by
  `tsc`/lint/build below.

### Verification (T3–T5, run together after T5)
- `pnpm test`: **PASS** — `Test Files 8 passed (8)`, `Tests 90 passed (90)`.
- `npx tsc --noEmit`: **PASS** — no output, exit clean.
- `pnpm lint`: **PASS** — only the same pre-existing `<img>` warnings as T1/T2 (5 files, all outside
  this feature's scope). No errors, no new warnings from T3–T5 files.
- `pnpm build`: **PASS** — `✓ Compiled successfully`; `/` First Load JS **before: 105 kB → after:
  106 kB** (qrcode + Radix Dialog stay in `ShareDialog`'s dynamic, `ssr:false` chunk, not the
  initial bundle — confirms the lazy-load requirement).

### Line counts
`git diff --shortstat e21e46d..HEAD -- . ':!pnpm-lock.yaml' ':!package-lock.json'`:
```
11 files changed, 538 insertions(+), 2 deletions(-)
```
(T3+T4+T5 together; lockfile changes for `qrcode`/`@types/qrcode` landed with T3's commit, and
`@radix-ui/react-dialog`'s with T4's commit, per the "lockfile with its task" rule — each `pnpm add`
was re-run against a package.json with only that task's dependency present so the lockfile diff
split the same way.)

### T5b — Parent browser verification fixes
Three issues found by the parent's browser verification of T3–T5, fixed as one follow-up work unit
in the same worktree/branch.

**Bug 1 — board input leaked through the open share dialog** (`7b555e3 fix(game): ignore board
input while a dialog is open`). Repro: `/?t=2#projects`, open the share dialog, focus "Descargar
PNG", press ArrowDown → the board behind the modal walked to the next stop and the URL changed,
while the dialog kept showing the old URL/QR. Cause: `board-game.tsx`'s `wheel`/`keydown`/
`touchstart`/`touchend` listeners on `window` only guarded against INPUT/TEXTAREA targets.
- New pure helper `shouldIgnoreBoardInput({ targetTag, targetIsContentEditable, targetInDialog,
  modalOpen })` in `components/game/board-events.ts` (kept the INPUT/TEXTAREA rule, added SELECT
  and contenteditable).
  - RED: `pnpm test -- board-events.test.ts` → `6 failed | 90 passed (96)`, all
    `TypeError: shouldIgnoreBoardInput is not a function`.
  - GREEN: `96 passed (96)`.
- Wired into all four `board-game.tsx` handlers via two small DOM helpers: `isModalOpen()` —
  `document.querySelector('[role="dialog"][data-state="open"]')` — and `describeInputTarget(target)`
  — tag, `isContentEditable`, and `target.closest('[role="dialog"]')` — read fresh at event time, so
  the board never couples to the share feature's React state (Radix `DialogContent` renders
  `role="dialog"` and `data-state`, confirmed in `node_modules/@radix-ui/react-dialog/dist/index.mjs`).
  When `shouldIgnoreBoardInput` is true, the handler returns immediately: no `preventDefault()`, no
  move — fixing both the board-walks-behind-the-dialog bug and the Space-to-activate-a-button
  breakage the same guard was causing.
- Browser-verified (dev server, full mode, `/?t=2#projects`): opened the dialog, focused "Descargar
  PNG", pressed ArrowDown — board stayed on CASILLA 12 (Projects), dialog still showed
  `http://localhost:3000/?t=2#projects`. `read_page` confirmed `dialog [ref_24]` present throughout.

**Gap — downloaded SVG had no standalone size, and its object URL was revoked too eagerly**
(`acd570d fix(share): export standalone sized svg and defer url revoke`). In
`share-dialog.tsx#serializeQrSvg`, the cloned `<svg>` kept only `viewBox` plus the Tailwind `class`
(meaningless outside the page) — some apps open it at an odd size. Fixed: the clone now gets explicit
`width`/`height` (`SVG_EXPORT_SIZE = 512`) and has `class` removed. Also, `downloadBlob` revoked its
`URL.createObjectURL` synchronously right after `anchor.click()`, which can cancel the download in
some browsers; now deferred by `REVOKE_URL_DELAY_MS = 100` via `setTimeout`. DOM-only change, no new
pure logic — verified by `tsc`/lint/build.

**Bug 2 — the mobile menu's "Compartir" never showed the dialog** (`b09bacf fix(share): keep the
share dialog mounted when the mobile menu closes`). Repro: 375px, `/?mode=lite#skills`, no
`navigator.share`, coarse pointer → strategy `"dialog"`; tapping the hamburger then "Compartir"
closed the menu and no `[role="dialog"]` ever appeared. Cause: `onBeforeShare` called
`setIsMenuOpen(false)`, which unmounted the menu-item `<ShareButton>` — the component that owned
`dialogOpen`/`hasOpenedDialog` and rendered `<ShareDialog>` — taking the about-to-open dialog down
with it.
- Fix: extracted the share state and click logic into `components/share/use-share.tsx`
  (`useShare()` → `{ share, dialog }`), called once in `Navbar` above the collapsible mobile menu;
  `{dialog}` is now rendered at the header's root, outside the `{isMenuOpen && (...)}` block, so it
  survives the menu closing. `share()` holds the exact same click logic T5 had (live
  `buildShareUrl`/`getShareStrategy`, native with `AbortError` ignored, dialog fallback), and
  `ShareDialog` is still lazy-loaded via `next/dynamic({ ssr: false })`, only mounted after the
  first open. `<ShareButton>` is now a thin, stateless presentational trigger
  (`{ variant, className, onShare }`) — no logic duplicated between the desktop icon and the mobile
  menu item, which calls `setIsMenuOpen(false)` then `share()`.
- No new pure logic (state wiring only) — no unit test added; verified by `tsc`/lint/build and
  browser.
- Browser-verified (375px, `/?mode=lite#skills`, confirmed via `navigator.share` `"undefined"` and
  `matchMedia("(pointer: coarse)").matches === true` so strategy resolves to `"dialog"`): opened the
  hamburger menu, tapped "Compartir" — menu closed and the dialog appeared with
  `input[aria-label="Enlace para compartir"].value === "http://localhost:3000/#skills"` (mode
  stripped, hash kept); `document.documentElement.scrollWidth === clientWidth === 375` (no
  horizontal overflow).

### Verification (T5b, run together)
- `pnpm test`: **PASS** — `Test Files 8 passed (8)`, `Tests 96 passed (96)`.
- `npx tsc --noEmit`: **PASS** — no output, exit clean.
- `pnpm lint`: **PASS** — only the same pre-existing `<img>` warnings (5 files outside this
  feature's scope). No errors, no new warnings.
- `pnpm build`: **PASS** — `✓ Compiled successfully`; `/` First Load JS unchanged at **106 kB**.

### T6 — link previews (`1629810 feat(seo): add open graph and twitter link previews`)
- New pure helper `lib/site-url.ts#resolveSiteUrl(env)`: `NEXT_PUBLIC_SITE_URL` (full URL, trailing
  slash tolerated, falls through if invalid) → `https://${VERCEL_PROJECT_PRODUCTION_URL}` → `https://${VERCEL_URL}`
  → `http://localhost:3000`; empty/whitespace values ignored at every step.
  - RED: `pnpm test -- lib/site-url.test.ts` → `Error: Cannot find module './site-url' imported from
    .../lib/site-url.test.ts` (test file written first, no implementation).
  - GREEN: `108 passed (108)` (96 pre-existing + 12 new). Full `pnpm test` also green at `108 passed (108)`.
- New `lib/site-metadata.ts`: `SITE_TITLE`/`SITE_DESCRIPTION` constants shared by `app/layout.tsx`
  and the OG/Twitter image, so the preview copy can't drift from the page's own title/description
  (plain string literals, no branching logic — no test added, consistent with other non-pure/DOM
  files in this feature).
- `app/layout.tsx`: `metadataBase: resolveSiteUrl(process.env)`; kept the existing title/description
  (now sourced from `lib/site-metadata.ts`); added `openGraph` (`type: "website"`, `locale: "es_MX"`,
  `siteName: "BarrilitoDev"`, title, description, `url: "/"`) and `twitter`
  (`card: "summary_large_image"`, title, description).
- `app/opengraph-image.tsx`: `ImageResponse` from `next/og` on the default Node.js runtime (no
  `export const runtime`). `alt` (Spanish), `size = { width: 1200, height: 630 }`,
  `contentType = "image/png"`. Dark background (`#121212`) with a top gradient bar and "BarrilitoDev"
  in large text, the site's Spanish description as a one-line tagline, and a
  "Serpientes y escaleras · Portafolio" subtitle. Colors are hex conversions of the HSL theme tokens
  from `app/globals.css` (`--primary` 193 95% 68% → `#60d9fb`, `--secondary` 43 100% 58% → `#ffc229`,
  `--accent` 53 93% 54% → `#f7dd1d`), documented in a code comment since `ImageResponse` can't read
  CSS custom properties. Logo embedded: `public/assets/barrildevb.png` is read with `fs.readFileSync`
  relative to `process.cwd()` and inlined as a base64 data URL (falls back to no logo if the read fails).
- `app/twitter-image.tsx`: re-exports `default`/`alt`/`size`/`contentType` from `./opengraph-image`
  so X/Twitter reuses the identical generated card.
- Deviation: `lib/site-url.ts#SiteUrlEnv` needed an index signature (`[key: string]: string | undefined`)
  for `resolveSiteUrl(process.env)` to type-check — `tsc --noEmit` failed with `TS2559: Type
  'ProcessEnv' has no properties in common with type 'SiteUrlEnv'` without it (a TS "weak type" check
  triggered because every property on `SiteUrlEnv` is optional); the index signature doesn't change
  the runtime precedence logic or the test cases.

### Verification (T6)
- `pnpm test`: **PASS** — `Test Files 9 passed (9)`, `Tests 108 passed (108)`.
- `npx tsc --noEmit`: **PASS** — no output, exit clean.
- `pnpm lint`: **PASS** — only the same pre-existing `<img>` warnings (5 files outside this feature's
  scope); `app/opengraph-image.tsx`'s own `<img>` (for the inlined logo) is suppressed with
  `eslint-disable-next-line @next/next/no-img-element` since `next/image` doesn't apply inside
  `ImageResponse`. No errors, no new warnings.
- `pnpm build`: **PASS** — `✓ Compiled successfully`; route table shows both
  `○ /opengraph-image  0 B  0 B` and `○ /twitter-image  0 B  0 B` as static, `○ /maintenance` still
  builds, `/` unchanged at 106 kB First Load JS.
- Browser check (`pnpm start -p 3100`, stopped after the check; port 3000 untouched): `curl -s
  http://localhost:3100/` head contains `og:title`, `og:description`, `og:url`, `og:site_name`,
  `og:locale`, `og:image` (+ `:alt`/`:type`/`:width`/`:height`), `og:type`, and `twitter:card`,
  `twitter:title`, `twitter:description`, `twitter:image` (+ `:alt`/`:type`/`:width`/`:height`).
  `og:image`/`twitter:image` resolve to `http://localhost:3000/...` (from `resolveSiteUrl`'s
  localhost fallback, since no `NEXT_PUBLIC_SITE_URL`/`VERCEL_*` env vars are set locally — expected).
  `curl -sI http://localhost:3100/opengraph-image` and `.../twitter-image` both `HTTP/1.1 200 OK`,
  `content-type: image/png`.

### T7 — final verification (parent, inline)
- Parent fixes found during verification:
  - `a76b28c fix(seo): keep the og logo visible on the dark card` — the black line-art logo was nearly invisible on the
    dark OG card; now on a white badge. Checked by rendering `/opengraph-image` (200, `image/png`, 1200×630).
  - `eb94a76 fix(share): return focus to the share trigger when the dialog closes` — Esc left focus on `BODY` because the
    dialog is opened programmatically (no `DialogTrigger`); `useShare` now remembers the trigger and restores it via
    `onCloseAutoFocus` (falls back to Radix default when the trigger is gone, e.g. the closed mobile menu).
- Browser (dev server, fresh load, console clean after marker):
  - Dark theme, `/?mode=full#contact`: board at CASILLA 25; dialog input `http://localhost:3000/#contact` (mode stripped);
    QR box `rgb(255,255,255)`; `BarcodeDetector` decodes the QR to `http://localhost:3000/#contact`.
  - Light theme, `/?t=7#skills`: board at CASILLA 06; QR decodes to `http://localhost:3000/?t=7#skills`; Esc closes the
    dialog and focus returns to "Compartir".
  - Earlier checks (T2, T5b): hash-less load stays clean, replaceState keeps `history.length`, lite deep link scrolls,
    board ignores keys behind the dialog, mobile menu opens the dialog, 375px without horizontal scroll, PNG 1024×1024.
  - Head: `og:title`, `og:image`, `twitter:card=summary_large_image`, `twitter:image` present.
- Final checks: `pnpm test` 108/108; `npx tsc --noEmit` clean; `pnpm lint` 0 errors (pre-existing `<img>` warnings only);
  `pnpm build` green — `/` 106 kB First Load JS, `/opengraph-image` and `/twitter-image` static.
- Not verified here: a real phone's native share sheet (this browser has no `navigator.share`); scanning with a physical
  phone camera (decoded with `BarcodeDetector` instead).

## Review (RDD)
- Slice PR1 range `f65a194..2456022` (includes `2456022 chore: ignore gentle-ai skill registry cache`, added so
  the untracked `.atl/` registry no longer blocks candidate selection — user choice). Assessed: risk medium,
  473 lines, `review_due` slice_budget_reached. Consent granted by user.
- Lineage `review-6c49f58b4b6311e3`: one lens (reliability) → approved; acknowledgement burned authority.
  Reviewed boundary advances to `2456022`.
- Advisory, non-blocking findings (accepted as T2b because they contradict the "unknown hashes are ignored" constraint):
  - R3-unknown-hash-overwritten-on-mount (warning): a foreign fragment on load was rewritten to `#about`.
  - R3-shouldsync-unknown-hash-untested (warning): no test for a non-empty, non-stop hash on the initial stop.
  - R3-dom-hash-wiring-unasserted (suggestion): no test that `navigateToStop` uses replaceState, not pushState.
- Note: the T2 entry above describing a "skip the first effect run" ref is superseded by `d8ecd27`.

## Review (RDD) — slice PR2
- Range `2456022..74896e9` (T2b, T3–T5, T5b; includes `pnpm-lock.yaml`): risk medium, 1481 lines, `review_due`
  slice_budget_reached. Consent granted by user. Lineage `review-658a0b7d7c0b22b6`: one lens (reliability) →
  approved; acknowledgement burned authority. Reviewed boundary advances to `74896e9`.
- Advisory, non-blocking findings:
  - R3-stale-touch-start-after-ignored-touchstart (warning) — fixed in T5c (`4703ab4`): `tsc` clean, `pnpm test` 96/96, `pnpm lint` 0 errors.
  - R3-board-guard-wiring-unasserted (warning) — follow-up: no test for the `isModalOpen` selector / `closest('[role="dialog"]')` wiring; proven only by browser check.
  - R3-use-share-fallback-untested (suggestion) — follow-up: hook-level test for native → AbortError / other error → dialog.
  - R3-silent-share-and-png-failures (suggestion) — follow-up: surface "Más opciones" and PNG export failures in the aria-live region.
- Known limitation: a hash-only navigation performed while the dev page is still compiling (before the board mounts) can be lost; full loads with a hash work.

## Review (RDD) — slice PR3
- Range `74896e9..HEAD` (T5c, T6, OG logo fix, focus fix, docs): assessed risk medium, 395 lines, `review_due` false —
  `under_budget`. No review ran; no later commit is planned, so this slice stays unreviewed unless the user asks for one.
- Whole-branch candidate `f65a194..ae364c9` (25 files, 2335 lines, medium) offered by the stop hook: user declined
  (`declined_this_candidate`). No review record; delivery follows ordinary repository policy.

## Delivery slices (stacked-to-main)
PR2 of the original plan (~730 code lines) exceeded the 400-line budget, so one slicing pass split it at existing
commit boundaries, and T2b moved to the deep-link PR it belongs to. Every boundary passes `pnpm test` and `tsc --noEmit`.

| PR | Branch | Range | Code lines (with ODD log) | RDD |
|----|--------|-------|---------------------------|-----|
| [#4](https://github.com/jblancoh/barrilito-dev/pull/4) deep link | `claude/share-qr-01-deep-link` | `f65a194..c67e4f0` | 369 (533) | approved (`review-6c49f58b4b6311e3`; T2b in `review-658a0b7d7c0b22b6`) |
| [#5](https://github.com/jblancoh/barrilito-dev/pull/5) QR rendering | `claude/share-qr-02-qr-render` | `c67e4f0..9030dac` | 128 | approved (`review-658a0b7d7c0b22b6`) |
| [#6](https://github.com/jblancoh/barrilito-dev/pull/6) share dialog | `claude/share-qr-03-share-dialog` | `9030dac..5607375` | 324 | approved (`review-658a0b7d7c0b22b6`) |
| [#7](https://github.com/jblancoh/barrilito-dev/pull/7) share button | `claude/share-qr-04-share-button` | `5607375..74896e9` | 244 (396) | approved (`review-658a0b7d7c0b22b6`) |
| [#8](https://github.com/jblancoh/barrilito-dev/pull/8) link previews | `claude/page-share-qr-module-1f086f` | `74896e9..HEAD` | 303 (413+) | not reviewed |

Merge in order; after each merge, retarget the next PR to `main`.

## Follow-ups (not in scope)
- Tests for the DOM wiring: `isModalOpen`/`closest('[role="dialog"]')` board guard and `useShare` native → fallback paths (R3 advisories).
- Surface "Más opciones" and PNG export failures in the dialog's aria-live region (R3 suggestion).
- Pre-existing: the navbar hamburger button has no accessible name.
- Set `NEXT_PUBLIC_SITE_URL` in Vercel if the public domain differs from the project's production domain.

## Next step
Feature complete; PRs #4 to #8 are open. Merging is the user's decision.
