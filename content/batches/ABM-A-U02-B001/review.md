# Batch ABM-A-U02-B001 — evidence and review record

Paper ABM, Module A unit 2 "Sampling Techniques" (`ABM::MOD_A::U02`). Thirty-three items: 10 concept or formula cards, 3 worked examples, 14 choice questions and 6 numerical questions. Record written 14 November 2026.

## Evidence

Source `S01` *Advanced Bank Management* (CAIIB courseware), scanned pages read directly with `scripts/render-page.mjs` (printed page n = PDF page n + 15). Pages read: printed pp. 17 to 42 (PDF pp. 32 to 57): unit opening, sampling types, random sampling, sampling distributions, normal and non-normal populations, central limit theorem, finite population multiplier, glossary, equations and the start of the terminal questions. Printed pp. 43 to 45 (remaining multiple-choice questions, answers, probability table annexure) were not read. All 18 facts in `staging.json` carry a printed page and section. The unit states no regulation, so session applicability is not applicable.

## Drafts and originality

The courseware's worked illustrations (heights of five boys, tyre life of five owners, savings accounts, bank tellers' earnings, credit card balances, tools, coin tosses, textile firms) and its terminal questions were compared with every item.

| Area | Relationship to the book |
| --- | --- |
| Cards D001 to D006, D008, D010 | Reorganised as decisions and comparison tables (judgement versus random, stratified versus cluster, notation grid). Book wording and examples are not reused |
| Formula cards D007, D009 | Same standard formulas (standard error, z, finite population multiplier); common errors, assumptions and the 5 per cent rule framing are new |
| Worked example D011 | Same idea as the book's five-boys table (list every sample, mean of means equals the population mean). New population (loan officers 10, 20, 30, 40), and it adds the exact check of the sampling variance against the finite-population formula, which the book does not do |
| D012 | Central limit theorem application like the book's tellers example, with different quantities, a two-sided probability and a skewed-population framing. **Closest to a book problem in method**; the numbers and task differ |
| D013 | Finite population multiplier with new numbers and a decision on whether to apply it |
| Questions D014 to D027 | Scenario items in banking settings. The book's terminal questions are definitional or true/false; D020 and D021 test the same stratified-versus-cluster distinction as book Questions 7 and 16.4 but through different scenarios and wording |
| Numerical D028 to D033 | New figures and tasks. D033 (mean of sample means) mirrors the book's illustration in a new population |

## Known points

- The book's figure 31.63 for sigma = 100 and n = 10 comes from rounding the square root of 10 to 3.162; the exact value is 31.62. The card quotes the book's figure as the courseware's illustration, and the test records the difference.
- Standard normal areas used in D012 (0.3413 and 0.4332) were checked by numerical integration in the test, not read from the courseware annexure. The table sum 0.6826 differs from the exact 0.6827 by rounding; the item states both.
- The unit objectives on printed p. 18 name hypothesis testing; the unit does not teach it, so no item covers it.
- The book's Example 1 (printed p. 34) mixes up sample sizes in part (b); it was not used.

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | `tests/content/batch-abm-a-u02-b001.test.ts` recomputes the enumeration, variances, z values, normal areas (by integration), the multiplier, and every numerical answer, and grades each |
| Source support | passed | Pages read directly (not pp. 43 to 45) |
| Session applicability | not applicable | No regulatory content |
| Originality | passed against the pages read | See table |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.

## Coverage after this batch

All five objectives of unit 2 (LO_01 to LO_05) have teaching and assessment. Next: unit 3, Measures of Central Tendency and Dispersion (printed p. 46 = PDF p. 61).
