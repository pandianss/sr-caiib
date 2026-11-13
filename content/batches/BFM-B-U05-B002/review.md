# Batch BFM-B-U05-B002 — evidence and review record

Paper BFM, unit "Credit Risk" (`BFM::MOD_B::U05`), new objective LO_08 (additional reading).
Thirty-four items. Written 16 November 2026 by Claude Sonnet 5.5.

## Evidence

| Source | Used for |
| --- | --- |
| `S03` (courseware, printed pp. 452-454, read from the page images) | Altman Z score and its five ratios, the 1.81 cut-off, the default probability from interest rates, the collateral exposure formula, the rating transition matrix and how to read it |
| `RBI_CAP_2025` (Capital Adequacy Directions, 2025, primary; paragraphs 161 to 163 and Table 27) | E* formula, premium and discount nature of haircuts, no exposure haircut on loans, haircut on repo-style exposures, 8 per cent currency mismatch haircut |

## Differences found and limits of the evidence

- The courseware illustration applies an exposure-weighted average haircut of 9 per cent to loan exposures and gets an exposure after mitigation of ₹87 crore. The Directions state that loans and investments take no exposure haircut, which on the same figures gives ₹60 crore. The lesson teaches the Directions, states the courseware variant, and the calculation test reproduces both figures.
- The courseware states its default probability example as 3 per cent; the unrounded result is 3.11 per cent. Items compute unrounded.
- The no-recovery assumption behind the default probability formula is the author's reading of the formula (equating the two expected payoffs); the courseware does not state it.
- The Altman coefficients, the 1.81 cut-off and the definition of X4 are the courseware's. No external source on the Z model was read, and no claim is made about its fit to Indian borrowers.
- The courseware's examples (Mahan Bank, LM Ltd, its matrix with AAA to D grades) are not reproduced; all figures and the matrix here are new. The courseware's risk weights in the example (20 per cent, 10 per cent) are not used.
- The reviewer is the authoring agent; no independent or human review.

## Drafts and originality

| Draft | What it is |
| --- | --- |
| D001-D004 cards | Z score; default probability from rates; exposure after collateral; transition matrix |
| D005-D008 worked examples | Two Z scores; implied default; loans against repo-style exposure; the BB row |
| D009-D026 questions | New stems; answer positions vary |
| D027-D034 numeric | Z scores, implied default, E* with and without currency mismatch, transition counts |

## Review status

| Check | Status |
| --- | --- |
| Structure and mapping | passed (`tests/content/batch-b5-b002.test.ts`) |
| Calculations | passed: D005 to D008 and D027 to D034 recomputed independently with exact decimals |
| Source support | passed with the limits above |
| Originality | passed against the pages read |
