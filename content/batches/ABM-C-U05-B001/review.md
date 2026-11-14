# Review record: ABM-C-U05-B001

Paper ABM, Module C unit 5 (courseware unit 21, Credit Delivery and Straight Through Processing): documentation, registration of charges, third-party guarantees, charges and possession, disbursal of working capital and term loans, the loan system, the 2026 account framework, consortium, multiple banking and syndication, and STP (objectives LO_01 to LO_05, registered in this batch). Sixty-three items: 11 concept cards, 3 worked examples, 43 choice questions and 6 numerical questions. Record written 14 November 2026.

## Evidence

Courseware `S01` printed pp. 482 to 493 (PDF pp. 498 to 508), read as page images. Regulatory content is taught from the primary Directions: `RBI_CRMD_2025` (Credit Risk Management Directions, 2025: Chapter X CERSAI, Chapter XIA cash credit, current and overdraft accounts inserted with effect from 1 April 2026, Chapter XII loan system), `RBI_TDCR_2025` (paragraphs 127 to 129 on consortium and multiple banking) and `RBI_CF_2025_PDF` (paragraph 83 on disbursal in project finance). The tests check key phrases against the local copies. The copies are later versions (updated October 2026); no amendment after the 30 June 2026 cut-off is marked on the chapters used.

## Limits and what was held back

- The courseware's statement that no account may be opened with another bank without permission is superseded by the 2026 account framework and not taught.
- The courseware's 20 per cent credit conversion factor for undrawn limits is not in the 2025 text (it refers to the Capital Adequacy Directions); not taught.
- Registrar of Companies, sub-registrar, aircraft and ship registration statements are the courseware's (needs_review); the courseware's true or false item says 60 days where its text says 30.
- The RBI suggestions on directors' personal guarantees and the no-consideration rule are older circulars not in the 2025 text (needs_review). Consortium guideline items (vi) and (vii) are not in paragraph 128 and are not taught.
- Statutory restrictions on advances (Banking Regulation Act sections 19 and 20, remission of debts) and related party lending are in `RBI_CRMD_2025` Chapters IV and V and were read in part; they are not yet taught and remain on the Module C unit 1 LO_07 gap.
- Syndication is described only in the courseware's general terms.

## Drafts and originality

Tables and procedures are written afresh; the worked examples and numerical questions use new figures. Answer positions are spread across A to D by construction. Distractor explanations are brief.

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | `tests/content/batch-abm-c-u05-b001.test.ts` recomputes three worked examples and six numerical answers and checks key phrases against the local Directions |
| Source support | primary text for the loan system, account framework, CERSAI and consortium rules; courseware for the rest | See limits |
| Session applicability | passed on its face | Chapter XIA in force from 1 April 2026 |
| Originality | passed | See above |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.
