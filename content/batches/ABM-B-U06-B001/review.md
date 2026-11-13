# Batch ABM-B-U06-B001 — evidence and review record

Paper ABM, Module B unit 6 "Conflict Management and Negotiation" (`ABM::MOD_B::U06`; courseware unit 15). Forty-three items: 11 concept cards and 32 choice questions. Record written 15 November 2026.

## Evidence

Source `S01` *Advanced Bank Management* (CAIIB courseware), scanned pages read directly with `scripts/render-page.mjs` (printed page n = PDF page n + 15). Pages read: printed pp. 340 to 361 (PDF pp. 355 to 376), the whole unit including the summary, keywords, Check Your Progress questions, terminal questions and further readings. Printed p. 339 (title page) was not read in detail. All 16 facts in `staging.json` carry a printed page and section. No calculations are involved.

## Limits of the evidence

The unit is descriptive. Frameworks attributed to McLean (2005), Hocker and Wilmot (1991), Marquid (cited by Kelley, 2006), Susskind, Mary Parker Follett, Blake and Mouton, the Thomas-Kilmann model and the Helpguide.org team were not checked against the originals. The courseware's statement that managers spend at least 25 per cent of their time resolving conflicts is not verified and appears in a lesson only as the courseware's claim. Session applicability is **not checked** (no cut-off-dated rule is stated).

## Courseware difference

The courseware's sentence on the degrees of assertiveness and cooperativeness in the Thomas-Kilmann model is partly garbled ("competing consists of a low degree of cooperation and a high degree of assertiveness"; its example for accommodating is similarly compressed). The lesson teaches the standard placement: competing high assertiveness and low cooperation; accommodating low and high; avoiding low and low; collaborating high and high; compromising middle on both. No question depends on the compromising midpoint.

## Drafts and originality

The courseware's prose, lists (the eleven skills, the causes of conflict, the preventive actions) and Check Your Progress questions (printed pp. 359 to 360) were compared with every item.

| Area | Relationship to the book |
| --- | --- |
| Cards D001 to D011 | Reorganised into comparison tables (the three types of conflict, the three forms of goal conflict and role conflict, causes with examples, the five phases, the Thomas-Kilmann approaches with their two dimensions, the five-step process, the three viewpoints). The courseware's lists that are the substance of the topic keep its terms; the Ram and Rahim illustration and the family and friendship anecdotes are not reproduced |
| Questions D012 to D043 | New scenario or definition items; none repeats a Check Your Progress question; answer positions are balanced 8 each across A to D by construction |

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | not applicable | None |
| Source support | passed for the courseware's account | Pages read directly; cited works not checked |
| Session applicability | not checked | See above |
| Originality | passed against the pages read | See table |
| Question quality | partly checked | `tests/content/batch-abm-b-u06-b001.test.ts` checks structure and answer spread; no human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.

## Coverage after this batch

All five objectives of Module B unit 6 have teaching and assessment. Next: Module B unit 7, HRM and Information Technology (courseware unit 16, printed p. 362 = PDF p. 377).
