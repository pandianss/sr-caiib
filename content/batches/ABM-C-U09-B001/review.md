# Review record: ABM-C-U09-B001

Paper ABM, Module C unit 9 (courseware unit 25, Resolution of Stressed Assets under the Insolvency and Bankruptcy Code 2016): the Code, its coverage and institutions, the shift to creditors in control, the corporate insolvency resolution process (initiation, moratorium, time limit, committee of creditors, model timeline), section 29A, resolution plans, liquidation and the order of priority, and the pre-packaged process (objectives LO_01 to LO_05, registered in this batch). Sixty-two items: 11 concept cards, 3 worked examples, 42 choice questions and 6 numerical questions. Record written 14 November 2026.

## Evidence

Courseware `S01` printed pp. 531 to 551 (PDF pp. 546 to 566), read as page images. Statute: `IBC_2016_CONSOLIDATED_2021` (the IBBI consolidation up to 12 August 2021: sections 4, 7(1), 12, 14, 21, 22, 29A, 30(4), 33, 53, 54 and 54A to 54D) and `IBC_AMENDMENT_ACT_2026` (sections 7, 12A, 14, 16, 33 and 53 amendments read). The tests check key phrases against the local copies.

## Limits and what was held back

- The post-amendment consolidated Code (India Code, 2 July 2026) and commencement notification S.O. 2625(E) were not retrieved. A search summary reports that 56 of the 72 sections of the 2026 Act came into force on 26 May 2026 (before the cut-off); the creditor-initiated process and group insolvency were reported as not in force. Only some amendments were read; section 30(2) (plan contents), section 33 additions and the pre-pack cross-references were not compared in full, so those cards are marked needs_review or taught only as the courseware's account.
- The regulation-level material (model CIRP timeline, information memorandum, evaluation matrix, liquidation regulations) is from IBBI regulations amended up to 4 July 2025 as the courseware states and is `needs_review`.
- The courseware's Rs 1 crore default threshold for CIRP (section 4 sets Rs 1 lakh, with a Government power to raise it to Rs 1 crore) and its statement that a pre-pack is for MSME defaults "up to Rs 1 crore" (a misreading of section 4) are not taught as stated.
- The courseware's statements on the CoC quorum (33 per cent), routine decisions (51 per cent) and the number of insolvency professional agencies are not in the sections read; flagged or not taught.

## Drafts and originality

Tables and procedures are written afresh; worked examples and numerical questions use new figures (Rs 400, 300, 200 and 100 crore of debt; Rs 60 crore of liquidation proceeds; Rs 300 lakh pre-pack debt). Answer positions are spread across A to D by construction. Distractor explanations are brief.

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | `tests/content/batch-abm-c-u09-b001.test.ts` recomputes the three worked examples and six numerical answers and checks key phrases against the local Code and Act |
| Source support | statute for the sections listed; courseware for the rest (needs_review) | See limits |
| Session applicability | NOT fully established | The 2026 amendments in force at the cut-off were only partly compared |
| Originality | passed | See above |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.
