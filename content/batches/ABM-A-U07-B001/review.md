# Batch ABM-A-U07-B001 — evidence and review record

Paper ABM, Module A unit 7 "Estimation" (`ABM::MOD_A::U07`). Thirty-six items: 8 concept or formula cards, 5 worked examples, 12 choice questions and 11 numerical questions. Record written 14 November 2026.

## Evidence

Source `S01` *Advanced Bank Management* (CAIIB courseware), scanned pages read directly with `scripts/render-page.mjs` (printed page n = PDF page n + 15). Pages read: printed pp. 135 to 150 (PDF pp. 150 to 165), the whole unit including glossary and terminal questions. Printed p. 134 (title page) was not read. All 10 facts in `staging.json` carry a printed page and section. No regulation is stated, so session applicability is not applicable.

## Courseware checks and differences

- The test reproduces the courseware's figures: standard error 0.707 and the three intervals (35.293 to 36.707, 34.586 to 37.414, 33.879 to 38.121); the wiper-blade interval 19.82 to 22.18; the finite-population example (Rs 129.57; limits Rs 11,587.50 and Rs 12,012.50, within rounding of its square root); the confidence levels 0.683, 0.955 and 0.997 (exact 0.6827, 0.9545 and 0.9973) and the multipliers 1.64, 1.96 and 2.58 (checked by numerical integration); the five-diameter variance 0.00055; the syringe standard deviation 6.01 (divisor n - 1).
- The proportion example prints limits 0.253 to 0.547 after rounding the standard error to 0.057; unrounded they are 0.254 to 0.546. Fact F010 records both and the card says so.
- Table 7.2 (printed p. 138) prints one squared deviation as 881 where (-9) squared is 81; the printed total (1,228) uses 81. No item uses that table.
- The courseware calls plus or minus 2 standard errors a 95.5 per cent interval; the exact multiplier for 95 per cent is 1.96. The items use each figure as the courseware states it, and the numerical item D036 asks for the courseware's 95.5 and accepts only that value.
- The courseware names hypothesis testing as the second area of inference but does not teach it in this unit. No item covers it.

## Drafts and originality

The courseware's examples (syringe cartons, taxi mileage, batteries, wiper blades, family incomes, proportion of employees preferring their own retirement plan) and its twenty-five terminal questions were compared with every item.

| Area | Relationship to the book |
| --- | --- |
| Cards D001 to D008 | Reorganised into term tables, a z-multiplier table and a "reading an interval correctly" card. No sentence is reproduced; the repeated-sampling interpretation is the book's idea in new words |
| Worked examples D009 to D013 | Same standard methods as the book with new data (loan processing times, account balances with a finite population, non-performing loans, margin versus sample size). D010 compares four confidence levels on one sample, which the book does not tabulate |
| Questions D014 to D025 | New scenario items; none repeats a terminal question |
| Numerical D026 to D036 | New figures. D032 and D033 follow the book's formulas with different values |

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | `tests/content/batch-abm-a-u07-b001.test.ts` recomputes every worked example, the courseware figures and every numerical answer, grades each, and checks the normal multipliers by integration |
| Source support | passed | Pages read directly (not p. 134) |
| Session applicability | not applicable | No regulatory content |
| Originality | passed against the pages read | See table |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.

## Coverage after this batch

All six objectives of unit 7 have teaching and assessment. Next: unit 8, Linear Programming (printed p. 151 = PDF p. 166).
