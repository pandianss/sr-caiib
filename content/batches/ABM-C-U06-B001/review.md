# Review record: ABM-C-U06-B001

Paper ABM, Module C unit 6 (courseware unit 22, Credit Control and Monitoring): purpose of monitoring and the loan review mechanism, the monitoring tools, credit audit, legal audit of title documents, and the RBI directions on credit risk evaluation, drawing power statements, review of limits and large NPAs (objectives LO_01 to LO_04, registered in this batch). Forty-six items: 8 concept cards, 2 worked examples, 31 choice questions and 5 numerical questions. Record written 14 November 2026.

## Evidence

Courseware `S01` printed pp. 495 to 499 (PDF pp. 510 to 514), read as page images. Directions: `RBI_CRMD_2025` paragraphs 6 to 12 (credit risk evaluation) and `RBI_IRACP_2025` paragraphs 10 to 24 (Board policy, drawing power statements, review of limits, stock audit and collateral valuation of NPAs of Rs 5 crore and above, advocates and valuers). The tests check key phrases against the local copies.

## Limits and what was held back

- Credit audit (RBI Guidance Note of 12 October 2002) and legal audit of title documents (circular of 7 June 2013) are the courseware's account; neither appears in the 2025 Credit Risk Management or IRACP Directions read, so those cards are `needs_review`.
- The six-month rule for excluding old receivables from drawing power is the courseware's banking practice, taught as such.
- Paragraph 12A of the Credit Risk Management Directions (calamities), inserted from 1 July 2026, is after the cut-off and not taught.
- The courseware's credit audit frequencies and sample sizes are as the courseware reports the 2002 note.

## Drafts and originality

Tables and procedures are written afresh; worked examples and numerical questions use new figures. Answer positions are spread across A to D by construction. Distractor explanations are brief.

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | `tests/content/batch-abm-c-u06-b001.test.ts` recomputes the worked examples and five numerical answers and checks key phrases against the local Directions |
| Source support | primary text for LO_04; courseware for LO_01 and LO_02; LO_03 courseware (needs_review) | See limits |
| Session applicability | passed on its face for LO_04 | Post-cut-off insertion excluded |
| Originality | passed | See above |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.
