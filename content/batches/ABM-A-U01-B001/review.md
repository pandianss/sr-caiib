# Batch ABM-A-U01-B001 — evidence and review record

Paper ABM, Module A unit 1 "Definition of Statistics, Importance & Limitations & Data Collection, Classification & Tabulation" (`ABM::MOD_A::U01`). Thirty items: 9 concept or formula cards, 3 worked examples, 12 choice questions and 6 numerical questions. Record written 14 November 2026.

## Evidence

Source `S01` *Advanced Bank Management* (CAIIB courseware), scanned pages read directly with `scripts/render-page.mjs` (printed page n = PDF page n + 15). Pages read: printed pp. 4 to 16 (PDF pp. 19 to 31) in full, including the unit's worked problems and terminal questions, plus the syllabus page (PDF p. 10 of the book) and the contents page. All 15 facts in `staging.json` carry a printed page and section. The unit states no regulation, rule date or regulatory figure, so session applicability is not applicable.

## Drafts and originality

The courseware's solved problems 1 to 9 and its six terminal questions were compared with every item.

| Area | Relationship to the book |
| --- | --- |
| Concept cards D001 to D006, D009 | Reorganised around the learner's decisions (four phases, the "can it be a number" test, primary versus secondary trade-off, bases of classification). Banking examples are new. No table or sentence structure is reproduced |
| Formula cards D007, D008 | Book gives the formulas as a list; here they are bundled with common errors and a different explanation. Frequency density is taught with a reason for using it |
| Worked examples D010 to D012 | Same methods as book Example 3 and Problems 1, 3, 5 and 6, with different data and tasks (loan classes, unequal-width balance classes with density, a raw list of accounts per customer). D011 adds frequency density, which the book defines but does not apply |
| Questions D013 to D024 | Scenario items in banking settings. The book's own questions ask for definitions in words; none is reused |
| Numerical D025 to D030 | D025 asks for the number of classes given a width (the book's Question 2 asks for the width given a number of classes, so the task is inverted); the rest have no counterpart in the book |

## Known points

- The book lists "age in years" as a discrete variable; D004's expanded text says age is continuous in principle and that the recording decides.
- Book Problem 2 (marks of 20 students) was not reproduced and its class counts were not rechecked.
- D004 (self-check) and D014 use "attribute" as the courseware does; there is no separate treatment of ordinal data.

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | `tests/content/batch-abm-a-u01-b001.test.ts` recomputes boundaries, marks, percentage frequency, density, cumulative counts, the tally and all six numerical answers, and grades each expected answer |
| Source support | passed | Pages read directly |
| Session applicability | not applicable | No regulatory content |
| Originality | passed against the pages read | Compared with printed pp. 4 to 16 only |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026 to accept agent-only review.

## Coverage after this batch

All five objectives of unit 1 (LO_01 to LO_05) have teaching and assessment. Next: unit 2, Sampling Techniques (printed p. 17 = PDF p. 32).
