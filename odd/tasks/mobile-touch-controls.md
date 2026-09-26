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
- [ ] T1 — Horizontal swipe classifier (`components/game/touch-gesture.ts` + tests) wired into touch handlers. Route: inline (small, understood; 1 new pure module + 1 handler edit).
- [ ] T2 — Compact HUD on narrow viewports + `inputHint(coarse)` helper with tests. Route: inline.

## Acceptance criteria
- Vertical swipes never change the square; a left swipe (>= 60px, horizontal-dominant, not starting at a screen edge) rolls, a right swipe goes back.
- On narrow viewports the HUD is a compact card that does not overlap the section panel.
- Touch devices show a swipe hint; pointer devices keep the scroll hint.

## Checks
- `npm test`, `npm run lint`, `npx tsc --noEmit`.
- Browser preview at mobile preset.

## Progress
- Created 2026-09-26 on branch `claude/mobile-instructions-box-104141` (base main@0841ecf).

## Next step
T1.
