# Project execution state

Last updated: 12 November 2026, session 6. Authoring model switched from Fable 5.2 to Sonnet 5.5 at the owner's request (batch 4 onward); nothing in the process depends on the model. Content authoring is **unblocked for five papers** (171 topics); the other four electives (105 topics) have no courseware. Completion remains blocked on those books, provider sandbox keys and the sheer volume of authoring still to do.

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
  `content/sources/iibf/` and are not committed. Razorpay's public docs were read. The owner's notebook is accessible in the
  browser pane after owner sign-in (session 4); see `content/sources/notebook-inventory.md`. It holds five
  courseware files that each **stop at about printed page 180**, and no courseware for RM, ITDB, HRM or RB.
  On 11 Nov 2026 the owner placed the **complete PDFs** of those five books in `content/sources/books/`
  (scans, no text layer; registry entries S01–S05). They are read by rendering pages to images with
  `scripts/render-page.mjs`. These PDFs, not the notebook, are now the working source.
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
| First published content | done (small) | Pack `BFM-2026DEC` v6 (12 Nov 2026): 41 items (20 cards incl. 7 worked examples and 2 formula cards, 21 questions) for part of one BFM topic, free sample. Objectives published and complete: 4 of 7 in that topic (LO_02, LO_03, LO_04, LO_06); remaining LO_01 (FEMA card held back), LO_05 (RBI internal controls not checked), LO_07 (FEDAI, held back); topics complete: 0 of 276. Published on the authoring agent's review alone by owner decision of 11 Nov 2026. Seen working in the app: lesson, self-check, sources, practice, short mock. |
| Implementation | in_progress (feature-complete against synthetic content) | All screens, engine, storage, backend and service worker exist and are tested. Not yet exercised with real published content, a real payment provider, a screen reader or a physical phone. |
| Original full-syllabus content | in_progress, mostly blocked | 276-topic baseline. Batch `BFM-A-U01-B001`: 7 editorial objectives, now 12 draft items in two batches (6 cards, 6 questions) as **drafts** (source and originality review pending). 0 topics drafted adequately, 0 reviewed, 0 published. Courseware on disk for ABM, BFM, ABFM, BRBL, CB (171 topics); 105 topics in RM, ITDB, HRM, RB have no source. |
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
- How it was checked: headings by font size; 6 plain-type headings inferred and flagged on the topic (4 by
  paragraph structure, 2 by reading the page via an override list tied to the file's hash); elective results
  compared with the kit's independent hand-checked 2025 transcription: 123 of 124 titles identical, the other
  differing only in the name given to an unheaded appendix list. **Review method: automated plus spot reading
  by the agent. Not proofread line by line by a person.**
- Official topic denominator: 276. Editorial objectives: 7 (all in `BFM::MOD_A::U01`). Topics adequately
  drafted / assessed / reviewed / published: 0 / 0 / 0 / 0. Papers with courseware on disk: ABM, BFM, ABFM,
  BRBL, CB (`content/sources/availability.json`); 105 topics blocked for want of a source.
- Notebook inventory: `content/sources/notebook-inventory.md` (as reported by the notebook's model).
- Latest batch: `content/batches/BFM-A-U01-B001/` (staging, import config, draft bundle, review record).
  6 draft items: statute card, concept card, worked example, 2 choice questions, 1 numerical. Calculations
  recomputed independently in `tests/content/batch-calculations.test.ts` (pass). After the full PDF arrived,
  16 pages were **read directly**: 10 of 11 facts confirmed as worded, one is an inference (flagged); originality
  compared with the book's ten worked examples and self-test questions, and one more question (D006) redesigned.
  Still pending: applicability at the cut-off against primary sources, and any independent or human review.
  The reviewer so far is the authoring agent.
- Open source points: the cut-off for December 2026 is derived from the general rule (no 2026 table); the
  numerical notice gives rounding examples but no rule for an exact tie, so authored numericals must avoid tie
  cases until confirmed; `visual-map/source-data.json` (2025 booklet) is superseded and unused by the build.
- Batch `content/batches/BFM-A-U01-B002/`: 6 more draft items (participants card, forward-rate formula card,
  cross-rate worked example, 1 choice question, 2 numericals), written from pages read directly; calculations
  recomputed in `tests/content/batch-b002.test.ts`. Draft items in total: 12, all in `BFM::MOD_A::U01`.
- Published: `content/packs/BFM-2026DEC.json` from `content/publish/BFM-2026DEC-v1.json` via
  `scripts/publish-pack.mjs` (review method `automated`, reviewer = authoring agent). Held back: the FEMA
  definition card (B001 D001); India Code did not respond, and a search result suggests the Act has more
  sub-clauses than the courseware quotes. Topics published and complete: still 0 of 276.
- Batch `content/batches/BFM-A-U01-B003/` (12 Nov): value dates, factors, customer forward rate, three questions;
  published in pack v2 (`content/publish/BFM-2026DEC-v2.json`).
- Batch `content/batches/BFM-A-U01-B004/` (12 Nov, Sonnet 5.5): front/mid/back office, five dealing-room risks, settlement vs pre-settlement worked example, 3 questions; pack v3 (`content/publish/BFM-2026DEC-v3.json`). A numerical slip in the book's settlement-risk illustration was found and reported in the review record.
- Batch `content/batches/BFM-A-U01-B005/` (12 Nov): forwards vs futures, options, importer call-option example, swap net-payment numerical, 3 questions; pack v4 (`content/publish/BFM-2026DEC-v4.json`).
- Batch `content/batches/BFM-A-U01-B006/` (12 Nov): swap types, funds and currency positions, net-position worked example, integrated treasury; pack v5 (`content/publish/BFM-2026DEC-v5.json`). Known weakness: question D006 has an all-opposites distractor set.
- Batch `content/batches/BFM-A-U01-B007/` (12 Nov): FEDAI Rules 1 and 6 as 6 **draft items, held back** (not in any publish spec; enforced by a test) because FEDAI's current rulebook could not be retrieved. Release condition in its `review.md`.
- Batch `content/batches/BFM-A-U01-B008/` (12 Nov): option pricing elements, indirect-quote conversion, integrated-treasury question; pack v6 (`content/publish/BFM-2026DEC-v6.json`). B006 D006 remains published with a known weak distractor set; B008 D006 covers the same fact better. A retire/revise step for published items is not built.
- Gap closure (15 Nov 2026, pack v34 = 519 items, 276 tests passing): every Module A objective (45) now has no open gap and no held item. Closed in `BFM-A-U01-B009` (FEDAI Rules), `-U01-B010` (FEMA Act, dealing room controls, NOOPL/AGL), `-U06-B003` (Non-Debt Instruments Rules and remittance of assets), `-U05-B007` (export and import controls, trade credit), `-U06-B004` (ECB reporting and conversion), `-U02-B004` (travel exchange, overseas investment), `-U03-B005` (assessment), `-U04-B006` (Guarantees Regulations 2026, credit flow). Held items superseded or withdrawn: U01-B001 D001, U04-B004 D006 and D016, U05-B005 D008 and D019, U06-B002 D005. Coverage: 6 of 276 topics (all BFM Module A) now count as published; before this pass the count was 0 because a topic counts only when every objective has no gap, adequate teaching and assessment, and passed reviews.
  Evidence limits that remain (recorded as `source_caveats` in the ledger, shown on the coverage screen, not as open gaps): the Non-Debt Instruments Rules and Overseas Investment Rules texts are secondary reproductions; ICC texts (UCP 600, URR 725, ISBP 745, Incoterms, ISP 98) were not retrieved; the RBI directions of 16 Jan 2026 (in force 1 Oct 2026) and the Reporting Master Direction No. 18 were not retrieved in substance; several RBI pages are post-cut-off updates. All reviews are by the authoring agent (owner accepted agent review). Coverage 'drafted' for U05 stays false because LO_10 is a case study taught by worked examples with no concept card.
  Update (15 Nov 2026, pack v38 = 647 items, 287 tests): Module A units 7 to 10 are now authored in `BFM-A-U07-B001`, `-U08-B001`, `-U09-B001` and `-U10-B001` (courseware printed pp. 184-266 = PDF pp. 201-283), with courseware-vs-primary differences recorded in review notes (IFSCA Banking Regulations as amended July 2023; Current Account Transactions Rules updated to 2015; ECGC SCR sheet). All ten Module A units now count as published in the ledger; evidence limits are source caveats. Next: Module B (risk), courseware from printed p. 267 = PDF p. 284.
  Module B started (15 Nov 2026, pack v39 = 689 items, 292 tests): unit 1 (courseware unit 11, printed pp. 273-294, PDF pp. 290-311) done in `BFM-B-U01-B001`, with the lending rate rules checked against RBI's Interest Rates on Advances Directions 2025. Courseware printed pp. 267-269 (unit 10 keywords: REGTECH, regulatory sandbox, P2P lending, cloud) were read after unit 10 was published and are glossary-level only. Next: Module B unit 2 (courseware unit 12, from PDF p. 312), then units 3 to 8.
  Module B unit 2 (courseware unit 12, printed pp. 296-306, PDF pp. 313-323) done in `BFM-B-U02-B001` (pack v40 = 730 items, 296 tests); the courseware's 90-day Held for Trading rule is flagged against RBI's 2025 investment classification Directions. Next: Module B unit 3 (courseware unit 13, risk regulations / Basel, from about PDF p. 324; sources to fetch: RBI capital adequacy and Basel III Directions, BCBS texts), then units 4 to 8.
- Next content cursor: BFM Module B (treasury and investment management; courseware begins after unit 6 at about printed p. 180 = PDF p. 197; read the module contents page and the syllabus units first). Module A (units 1 to 6) is authored, with gaps listed in the ledger. Done: `BFM-A-U06-B002` (foreign investment reporting; FDI concepts held; pack v26 = 344 items); `BFM-A-U06-B001` (ECBs under the February 2026 framework and trade credit; pack v25 = 331 items); unit 5 complete in `BFM-A-U05-B001` to `-B006` (pack v24 = 312 items). Earlier: `BFM-A-U05-B005` (importer rules; pack v23 = 305 items; trade credit ceilings held). Earlier: `BFM-A-U05-B004` (EDPMS, overdue bills and caution list, factoring, forfaiting; pack v22 = 288 items). Earlier: `BFM-A-U05-B003` (export finance and Gold Card from RBI Credit Facilities Directions 2025; pack v21 = 271 items). Earlier: `BFM-A-U05-B002` (write-off, set-off, EEFC, export finance concepts; pack v20 = 254 items). Earlier: `BFM-A-U05-B002` (write-off, EEFC/DDA/foreign currency accounts, then export finance: printed pp. 134 onward = PDF p. 151+; sources saved: content/sources/primary/rbi-md-10395.html (export MD), rbi-md-import-10201.html, rbi-exim-directions-2026.html). Done in unit 5: `BFM-A-U05-B001` (export rules; pack v19 = 237 items). Earlier: `BFM-A-U05` (facilities for exporters and importers; courseware starts printed p. 125 = PDF p. 142; RBI export and import directions of 16 Jan 2026 in force from 1 Oct 2026 supersede the 2016 Master Directions: verify which applies at the 30 June 2026 cut-off and say so). Done: unit 4 (letters of credit) in five batches `BFM-A-U04-B001` to `-B005`; pack v18 = 219 items; held back: crystallisation (FEDAI), commercial standby safeguards for imports (RBI). Earlier: `BFM-A-U04` (documentary letters of credit; courseware starts around printed p. 85; verify UCPDC/URR/ISBP/INCOTERMS statements against ICC or RBI sources if reachable; held-back otherwise). Done: unit 2 (LRS): `BFM-A-U02-B001` (RBI LRS FAQ), `-B002` (TCS from section 394 of the Income-tax Act, 2025), `-B003` (LRS Master Direction); pack v13 = 130 items. Unit 2 gaps: ODI procedure under the 2022 Overseas Investment texts, cash/note limits, Master Direction on Reporting. Earlier: `BFM-A-U02` (LRS, TCS: verify against RBI LRS FAQ/Master Direction and Income-tax sources, saved under content/sources/primary/ and registered). Done: `BFM-A-U03-B004` (facilities to NRIs; June 2026 widening of Schedule III share route per RBI circular 14; property rules from RBI FAQ; 11 items, pack v10 = 85 items). Unit 3 now has published content for all six objectives (LO_03 complete; LO_01, LO_02 complete; LO_04 complete; LO_05 and LO_06 have gaps listed in the ledger). Earlier: `BFM-A-U03-B004` (facilities to NRIs, LO_06, printed pp. 79-82; verify against FEMA NDI Rules / RBI FAQs). Done: `BFM-A-U03-B003` (NRI/PIO, NRE/NRO/FCNR(B)/SNRR, USD 1 million allowance, loans against deposits, housing loans; checked against RBI FAQ and Master Direction; 14 items, pack v9 = 74 items; LO_04 and LO_05 published). Earlier: `BFM-A-U03-B003` (NRI banking, printed p. 69 onward, LO_04: regulation-heavy; verify against RBI/FEMA primary pages, saved under content/sources/primary/ and registered). Done: `BFM-A-U03-B002` (RTGS, NEFT checked against RBI FAQ pages; CHAPS caution from Bank of England page; 9 items, pack v8 = 60 items; LO_03 complete). Earlier: `BFM-A-U03-B001` (correspondent banking, Nostro/Vostro/Loro, mirror reconciliation, SWIFT/CHIPS/Fedwire/CHAPS/TARGET; 10 items, pack v7 = 51 items; RTGS/NEFT left out as RBI-sensitive). BFM-A-U02 (LRS, TCS) still pending and regulation-heavy. Superseded note: `BFM-A-U03` (correspondent banking...). BFM-A-U02 (LRS limits, TCS) is regulation-heavy: draft only and hold. Superseded note: `BFM-A-U01-B008` (option pricing elements, indirect-quote and definition questions, better D006 distractors in B006; then BFM unit 2). Superseded note: `BFM-A-U01-B007` (option pricing elements, then RBI/FEDAI LO_07 from printed p. 27 with a primary-source check; also fix D006 distractors and add an indirect-quote question and a definition question for LO_01/LO_02). Superseded note: `BFM-A-U01-B006` (swaps: currency, zero coupon, equity, basis, printed p. 25; funds and currency positions, integrated treasury, printed pp. 15-16; then RBI/FEDAI LO_07 from printed p. 27). Earlier note: Earlier note: `BFM-A-U01-B004` (dealing room LO_05, from printed p. 14 on), then LO_06, LO_07, an
  indirect-quote question for LO_02, a definition question for LO_01. Superseded note follows: `BFM-A-U01-B003` — value-date lesson and indirect-quote question (LO_02), customer
  forward-rate worked example (LO_03), then LO_04–LO_07; then `BFM::MOD_A::U02`.

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
| Notebook access | Browser pane, owner signed in, 11 Nov 2026 | Four chat questions: source inventory; fact brief for BFM unit 1; completeness of each file plus verbatim support; audit of six drafts | Inventory and completeness recorded; brief had 3 errors caught by the verbatim check; audit led to 2 redesigns and 3 revisions | All model-mediated. Page images could not be read at the pane's size |
| Batch BFM-A-U01-B001 | Windows 11, Node 24.21.0 | `npm run validate:staging`, `npm run import:staging`, `npm run check` | 6 valid draft items; 168 tests pass (5 new content checks) | Structure and arithmetic only; not source truth or originality |
| Book PDFs | same | pdfjs inventory script; `node scripts/render-page.mjs <pdf> <dir> <pages>` then reading the images | 5 complete scanned books (718/626/774/662/517 pages), fingerprints recorded; BFM copyright page and printed pp. 4, 9, 11, 12, 30, 33, 35–43 read | Title pages of the other four books not yet read; page images are 640×840 px, legible but small |
| Batch B001 page review | same | Direct reading against `content/batches/BFM-A-U01-B001/staging.json` | 10 facts confirmed, 1 inference flagged, D006 redesigned; see the batch's `review.md` | Same agent wrote and reviewed; no human review |
| Provider sandbox, screen reader, phone hardware, clean clone | — | — | not_run | — |

## Blockers

| Dependency | Affected | Attempts | Independent work left | Minimum action |
| --- | --- | --- | --- | --- |
| Courseware for RM, ITDB, HRM, RB | 105 topics in four electives | None possible | Authoring the 171 topics that do have a source | Put those four books in `content/sources/books/` |
| Primary sources for applicability at the 30 June 2026 cut-off (FEMA text, FEDAI rules, RBI directions) | Publication of regulatory-sensitive items | Not yet attempted for this batch | Web research on official sites is covered by the earlier approval to fetch official documents | None yet |
| FEDAI rulebook / RBI press release on FEDAI (RBI pages redirect; no official FEDAI page found) | Publishing batch B007 and any other FEDAI or RBI rule items | Web search and fetch on 12 Nov 2026 | Draft non-regulatory topics | Owner may supply the current FEDAI rules PDF in `content/sources/primary/`; otherwise retry later |
| FEMA text from India Code (site timed out on 11 Nov 2026) | Publishing the FEMA definition card | Three attempts | — | Retry later; no owner action needed |
| Razorpay test keys + support/refund text | Provider sandbox verification | Adapter checked against current docs and a local stand-in | None | Put test keys and `SUPPORT_TEXT` in a local `.env` (not in chat or git) |
| A person to proofread the syllabus extraction (recommended, not blocking) | Confidence in the 276-topic denominator | Automated cross-checks done | — | Compare `content/syllabus/caiib-2026.json` titles with the PDF, especially the 6 flagged headings |

## Resume instruction

- Last completed logical unit: first pack published (11 items); encoding damage from earlier PowerShell bulk
  edits repaired in five files; all checks green; committed.
- Tooling caution: never rewrite source files with PowerShell `Get-Content -Raw` + `WriteAllText`; it corrupts
  non-ASCII characters. Use the Edit tool or Python with explicit UTF-8.
- Nothing is half-edited.
- Exact next action: batch `BFM-A-U01-B004` (render printed pp. 14–29 of S03 = PDF 31–46). Earlier note: batch `BFM-A-U01-B003`, working from the PDF pages directly (S03, PDF page = printed + 17):
  read printed pp. 7–8 and 14–29 for factors, dealing room, derivatives and RBI/FEDAI guidelines; write facts
  with page locators, author, import, recompute, compare with the book's examples, update the ledger.
  The notebook is no longer needed. Then LO_04–LO_07, then `BFM::MOD_A::U02`.
- Scale reminder: one batch covered part of one of 276 topics. Finishing five papers is on the order of several
  hundred batches.
- Still possible without owner input: clean `npm ci` clone test; optional standalone coverage-map export.
- Run: `npm run dev:fixtures` (http://localhost:5173) and `npm run server` (http://localhost:8787).
- To refresh the baseline from a newer IIBF PDF: update the registry entry and rerun
  `scripts/extract-syllabus.mjs`; the build refuses a syllabus whose hash differs from the registry.
