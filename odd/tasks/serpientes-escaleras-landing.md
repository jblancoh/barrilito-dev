# Feature: Snakes & Ladders landing

Locator: `odd/tasks/serpientes-escaleras-landing.md` · Engram mirror: `odd/serpientes-escaleras-landing/tasks`
Branch: `jblancoh/feat-serpientes-escaleras` (base `main` @ b4e1448)

## Objective
Replace the single-page home with the isometric three.js Snakes & Ladders landing described in
`design_handoff_serpientes_escaleras/README.md` (reference prototype: `Serpientes y Escaleras.dc.html`).

## Why
User-requested redesign: game-like landing where each scroll tick rolls a predefined die and the
barrel token hops to the next section square; section content shows in an overlay panel.

## Scope
- `components/game/*` (board-game, use-board-scene, board-config, hud-status, section-panel, sections/*)
- `lib/content.ts` shared skills/projects data; `app/page.tsx`, `app/layout.tsx`, navbar overlay, Geist Mono font, Tailwind `chart5`
- Deps: `three`, `@types/three`; dev `vitest` for pure board logic

## Constraints
- Next.js 14 App Router, React 18, Tailwind 3, shadcn/ui, lucide-react, next-themes. Package manager: pnpm.
- No new colors: tokens from `app/globals.css`. Camera B (token cam) default, A available via prop.
- Respect `prefers-reduced-motion`, SEO DOM fallback, dispose GPU resources, DPR ≤ 2.

## TDD
Mode: strict (source: user global CLAUDE.md "Strict TDD Mode: enabled"). Runner: none existed → adding `vitest` (`pnpm test`) for pure board logic; 3D scene / DOM verified by build, lint and browser check.

## Delivery
Strategy: single branch, work-unit commits, push (user request). No PR requested.

## Tasks
- [x] T1 Foundations: deps, vitest, Tailwind chart5, Geist Mono, `lib/content.ts`, `board-config.ts` + pure path logic with tests — route: delegated (writer trigger, 2+ files)
- [x] T2 three.js scene hook `use-board-scene.ts` (board, tiles, ladders, snakes, token, die, cameras A/B, anim queue, theme, dispose) — route: delegated
- [ ] T3 Overlay UI + wiring: board-game, HUD, stop rail, section panel + 6 sections, input (wheel/keys/touch/goTo), navbar overlay, page/layout, loading, reduced motion, SEO fallback — route: delegated
- [ ] T4 Verification: `pnpm test`, `pnpm lint`, `pnpm build`, browser check of both themes — route: inline + delegated

## Acceptance criteria
- Scroll/keys/touch/nav advance stop-by-stop with predefined rolls 5,6,6,4,3; back walks without die.
- Ladders 2→22, 15→25 and snakes 24→12, 21→1 rendered and usable via goTo paths.
- Panel content matches handoff copy; contact form shows inline success.
- Theme toggle recolors scene. Build and lint pass.

## Progress / evidence

### T1 Foundations — done
Commit `6e8a057` "feat(game): add board config and pure path logic".
- Added `three@0.160.1`, `@types/three@0.160.0`, `vitest@5.0.1`; `pnpm test` script → `vitest run`.
- Tailwind: `chart5: hsl(var(--chart-5))` + `fontFamily.mono` reading `--font-geist-mono`.
- `app/layout.tsx`: `next/font/local` loads `app/fonts/GeistMonoVF.woff` as `--font-geist-mono`, applied on `<body>`.
- `lib/content.ts`: skills, projects, services, socialLinks, contactInfo (schedule as array). Existing
  `skills-section.tsx`, `projects-section.tsx`, `hero-section.tsx`, `contact-section.tsx` now import from it
  (no more inline duplicated data).
- `components/game/board-config.ts` + `board-config.test.ts` (26 tests): STOPS/LADDERS/SNAKES/FACE_ROTATIONS,
  boustrophedon `squareToGrid`/`squareToWorld`, `rollForStop`/`PREDEFINED_ROLLS` ([5,6,6,4,3]),
  `forwardPath`/`backPath`/`goToPath`/`shortcutPath`.
- TDD evidence: wrote test file first, ran `pnpm test` → RED (`Cannot find module './board-config'`), implemented
  `board-config.ts`, ran again → GREEN (26/26 passed).
- Verification: `pnpm test` 26 passed; `pnpm lint` only pre-existing `no-img-element` warnings, no errors;
  `pnpm build` compiled successfully (`✓ Compiled successfully`, 5 static pages).

### T2 Scene — done
Commit `5ed1981` "feat(game): add three.js board scene".
- `components/game/use-board-scene.ts`: `BoardScene` class (renderer antialias/DPR≤2/PCFSoft, hemi+directional
  lights, 80×80 shadow ground, slab, 25 canvas-textured tiles, ladders as cylinder rungs, snakes as tapered
  vertex-colored tubes with bobbing head/tongue, barrel token with atom+glow sprite, 6-face canvas die),
  animation queue (roll/hop/ladder-climb/snake-slide/arrive), ripple + confetti fx, cameras A (ortho iso) and
  B (perspective token cam, default) with panel-aware look-target shift, `applyTheme(dark)` reading live CSS
  variables via `getComputedStyle` (no hardcoded palette table), resize via `ResizeObserver`, prefers-reduced-motion
  handling (clamped near-instant durations, no arcs/spins, confetti skipped), and `dispose()` walking the scene
  graph to free geometries/materials/textures + renderer + observers.
- Thin `useBoardScene(hostRef, options)` React hook wraps the class, exposing `{ api: {forward, back, goTo,
  shortcut, isBusy, getLockUntil}, state, layout }`.
- Deviation from README: glow sprite gradient and die's destructive pip color are generated from the live
  palette instead of the prototype's hardcoded hsla literals, so they react to the actual active CSS variables
  (same visual colors, just theme-reactive) — required by the task's "read theme colors from CSS variables" guidance.
- Verification: `pnpm exec tsc --noEmit` clean; `pnpm test` 26 passed (unchanged); `pnpm lint` only the pre-existing
  `no-img-element` warnings; `pnpm build` compiled successfully, 5 static pages (scene not yet wired into a page).

## Next step
T3 — overlay UI + wiring (`board-game.tsx`, HUD, section panel, sections, page/layout).
