# Review record: ABM-D-U02-B001

Paper ABM, Module D unit 2 (courseware unit 27, Compliance Audit): risk based internal audit and the lines of defence, internal audit principles and fraud risk, the Board, the Audit Committee and the Head of Internal Audit, reporting and test checking of compliance breaches, financial statement disclosure rules, accounting standards for banks and the SEBI Listing Regulations disclosures (objectives LO_01 to LO_07, registered in this batch). Ninety items: 18 concept cards, 1 worked example, 66 choice questions and 5 numerical questions. Record written 14 November 2026.

## Evidence

Courseware `S01` printed pp. 568 to 591 (PDF pp. 583 to 606), read as page images. Primary sources: `RBI_HIA_2021` (RBI circular RBI/2020-21/83 of 7 January 2021 on the risk based internal audit framework and the Head of Internal Audit) and `RBI_FS_2025` (Reserve Bank of India (Commercial Banks - Financial Statements: Presentation and Disclosures) Directions, 2025, copy updated as on 1 June 2026, retrieved from a public mirror of the RBI document). Key phrases from both are tested against the saved text.

## Where the courseware was corrected

- **Applicability.** The courseware describes the 2021 Master Direction, which covered Local Area Banks, Small Finance Banks, Payments Banks, RRBs and co-operative banks. The 2025 Directions repealed it and cover Commercial Banks only; the items teach the 2025 scope.
- **AS 25.** The courseware says the 2001 half-yearly review under AS 25 is extended to all banks. The 2025 Directions say AS 25 is not mandatory for listed banks' quarterly reporting, though its recognition and measurement principles apply. The items teach the 2025 text.
- **Inter-branch accounts.** The courseware omits the six-month netting and the 100 per cent provision on the aggregate net debit without cross-category set-off; these are taught from the Directions and tested numerically.
- **Listing Regulations.** The courseware's prior intimation periods (two, five and eleven working days), the 48 hour newspaper rule and the Schedule III item lists predate later amendments. They are not tested as numbers or complete lists.

## Limits and what was held back

- The SEBI consolidated Regulations as at 30 June 2026 could not be retrieved (page unavailable). Regulation 29, 30, 46 and 47 content is the courseware's account (needs_review). Secondary sources report that a May 2024 amendment made prior intimation at least two clear working days; unverified at SEBI.
- The sixteen internal audit principles, the Audit Committee particulars (independent non-Board chair, two-thirds majority, written dissent, quarterly meetings) and the reporting framework and test checking are the courseware's account (needs_review).
- The HIA circular was current when retrieved; whether later consolidation of RBI instructions into Directions changed it was not checked.
- Not taught: Schedule 17 and 18 references, the courseware's statement on placing strictures in the public domain, AS 15, AS 21 and AS 22 summaries and the deferred tax note.

## Drafts and originality

Tables and procedures are written afresh; the worked example and numerical questions use new figures. Answer positions are spread across A to D by construction. Distractor explanations are brief.

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | `tests/content/batch-abm-d-u02-b001.test.ts` recomputes the worked example and five numerical answers and checks key phrases against both RBI texts |
| Source support | HIA circular and 2025 Directions for the rules taught as current; courseware for the rest (needs_review) | See limits |
| Session applicability | passed for the sources retrieved | SEBI text not retrieved |
| Originality | passed | See above |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.
