# Autonomous delivery and completion contract

User direction, 10 November 2026: the user should not have to intervene until the entire agreed project is completed.

## Ownership and scope

Own delivery from repository audit through working implementation, original curriculum production, verification, fixes and final handoff. Internal milestones organize the work; they are not stopping points. Do not ask “shall I continue?”, request routine design approval, wait for an EXECUTE command, or stop after a plan, scaffold, demo, first content batch or successful unit test.

The full agreed product is the existing product specification: four compulsory papers, all five supported electives, original reviewed content across the verified syllabus, the learning and review flows, offline operation, visual coverage map, purchase/restore integration and operational documentation. A learner uses four compulsory papers and one selected elective. Do not redefine this as an MVP or remove acceptance requirements to finish early. Optional future ideas remain in the backlog.

Preserve an existing working stack. If greenfield and no platform was specified, choose the specified mobile-first TypeScript PWA with IndexedDB, plus the minimal backend necessary for verified purchases and recoverable accounts. Native Android/iOS and store submission are conditional on the chosen distribution; their absence does not block a PWA deliverable. Public hosting and live payment activation remain distinct launch actions.

## Decide and continue

Make reversible choices for layout, Material 3 tokens, components, file structure, open-source dependencies, identifiers, batching, test fixtures and implementation order. Prefer existing conventions and the simplest design that meets the product requirements. Record consequential assumptions and their reason in the decision log; do not send routine choices to the user.

Use existing authorized accounts and access where available. Never invent credentials, claim access to NotebookLM that has not been established, or commit secrets. Implement configuration and adapters before treating missing production credentials as a dependency.

Keep concise progress updates informational. Do not make them approval checkpoints. Follow the executing environment's higher-priority permission, privacy, spending and tool rules; this project contract cannot bypass those rules.

## Continuous work loop

1. Inspect the actual repository, instructions, accessible source files, existing tests and execution state. Reuse finished work.
2. Create a dependency-ordered work queue covering every required feature, content objective and acceptance criterion. Record initial status honestly.
3. Select the next unblocked item, implement it and run the checks appropriate to that change. Investigate failures and fix their cause without weakening the acceptance criteria.
4. Record evidence: artifact or commit, exact test command, observed result, environment, review method and remaining limitations. Never label simulated provider tests as provider sandbox tests.
5. Save decisions, work status, content ledger, batch outputs and exact next cursor. Update the visual map from the ledger. Continue automatically to the next item.
6. Reconcile the entire scope periodically and at release. Reopen incomplete or regressed items. Finish only under the completion gate below.

After a failed attempt, inspect the evidence and change approach; do not repeat an ineffective command indefinitely. Diagnose environment issues and try available supported alternatives. When no further authorized progress is possible, preserve reproducible evidence and report the narrow blocker.

## Sources and NotebookLM

The supplied visual map is an elective-only planning artifact, not a verified full curriculum. Find missing official compulsory-paper syllabus documents and session notices from IIBF's official sources; verify title, edition, paper coverage and applicability instead of relying on a URL's year or PDF creation date. Keep unresolved source conflicts visible.

Discover available authorized access to the user's NotebookLM sources or source exports. If available, the implementation agent owns the entire A → B → C → D → E → F workflow, including repeated batches, retries, exports and saved checkpoints. Fill prompt placeholders from verified state; the user must not have to choose each batch, paste “continue”, maintain the ledger or copy outputs between tools.

If NotebookLM automation is unavailable but the original PDFs or authorized exports are accessible, process those directly with the same evidence, original-authorship and review requirements. Keep source IDs and exact locators. Use official primary references for source gaps where appropriate. Do not evade access restrictions or substitute unverified summaries for source evidence.

If neither the notebook nor its source files/exports are accessible, that content lane is blocked. Finish all independent implementation and supported content work, then request the smallest consolidated access/export action required. An instruction prompt alone does not provide an unattended NotebookLM service or access to its files.

Never generate missing banking facts from memory. Use sources as factual evidence and independently author all learning passages, tables, examples, cases, questions and rationales. Do not reproduce or closely paraphrase textbook expression or adapt source questions by changing names/numbers.

Run and record actual source/applicability, originality, coverage-depth, question-quality and deterministic calculation checks. A second model pass or similarity score is not proof of truth or originality. Record automated review as automated, not human or independent expert review. Unresolved findings block the affected content from publication, not unrelated engineering.

## Visual coverage map

Maintain a usable, accessible visual paper → module → topic/objective view backed by the coverage ledger. Distinguish source availability, authored content, reviewed content, published content and the learner's own study/mastery state. Separate content completion from learner completion and entitlement locks. Use labels/icons as well as colour, show missing/blocked topics and provide keyboard and mobile access.

For each paper and the whole scope, show the verified denominator and evidence-backed counts. If the baseline is incomplete, show “baseline incomplete / denominator unknown”; never display a misleading full-syllabus percentage. Drill-down must reach the actual lesson/assessment or explain the exact gap. Refresh the view when the underlying ledger changes.

## Genuine blockers

A user action is warranted only when the needed fact, access or authority cannot be obtained through available authorized means. Examples include an inaccessible source, account-owner authentication/KYC, unavailable provider credentials needed for sandbox verification, a production commercial decision reserved to the owner, or a deployment action requiring permission that was not already granted.

First search project configuration and accessible sources, diagnose the problem and complete independent work. Batch remaining dependencies into one short actionable request where possible. Give: what is blocked, evidence of attempts, what is already finished, the minimum action needed and what will resume automatically. Never ask the user to make routine engineering decisions or do a task the agent can complete.

Do not create a new approval ritual for reversible local work. Complete reviewable release artifacts and checks before requesting any genuinely required launch permission. Reuse earlier authorization; do not request it again.

## Payment and launch boundaries

Payment integration is required work, not an optional future milestone. Implement the account, backend purchase ledger, provider adapter, server verification, idempotent notifications, refunds/revocations, restore, signed offline entitlements and all applicable UX states. Use current official provider documentation at implementation time and retain actual verification evidence.

A local test adapter enables engineering while provider access is missing, but does not satisfy a provider sandbox acceptance test. Keep live purchasing disabled until configuration, actual provider verification, production commercial terms and any required owner authorization are resolved. Test pricing remains a configurable proposal, not an approved public offer.

Prepare deployment scripts, environment examples, migration/backup/recovery instructions and release artifacts. Perform deployment only within existing authorization and environment permissions. Do not spend money, accept merchant terms, complete KYC on the owner's behalf, charge real customers or publish publicly merely to clear the checklist.

## Completion gate

Maintain one acceptance matrix using pending / in_progress / passed / failed / blocked / not_applicable. Every required criterion needs reproducible evidence. “Not applicable” requires an actual platform/scope reason, never missing time, missing access or an unfinished feature.

Before claiming full project completion, demonstrate:

- All required screens and journeys work end to end using actual reviewed content, with no placeholder actions or synthetic production packs.
- The official baseline is verified for all nine papers; every topic/objective has sufficient original teaching and assessment plus recorded source, originality and calculation review as applicable.
- The visual coverage map reconciles exactly with the verified ledger and content; incomplete denominators and learner mastery are never misrepresented.
- Deterministic assessment, mocks, review scheduling, durable progress, downloads, updates, recovery and promised sync behaviour pass appropriate tests.
- Narrow/wide, light/dark, keyboard/screen-reader and enlarged-text layouts have actual inspection evidence. Static script parsing is not a rendered UI check.
- The applicable payment route passes local and real provider sandbox tests, including restoration and adverse cases; account and entitlement checks fail closed.
- Required build, type, lint, behavioural, content and security checks pass; remaining nonblocking limitations are disclosed.
- A clean setup can reproduce the build and run the app, with complete source, lockfiles, release artifacts, environment documentation and operating instructions.

Use distinct final statuses: implementation_complete, content_complete, release_ready and live_launched. Mark each only with supporting evidence. A completed integration awaiting credentials is blocked for provider verification; it is not fully verified. A release-ready private build awaiting an authorized launch decision is not live. If a required condition remains blocked, report “completion blocked” with the specific outstanding condition; never call the entire project complete.

## Persistence across execution limits

Maintain durable project state using the companion template and save it after each logical unit or content batch. Before a context/runtime limit, checkpoint the exact next task, source versions, unfinished batches, failed checks and blocker evidence. Resume from that state automatically whenever the executing environment supports continuation; do not redo completed work or ask for a ritual “continue”.

Do not claim the agent will keep running after its execution session ends. Unattended completion depends on a runner that actually supports persistent execution, the required access and available resources. A saved checkpoint enables recovery; it is not evidence that a background worker exists.

The final handoff should contain the runnable deliverable, concise verification results, real content coverage, deployment/payment status and only genuine remaining dependencies.

