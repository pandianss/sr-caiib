# Batch ABM-A-U03-B001 — evidence and review record

Paper ABM, Module A unit 3 "Measures of Central Tendency & Dispersion, Skewness, Kurtosis" (`ABM::MOD_A::U03`). Forty-seven items: 12 concept or formula cards, 8 worked examples, 16 choice questions and 11 numerical questions. Record written 14 November 2026.

## Evidence

Source `S01` *Advanced Bank Management* (CAIIB courseware), scanned pages read directly with `scripts/render-page.mjs` (printed page n = PDF page n + 15). Pages read: printed pp. 47 to 70 (PDF pp. 62 to 85), the whole unit including the keyword list and terminal questions. Printed p. 46 (unit title page) was not read. All 16 facts in `staging.json` carry a printed page and section. The unit states no regulation, so session applicability is not applicable.

## Where the courseware differs from the standard result

Three facts are marked `needs_review` or carry a stated difference, and the items follow the standard result with the courseware's version recorded here:

| Courseware | Standard result used in the items |
| --- | --- |
| Printed p. 53 orders the means AM > HM > GM | AM > GM > HM for positive values not all equal; D004 and the ordering question (D024) teach this. The courseware's relation AM x HM = GM squared for two numbers is correct and is taught |
| Example 14, p. 53: H.M. = 64/6 = 4 | 64/16 = 4 (the answer is right, the printed division is not) |
| Printed p. 68: beta1 "sign is the sign of mu3"; beta2 compared with 0, "mesokurtic" listed twice; Example 32 gives beta2 = 0.025 | beta1 = mu3 squared over mu2 cubed cannot be negative, so the direction of skew is read from the sign of mu3. beta2 = mu4 over mu2 squared is 3 for the normal curve; the card states the courseware's comparison with 0 as the excess form. From the courseware's own table mu4 = 36,000 and mu2 = 120, so beta2 = 2.5 (checked in the test) |

A learner will meet the courseware's wording in the book. The kurtosis card tells them which form is which and to check the form a question uses, and no choice or numerical question depends on the 0 versus 3 convention.

## Drafts and originality

The courseware's Examples 1 to 32 and its six terminal questions were compared with every item.

| Area | Relationship to the book |
| --- | --- |
| Cards D001 to D012 | Reorganised into comparison tables and decision rules (when the mean misleads, choosing among averages, reading CV). No sentence or table structure is reproduced |
| Worked examples D013 to D020 | Same standard methods as the book's examples (combined and corrected mean, missing frequency, grouped median, quartiles, mode, MD, SD, moments), with different data. D013 pools three staff groups (the book pools student groups and workers); D016 to D019 share one new 120-loan table; D015 pairs growth with average speed and checks AM x HM = GM squared on the speeds |
| Questions D021 to D036 | New scenario items in banking settings. D022 is the weighted-pooling idea of book Example 7 in a different setting |
| Numerical D037 to D047 | New figures. D037 (missing eighth value) and D039 (geometric mean of three numbers) follow the book's example types; D045 uses a classic eight-number data set with an exact standard deviation. None reuses a book number set |

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | `tests/content/batch-abm-a-u03-b001.test.ts` recomputes every worked example and numerical answer, the mean-median-mode relation on the shared table, the moments, the AM, GM, HM ordering, and grades each expected answer. The grouped mode answer (24.1176) is not a tie at 2 decimals |
| Source support | passed | Pages read directly |
| Session applicability | not applicable | No regulatory content |
| Originality | passed against the pages read | See table |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.

## Coverage after this batch

All seven objectives of unit 3 (LO_01 to LO_07) have teaching and assessment. Next: unit 4, Correlation and Regression (printed p. 71 = PDF p. 86).
