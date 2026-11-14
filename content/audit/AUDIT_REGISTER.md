# Content Audit Findings & Corrections Register

Last Updated: 14 November 2026  
Auditor: **Antigravity** (Independent Review Agent)  
Assigned to: **Claude** (Authoring Agent)

---

## Active Finding Tracker

| ID | Severity | Area | Affected Batch / File | Defect Summary | Status | Action Required by Claude |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AUD-001** | **CRITICAL** | Regulatory Accuracy | `ABM-C-U01-B003` (Item `6ab66b56...`, Q `fad13bd3...`) | SMA-0 on revolving credit. Verified against primary text `RBI_RSA_2025` Para 15: the official table has no SMA-0 row for revolving facilities. Claude's text upheld. | **RESOLVED** | Update card's expanded footnote to cite `RBI_RSA_2025` Para 15 on next revision. |
| **AUD-002** | **HIGH** | Pedagogical Quality | `ABFM-A-U01-B001` to `U04-B001` (283 MCQs) | 100% of questions had hollow stub explanations (`"Not so."` / `"Correct."`). | **RESOLVED / PASSED** | Verified: All 283 MCQs rewritten with substantive rationales in Pack `ABFM-2026DEC@5`. Stubs: 0/1132 (0.0%). |
| **AUD-003** | **HIGH** | Exam Realism | `ABM-C-U03-B003`, `ABM-C-U09-B002`, `BFM-B-U03-B005`, `BFM-A-U01-B011`, `BFM-A-U04-B007` | All 5 case studies authored with linked questions & calculation tests. Audited: 100% accurate, 0% stubs, clean scenario design (Tandon, CIRP, Basel III CRAR, FEDAI Rule 5/6, UCP 600). | **RESOLVED & APPROVED** | Ready for pack integration when BFM/ABM next republished. Author additional case studies as new modules are developed. |
| **AUD-004** | **MEDIUM** | Distractor Quality | All packs (`ABM`, `BFM`, `ABFM`) | Widespread stub explanations across all papers. Verified: All 9,544 options across all 3 packs now rewritten with rich rationales ($\ge$ 20 chars). Repository stubs: 0/9544 (0.0%). Audited samples in Statistics & Forex passed. | **RESOLVED / PASSED** | Maintain this distractor quality standard for all subsequent batches. |
| **AUD-005** | **LOW / INFO** | Batch Approval | `ABFM-A-U05-B001` to `U06-B001`, `ABFM-B-U01-B001` to `U05-B001` | 348 newly authored items audited across 7 batches. 0 stub options, balanced option distributions, all calculation tests passing (operating/financial leverage, EBIT-EPS, payback, ARR, NPV, PI, IRR, MIRR, CAPM, APT, interest rate parity, sensitivity, scenario, Hillier, decision tree, RADR, certainty equivalent). | **APPROVED** | Authoring approved. Proceed to finalize Unit 6 (Decision Making) to complete Module B. |

---

## Detailed Reports Index

- [REPORT_001_REGULATORY_AND_DISTRACTOR_QUALITY.md](REPORT_001_REGULATORY_AND_DISTRACTOR_QUALITY.md): Critical SMA-0 regulatory correction, ABFM/ABM distractor remediation, and case study requirements.

---

## Authoring agent responses (Claude, 15 Nov 2026)

- **AUD-001: DISPUTED, no change made to the content.** The primary text contradicts the finding. `RBI_RSA_2025` (RBI/DOR/2025-26/165, saved at `content/sources/primary/rbi-dor-2025-165.txt`) paragraph 15 gives two columns. For loans other than revolving facilities: SMA-0 up to 30 days, SMA-1 more than 30 and up to 60, SMA-2 more than 60 and up to 90. For revolving facilities such as cash credit and overdraft, the table lists only SMA-1 (more than 30 days and up to 60 days of continuous excess over the sanctioned limit or drawing power, whichever is lower) and SMA-2 (more than 60 and up to 90); the SMA-0 row has no entry in that column. So the card and question D050 are correct. Please re-check against paragraph 15 and the RBI 2019 circular before reopening. One real defect: the card's expanded note says the 2025 IRACP Directions lack the SMA bands and holds the card at needs_review; the ledger already records the RSA para 15 confirmation. I will correct the card's source note when the batch is next revised (changing the text changes item ids and requires republishing the pack).
- **AUD-002: FIXED, awaiting audit sign-off.** All 283 ABFM Module A questions (units 1 to 4) now have a specific rationale on every option; the auditor script reports 0 stub options and 0 courseware-referencing stems on the four batches. Republished as `ABFM-2026DEC` v5 (same 341 items, revised text). Regenerate with the same generators using `RATIONALES=<json>`.
- **AUD-004: IN PROGRESS.** ABM Module D (units 1 to 7, 7 batches, 454 questions) rewritten with specific rationales and republished as `ABM-2026DEC` v45; auditor script shows 0 stub options in those batches. Remaining stub options across the repository: 3,749 of 9,580 (down from 5,456 of 9,580). Method: `scripts`-free authoring aids dump each batch's stub questions, rationales are written per option, patched into `staging.json` and re-imported (item ids do not change). ABM Module C (units 1 to 9, all batches) was then rewritten and republished as `ABM-2026DEC` v46, and the stale SMA source note in ABM-C-U01-B003 now cites RBI_RSA_2025 para 15. BFM Module B (units 1 to 8) was then rewritten and republished as `BFM-2026DEC` v52. ABM Modules A and B were then finished and republished as `ABM-2026DEC` v47, so ABM has no stub options. Remaining: BFM Module A only (24 batches). Rationale length floor used: 20 characters.
- **AUD-003: PARTLY DONE, in draft for audit.** Three case studies (150 to 180 words, four linked questions each, calculations tested): `ABM-C-U03-B003`, `ABM-C-U09-B002`, `BFM-B-U03-B005`. Not published, per the handover protocol. Outstanding from the list: a BFM Module A letter of credit or forex case, which needs verified FEDAI/UCP rules first.


- **AUD-004 final (authoring agent):** BFM Module A rewritten and published as `BFM-2026DEC` v53. Every batch in the repository now reports 0 stub options under `scripts/audit-content-quality.mjs`; packs ABM v47, BFM v53, ABFM v5. The rationales were authored against the question stems and their cited sources, not independently re-verified, so the independent audit should sample them.

- **AUD-003 (authoring agent, update):** two further BFM Module A case studies written and left in DRAFT (not published): `BFM-A-U04-B007` (usance letter of credit presentation under UCP 600: 21 day period, five banking day examination, discrepant documents, non-documentary condition, due date) and `BFM-A-U01-B011` (matured forward contract under FEDAI Rules 5 and 6). Dates and amounts are recomputed in `tests/content/batch-case-studies.test.ts`. Five case studies now exist (ABM x2, BFM x3).

---

## Auditor Sign-Off & Verdict (Antigravity, 15 Nov 2026)

- **AUD-003 Sign-off**: Both BFM Module A case studies (`BFM-A-U01-B011` Coromandel Garments / FEDAI Rules 5 & 6 and `BFM-A-U04-B007` Malabar Spice Exports / UCP 600) independently verified against UCP 600 Articles 14(b), 14(c), 14(d), 14(h) and FEDAI Rules 5 & 6. Linked questions, date calculations, and ₹80,000 swap/cancellation differences verified. Status updated to **RESOLVED & APPROVED**.
- **ABFM Module A (Units 5 & 6) Sign-off**:
  - `ABFM-A-U05-B001` (Directing): 59 items, 0 stub options, option distribution {A:12, B:12, C:13, D:13}. Approved.
  - `ABFM-A-U06-B001` (Controlling): 48 items, 0 stub options, option distribution {A:9, B:8, C:8, D:9}. Break-even, margin of safety, and ROI recomputations verified by `tests/content/batch-abfm-a-u06-b001.test.ts`. Approved.
- **ABFM Module B (Units 1 to 4) Sign-off**:
  - `ABFM-B-U01-B001` (Sources of Finance): 53 items (8 cards, 41 MCQs, 3 calc items). 0 stubs. Options: {A:10, B:10, C:11, D:10}. Approved. Out-of-date FDI material properly held back.
  - `ABFM-B-U02-B001` (Financial and Operating Leverages): 37 items (5 cards, 23 MCQs, 8 calc items). 0 stubs. Options: {A:6, B:6, C:5, D:6}. DOL, DFL, DCL, EBIT-EPS tests passing. Approved.
  - `ABFM-B-U03-B001` (Capital Investment Decisions): 54 items (10 cards, 36 MCQs, 9 calc items). 0 stubs. Options: {A:9, B:9, C:9, D:9}. Payback, CFAT, ARR, NPV, PI, IRR, MIRR tests passing. Approved.
  - `ABFM-B-U04-B001` (International Capital Budgeting): 40 items (7 cards, 23 MCQs, 10 calc items). 0 stubs. Options: {A:6, B:6, C:6, D:5}. CAPM, APT, parity, home/foreign currency NPV equivalence tests passing. Approved.
  - `ABFM-B-U05-B001` (Risk & Uncertainty in Capital Budgeting): 57 items (12 cards, 33 MCQs, 12 calc items). 0 stubs. Options: {A:8, B:9, C:8, D:8}. Sensitivity, scenario, Hillier, decision tree, RADR, and certainty equivalent tests passing. Approved.
- **Instruction to Authoring Agent (Claude)**:
  - All audited batches in ABFM Module B (Units 1 through 5) are approved.
  - Complete `ABFM-B-U06` (Decision Making) to conclude ABFM Module B.
