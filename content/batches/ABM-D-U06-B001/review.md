# Review record: ABM-D-U06-B001

Paper ABM, Module D unit 6 (courseware unit 31, Compliance Function and Role of Chief Compliance Officer in NBFCs): the four layers of scale based regulation, group treatment, the Upper Layer criterion and transition path, net owned fund requirements and glide path, other SBR changes (courseware), NBFC governance requirements by layer, the compliance function framework for NBFC-UL and NBFC-ML, and the appointment, tenure and reporting line of the NBFC CCO compared with banks (objectives LO_01 to LO_05, registered in this batch). Eighty-four items: 9 concept cards, 2 worked examples, 69 choice questions and 4 numerical questions. Record written 14 November 2026.

## Evidence

Courseware `S01` printed pp. 656 to 668 (PDF pp. 671 to 683), read as page images. Primary sources, retrieved as text from the RBI website: `RBI_NBFC_SBR_2025` (the 2025 Registration, Exemptions and SBR Directions, text updated as on 1 July 2026), `RBI_NBFC_GOV_2025` (the 2025 Governance Directions, updated as on 24 June 2026) and `RBI_NBFC_CCO_2022` (RBI circular of 11 April 2022). Key phrases from all three are tested against the saved text.

## Where the courseware was corrected

- **Upper Layer criteria.** The courseware's scoring methodology (top ten NBFCs by asset size always in the Upper Layer, top 50 by exposure, 70 per cent quantitative and 30 per cent qualitative weights) was replaced by the Second Amendment Directions dated 24 June 2026, which took effect on issuance before the 30 June 2026 cut-off: the Upper Layer is now NBFCs with asset size of Rs 1,00,000 crore or more per the latest audited balance sheet, with the threshold reviewed every three years. The items teach the current criterion.
- **Governance instructions.** The courseware cites the earlier governance instructions, which the 2025 Governance Directions repealed. Their requirements (Board experience, Risk Management Committee, 30 per cent management change, KMP and independent director limits, compensation policy, whistle blower mechanism, Upper Layer listing within three years) are confirmed in the Directions and taught from them.

## Limits and what was held back

- The retrieved 2025 Governance Directions show paragraph 25 requiring only a sufficiently senior CCO and a Board approved policy. The detailed CCO framework (tenure, rank, selection, reporting line, dual hatting and so on) is taught from the 2022 circular, which the courseware reproduces. Whether it was withdrawn or replaced before 30 June 2026 could not be verified; the bank circular of 2020 was repealed only by Directions dated 31 July 2026, so the 2022 circular is taught as in force. Secondary reports mention separate Compliance Function Directions in 2026 (not retrieved).
- The amendment of 29 April 2026 (effective 1 July 2026, after the cut-off) renames the Base Layer category of NBFCs without public funds and customer interface as Type I NBFC; it is not taught.
- The courseware's other SBR changes (90 days NPA glide path, Rs 1 crore IPO ceiling, ICAAP, CET1 of 9 per cent and leverage for NBFC-UL, Tier 1 based concentration limits of 25 and 40 per cent, sensitive sector exposure, loan restrictions, Large Exposure Framework, core banking solution requirement, Government owned NBFC treatment) were not verified because the NBFC prudential Directions were not retrieved (needs_review); a few single-answer items repeat the courseware's figures and are marked by that note.
- The Governance Directions PDF could not be downloaded because the RBI document host showed a bot-detection page, which was not bypassed; the RBI web page text was used instead.

## Drafts and originality

Tables and procedures are written afresh; the worked examples and numerical questions use new figures. Answer positions are spread across A to D by construction. Distractor explanations are brief.

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | `tests/content/batch-abm-d-u06-b001.test.ts` recomputes the group classification and CCO rank and tenure worked examples and four numerical answers and checks key phrases against the three RBI texts |
| Source support | three RBI texts for the rules taught as current; courseware for the rest (needs_review) | See limits |
| Session applicability | passed for the amendments in force at 30 June 2026; 2022 circular status unverified | See limits |
| Originality | passed | See above |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.
