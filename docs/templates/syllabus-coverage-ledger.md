# Syllabus coverage ledger — working template

This is an editorial companion to the staging JSON, not an extension to its schema. Replace bracketed fields only with actual source or work records. Empty tables are intentional; no official syllabus data or review results have been invented.

## Baseline metadata

- Scope: all four compulsory papers and all five supported electives for the full product; identify any separately labelled partial release.
- Exam session: [session or unconfirmed]
- Official syllabus source IDs/titles/locators: [actual references or missing]
- Baseline version and date: [record actual version]
- Official leaf-topic count by paper and overall: [verified counts or unknown]
- Editorial-objective count: [separate counts or not yet derived]
- Mapping state: [provisional / incomplete with cursor / complete and checked]
- Source inventory/edition references: [saved inventory]

Never change a denominator just to improve progress. A real syllabus revision needs a new baseline version, explicit added/removed mappings and preservation of prior records.

## Official syllabus baseline

One row for every lowest-level official topic. Keep exact source wording here for traceability; this is internal mapping, not learner-facing textbook prose. Missing official syllabus data remains unknown rather than fabricated.

| Topic ID | Paper / module / unit | Exact official topic | Official syllabus source + locator | Derived objective IDs | Baseline issue |
| --- | --- | --- | --- | --- | --- |

## Objectives and supporting evidence

Each objective belongs to an official topic. Mark derived objectives editorial; internal IDs are not official IIBF codes. Source support is supported, partial, missing, conflicting or unreadable.

| Objective ID | Topic ID | Assessable objective | Official or editorial | Supporting source + locator | Source support | Conditions / exceptions / gaps |
| --- | --- | --- | --- | --- | --- | --- |

## Original teaching and assessment

Use BATCH_ID + draft_id before import and canonical item ID/revision after import. More than one row/item may be needed for an objective. Keep a mapping record when IDs change. A topic reaches a stage only when every required objective reaches that stage.

| Objective ID | Original lesson IDs | Original worked example IDs | Assessment IDs | Teaching adequate? | Assessment adequate? | Remaining depth / not-applicable reason |
| --- | --- | --- | --- | --- | --- | --- |

Adequacy is substantive: accurate explanation, relevant conditions and exceptions, meaningful retrieval, and application where required. Numerical objectives need a worked example and a distinct numerical assessment. No credit for a title mention or a tag. Repeated variants do not increase the official-topic numerator.

## Review and publication evidence

States: not started, pending, changes required, passed with recorded evidence; not applicable only with a reason. Record actual reviewer/method/date and evidence links. A NotebookLM audit alone is not independent verification. Calculations require reproducible recomputation.

| Objective / item IDs | Source + session review | Originality review against PDFs | Calculation / question checks | Review record links | Published ID + revision + pack | Remaining blocker |
| --- | --- | --- | --- | --- | --- | --- |

Originality review checks passages, tables, examples, scenario design, questions, distractors and solutions for copied expression or structure. Accurate common terminology and formulas are not defects. Redesign derivative material; do not accept copied material through an exception.

## Progress summary

Count official topics in the first table and editorial objectives separately in the second. Do not average percentages across papers; use the overall baseline numerator/denominator. Unknown denominators remain unknown. The stages are separate coverage views and must not be added together.

| Paper / overall | Official topics total | Source-supported | Adequately drafted | Adequately assessed | Fully reviewed | Published and complete |
| --- | --- | --- | --- | --- | --- | --- |

| Paper / overall | Objectives total | Source-supported | Adequately drafted | Adequately assessed | Fully reviewed | Published and complete |
| --- | --- | --- | --- | --- | --- | --- |

## Batch checkpoint

- Baseline version / source inventory version: [actual versions]
- Last batch and completed batches: [IDs]
- Draft-to-item mapping changes: [actual changes]
- Current ledger location/version: [saved record]
- Incomplete topics/objectives and required next work: [exact IDs and gaps]
- Blocked topics and specific missing sources: [exact needs]
- Pending reviews and numerical checks: [exact items]
- Next paper/unit/objective and continuation cursor: [exact next step]
- Current verdict: [baseline unconfirmed / incomplete / draft coverage complete with review pending / reviewed coverage complete / reviewed and published coverage complete]

Before declaring complete coverage, run Prompt F against every official topic, its objectives, actual authored content and recorded reviews. A phased release must disclose its scope and unfinished areas.
