# Mobile touch controls

## Objective
Make the board comfortable on phones: a compact HUD card on narrow viewports and touch navigation that never rolls the die while the visitor scrolls to read.

## Problem
- The HUD card (`components/game/hud-status.tsx`) uses the desktop layout (`w-[232px]`, no responsive variants) and crowds the board and section panel on narrow viewports.
- Any vertical touch swipe > 50px called `api.forward()/back()` (`components/game/board-game.tsx`), so scrolling to read rolled the die.

## Decision
Touch navigation uses a horizontal swipe (left = roll, right = back); vertical gestures stay free for scrolling. Chosen by the user over "button only" and "swipe only on the board".

## Scope
- Pure swipe classifier + wiring in `board-game.tsx`.
- Compact HUD on `layout.narrow`, input-aware hint text.

## Constraints
- TDD: strict (global user config), runner `npm test` (vitest). Pure logic only; JSX layout verified in the browser.
- Keep desktop HUD and wheel behavior unchanged.
- Delivery strategy: ask-on-risk; forecast ~150 authored lines, single PR.

## Tasks
- [x] T1 — Horizontal swipe classifier (`components/game/touch-gesture.ts` + tests) wired into touch handlers. Route: inline (small, understood; 1 new pure module + 1 handler edit).
- [x] T2 — Compact HUD on narrow viewports + `inputHint(coarse)` helper with tests. Route: inline.

## Acceptance criteria
- Vertical swipes never change the square; a left swipe (>= 60px, horizontal-dominant, not starting at a screen edge) rolls, a right swipe goes back.
- On narrow viewports the HUD is a compact card that does not overlap the section panel.
- Touch devices show a swipe hint; pointer devices keep the scroll hint.

## Checks
- `npm test`, `npm run lint`, `npx tsc --noEmit`.
- Browser preview at mobile preset.

## Progress
- Created 2026-09-26 on branch `claude/mobile-instructions-box-104141` (base main@0841ecf).
- T1 done in `affcee4`: RED observed (module missing), GREEN 6/6. Review assess: medium, under_budget (pending in slice).
- T2 done in `ef1cc62`: RED observed (`inputHint is not a function`), GREEN 8/8. Review assess: medium, under_budget.

## Verification evidence
- `npm test`: 206/206 passed. `npx tsc --noEmit`: clean. `npm run lint`: only pre-existing warnings in untouched files.
- Browser (375x812, dark): compact HUD in one row, does not overlap the section panel; hint reads "Desliza ← tira · → regresa".
- Synthetic TouchEvents: vertical up on panel, vertical down on board, and edge swipe kept "Tu turno"; left swipe switched to "Avanzando…". Animation did not advance because the pane was `visibilityState: hidden` (rAF paused), not a code issue.
- Desktop: original card and scroll hint unchanged.
- Branch total vs base: 214 insertions, 45 deletions (includes this doc); single PR.

## Review
- Native review lineage `review-b4dc5a1cc0f97715` (medium, lens reliability) on affcee4..adae9a1: approved and acknowledged.
- Advisory follow-ups (non-blocking, not applied):
  - WARNING: horizontal swipes starting inside the panel now move the board; no panel content scrolls horizontally today (grep: no overflow-x/pre/table/carousel), so latent only.
  - SUGGESTION: ignore multi-touch gestures (pinch) or match Touch.identifier.
  - SUGGESTION: guard `matchMedia` / fall back to `addListener` for older Safari.
  - SUGGESTION: boundary tests at exactly 60px, 1.5x ratio, 24px edge.

## Next step
Push and open the PR when the user decides.
