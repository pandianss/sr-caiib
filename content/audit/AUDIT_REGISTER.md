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
| **AUD-003** | **HIGH** | Exam Realism | `ABM-C-U03-B003`, `ABM-C-U09-B002`, `BFM-B-U03-B005` | 3 new case studies authored with 12 linked questions & calculation tests. Audited: 100% accurate, 0% stubs, clean scenario design. | **APPROVED (First Batch)** | Expand case studies to BFM Forex/LC and ABFM in subsequent batches. |
| **AUD-004** | **MEDIUM** | Distractor Quality | All packs (`ABM`, `BFM`, `ABFM`) | Widespread stub explanations across all papers. Verified: All 9,544 options across all 3 packs now rewritten with rich rationales ($\ge$ 20 chars). Repository stubs: 0/9544 (0.0%). Audited samples in Statistics & Forex passed. | **RESOLVED / PASSED** | Maintain this distractor quality standard for all subsequent batches. |

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
