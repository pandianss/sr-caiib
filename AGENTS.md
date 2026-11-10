# CAIIB Agent Operating Contract

Build a dependable, offline-first CAIIB learning app for working bankers. The learner loop is: **What should I study next? Can I apply it correctly? What should I review later?**

## Execution

The user's direction is full-project completion without routine intervention. Read `docs/specs/autonomous-delivery.md` at the start. Inspect existing code, dependencies, content and tests; then implement, verify, fix and continue through the whole agreed product. Milestones are internal work units, not stopping points. Do not stop at a plan, scaffold, demo, first content batch or passing contract suite. No routine approval pauses, “shall I continue?” questions or `[EXECUTE]` password.

Make reversible engineering and design decisions, record consequential assumptions and proceed. Preserve working functionality; keep optional new ideas in the backlog without shrinking required scope. Maintain `PROJECT_STATE.md`, the acceptance matrix and the source/content ledger; use `docs/templates/project-state.md` as the initial template. After each logical unit, save evidence and take the next unblocked task. At execution limits, save an exact resume checkpoint and continue automatically when the environment supports it; never claim an unstarted background worker exists.

Find missing official syllabus sources and use accessible NotebookLM sources or authorized PDF exports. Own batching, ledger updates and visual-map reconciliation. If access is genuinely unavailable, finish independent work and consolidate the smallest remaining dependency request. Never fabricate sources, review, tests or completion to avoid a blocker. Follow actual environment permissions; reuse authorization already given.

Completion requires the runnable app, all required original reviewed curriculum, the working visual coverage map, applicable payment integration, acceptance evidence and operational handoff. Report implementation, content, release readiness and live-launch status separately. Missing source evidence, provider verification or required acceptance checks means completion is blocked, not complete. Never claim that interface declarations implement an application or schema validation establishes banking accuracy.

## Requirements that always apply

- Compulsory IDs: `ABM`, `BFM`, `ABFM`, `BRBL`; electives: `CB`, `RM`, `ITDB`, `HRM`, `RB`. Use exact matching. Preserve history and active sessions when switching papers.
- Resolve module/unit/objective membership from the versioned curriculum catalogue. Do not restrict every paper to modules A–D. Validate ancestry, not just string prefixes.
- Separate exam-session content from current reference data. Pin attempts to pack, item and exam-configuration versions.
- Use deterministic calculation and explicit units/rounding. Use decimal arithmetic or appropriately bounded scaled integers for precision-sensitive financial grading. `Number` is suitable for counts, timers and documented statistical metrics. Never grade using a runtime LLM.
- Preserve local progress through restart. Timed mocks use a persisted absolute deadline.
- UI baseline: Today / Learn / Practice / Library; one paper selector; explicit answer submission; readable Material 3 components; light/dark, 48px touch targets on web, 200% text scaling, accessible feedback and recovery states.
- Use synthetic fixtures for engineering tests, isolated from release content. Published learning content requires evidence and editorial review. Never invent IIBF provenance or source locators.
- Source PDFs establish facts, not reusable learner-facing expression. Independently author all passages, tables, examples and questions. Exclude copied passages, close paraphrases, copied table structures, and source-question variants made by swapping names or numbers. Preserve accurate formulas, terminology and factual values.
- Complete the entire official syllabus: all four compulsory papers and all five supported electives in the full product. Maintain a topic/objective ledger with original teaching, assessment, review and published-item evidence. Small batches do not reduce scope; keep every unfinished or source-blocked topic visible. Never claim completeness from item counts alone.
- Import through explicit catalogue mappings and a source/context registry. Reject missing content, invalid records and broken references; never default an answer, choose the first unit, invent a date or report partial output as successful. Retain the full evidence bundle and batch-to-item mapping.
- NotebookLM output is unverified editorial staging. Audit sources, original authorship and syllabus gaps before publication; a schema validator does not establish any of these.
- Distinguish objective correctness, self-assessed recall and ungraded completion. Derive first exposure from reconciled history.
- Free study may be anonymous. Purchasing and restoring paid access requires a recoverable identity and verified entitlement. A local `isPaid` flag or successful checkout callback is not proof of payment.
- Implement and test the applicable payment integration as required project work. Missing live credentials do not stop independent development; local simulations must not be presented as provider sandbox verification. Live payment collection and public deployment require actual configuration and authority; prepare the concrete release before any necessary owner action.

## Load specifications as needed

| Task | Read |
| --- | --- |
| Continuous execution, blockers, checkpoints and completion gate | `docs/specs/autonomous-delivery.md`, `docs/templates/project-state.md` |
| Overall product scope and rationale | `docs/product-spec.md` |
| Data shapes and import validation | `src/types/contracts.ts`, `src/validation/contracts.ts`, `docs/specs/domain-data.md`, `docs/specs/staging-import.md` |
| Scheduling, learning, analytics | `docs/specs/learning-engine.md` |
| Screens, Material 3, accessibility and recovery | `docs/specs/ui-ux.md` |
| Source extraction and publication | `docs/specs/content-pipeline.md`, `docs/prompts/notebooklm-extraction.md` |
| Pricing, checkout, restore and paid offline use | `docs/specs/monetization.md` |
| Acceptance and handoff | `docs/specs/qa-acceptance.md` |

The user's latest instructions govern scope. The product specification governs behaviour; focused specs provide implementation detail. Update affected specifications together when requirements change. Types and validators must agree. Existing project migrations need explicit handling; never silently coerce legacy records into schema 2.0.0.

## Start

Inspect the project, establish the full acceptance queue and start the first unblocked implementation task. Continue until the completion gate passes or only genuine external blockers remain. A later explicit user instruction to plan only or narrow scope takes precedence.
