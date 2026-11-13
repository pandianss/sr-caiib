# Batch ABM-B-U05-B001 — evidence and review record

Paper ABM, Module B unit 5 "Performance Management" (`ABM::MOD_B::U05`; courseware unit 14), part 1: performance appraisal (objectives, uses, process, methods, potential, errors), performance review, feedback, counselling and managing average performers (objectives LO_01 to LO_03). Forty-two items: 13 concept cards and 29 choice questions. Record written 15 November 2026.

## Evidence

Source `S01` *Advanced Bank Management* (CAIIB courseware), scanned pages read directly with `scripts/render-page.mjs` (printed page n = PDF page n + 15). The whole unit was read (printed pp. 308 to 337, PDF pp. 323 to 352). This batch uses printed pp. 308 to 324 (PDF pp. 323 to 339); printed pp. 324 to 337 (competence and competency, competency mapping, assessment centres, behavioural event interview, the annexure with the Potential Appraisal Report) belong to part 2, and objectives LO_04 and LO_05 are registered with no items, so the topic is not complete. Printed p. 307 (title page) was not read in detail. All 17 facts in `staging.json` carry a printed page and section. No calculations are involved.

## Limits of the evidence

The unit is descriptive. Definitions and views attributed to Flippo, Heyel, Monappa and Mirza Saiyadain and McGregor were not checked against the originals. The courseware's description of the three-part appraisal method used in banks is its own description of practice and was not checked against any bank's appraisal policy; session applicability is **not checked** (no cut-off-dated rule is stated). The "720-degree appraisal" is a courseware label for a repeated 360-degree cycle with feedback between, and is taught as such. The courseware's list of thirteen common appraisal errors gives definitions for four only; the lesson defines those four, adds a one-line meaning for the horn and recency effects (clearly marked as the standard meaning) and says the others are named without definition in the courseware.

## Drafts and originality

The courseware's prose, lists, the list of methods, the do's and don'ts and Check Your Progress statements (printed pp. 318 and 324) were compared with every item.

| Area | Relationship to the book |
| --- | --- |
| Cards D001 to D013 | Reorganised into comparison tables (traditional methods with how they work and their drawbacks, MBO advantages and disadvantages, confidential report against open appraisal, errors with meanings, do's against don'ts, strategies for average performers). The lists that are the substance of the topic (the six steps, the eight traditional and six modern methods, the thirteen errors, the characteristics of a good system) keep the courseware's terms |
| Questions D014 to D042 | New scenario or definition items; none repeats a Check Your Progress statement; answer positions are balanced across A to D by construction |

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | not applicable | None |
| Source support | passed for the courseware's account | Pages read directly; cited authors not checked |
| Session applicability | not checked | See above |
| Originality | passed against the pages read | See table |
| Question quality | partly checked | `tests/content/batch-abm-b-u05-b001.test.ts` checks structure and answer spread; no human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.

## Coverage after this batch

Objectives LO_01 to LO_03 of Module B unit 5 have teaching and assessment. LO_04 and LO_05 are open. Next: `ABM-B-U05-B002` from printed p. 324 (PDF p. 339).
