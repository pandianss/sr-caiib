# Project execution state

Last updated: 10 November 2026, end of session 2. Completion is **blocked** on source access (see Blockers).

## Scope and decisions

- Product specification revision: `docs/product-spec.md`, 10 November 2026 (autonomous full-project delivery).
- Platform: greenfield, none specified → mobile-first TypeScript PWA (React 19, Vite 7, IndexedDB) plus a
  minimal Node backend (built-ins only: `node:http`, `node:sqlite`, `node:crypto`).
- Target session: CAIIB 2026 — **exam rules, question count, passing rule and regulatory cutoff not verified**.
  The app carries the session as `status: unverified`, so release builds offer no timed mock or pass/fail.
- Repository: `D:\projects\sr-caiib`, own git repo, branch `main`. Author identity copied from the parent
  `D:\` repo's history (`pandianss`, GitHub no-reply address) as local config.
- Source access available: only `visual-map/source-data.json` (2025 elective booklet transcription).
  No NotebookLM access, no PDFs, nothing fetched from IIBF or Razorpay.
- Consequential decisions:
  - Kit contents copied to the repo root and kept byte-identical; `caiib-agent-kit/` untouched and git-ignored.
  - UI components are hand-built on Material 3 token roles (`src/app/styles.css`); there is no maintained
    React Material 3 library. Static light/dark palettes; no dynamic colour.
  - Offline entitlement tokens are ES256 (P-256) compact JWS for universal WebCrypto support.
  - Account recovery is email + one-time code. Production needs an HTTP mail endpoint.
  - One active pack per paper. A "full" pack is used only with a valid entitlement; `free_unit_ids` stay open.
  - Policies documented in code: `GRADING_POLICY_V1` (`src/core/grading.ts`), `SM2_V1` (`src/core/sm2.ts`),
    `EVIDENCE_POLICY_V1` (`src/core/evidence.ts`). Reading speed 180 wpm and 72 s planning pace are estimates.
  - Mock expiry auto-submits saved answers; unanswered score zero. This is a product behaviour pending the
    verified official instruction.
  - Practice re-answers of an item already answered are recorded with `answer_was_revealed_prior: true`.
  - Bottom-navigation labels are capped near 130% at 200% text so four destinations stay visible.
  - In development with simulated payments only, one synthetic fixture paper (CB) is marked pass-only so the
    lock, checkout, restore and refund screens can be exercised. Release builds contain no fixtures.
  - Test price ₹399 / 6 months is a configurable proposal, not an approved offer. Support/refund text is
    required configuration (`SUPPORT_TEXT`) before Razorpay can be enabled.
- Optional backlog: Google Play Billing route, standalone HTML export of the coverage map from the ledger,
  CMS, dynamic colour, per-question idle detection finer than the 10-minute cutoff.

## Delivery status

| Dimension | Status | Evidence or remaining condition |
| --- | --- | --- |
| Implementation | in_progress (feature-complete against synthetic content) | All screens, engine, storage, backend and service worker exist and are tested. Not yet exercised with real published content, a real payment provider, a screen reader or a physical phone. |
| Original full-syllabus content | blocked | 0 objectives, 0 lessons, 0 questions authored. Compulsory syllabus missing; elective outline provisional. |
| Release readiness | blocked | Needs content, verified exam configuration and provider sandbox verification. |
| Live launch | pending | Owner action; not started. |

## Acceptance matrix

Evidence key: **T** = automated test, **B** = observed in the running app in the browser pane (Chromium,
synthetic fixtures), **A** = `scripts/ui-audit.js` measured on the rendered DOM.

| Area | Status | Evidence | Remaining |
| --- | --- | --- | --- |
| Paper isolation | passed | T `storage-session` "paper isolation"; B paper switch BFM/CB | — |
| Elective changes | passed (logic) | B elective chips keep history; unfinished session in another paper shown on Today with Resume | Not re-tested with real packs |
| Coverage ledger | in_progress | `npm run content:build` reconciles ledger ↔ catalogue (124 elective topics, 0 objectives) and fails on mismatch | No published items exist to map |
| Visual coverage map | passed for current data | B `#/coverage`: nine papers, "Baseline incomplete: total … unknown", no percentage, compulsory papers "Syllabus missing", drill-down shows exact gap; learner state separate | Standalone HTML export not regenerated (kit's planning map kept) |
| Syllabus completion | blocked | — | Sources |
| Original authorship | blocked | — | No content yet |
| Source trust | passed (mechanism) | T pack verification rejects unpublished/synthetic as published; build rejects invalid packs | No real items |
| Exam context pinning | passed (logic) | T attempts pin pack/config version; old pack retained while pinned | — |
| Navigation | passed | B start short session, find formula, change paper, resume after reload | — |
| Answer behaviour | passed | T grading suite; B empty/comma/unit input rejected with messages, explicit Submit, feedback after | — |
| Case studies | passed | B scenario pane open beside/above each question; 4 independent questions | — |
| Offline study | passed (desktop Chromium) | B `dist-fixtures` build: server stopped, page reloaded, resumed lesson, self-check, quiz and results all worked from cache + IndexedDB | Not tested on a phone or in airplane mode as such |
| First use | passed | B onboarding lists exactly what is available; release build states nothing is published | — |
| Persistence | passed | T IndexedDB restart test; B reload mid-lesson restored answered state and "Resumed" notice | — |
| Downloads | passed (logic) | T truncated/corrupt/mismatched/incompatible packs rejected, atomic activation, rollback, pinning | Download-failed UI seen only via tests, not provoked in browser |
| Synchronisation | passed (local server) | T duplicate upload → one event, foreign events rejected; B sign-in then "Progress is synced" | — |
| Mock timing | passed | T deadline math; B timer 19:52 → 19:45 across reload, forced deadline → reopened as "Time expired", stamped at deadline | — |
| Mastery evidence | passed | T first exposure, repeats, CRI ≥20 rule, weak-area ≥10 rule; B Performance shows "Insufficient evidence" | — |
| Accessibility | partially passed | A: zero findings for overflow, <48px targets, contrast <4.5:1, unnamed controls on 18 routes + lesson, case and feedback states at 375px light/dark and 200% text; B dialog focus trap, Escape, focus return, arrow-key tabs, skip link, landmarks | **No screen-reader run** (NVDA/TalkBack) and no manual keyboard pass by a person |
| Adaptive layout | passed (emulated) | A zero findings at 320×640, 375×812 and 1280×800 (rail + split case layout) | On-screen keyboard and device insets not tested on hardware |
| Interaction completeness | passed for exercised paths | B every control used in the flows above | Razorpay checkout window path never executed |
| Commerce: ledger | passed (LOCAL SIMULATION) | T `tests/server/commerce.test.ts` (14 tests); B fail, cancel, pending, app closed + server restart, verified, refund → relocked | Simulation is not provider evidence |
| Commerce: offline entitlement | passed | T counterfeit, wrong account, lease, expiry, rollback, bounded finish; B real WebCrypto verification unlocked the unit | — |
| Commerce: provider sandbox | **blocked** | — | Owner's Razorpay test keys; then run the checklist in `docs/operations.md` |
| Build, type, lint, tests | passed | `npm run check` → 163 tests pass, 0 lint problems; `npm run build` ok; `npm audit --omit=dev` 0 vulnerabilities | — |
| Clean setup reproduction | not_run | — | `npm ci` on a fresh clone not yet tried |

## Source and content checkpoint

- Source inventory: `caiib syllabus.pdf` (elective booklet, "Rules & Syllabus 2025", sha256 `3a45f14f…5590`
  per the kit's transcription); session applicability unconfirmed.
- Baseline `IIBF-ELECTIVES-2025-BOOKLET-PROVISIONAL`: 27 modules/appendices, 124 units (123 named sections +
  1 editorial container) across CB, RM, ITDB, HRM, RB. ABM, BFM, ABFM, BRBL: missing.
- Official topic denominator: unknown. Editorial objectives: 0. Drafted / reviewed / published: 0 / 0 / 0.
- Ledger: generated at build into `public/content/coverage.json` from `visual-map/source-data.json` +
  `content/objectives/*.json` + `content/ledger/*.json` (the last two do not exist yet).
- Next content cursor: after sources are available — verify exam config and cutoff, add compulsory baselines,
  then batch 1 = first unit of the learner-featured elective.
- Outstanding findings: Razorpay protocol details and all IIBF exam facts are unverified against live sources.

## Verification log

| Check | Environment | Command or interaction | Outcome | Limitations |
| --- | --- | --- | --- | --- |
| Full check | Windows 11, Node 24.21.0 | `npm run check` | types ok, lint 0 problems, 163 tests pass (110 kit, 39 engine, 14 backend) | Synthetic data; payments simulated |
| Release build | same | `npm run build` | dist/ built, 11 files precached, 0 published packs | — |
| Fixture build | same | `npm run build:fixtures` | dist-fixtures/ built, 15 files precached | Not a release artefact |
| Rendered UI audit | Browser pane (Chromium), dev server, fixtures | `window.__audit(routes, {theme, textScale})` from `scripts/ui-audit.js` | 0 findings at 320, 375, 1280 px; light/dark; 200% text. Two real defects found and fixed first: bottom nav overflow at 200% text, worked-step overflow at 200% text | 200% emulated via root font size; audit self-checked with injected bad elements |
| Journeys | same | Scripted clicks on the real DOM | onboarding → lesson → reload/resume → practice → mock → expiry; paywall → sign-in → pending → verified → refund | Driven by script, not by hand; few screenshots (pane was often hidden) |
| Offline | Browser pane, `vite preview` of dist-fixtures | Load, stop server, reload, study | Worked after fixing a service-worker `Vary` bug found by this test | Desktop only |
| Provider sandbox, screen reader, phone hardware, clean clone | — | — | not_run | — |

## Blockers

| Dependency | Affected | Attempts | Independent work left | Minimum action |
| --- | --- | --- | --- | --- |
| Official IIBF documents (compulsory syllabus, session rules, cutoff notice) | Baseline for 4 papers, exam configuration, mocks in release, CRI denominator | None fetched: owner approval for fetching was promised first | None of substance | Say "yes, fetch from iibf.org.in", or drop the PDFs into `content/sources/` |
| Teaching sources (NotebookLM notebook or authorized PDF exports) | Every lesson and question, all nine papers | None possible without access | None | Sign in to NotebookLM in the browser pane, or place exports in `content/sources/` |
| Razorpay test keys + support/refund text | Provider sandbox verification | Adapter and local stand-in tests only | None | Put test keys in a local `.env` (not in chat or git) |

## Resume instruction

- Last completed logical unit: full application verified against fixtures; docs written; all checks green.
- Nothing is half-edited.
- Exact next action when sources are approved: fetch and record the official CAIIB rules/syllabus and
  cutoff notice → fill `content/exam-contexts.json` (verified config) → extend `scripts/build-content.mjs`
  inputs with compulsory baselines → start authoring batch 1 per `docs/prompts/notebooklm-extraction.md`.
- Also still to do without owner input: re-check Razorpay's current documentation against `server/payments.ts`
  (web research, part of the same approval), try a clean `npm ci` clone, optional standalone map export.
- Run: `npm run dev:fixtures` (http://localhost:5173) and `npm run server` (http://localhost:8787).
