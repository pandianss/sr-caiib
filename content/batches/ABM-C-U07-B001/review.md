# Review record: ABM-C-U07-B001

Paper ABM, Module C unit 7 (courseware unit 23, Risk Management and Credit Rating): risks of banking, credit risk and its factors, mitigation, credit rating, internal and external ratings, scoring methodology, credit derivatives, RBI guidelines on credit risk management and the credit information system (objectives LO_01 to LO_05, registered in this batch). Forty-five items: 9 concept cards, 1 worked example, 31 choice questions and 4 numerical questions. Record written 14 November 2026.

## Evidence

Courseware `S01` printed pp. 502 to 508 (PDF pp. 517 to 523), read as page images. Primary text: `RBI_CAP_2025` paragraphs 131 to 133 (accredited rating agencies, consistency rule), `RBI_CRMD_2025` paragraphs 6 to 9 and `RBI_IRACP_2025` paragraph 11 (credit risk management duties, CRILC use). The tests check key phrases against the local copies.

## Limits and what was held back

- The courseware's guidelines 4 to 7 (Director Identification Number, wilful defaulter list, special audit) rest on the wilful defaulter master circular of 1 July 2015, not retrieved; not taught. The wilful defaulter and resolution directions are needed for the next unit.
- Credit information thresholds and fees (circulars of 2014 and 2015), the number and names of Credit Information Companies, and the CRILC reporting threshold are not taught; the credit information card is `needs_review`.
- RBI's position on credit derivatives (plain vanilla credit default swaps only, its worry about complexity) was not checked against current RBI directions and is not taught; only the concepts of CDS and CLN are taught.
- CareEdge Global IFSC Limited is not taught (the words after "non-resident corporate exposures" in paragraph 132(i) were deleted from 18 May 2026 and the paragraph was substituted on 7 October 2026, after the cut-off).
- The courseware lists SMERA; the Directions list Acuite, which is taught.

## Drafts and originality

Tables and procedures are written afresh; the worked example and numerical questions use new figures (a 30, 40, 30 scoring model and an expected loss of Rs 1.8 crore). Answer positions are spread across A to D by construction. Distractor explanations are brief.

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | `tests/content/batch-abm-c-u07-b001.test.ts` recomputes the worked example and four numerical answers and checks key phrases against the local Directions |
| Source support | primary text for the rating agency list and credit risk duties; courseware for the rest | See limits |
| Session applicability | passed on its face | Post-cut-off changes excluded |
| Originality | passed | See above |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.
