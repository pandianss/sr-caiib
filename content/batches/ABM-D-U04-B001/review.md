# Review record: ABM-D-U04-B001

Paper ABM, Module D unit 4 (courseware unit 29, Framework for Identification of Compliance Issues and Compliance Risks): compliance issues and challenges, compliance risk and how it is identified, principles for the compliance function, the compliance risk management function and due diligence, operational risk, inherent and residual risk, the main banking risks, compliance risk assessment, independent testing and the audit programme, the certificate reporting framework, inspection and audit, loan review and credit audit, and what good compliance delivers (objectives LO_01 to LO_07, registered in this batch). Seventy-eight items: 13 concept cards, 1 worked example, 60 choice questions and 4 numerical questions. Record written 14 November 2026.

## Evidence

Courseware `S01` printed pp. 613 to 633 (PDF pp. 628 to 648), read as page images. The only primary check is `RBI_CCO_2020` (RBI circular of 11 September 2020): the annual compliance risk assessment and activity plan, the submission to the ACB, internal audit of the compliance function and the three-year external review of the quality assurance programme. Those phrases are tested against the saved text.

## Limits and what was held back

- The unit is almost entirely the courseware's account. The loan review and credit audit material (checklist, scope, the 3 month, 6 month and 1 year frequencies, the 5 to 10 per cent random sample, procedure) is the courseware's account of RBI guidelines whose circulars were not retrieved (needs_review).
- The compliance risk scoring table, the certificate periodicity (5 and 10 days, monthly for overseas branches) and the test checking parameters are the courseware's illustration of bank practice, not RBI-prescribed figures (needs_review).
- The inherent and residual risk formulae are the courseware's information security framing.
- The challenges commentary (geopolitics, divergence, data, resilience, credit cycles, easing of buffers "in some countries", agility, financial crime, trust, ethics) is the courseware's commentary on trends, not a regulatory requirement.
- The courseware's check-your-progress answers were not used (the key for question 1 does not match the options).

## Drafts and originality

Tables and procedures are written afresh; the worked example and numerical questions use new figures. Answer positions are spread across A to D by construction. Distractor explanations are brief.

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | `tests/content/batch-abm-d-u04-b001.test.ts` recomputes the reporting calendar, the score bands and four numerical answers and checks key phrases against the circular |
| Source support | circular for the policy and review rules; courseware for the rest (needs_review) | See limits |
| Session applicability | passed for the circular | 2026 Directions are post cut-off |
| Originality | passed | See above |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.
