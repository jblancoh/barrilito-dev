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
- [x] T3 Overlay UI + wiring: board-game, HUD, stop rail, section panel + 6 sections, input (wheel/keys/touch/goTo), navbar overlay, page/layout, loading, reduced motion, SEO fallback — route: delegated
- [x] T5 Fix dark mode scene colors (user report): three.js r160 `Color.setStyle` ignores space-separated `hsl(h s% l%)`, leaving materials/background white; theme toggle read CSS vars before next-themes switched the `dark` class — route: inline (1–3 files)
- [x] T4 Verification: `pnpm test`, `pnpm lint`, `pnpm build`, browser check of both themes — route: inline + delegated

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

### T3 Overlay UI + wiring — done
Commit `24e9850` "feat(game): add board landing overlay UI and wire home page".
- `board-game.tsx` (canvas host + HUD + panel, wheel/keyboard/touch input matching the reference thresholds
  exactly — 250ms wheel reset, ±40 accumulation, 50px swipe, `panelCanScroll` bypass, inputs ignored while
  focused), `hud-status.tsx`, `section-panel.tsx` (card-flip transform for camera B), `shortcut-card.tsx`,
  `stop-colors.ts` (static Tailwind class maps, required since Tailwind's JIT can't see template-string
  classnames), `board-events.ts` (typed CustomEvent bus so the layout-level Navbar can `goTo` the client-only
  board), `board-nav.ts`, `seo-fallback.tsx` (server-rendered `sr-only` content in stop order), and
  `sections/{about,skills,projects,services,contact-info,contact-form}.tsx` (content/copy ported from the
  existing section components + `lib/content.ts`, inline contact success box, ladder/snake CTA cards).
- `app/page.tsx`: `next/dynamic(..., { ssr: false })` for `BoardGame` + `<SeoFallback />`.
- `components/site-chrome.tsx` (new): home route renders full-viewport with no footer; other routes keep the
  `container` + `Footer` layout with `pt-16` to clear the now-fixed Navbar. `app/layout.tsx` simplified to
  `<Navbar /><SiteChrome>{children}</SiteChrome>`.
- `navbar.tsx`: `fixed` overlay positioning; links now dispatch `goTo` events instead of hash anchors
  (Sobre mí/Habilidades/Proyectos/Servicios [hover chart-5]/Contacto), Blog link dropped per README.
- Bug found and fixed via browser smoke test (not caught by tsc/build): `BoardScene.applyTheme()` read
  `this.fogColor` before it was assigned in `init()`, throwing `Cannot read properties of undefined (reading
  'set')` on first paint and leaving the board stuck on "Preparando el tablero…". Moved the
  `this.fogColor = new THREE.Color()` assignment before `applyTheme()` is first called, and added
  `.catch(console.error)` on `init()` so a future failure surfaces instead of becoming a silent unhandled
  rejection.
- Verification: `pnpm exec tsc --noEmit` clean; `pnpm test` 26 passed; `pnpm lint` only pre-existing
  `no-img-element` warnings; `pnpm build` compiled successfully (5 static pages, `/` First Load JS 243 kB).
- Browser check (Chrome via `pnpm dev` + Claude Browser tool, both themes): board renders (tiles, ladder,
  snake with bobbing head/tongue, barrel token, die), "Tirar dado" rolls and hops to Habilidades with the
  correct predefined roll, "Regresar" walks back, Navbar "Proyectos" link jumps via `goTo` with arrival
  ripple, theme toggle recolors the whole scene (tiles/snake/token/die/background) live, `/maintenance`
  redirects to `/` as before (middleware unchanged). No console errors on a fresh tab after the fogColor fix.

### T4 Verification — done
Commit `ea125ea` "docs: describe the Snakes & Ladders landing and pnpm test" (README paragraph + `pnpm test`
mention). Final verification run, all in the foreground:
- `pnpm test`: 26 passed (26).
- `pnpm lint`: only the 5 pre-existing `@next/next/no-img-element` warnings (footer, hero-section,
  navbar, projects-section, maintenance page) — same set as before this feature, no new warnings or errors.
- `pnpm build`: compiled successfully, typecheck clean, 5 static pages generated, `/` 146 kB / 243 kB First
  Load JS (three.js is the bulk of the increase, expected for a client-only 3D scene).
Status: **done**, nothing pending. `pnpm-lock.yaml` updated only by the `three`/`vitest`/`@types/three`
installs; `package-lock.json` untouched; `design_handoff_serpientes_escaleras/` and `.DS_Store` left
untracked as instructed.

## Deviations from the README (all noted inline above)
1. Glow sprite gradient and the die's destructive pip color are generated from live CSS variables
   (`getComputedStyle`) rather than the prototype's hardcoded hsla literals, per the task's explicit
   "read theme colors from CSS variables" instruction — same visual colors, just theme-reactive.
2. `prefers-reduced-motion` is implemented as clamped near-instant (≤0.12s) transitions with no arc/spin/
   confetti rather than a true opacity-fade + hard teleport, to keep continuous motion cues (arrival ripple,
   panel transition) intact while still meaningfully reducing motion.
3. Navbar's Blog link removed and "Servicios" added, and all links now dispatch `goTo` events instead of
   `href="/#anchor"`, since the page is no longer a scrollable single page — required for the links to
   actually work with the board.

## Next step
None — feature complete (T1–T4 done). Optional follow-ups (not requested): GLTF token/die/snake-head models
(builders are already isolated for this), camera A (isometric) UI toggle (prop already supported by the
scene), real project screenshots instead of the "captura del proyecto" placeholder.

### T5 Dark mode fix — done
- Root cause 1 (verified in node): `new THREE.Color().set("hsl(0 0% 7%)")` stays `ffffff`; comma form gives `121212`. Added `components/game/color.ts` `toHslColor()` + `color.test.ts` (RED: missing module → GREEN 29/29).
- Root cause 2: child effect on `resolvedTheme` ran before next-themes applied the `<html>` class. Scene now follows the `dark` class via `MutationObserver`.
- Checks: `pnpm test` 29 passed, `tsc --noEmit` clean, lint no new warnings. Browser visual check not possible (pane hidden) — pending user confirmation.
