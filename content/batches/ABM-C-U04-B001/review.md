# Review record: ABM-C-U04-B001

Paper ABM, Module C unit 4 (courseware unit 20, Term Loans): term loans, deferred payment guarantees, project appraisal, commercial appraisal ratios, project and infrastructure finance, partial credit enhancement and take-out financing (objectives LO_01 to LO_05, registered in this batch). Seventy items: 13 concept cards, 5 worked examples, 41 choice questions and 11 numerical questions. Record written 14 November 2026.

## Evidence

Courseware `S01` printed pp. 469 to 480 (PDF pp. 484 to 495), read as page images. Method, formulas and descriptions are the courseware's. Regulatory rules are from `RBI_CF_2025_PDF` (Credit Facilities Directions 2025: Chapter VII project finance paragraphs 72 to 87, Chapter IX infrastructure financing paragraphs 134 to 143, Chapter XVI paragraphs 422 to 432 on partial credit enhancement) and `RBI_TDCR_2025` paragraph 15 (take-out financing). The tests check key phrases against the local copies.

## Limits and what was held back

- DCCO deferment, cost overrun and change in scope conditions (courseware pp. 478 to 480) come from the Resolution of Stressed Assets Directions, 2025, which was not retrieved; not taught, left for Module C unit 8.
- The courseware's promoter equity financing conditions rest on paragraph 137, deleted with effect from 1 July 2026; not taught. Paragraph 78 and 80 explanations inserted on 15 July 2026 (after the cut-off) are not taught.
- The courseware's partial credit enhancement limit of 20 per cent for a single bank (2015 and 2016 circulars) is replaced by 50 per cent from paragraph 426.
- The infrastructure sector list (Gazette of 8 April 2016) is taught only as five broad heads (needs_review).
- Courseware slips recorded: the break even formula prints Rs 200 for Rs 2,000; the risk bands have a gap between 65 and 66 (taught as a rule of thumb without boundary questions); its IRR formula is not the usual definition (the definition is taught); the ideal DSCR range is its own guidance.
- The copy of the Directions is later than the cut-off (updated October 2026); no amendment to paragraphs 72 to 87, 134 to 143 and 422 to 432 is marked after 30 June 2026 other than those noted.

## Drafts and originality

Tables and procedures are written afresh; the courseware's break even example (capacity 1,000, fixed cost 2,000, variable cost 7, price 12) is a standard textbook illustration and is reused with its own results because it carries the courseware's own worked figures; other worked examples and numerical questions use new figures. Answer positions are spread across A to D by construction. Distractor explanations are brief.

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | `tests/content/batch-abm-c-u04-b001.test.ts` recomputes the five worked examples and all eleven numerical answers and checks key phrases against the local Directions |
| Source support | courseware for method; primary text for project finance, infrastructure and PCE | See limits |
| Session applicability | passed on its face | Post-cut-off insertions excluded |
| Originality | passed with the noted exception | See above |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.
