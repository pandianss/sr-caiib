# Review record: ABM-C-U01-B003

Paper ABM, Module C unit 1 (courseware unit 17), part 3: special mention accounts, asset classification, income recognition, provisioning and the large exposures limits (objectives LO_09 and LO_10, registered in this batch). Fifty-seven items: 10 concept cards, 2 worked examples, 37 choice questions and 8 numerical questions. Record written 14 November 2026.

## Evidence

Courseware source `S01`: printed pp. 415 to 419 (PDF pp. 430 to 434). Primary sources read: `RBI_IRACP_2025` (Income Recognition, Asset Classification and Provisioning Directions, 2025; paragraphs 5, 42-46, 63-71, 80-96, 118, 124-136) and `RBI_CONC_2025` (Concentration Risk Management Directions, 2025; Large Exposures Framework paragraphs 4, 15, 16, 18, 20, 25, 62-66, 79 and the deletion note on Chapter IV). Every fact except the SMA categories is supported by the primary text. The SMA categories (SMA-0, SMA-1, SMA-2) come from the courseware only and are marked `needs_review`.

## Limits and what was held back

- The IRACP copy is marked as updated on 1 October 2026 and contains amendments effective 1 July 2026, after the 30 June 2026 cut-off (item (6) of paragraph 80 deleted; paragraphs 84A to 84D inserted). They are not taught.
- The courseware's statement that no provision is needed on the guaranteed portion of ECGC or CGTMSE covered accounts conflicts with paragraph 85 (15 per cent without allowance for ECGC cover). Not taught.
- The Credit Guarantee Fund Scheme for Micro and Small Enterprises material (printed pp. 418 to 419) was not checked against a primary source. Not taught.
- The courseware's accelerated provisioning table is in the Directions only for wilful defaulter directors (paragraph 118); the rates are not taught.
- The courseware's large borrower, Specified Borrower and loan system material is out of date (the chapter was deleted from 1 January 2026) and is not taught. Other exposure norms were not read.
- The courseware's 0.25 per cent standard asset group omits individual housing loans; the Directions are followed.

## Drafts and originality

Teaching text, tables, questions and examples were written independently from the facts. Worked examples and numerical questions use new figures (a Rs 80 lakh doubtful loan with Rs 50 lakh security; Tier 1 capital of Rs 5,000 crore and Rs 8,000 crore). Answer positions are spread across A to D by construction. Distractor explanations are brief.

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | `tests/content/batch-abm-c-u01-b003.test.ts` recomputes the provisioning band logic, the worked examples and all numerical answers, and checks key phrases against the local copies of both Directions when present |
| Source support | passed for primary-supported facts; SMA categories courseware only | See above |
| Session applicability | passed on its face | Post-cut-off amendments identified and excluded |
| Originality | passed | See above |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.

## Coverage after this batch

LO_09 and LO_10 have teaching and assessment. Module C unit 1 still has gap records on LO_05, LO_06 and LO_07 and the courseware pages from printed p. 419 are only partly used.
