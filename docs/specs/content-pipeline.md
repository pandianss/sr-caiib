# Original-content authoring and publication pipeline

Read `../prompts/notebooklm-extraction.md` for the authoring workflow and `autonomous-delivery.md` for orchestration. The books remain in the user's notebook; this kit has neither retrieved nor verified them. The executing agent must establish authorized notebook/PDF access and own batches, exports, audits, checkpoints and continuation; do not delegate routine orchestration to the user.

## Stages and evidence

| Stage | Output | What it establishes |
| --- | --- | --- |
| Inventory | Source IDs, exact titles, edition metadata, visible locators | Which material the batch used |
| Curriculum map | Complete official syllabus baseline, derived objectives and gap ledger | The fixed full-scope denominator, if verified |
| Evidence extraction | Bounded cited fact ledger | Traceability back to selected sources |
| Draft authoring | Independently designed lessons, examples, tables and assessments | Candidate educational content only |
| Structural import | `validateExtraction`, mapping and `validateContentItem` | Valid fields, IDs and evidence links |
| Editorial review | Source/applicability, originality, coverage-depth and numerical checks | Actual recorded review evidence and remaining gaps |
| Publication | Published pack, `validatePack`, manifest, checksum | A structurally eligible pack; not proof of full syllabus coverage |
| Syllabus completion audit | Baseline-to-content reconciliation for all papers | Whether every topic has adequate reviewed original teaching and assessment |
| Activation | Verified download, atomic switch, retained old pack | Reliable offline delivery |

Keep source inventories and cited ledgers with each batch. The source registry should retain exact title, edition, file fingerprint where available, source ID, visible locations, issue/effective dates if known, and relevant access/licensing metadata where known. Do not invent missing bibliographic details.

One authoring batch should target at most three related objectives, with up to three cards and three questions. These are response-size limits, not total content quotas. An objective can span several batches until sufficiently taught and assessed. Larger cases can be authored separately with the same evidence rules.

## Mandatory original authorship

Source PDFs establish facts, methods and reference evidence. All learner-facing passages, explanations, comparison tables, analogies, worked examples, cases, questions, distractors and solutions must be independently authored. Do not reproduce source expression or distinctive teaching arrangements. Close paraphrases, reworded source tables, and source questions altered only by names/numbers/option order are unacceptable. This product rule has no permission-to-reproduce exception.

Use a two-stage process: first distil a concise cited factual brief, then design teaching and assessment around the syllabus objective and the learner's task. Do not rewrite the source sentence by sentence or chapter by chapter. New tables need an original learning purpose, comparison dimensions, grouping and wording. New questions need an independently designed reasoning task and scenario; new numericals need their own setup and independently checked answers.

Preserve accurate formulas, common technical terminology, official names/section identifiers and necessary factual values. Originality must not distort the subject. Exact source titles/headings and locators may remain in provenance. Review against the referenced PDFs for both wording and structure; where comparison is unavailable, leave the review pending. Similarity measures and model self-checks are screening aids, not proof. Redesign derivative items from the factual brief before publication.

## Full syllabus scope and completion

Use the official syllabus for the intended exam context as the fixed baseline. The full content programme covers all four compulsory papers and all five supported electives; learners select one elective. A phased launch does not narrow the eventual scope. Record every official module/unit/leaf topic, including unsupported topics. Derive clearly labelled editorial objectives beneath the official topics without inventing official identifiers.

Maintain the companion ledger in `../templates/syllabus-coverage-ledger.md`. Keep source-supported, drafted, assessed, reviewed and published statuses separate. For each objective, record batch/draft IDs and later canonical lesson/example/question IDs, evidence locators, review records, gaps and next action. Track official-topic coverage and editorial-objective coverage separately; duplicates or a changed denominator cannot inflate completion.

Sufficient coverage requires original teaching and meaningful assessment for each objective, including supported assumptions, exceptions and limitations. Numerical objectives need an original worked example plus a distinct original numerical assessment; application objectives need original application tasks. Mark any format not applicable with a reason. Mere mentions, tags, glossary entries or question counts do not establish coverage. A shared content item may support multiple objectives only when its substance covers each.

Save a checkpoint after every batch and continue across every paper. Missing sources remain explicit blockers while other supported topics proceed. Search official IIBF sources for missing syllabus/session evidence and available authorized primary references for unsupported topics. If the baseline is still unavailable, completeness remains unconfirmed. Only after accessible alternatives and independent work are exhausted, request the smallest consolidated source/access action. Never invent evidence or delete an uncovered topic. Update the visual map from the ledger after each batch; source coverage, content coverage and learner progress are separate measures.

A final syllabus-wide reconciliation must find no missing, unsupported, insufficiently taught, unassessed or unreviewed topics before declaring reviewed completeness. Published completeness additionally requires all corresponding published item references. Report draft completeness and partial releases honestly. Batch completion and schema validity never establish full syllabus coverage.

## Mapping staging into schema 2.0.0

- Resolve each draft using explicit unit and objective IDs from the verified catalogue. `unit_label` remains descriptive provenance; never use the first unit, title similarity or chapter position as an automatic mapping.
- `fact_ids` resolve within their batch. Each fact connects to an exact source ID/locator in the saved source registry and cited ledger.
- Give each final item a stable ID derived from namespace, syllabus version, paper, batch and draft ID. Preserve the draft-to-item mapping; repeated batch-local IDs in other batches must not collide. Imported items begin at revision 1; later corrections need explicit revision handling.
- Copy the payload into the appropriate discriminated card/question/case variant. Add required common fields, prerequisites, curriculum mapping, citations and exam/current context. Do not use an unsafe type assertion to skip validation.
- Set `publication_state: 'draft'`, `review: null`; preserve uncertainties. Unstructured or incomplete candidates stay in editorial staging rather than becoming invalid app records.
- Record known source dates separately from verified session applicability. An absent cutoff remains an editorial issue; do not invent a date to satisfy an app field.
- Run item validation after normalisation. Review and publication occur only after the outstanding evidence issues have been resolved.

A working draft importer is included at `src/import/staging.mjs`, with CLI `scripts/import-staging.mjs`. Follow [staging-import.md](staging-import.md): supply an explicit per-draft curriculum mapping, exact source registry and evidence-supported context. Missing answers, invented defaults, invalid records and broken case links reject the whole batch before output. The resulting draft envelope retains the full source batch and unresolved issues. `validateExtraction` checks the staging envelope and links; `validateContentItem` checks canonical item structure. Neither establishes factual truth or original authorship.

## Question and calculation checks

Use independently designed scenarios, reasoning tasks, explanations and plausible distractors. Do not copy source question banks, make cosmetic variants of source questions, or call generated questions actual IIBF questions. A book may establish a formula; independently recompute new example values using deterministic arithmetic. Store the stated rounding instruction and the resulting decimal-string answer. Preserve numerical conventions, valuation dates and units.

The canonical expected answer is already rounded to the question's precision. When implementing grading, define input parsing explicitly: reject extra nonzero precision, commas/exponents unless the UI intentionally normalises them, NaN/infinity and incompatible units. Harmless formatting differences such as a trailing zero can be normalised under a documented rule. Do not round an incorrect learner answer into correctness through a broad tolerance. Handle negative zero deliberately. This kit validates stored answer specifications; it does not implement the numerical grader.

For legal or regulatory content, compare with relevant primary updates and the selected exam cutoff. Native NotebookLM citations and a second LLM audit are evidence aids; neither is independent verification. Record review method honestly. A content item cannot be published merely because it says `source_verified: true`.

## Publication controls

Only `published` items enter delivery packs. Synthetic test fixtures remain under tests, regardless of the simulated publication flags needed to exercise validators. Require recorded source, applicability, numerical, question-quality and original-authorship checks before the real publishing service accepts a transition. The publishing service must reject reproduced or closely paraphrased source material regardless of structural validity.

Snapshot pack contents immutably; use `pack_id + pack_version`, item ID/revision and exam-config version together. Create a new pack for corrections. Keep older versions for existing attempts and explain any deliberate regrading. Include pack bytes/assets in checksum validation and offline downloads; integrity verification and atomic activation are separate from schema validation.

The paid offer may cover only material actually ready. A unit with coverage gaps, derivative content, missing citations, unverified calculations or unresolved session applicability cannot be marketed as complete. All published paid and free learning content follows the same originality standard.
