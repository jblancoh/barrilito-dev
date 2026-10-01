# Referral Attribution

## Objective
Measure portfolio visits that arrive from client-site creator-credit banners, with one stable source identifier per client.

## Problem and Why
The portfolio already includes Vercel Web Analytics, but it does not currently identify which client banner referred a visitor. Native UTM reporting requires Web Analytics Plus or Enterprise; Vercel Pro includes custom events, so the implementation will use a gated custom event carrying the client source identifier.

## Scope
- Add a client-side tracker at the root layout boundary that recognizes valid referral query parameters and sends one `portfolio_referral` custom event with a sanitized client identifier.
- Keep the tracker disabled by default until the Vercel team has a plan that supports custom events; document the activation setting and per-client link format.
- Add focused unit tests and a short operator guide.

## Constraints
- No edits to client-owned websites; provide their banner URL format only.
- Do not collect personal data or arbitrary query values.
- Preserve the existing server-component root layout, `brief=1` behavior, and URL hash.
- Strict TDD is enabled by `AGENTS.md`; runner: `npm test` (`vitest run`).
- The user authorized implementation. Implementation route: delegated direct; mapping trigger fired because understanding crossed 4+ files; writer trigger fired because implementation spans multiple non-trivial files.
- Vercel Pro custom events support at most two properties and are usage-billed; no custom event should be emitted while the feature flag is off.

## Acceptance Criteria
- A well-formed client referral URL produces exactly one custom event per page load with only the safe client identifier.
- Missing, malformed, non-referral, or unsafe parameters produce no event.
- The feature flag defaults off and prevents event emission until explicitly enabled.
- Existing query/hash handling is not changed.
- Operator documentation includes a concrete client URL example and the Pro activation/test procedure.

## Tasks
- [x] **T1 — Track referral landings**: Added a pure parser/tracking boundary, root client tracker, and test-first coverage for valid, absent, malformed, and disabled inputs. Focused test passed: `npx vitest run lib/referral-attribution.test.ts` (7 tests).
- [x] **T2 — Document client setup and activation**: Added `docs/referral-attribution.md` with the stable link format, Pro/Enterprise activation and redeploy steps, dashboard verification, data boundary, and official Vercel references.

## Verification
- Focused tests: `npx vitest run lib/referral-attribution.test.ts` — passed (7 tests).
- Full tests: `npm test` — passed (24 files, 289 tests).
- Static checks: `npm run lint` — passed (0 errors; 12 pre-existing warnings outside the added files).
- Runtime/dashboard check: deferred until the Vercel Pro plan is active; before that, verify the disabled flag prevents custom-event calls.

Test setup note: initial `npm test` could not find the workspace Vitest binary because dependencies were absent. `npm ci` was blocked by the repository's existing package-lock/package.json mismatch. Installed test tooling locally without saving package metadata (`npm install --legacy-peer-deps --no-package-lock --ignore-scripts`, plus no-save Vite) and reran the required commands successfully.

## Delivery
- Feature branch: `jblancoh/feature-referral-attribution`.
- Delivery strategy: `ask-on-risk` (default); forecast approximately 180 authored changed lines, below the ~400-line planning budget.
- Planned work unit: one Conventional Commit containing tracker, tests, and operator documentation.

## Progress
- Exploration confirmed existing Analytics at `app/layout.tsx`, installed `@vercel/analytics` 2.x, and found that the contact form removes only `brief` while preserving other query params and hashes.
- T1 and T2 are complete. TDD observed the expected missing-module failure before implementation; focused tests, full tests, and lint now pass.

## Next Step
Record the final commit identity after creating the work-unit commit.

## Relevant Files
- `app/layout.tsx` — root server layout with existing Analytics component.
- `components/game/sections/contact-form.tsx` — existing consumer of `brief=1` query intent.
- `lib/project-brief.ts` and `lib/project-brief.test.ts` — query handling and pure helper test conventions.
- `lib/referral-attribution.ts` and `lib/referral-attribution.test.ts` — safe referral parsing, tracking boundary, and tests.
- `components/referral-attribution-tracker.tsx` — once-per-page client analytics tracker.
- `docs/referral-attribution.md` — link format, activation, verification, and data boundary.
