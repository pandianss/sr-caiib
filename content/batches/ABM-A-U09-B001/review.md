# Batch ABM-A-U09-B001 — evidence and review record

Paper ABM, Module A unit 9 "Simulation" (`ABM::MOD_A::U09`). Twenty-eight items: 5 concept or formula cards, 3 worked examples, 12 choice questions and 8 numerical questions. Record written 14 November 2026.

## Evidence

Source `S01` *Advanced Bank Management* (CAIIB courseware), scanned pages read directly with `scripts/render-page.mjs` (printed page n = PDF page n + 15). Pages read: printed pp. 162 to 169 (PDF pp. 177 to 184), the whole unit including keywords, the terminal case studies and questions. Printed p. 161 (unit title page) was not read. All 7 facts in `staging.json` carry a printed page and section. No regulation is stated, so session applicability is not applicable.

## Courseware checks and limits

- The courseware's milk example reproduces: the intervals 00-09, 10-39, 40-59, 60-89 and 90-99, the mean demand of 55 litres, and the day-1 and day-13 old-rule profits (-Rs 500 and -Rs 820). Its full 20-day table was not recomputed.
- Its conclusion that the new rule is more profitable rests on a single 20-day run; no item treats a short simulation as proof, and D007 and D008 show how a ten-day run differs from the exact expected profit.
- The Shrimps Galore case study and the other terminal case studies use normal random deviates and supply variation that the unit does not teach; they are not used.
- The unit objectives mention random number generation but the text shows only the use of two-digit random numbers against probability intervals; computer pseudo-random generators are not covered.

## Drafts and originality

The courseware's single worked example (daily milk ordering) and its four terminal questions were compared with every item.

| Area | Relationship to the book |
| --- | --- |
| Cards D001 to D005 | Reorganised into an intervals table, a four-move simulation loop, a stage table for the methodology and a two-column table of advantages and drawbacks. The courseware's list of application areas is condensed to examples, and no sentence is reproduced |
| Worked examples D006 to D008 | Same method as the book's milk example (intervals, lookup, sold = min(demand, order), profit) with a new product, a new distribution and an extra step: comparison of the simulation with the exact expected profit, which the book does not do |
| Questions D009 to D020 | New scenario items; none repeats a terminal question |
| Numerical D021 to D028 | New figures |

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | `tests/content/batch-abm-a-u09-b001.test.ts` rebuilds the intervals, replays the ten random numbers, recomputes both rules' daily profits and the exact expected profits by summing over the distribution, reproduces the courseware's intervals and profits, and grades every numerical answer |
| Source support | passed | Pages read directly (not p. 161) |
| Session applicability | not applicable | No regulatory content |
| Originality | passed against the pages read | See table |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.

## Coverage after this batch

All four objectives of unit 9 have teaching and assessment. This completes ABM Module A (Statistics, units 1 to 9). Next: ABM Module B, Human Resource Management, unit 10 (printed p. 173 = PDF p. 188).
