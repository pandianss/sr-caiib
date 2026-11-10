# Project execution state

Last updated: 11 November 2026, session 3. Completion is **blocked** on teaching-source access (see Blockers).

## Scope and decisions

- Product specification revision: `docs/product-spec.md`, 10 November 2026 (autonomous full-project delivery).
- Platform: greenfield, none specified → mobile-first TypeScript PWA (React 19, Vite 7, IndexedDB) plus a
  minimal Node backend (built-ins only: `node:http`, `node:sqlite`, `node:crypto`).
- Target session: **CAIIB December 2026** (`CAIIB-2026-DEC`), verified from IIBF's "CAIIB Rules & Syllabus 2026":
  100 questions / 100 marks (IIBF may vary the count), 2 hours, no negative marking, pass mark 50, calculator
  policy. Exam dates 6-27 Dec 2026 from the IIBF CAIIB page. Regulatory cut-off 30 June 2026 is **derived from the
  document's general rule**; its example table still shows 2025 sessions.
- Repository: `D:\projects\sr-caiib`, own git repo, branch `main`. Author identity copied from the parent
  `D:\` repo's history (`pandianss`, GitHub no-reply address) as local config.
- Source access available: four official IIBF documents fetched with owner approval on 10 Nov 2026 and
  recorded in `content/sources/registry.json` (URLs, SHA-256, facts taken, open points). Local copies are in
  `content/sources/iibf/` and are not committed. Razorpay's public docs were read. **No teaching sources**
  (NotebookLM notebook or textbook PDFs) are accessible.
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
| Original full-syllabus content | blocked | Official baseline now established for all nine papers (276 topics). 0 objectives, 0 lessons, 0 questions authored: no teaching sources. |
| Release readiness | blocked | Needs content and provider sandbox verification. Exam configuration is verified. |
| Live launch | pending | Owner action; not started. |

## Acceptance matrix

Evidence key: **T** = automated test, **B** = observed in the running app in the browser pane (Chromium,
synthetic fixtures), **A** = `scripts/ui-audit.js` measured on the rendered DOM.

| Area | Status | Evidence | Remaining |
| --- | --- | --- | --- |
| Paper isolation | passed | T `storage-session` "paper isolation"; B paper switch BFM/CB | — |
| Elective changes | passed (logic) | B elective chips keep history; unfinished session in another paper shown on Today with Resume | Not re-tested with real packs |
| Coverage ledger | in_progress | `npm run content:build` reconciles ledger ↔ catalogue (276 official topics in 44 modules/appendices, 0 objectives) and fails on mismatch or on a source-fingerprint mismatch | No objectives or published items yet |
| Visual coverage map | passed for current data | B `#/coverage`: "0 of 276 official topics are reviewed and published", each paper "Syllabus verified" with its own denominator (BRBL 64), drill-down shows official scope, the exact gap and plain-type-heading notes; learner state separate. The earlier "baseline incomplete" state was observed before the syllabus was loaded | Standalone HTML export not regenerated |
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

- Source registry: `content/sources/registry.json`.
  - `IIBF_CAIIB_RULES_SYLLABUS_2026`: "CAIIB Rules & Syllabus 2026", 29 pages, PDF dated 23 Feb 2026,
    sha256 `038c859f…99c9`, linked from the official CAIIB page. Covers all nine papers.
  - `IIBF_CAIIB_PAGE_SCHEDULE_2026`: exam dates for the May/June and December 2026 sessions.
  - `IIBF_NOTICE_QUESTIONS_WITHOUT_OPTIONS_2023`: numerical-answer rules (digits, minus, decimal point only;
    one mark each; rounding examples).
  - `IIBF_NOTICE_CUTOFF_GUIDELINES`: older notice showing the same cut-off pattern.
- Baseline `IIBF-CAIIB-RULES-SYLLABUS-2026` (`content/syllabus/caiib-2026.json`, produced by
  `scripts/extract-syllabus.mjs`): 41 modules + 3 appendices, **276 topics**: ABM 32, BFM 31, ABFM 25, BRBL 64,
  CB 19, RM 40, ITDB 20, HRM 25, RB 20.
- How it was checked: headings by font size; 5 plain-type headings inferred and flagged on the topic (3 by
  paragraph structure, 2 by reading the page via an override list tied to the file's hash); elective results
  compared with the kit's independent hand-checked 2025 transcription: 123 of 124 titles identical, the other
  differing only in the name given to an unheaded appendix list. **Review method: automated plus spot reading
  by the agent. Not proofread line by line by a person.**
- Official topic denominator: 276. Editorial objectives: 0. Drafted / reviewed / published: 0 / 0 / 0.
- Open source points: the cut-off for December 2026 is derived from the general rule (no 2026 table); the
  numerical notice gives rounding examples but no rule for an exact tie, so authored numericals must avoid tie
  cases until confirmed; `visual-map/source-data.json` (2025 booklet) is superseded and unused by the build.
- Next content cursor: derive editorial objectives for the first unit of each paper once teaching sources are
  available, then batch 1 per `docs/prompts/notebooklm-extraction.md`.

## Verification log

| Check | Environment | Command or interaction | Outcome | Limitations |
| --- | --- | --- | --- | --- |
| Full check | Windows 11, Node 24.21.0 | `npm run check` | types ok, lint 0 problems, 163 tests pass (110 kit, 39 engine, 14 backend) | Synthetic data; payments simulated |
| Release build | same | `npm run build` | dist/ built, 11 files precached, 0 published packs | — |
| Fixture build | same | `npm run build:fixtures` | dist-fixtures/ built, 15 files precached | Not a release artefact |
| Rendered UI audit | Browser pane (Chromium), dev server, fixtures | `window.__audit(routes, {theme, textScale})` from `scripts/ui-audit.js` | 0 findings at 320, 375, 1280 px; light/dark; 200% text. Two real defects found and fixed first: bottom nav overflow at 200% text, worked-step overflow at 200% text | 200% emulated via root font size; audit self-checked with injected bad elements |
| Journeys | same | Scripted clicks on the real DOM | onboarding → lesson → reload/resume → practice → mock → expiry; paywall → sign-in → pending → verified → refund | Driven by script, not by hand; few screenshots (pane was often hidden) |
| Offline | Browser pane, `vite preview` of dist-fixtures | Load, stop server, reload, study | Worked after fixing a service-worker `Vary` bug found by this test | Desktop only |
| Syllabus extraction | Windows 11, Node 24.21.0 | `node scripts/extract-syllabus.mjs content/sources/iibf/caiib-rules-syllabus.pdf content/syllabus/caiib-2026.json` | 9 papers, 276 sections, 0 issues, 10 notes; elective cross-check 123/124 | Automated; not human-proofread |
| Razorpay documentation check | WebFetch, 11 Nov 2026 | Standard Checkout integration steps and webhook validation pages | Orders endpoint, Basic auth, paise amounts, 40-char receipt, handler fields, `order_id|payment_id` HMAC-SHA256 hex using the server's order id, raw-body webhook HMAC, `x-razorpay-event-id`, unordered delivery: all match `server/payments.ts`. Added the mandatory `amount`/`currency` checkout options | Reading docs is not sandbox verification; refund status values are not covered by those pages |
| Full check after baseline | same | `npm run check` | 163 tests pass, lint clean | — |
| Provider sandbox, screen reader, phone hardware, clean clone | — | — | not_run | — |

## Blockers

| Dependency | Affected | Attempts | Independent work left | Minimum action |
| --- | --- | --- | --- | --- |
| Teaching sources (NotebookLM notebook or authorized PDF exports of the IIBF books) | Every objective, lesson and question, all nine papers | None possible without access; banking facts are not written from memory | None | Sign in to NotebookLM in the browser pane, or place exports in `content/sources/books/` |
| Razorpay test keys + support/refund text | Provider sandbox verification | Adapter checked against current docs and a local stand-in | None | Put test keys and `SUPPORT_TEXT` in a local `.env` (not in chat or git) |
| A person to proofread the syllabus extraction (recommended, not blocking) | Confidence in the 276-topic denominator | Automated cross-checks done | — | Compare `content/syllabus/caiib-2026.json` titles with the PDF, especially the 5 flagged headings |

## Resume instruction

- Last completed logical unit: official baseline and exam configuration loaded; all checks green; committed.
- Nothing is half-edited.
- Exact next action when teaching sources are available: source inventory (Prompt A) → derive objectives into
  `content/objectives/<PAPER>.json` → author batch 1 → import with `npm run import:staging` → review → publish
  wrapper into `content/packs/` → `npm run content:build`.
- Still possible without owner input: clean `npm ci` clone test; optional standalone coverage-map export.
- Run: `npm run dev:fixtures` (http://localhost:5173) and `npm run server` (http://localhost:8787).
- To refresh the baseline from a newer IIBF PDF: update the registry entry and rerun
  `scripts/extract-syllabus.mjs`; the build refuses a syllabus whose hash differs from the registry.
