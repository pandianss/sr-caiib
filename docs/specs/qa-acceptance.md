# QA and acceptance

Read [autonomous-delivery.md](autonomous-delivery.md) for the mandatory full-project completion gate. Scope is the whole agreed product unless the user explicitly narrows it; an internal milestone cannot waive required criteria.

## Additional content and commerce acceptance

The core product criteria below remain applicable. The source pipeline and monetisation are required scope; apply the following checks to the selected distribution:

1. Notebook output stays in staging/draft; unknown source metadata is preserved honestly, and missing evidence blocks real publication.
2. Structural validation rejects invalid variants, option duplicates, wrong paper/parent IDs, unsupported publication states and dangling links.
3. Self-rated recall cannot inflate assessed accuracy; CRI sample eligibility never displays Ready as a pass-readiness claim.
4. Paid access is granted only after backend provider verification and account/product/amount/state checks.
5. Duplicate/out-of-order provider notifications do not duplicate grants or undo refund/revocation state.
6. Pending/failed/cancelled checkout remains recoverable; closing the app after payment does not lose an eventual verified purchase.
7. Restore checks the proper account/provider and preserves trial history.
8. Signed offline access respects the disclosed lease and purchased expiry; counterfeit tokens, wrong accounts and obvious clock rollback cannot create access.
9. Expiry/revocation preserves history and free content, and already authorized sessions have a bounded finish policy.
10. The offer reflects actual content availability and clear prices, access dates, non-renewal and support/refund terms.

Runtime tests in this kit establish contract/validator behaviour only. App persistence, visual accessibility, schema migrations, source accuracy, actual payment integrations, signatures, offline timing and store compliance require tests of the implementation that uses the kit.

Focused implementation specification. See `../product-spec.md` for full product scope and `../../AGENTS.md` for execution rules.

## Milestones and design validation

Complete design and implementation in bounded stages, then move directly to the next unblocked stage. These are internal execution units, not user approval or stopping points. For an existing project, address actual gaps rather than rebuilding completed work:

1. **Audit:** identify the current state, target exam context, source availability, content coverage, and implementation risks.
2. **Design foundation:** define tokens, navigation, core journeys, and the main screen/state layouts.
3. **Working learning flow:** connect validated content to lessons, retrieval, practice, results, and durable local progress.
4. **Offline and assessment:** implement the required download/version behaviour, numeric grading, case studies and configured mocks.
5. **Review and evidence:** implement the selected scheduler, evidence-based remediation and required transparent analytics.
6. **Complete curriculum and coverage:** continue source discovery, original authoring, review and publication preparation across all nine papers; connect the visual map to the full ledger.
7. **Commerce and delivery:** implement and verify the applicable payment route, package the runnable product and satisfy the full acceptance gate. Keep live launch status separate.

Before expanding across every screen, produce and self-review representative layouts for Today, paper selection, a lesson, a practice question, a case study, and session completion. Include representative dark, enlarged-text, and offline/error states.

Use real representative content and a difficult layout, such as a long statute or equation. Proceed after your review unless the user requested a design approval checkpoint. Do not stop at a static mockup when the user requested a working implementation.

Keep optional future features in a backlog. Implement monetisation as required project work using the payment requirements; finish provider verification when access is available and record any unavailable verification as blocked. Do not let unrequested analytics, animation, AI tutoring, gamification or infrastructure expansion delay the agreed product.

## Acceptance criteria

For each criterion, track **pending**, **in_progress**, **passed**, **failed**, **blocked**, or **not_applicable**, with evidence. The default scope is the entire agreed product. Do not exclude required work because it is unfinished or source-blocked. Use not_applicable only for a genuine documented platform/scope reason. Full completion requires every applicable criterion to pass; see the autonomous-delivery completion gate.

| Area | Observable requirement |
| --- | --- |
| Paper isolation | Selecting BFM never returns ABFM content or progress. |
| Elective changes | Switching electives preserves previous history and does not silently discard an active attempt. |
| Coverage | Every published item maps to valid objectives; all official syllabus topics remain in the ledger, including blocked and unfinished topics. |
| Visual coverage map | Drill-down shows all papers and their verified topic/objective structure; source, authored/reviewed/published content and learner state remain distinct. Counts reconcile with the ledger; unknown denominators never produce a full-syllabus percentage. |
| Syllabus completion | A full-product claim covers all four compulsory papers and all five supported electives, with adequate original teaching, assessment and completed review for every official topic and its objectives. Scoped releases disclose their gaps. |
| Original authorship | Passages, tables, worked examples, scenarios, questions, distractors and solutions are independently authored. Copied expression, close paraphrase and superficial source-question variants are excluded. |
| Source trust | Published regulatory claims have verified provenance and applicable dates. Unverified items cannot enter scored exam practice. |
| Exam context | A later current-rate update cannot silently alter a pinned exam-session question or an active attempt's answer key. |
| Navigation | A learner can start a short session, find a formula, change paper, and resume interrupted work without losing context. |
| Answer behaviour | Choice and numeric questions support explicit submission, correct grading, required precision, and mode-appropriate feedback. |
| Case studies | Scenario access remains usable and later questions do not require a previously submitted answer. |
| Offline study | A downloaded lesson, self-check, quiz, result, and scheduled review work in airplane mode after restart. |
| First use | Available starter content and download requirements are clear; undownloaded coverage is not represented as offline-ready. |
| Persistence | Answers, reading position, bookmarks, and review state survive app restart. |
| Downloads | Interrupted or invalid updates retain the last valid pack and learner data. |
| Synchronisation | Retrying an event upload twice produces one logical event; pending work survives restart. |
| Mock timing | Backgrounding and reopening preserve the deadline; expiry and unanswered responses follow the verified rules. |
| Mastery evidence | Repeated exposure is separated from unseen performance; weak-area and CRI displays respect minimum evidence. |
| Accessibility | Relevant screens pass contrast, touch-target, focus/screen-reader, and 200% text-size checks in both themes. |
| Adaptive layout | Narrow phones and wider windows remain usable; keyboard and system insets do not cover necessary controls. |
| Interaction completeness | Every visible control works or clearly explains a genuine unavailable state; no decorative placeholder actions. |

## Verification and final handoff

Use checks appropriate to the actual changes:

- Run content/schema validation for published packs and references.
- Reconcile the full coverage ledger with the official syllabus; inspect substantive teaching and assessment coverage, not just item counts or tags.
- Review original authorship against the referenced PDFs, including table structure and question design. Rewrite derivative items from a factual brief; similarity scores or an LLM self-declaration do not prove originality.
- Check representative numerical answers, units, rounding boundaries, and invalid inputs with deterministic expected results.
- Test routing isolation, answer grading, scheduler failures, persistence, pack activation, and sync deduplication when those behaviours change.
- Check mocks across background/resume and expiry.
- Inspect representative layouts on narrow and wide windows, light/dark themes, and enlarged text. Include actual long content and error states.
- Run the repository's relevant build, lint, type, and behavioural checks. Keep tests focused on meaningful outcomes.

Maintain only the documentation needed to operate and review the implementation: setup/run instructions, key design decisions, schemas/contracts, content-source registry and coverage report, and validation evidence. Keep these concise and current.

In the final handoff, state what changed, how to run or inspect it, what was verified, what content is genuinely available, and what remains incomplete or blocked. Never claim a working API, complete curriculum, verified source, successful test, published deployment, or offline capability without evidence.

## Import acceptance

Exercise explicit mapping, rejection of missing answer/formula fields, evidence preservation, batch-aware IDs, case/self-check links, worked solutions and CLI failure with no output write. Existing outputs must remain unchanged.
