# Batch ABM-A-U08-B001 — evidence and review record

Paper ABM, Module A unit 8 "Linear Programming" (`ABM::MOD_A::U08`). Thirty-three items: 7 concept cards, 4 worked examples, 13 choice questions and 9 numerical questions. Record written 14 November 2026.

## Evidence

Source `S01` *Advanced Bank Management* (CAIIB courseware), scanned pages read directly with `scripts/render-page.mjs` (printed page n = PDF page n + 15). Pages read: printed pp. 152 to 160 (PDF pp. 167 to 175), the whole unit including keywords and terminal questions. Printed p. 151 (title page) was not read. All 9 facts in `staging.json` carry a printed page and section. No regulation is stated, so session applicability is not applicable.

## Courseware differences

| Courseware | What the items teach |
| --- | --- |
| After its three simplex tableaux it states that "m = 6", that workshop 1 is not fully used and that workshops 2 and 3 are working to full capacity (printed p. 159) | Its own final tableau has the slack of 6 under p, the third workshop (C <= 10, with C = 4); the first two workshops are fully used (4 x 24 + 6 x 4 = 120; 2 x 24 + 6 x 4 = 72). The test checks the slacks (0, 0, 6) with an independent simplex. Fact F008 is `needs_review`; the card tells learners to read slacks from the tableau |
| Graphical example optimum quoted as Rs 6,670 (printed p. 155) | 6,666.67 exactly for its data (4/3 radios and 8/3 televisions); no item uses these numbers |
| Shadow prices appear in the keywords and the terminal questions but are not defined in the unit text | Defined from the optimum tableau (Z-row entry under a slack variable) and illustrated with new data; fact F009 is `needs_review` |
| Artificial variables, goal programming, financial budgeting | Named only; not developed here |

## Drafts and originality

The courseware's examples (radios and televisions by the graphical method, bats and chess sets by the simplex method) and its ten terminal questions and case studies were compared with every item.

| Area | Relationship to the book |
| --- | --- |
| Cards D001 to D007 | Rewritten around a formulation checklist, corner-point reasoning, a five-move iteration table and a scarce-or-abundant reading rule. Banking examples replace production examples |
| Worked examples D008 to D011 | The book's methods (formulate, evaluate corners, tableau iterations, read slack) on a new problem (home and vehicle loans, with the same data used for all three solution routes so the graphical and simplex answers can be compared). D010 is cross-checked against an independent tableau solver, including every intermediate tableau entry quoted |
| Questions D012 to D024 | New scenario items; none repeats a terminal question |
| Numerical D025 to D033 | New figures. D031 evaluates a small minimisation by corner points, which the courseware states in words but does not work |

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | `tests/content/batch-abm-a-u08-b001.test.ts` enumerates every vertex of each feasible region, runs an independent tableau simplex (checking Z after each iteration, the final basis, slacks and shadow prices), verifies the dual relations, reproduces the courseware's examples as corrected, and grades every numerical answer |
| Source support | passed | Pages read directly (not p. 151) |
| Session applicability | not applicable | No regulatory content |
| Originality | passed against the pages read | See table |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.

## Coverage after this batch

All four objectives of unit 8 have teaching and assessment. Next: unit 9, Simulation (printed p. 161 = PDF p. 176).
