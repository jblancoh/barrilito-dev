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
- [ ] T1 `lib/share.ts`: `buildShareUrl`, `getShareStrategy`, `parseStopHash` with vitest (RED→GREEN) — route: delegated (writer trigger: 2+ files, preparation reading)
- [ ] T2 Board deep link: initial stop from `location.hash`, `replaceState` on stop change, invalid hash ignored; verify lite `/#projects` — route: delegated (same writer as T1)
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
_(none yet)_

## Next step
T1–T2 (slice PR1), delegated to one writer.
