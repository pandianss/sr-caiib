# Batch BFM-A-U02-B002 — evidence and review record

Paper BFM, unit "Liberalised Remittance Scheme (LRS) and other Remittance Facilities for Residents" (`BFM::MOD_A::U02`), objective LO_05 (tax collected at source).
Eleven items. Written 13 November 2026 by Claude Sonnet 5.5.

## Evidence

TCS rules changed on 1 April 2026, before the 30 June 2026 cut-off, so the courseware's 2020 description (S03 printed pp. 53-54) is superseded.
Primary sources, saved locally and fingerprinted in `content/sources/registry.json`:

| Source | Used for |
| --- | --- |
| `ITA2025_S394` (Income Tax Department page for section 394 of the Income-tax Act, 2025) | Table item 7 (LRS: 2% education or medical, 20% other, above ten lakh rupees), item 8 (overseas tour package 2%), sub-sections (4) and (5) (education loan, tax already collected or deducted); footnotes show the substitutions by Act No. 4 of 2026 with effect from 1 April 2026 |
| `FB2026_MEMO` (Finance Bill 2026 explanatory memorandum) | The change from 5% to 2% for education or medical treatment; tour package reduced to 2% with the threshold removed |

## Judgement calls

- **Basis of the computation.** Section 394 says "an amount or aggregate of the amounts exceeding ten lakh rupees" without stating that the rate applies to the excess only. The items compute on the part above the threshold, which is how the earlier provision worked, how the courseware examples work, and how the memorandum describes it. Each computing stem states the basis, and the ledger and the unresolved list record that explicit current wording was not retrieved.
- **Footnote wording.** The section's footnote quotes an earlier table form that reads oddly; the current clauses are used.
- **Not taught:** the 10% rate where PAN or Aadhaar is missing, and TCS on transfers to an NRO account (courseware printed p. 53): not found in the section retrieved.

## Drafts and originality

| Draft | What it is | Compared with the sources |
| --- | --- | --- |
| D001 card | Three things to know about TCS: trigger, rate by purpose, collector | Own framing of the section's table |
| D002 card | When no TCS is collected | Own ordering and wording |
| D003 worked example | Three investment remittances in a year at 20% | New figures; the courseware's examples are not reused |
| D004 card | What changed from the old courseware numbers | New |
| D005–D011 questions | Rate, threshold, collector, two numericals, education loan, tour package | New figures; correct answers vary in position |

## Review status

| Check | Status |
| --- | --- |
| Structure and mapping | passed |
| Calculations | passed (`tests/content/batch-u02-b002.test.ts`, independent recomputation, with the wrong readings checked as not accepted) |
| Source support | passed for what is taught (section 394 and the memorandum read) |
| Session applicability | passed: both sources are effective or dated before the cut-off |
| Originality | passed against the pages read |
