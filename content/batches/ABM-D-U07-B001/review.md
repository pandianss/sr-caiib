# Review record: ABM-D-U07-B001

Paper ABM, Module D unit 7 (courseware unit 32, Fraud and Vigilance in Banks): definitions of fraud and forgery and the criminal law now in force, where frauds are committed, cyber threats and cybercrimes, payment fraud reporting, fraud risk governance, early warning signals and red flagging, reporting to law enforcement agencies and RBI, closure, cheque frauds, legal audit and dates, vigilance in banks, the vigilance angle, departmental investigation and punishments, the twelve sutras and the RBI internal vigilance guidelines for private sector and foreign banks (objectives LO_01 to LO_08, registered in this batch). One hundred and thirty-three items: 17 concept cards, 2 worked examples, 110 choice questions and 4 numerical questions. Record written 14 November 2026.

## Evidence

Courseware `S01` printed pp. 669 to 702 (PDF pp. 685 to 717), read as page images. Primary sources: `RBI_FRM_2024` (the RBI Master Directions on Fraud Risk Management in Commercial Banks and AIFIs of 15 July 2024), `RBI_CIV_2011` (the RBI circular of 26 May 2011 on internal vigilance in private sector and foreign banks) and `NCRB_BNS_IPC_TABLE` (the BNS and IPC correspondence table). Key phrases are tested against the saved texts.

## Where the courseware was corrected or superseded

- **Criminal law.** The courseware cites the Indian Penal Code and the Code of Criminal Procedure. The Bharatiya Nyaya Sanhita, 2023 replaced the IPC from 1 July 2024; the items teach the BNS equivalents confirmed in the NCRB table (fraudulently = section 2(9); forgery = 336(1); making a false document = 335).
- **Fraud reporting and monitoring.** The courseware reproduces older material (an amount-wise table for lodging complaints starting at Rs 10,000, cheque fraud preventive measures and thresholds of the 2014 circular, the quarterly and annual review of frauds of the earlier framework). The items teach the 2024 Master Directions (the LEA thresholds of Rs 1 crore for private and foreign banks and Rs 6 crore for PSBs and RRBs, the periodic review by senior management and the Board or ACB) and do not teach the older figures.

## Limits and what was held back

- The Reserve Bank of India (Commercial Banks - Fraud Risk Management) Directions, 2026 (31 July 2026) and the Commercial Banks Miscellaneous Supervisory Directions, 2026 (31 July 2026, which consolidate the vigilance circular) are after the 30 June 2026 cut-off and are not taught.
- The fraud statistics tables, the recent digital fraud measures (bank.in domain, 1600 number series, Mobile Number Revocation List, beneficiary name look-up, MuleHunter.AI, Financial Fraud Risk Indicator), Positive Pay, the procedure for lodging an FIR with the CBI and the section 47A penalty are not taught as figures or requirements.
- The Contract Act section 17, Companies Act section 447 and CVC Vigilance Manual statements (CVC jurisdiction from Scale V, the 3 month preliminary enquiry, the two audits or four years limit for disciplinary proceedings, penalties for officers and award staff) were not checked against primary text (needs_review).
- The cyber threat and cybercrime descriptions and the twelve sutras are the courseware's general account.

## Drafts and originality

Tables and procedures are written afresh; the worked examples and numerical questions use new figures. Answer positions are spread across A to D by construction. Distractor explanations are brief.

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | `tests/content/batch-abm-d-u07-b001.test.ts` recomputes the red-flag timeline and the reporting worked example and four numerical answers and checks key phrases against the three saved sources |
| Source support | the 2024 Master Directions, the 2011 circular and the NCRB table for the rules taught as current; courseware for the rest (needs_review) | See limits |
| Session applicability | passed for the sources retrieved | The 2026 Directions are post cut-off |
| Originality | passed | See above |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.
