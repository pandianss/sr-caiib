# Batch ABM-B-U02-B001 — evidence and review record

Paper ABM, Module B unit 2 "Development of Human Resources" (`ABM::MOD_B::U02`; courseware unit 11), part 1: HRD and its subsystems, job and role analysis, learning and development, the systematic approach to training (objectives LO_01 to LO_04). Twenty-eight items: 10 concept cards and 18 choice questions. Record written 14 November 2026.

## Evidence

Source `S01` *Advanced Bank Management* (CAIIB courseware), scanned pages read directly with `scripts/render-page.mjs` (printed page n = PDF page n + 15). Pages read for this batch: printed pp. 198 to 215 (PDF pp. 213 to 230). Printed pp. 215 to 248 (support systems, performance and potential appraisal, attitude development, career path planning, self-development, organisational development, HRIS, talent management and succession planning) are not covered and belong to the next batch; objectives LO_05 to LO_09 are registered with no items, so the topic is not complete. Printed p. 197 (title page) was not read. All 11 facts in `staging.json` carry a printed page and section. No calculations are involved.

## Limits of the evidence

The unit is descriptive and rests on the courseware's account and on frameworks it attributes to Pareek and Rao (1986), Rao and Pereira (1986), Nadler (1984), Knowles, Decenzo and Robbins (1995), Rao (1995), Kirkpatrick, Handy (1976) and Lindeman. None was checked against the original work, so the items attribute them as the courseware reports them. The account of bank mergers (printed pp. 200 to 201) is the courseware's own and was not checked against primary sources; the 2019 announcement of ten public sector banks into four is reported as the courseware states it. The courseware gives two overlapping definitions of training, education and development (Nadler's three-way split and a four-row table on printed p. 208); the items use Nadler's split. Session applicability is **not checked** (no cut-off-dated rule is stated).

## Drafts and originality

The courseware's prose, its table on printed p. 208, its Check Your Progress statements (printed pp. 206 to 207) and its lists were compared with every item.

| Area | Relationship to the book |
| --- | --- |
| Cards D001 to D010 | Reorganised into period-by-pressure tables, comparison tables (task, job, position and role; training, education and development; the three learning theory families; the four evaluation levels) and procedural summaries. Lists that are the substance of a topic (the six HRD systems, the seven adult learning principles, the five training steps, the four evaluation levels, the contents of a job description and a job specification) keep the courseware's terms, as exam use requires |
| Questions D011 to D028 | New scenario or definition items; none repeats a Check Your Progress statement. Answer positions are spread across A to D by construction |

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | not applicable | None |
| Source support | passed for the courseware's account | Pages read directly; cited works not checked |
| Session applicability | not checked | See above |
| Originality | passed against the pages read | See table |
| Question quality | partly checked | `tests/content/batch-abm-b-u02-b001.test.ts` checks structure and answer spread; no human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.

## Coverage after this batch

Objectives LO_01 to LO_04 of Module B unit 2 have teaching and assessment. LO_05 to LO_09 are open. Next: `ABM-B-U02-B002` from printed p. 215 (PDF p. 230).
