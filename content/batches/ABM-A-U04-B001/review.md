# Batch ABM-A-U04-B001 — evidence and review record

Paper ABM, Module A unit 4 "Correlation and Regression" (`ABM::MOD_A::U04`). Twenty-seven items: 6 concept or formula cards, 2 worked examples, 11 choice questions and 8 numerical questions. Record written 14 November 2026.

## Evidence

Source `S01` *Advanced Bank Management* (CAIIB courseware), scanned pages read directly with `scripts/render-page.mjs` (printed page n = PDF page n + 15). Pages read: printed pp. 72 to 83 (PDF pp. 87 to 98): scatter diagrams, correlation, regression, standard error of the estimate, limitations, glossary and the first terminal questions. Printed p. 71 (title page) and pp. 84 to 85 were not read. All 8 facts in `staging.json` carry a printed page and section. No regulation is stated, so session applicability is not applicable.

## Courseware error found

Example 4.1 (printed p. 77) adds the seven squares of x to 31,940; they add to 31,970. The printed r = 0.8383, line y = 39.96 + 0.3258x, prediction 62.77 and standard error 5 are therefore slightly off; the correct values are r = 0.8336, y = 40.19 + 0.3222x, 62.75 and 5.04. The test recomputes both. Fact F004 is marked `needs_review`, and no item uses the printed numbers. The courseware's statement that one standard error gives 65 per cent confidence (the usual normal-theory figure is about 68 per cent) is quoted as "roughly two-thirds" and the two-standard-error band as about 95 per cent.

## Drafts and originality

The courseware's Examples 4.1 to 4.4, its two practice exercises and its five terminal questions were compared with every item.

| Area | Relationship to the book |
| --- | --- |
| Cards D001 to D006 | Rewritten around decisions (which variable goes where, how to read the r dial, what each formula answers). The book's scatter figures are not reproduced; its rice-and-accidents illustration is used only as the stated fact and the cards use a deposits-and-ATMs case |
| Worked examples D007, D008 | Same standard methods as Examples 4.1 to 4.4 with different data (advertising spend and new accounts; covariance and variances for 20 pairs). D007 combines r, the line, a prediction and Se in one set |
| Questions D009 to D019 | New scenario items; none repeats a terminal question |
| Numerical D020 to D027 | New figures. D024 and D025 use a four-pair data set of this batch |

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | `tests/content/batch-abm-a-u04-b001.test.ts` recomputes the sums, r, slope, intercept, prediction, residuals and Se for every example, the courseware's example with both printed and corrected totals, the circle case, and grades each numerical answer |
| Source support | passed | Pages read directly (not pp. 71, 84, 85) |
| Session applicability | not applicable | No regulatory content |
| Originality | passed against the pages read | See table |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.

## Coverage after this batch

All five objectives of unit 4 have teaching and assessment. Coefficient of determination (named in the keyword list) and regression of x on y are not taught by the courseware pages read, and are not covered. Next: unit 5, Time Series (printed p. 86 = PDF p. 101).
