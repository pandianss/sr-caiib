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
| **AUD-005** | **LOW / INFO** | Batch Approval | `ABFM` (25 units), `BFM` (31 units), `BRBL-A` (all 7 units complete), `BRBL-B-U01` | 2,723 newly authored items audited across 42 batches. 0 stub options (0.0%), balanced option distributions across A-D, all calculation/period tests passing. | **APPROVED** | BFM & ABFM 100% drafted & approved. BRBL Module A 100% drafted & approved (Units 1-7). BRBL Module B Unit 1 approved. Continue BRBL Module B. |

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
  - `ABFM-B-U06-B001` (Decision Making): 45 items (8 cards, 25 MCQs, 12 calc items). 0 stubs. Options: {A:6, B:7, C:6, D:6}. Activity-based CVP, relevant costs, make-or-buy, ABC tests passing. Approved. **ABFM Module B complete.**
- **ABFM Module C (Units 1 to 6) Sign-off**:
  - `ABFM-C-U01-B001` (Corporate Valuation Overview & Multiples): 57 items (10 cards, 35 MCQs, 13 calc items). 0 stubs. Options: {A:9, B:8, C:9, D:9}. NOPLAT, ROIC, FCF, WACC, terminal value tests passing. Approved.
  - `ABFM-C-U02-B001` (DCF Valuation): 47 items (8 cards, 30 MCQs, 8 calc items). 0 stubs. Options: {A:7, B:7, C:8, D:8}. Dividend discount models (Gordon, two-stage, H-model), FCFF, APV tests passing. Approved.
  - `ABFM-C-U03-B001` (Other Non-DCF Valuation Models): 57 items (7 cards, 37 MCQs, 13 calc items). 0 stubs. Options: {A:10, B:9, C:9, D:9}. P/E, P/B, P/S, PEG, EV multiples, NAV, stock-and-debt tests passing. Approved.
  - `ABFM-C-U04-B001` (Special Cases of Valuation): 68 items (10 cards, 46 MCQs, 12 calc items). 0 stubs. Options: {A:12, B:11, C:11, D:12}. Start-ups, young growth, financial service firms, cyclical firms, and distressed firm tests passing. Approved.
  - `ABFM-C-U05-B001` (Mergers, Acquisitions and Restructuring): 120 items (19 cards, 78 MCQs, 23 calc items). 0 stubs. Options: {A:20, B:20, C:19, D:19}. Cash/stock merger NPV, exchange ratios, EPS illusion, HHI, optimal control, synergy, and LBO/buyout tests passing. Legal/tax gaps properly quarantined. Approved.
  - `ABFM-C-U06-B001` (Deal Structuring and Financial Strategies): 76 items (11 cards, 52 MCQs, 13 calc items). 0 stubs. Options: {A:13, B:13, C:13, D:13}. Goodwill, bargain purchase, NCI, step-up tax saving, cost of debt, EPS by financing, and interest coverage tests passing. Approved. **ABFM Module C complete.**
- **ABFM Module D (Units 1 to 7) Sign-off**:
  - `ABFM-D-U01-B001` (Hybrid Finance): 82 items (14 cards, 52 MCQs, 16 calc items). 0 stubs. Options: {A:13, B:13, C:13, D:13}. Conversion ratio/price/premium, Black-Scholes warrant pricing, preference share cost/CRR, and FCCB currency cost tests passing. Approved.
  - `ABFM-D-U02-B001` (Start-up Finance): 70 items (13 cards, 44 MCQs, 13 calc items). 0 stubs. Options: {A:11, B:11, C:11, D:11}. Post-money/pre-money, dilution, burn rate, runway, convertible note, and guarantee cover tests passing. Outdated angel tax and government grant particulars properly quarantined. Approved.
  - `ABFM-D-U03-B001` (Private Equity and Venture Capital): 88 items (16 cards, 55 MCQs, 17 calc items). 0 stubs. Options: {A:13, B:14, C:14, D:14}. Multiples, required growth, joint probability, power-law distribution, 2/20 fee/carry split, hurdle rate compounding, and LBO equity tests passing. Volatile AIF thresholds held back. Approved.
  - `ABFM-D-U04-B001` (Artificial Intelligence): 70 items (15 cards, 47 MCQs, 8 calc items). 0 stubs. Options: {A:12, B:12, C:12, D:11}. Expected utility, classifier accuracy, chatbot cost saving, false alert rate, fuzzy negation tests passing. Approved.
  - `ABFM-D-U05-B001` (Business Analytics as Management Tool): 82 items (15 cards, 51 MCQs, 16 calc items). 0 stubs. Options: {A:13, B:13, C:13, D:12}. Association rule support/confidence, classifier accuracy, aggregation, moving average forecast error tests passing. Approved.
  - `ABFM-D-U06-B001` (Green & Sustainable Financing): 76 items (15 cards, 50 MCQs, 11 calc items). 0 stubs. Options: {A:13, B:13, C:12, D:12}. Coupon spread, basis point yield gap, emission intensity, ESG score weighting tests passing. Volatile circular dates quarantined. Approved.
  - `ABFM-D-U07-B001` (SPACs): 68 items (11 cards, 45 MCQs, 12 calc items). 0 stubs. Options: {A:12, B:11, C:11, D:11}. Founder shares, 37.5% approval, redemption trust, 80% target test, net-settled warrant tests passing. Approved. **ABFM Module D complete — ENTIRE ABFM SYLLABUS DRAFTED AND APPROVED!**
- **BFM Module C (Units 1 to 6) Sign-off**:
  - `BFM-C-U01-B001` (Introduction to Treasury Management): 65 items (10 cards, 44 MCQs, 11 calc items). 0 stubs. Options: {A:11, B:11, C:11, D:11}. Swap arbitrage yield/spread profit, open position, transfer pricing spread tests passing. Primary source alignment verified. Approved.
  - `BFM-C-U02-B001` (Treasury Products): 87 items (15 cards, 56 MCQs, 16 calc items). 0 stubs. Options: {A:14, B:14, C:14, D:14}. T-bill/CP yield, repo interest/cash, corridor width, SDF interest, forward rate/premium, MTM loss tests passing. Approved.
  - `BFM-C-U03-B001` (International Equity and Debt Products): 61 items (9 cards, 40 MCQs, 12 calc items). 0 stubs. Options: {A:10, B:10, C:10, D:10}. GDR parity, diluted holding, ECB exchange loss/hedge, trade credit interest tests passing. Outdated FEMA/ECB limits quarantined. Approved.
  - `BFM-C-U04-B001` (Funding and Regulatory Aspects): 63 items (10 cards, 40 MCQs, 13 calc items). 0 stubs. Options: {A:10, B:10, C:10, D:10}. CRR/SLR requirements, free funds, daily floor, penal interest, repo interest, net vs gross settlement tests passing. Approved.
  - `BFM-C-U05-B001` (Treasury Risk Management): 70 items (11 cards, 45 MCQs, 14 calc items). 0 stubs. Options: {A:12, B:11, C:11, D:11}. VaR worst rates, horizon scaling, parametric VaR, YTM, bond price, Macaulay & modified duration, price sensitivity, portfolio duration, stop-loss and carry tests passing. Approved.
  - `BFM-C-U06-B001` (Derivative Products): 93 items (18 cards, 54 MCQs, 21 calc items). 0 stubs. Options: {A:14, B:13, C:13, D:14}. Forward rate parity, option payoff & break-even, futures hedging, T-bill futures tick value, interest rate swap net payments, FRA settlement discount, and currency swap tests passing. Courseware vanilla option risk claim corrected. Approved.
- **BFM Module C (Unit 7) Sign-off**:
  - `BFM-C-U07-B001` (Treasury and Asset-Liability Management): 58 items (9 cards, 34 MCQs, 15 calc items). 0 stubs (0.0%). Options: {A:9, B:9, C:8, D:8}. Liquidity gap, sensitivity, duration gap, and transfer pricing tests passing. Approved. **BFM Module C complete (all 7 units).**
- **BFM Module D (Units 1 to 6) Sign-off**:
  - `BFM-D-U01-B001` (Balance Sheet Components and ALM): 51 items (8 cards, 31 MCQs, 12 calc items). 0 stubs (0.0%). Options: {A:8, B:8, C:7, D:8}. Net interest income, NIM, and duration of equity tests passing. Approved.
  - `BFM-D-U02-B001` (Capital Adequacy & Basel Norms): 51 items (7 cards, 32 MCQs, 12 calc items). 0 stubs (0.0%). Options: {A:8, B:8, C:8, D:8}. CRAR, Tier 1/2 capital limits, RWA, CCB tests passing. Approved.
  - `BFM-D-U03-B001` (Asset Classification & Provisioning): 67 items (10 cards, 43 MCQs, 14 calc items). 0 stubs (0.0%). Options: {A:11, B:11, C:10, D:11}. Sub-standard, doubtful (D1-D3), loss asset provisioning, and unsecured exposure provisioning tests passing. Approved.
  - `BFM-D-U04-B001` (Liquidity Management): 70 items (12 cards, 45 MCQs, 13 calc items). 0 stubs (0.0%). Options: {A:11, B:12, C:11, D:11}. Structural liquidity buckets, tolerance limits, and cash flow gap tests passing. Approved.
  - `BFM-D-U05-B001` (Interest Rate Risk Management): 73 items (13 cards, 43 MCQs, 17 calc items). 0 stubs (0.0%). Options: {A:11, B:10, C:11, D:11}. Repricing gap, basis risk, yield curve shift, duration gap, and bond price sensitivity tests passing. Approved.
  - `BFM-D-U06-B001` (RAROC and Profit Planning): 46 items (9 cards, 23 MCQs, 14 calc items). 0 stubs (0.0%). Options: {A:6, B:6, C:6, D:5}. RAROC = (Revenues - Expenses - Expected Loss + Return on Capital) / Economic Capital, transfer pricing, and hurdle rate tests passing. Approved. **BFM Module D complete (all 6 units) — ENTIRE BFM SYLLABUS DRAFTED AND APPROVED (ALL 31 UNITS)!**
- **BRBL Module A (Units 1 to 5) Sign-off**:
  - `BRBL-A-U01-B001` (Legal Framework of Regulation of Banks): 65 items (11 cards, 48 MCQs, 6 calc/period items). 0 stubs (0.0%). Options: {A:12, B:12, C:12, D:12}. Banking Regulation Act Section 5(b)/6/8/9, non-banking asset 7-year holding limit, licensing rules. Approved.
  - `BRBL-A-U02-B001` (Control over Organisation of Banks): 74 items (13 cards, 55 MCQs, 6 calc/cap items). 0 stubs (0.0%). Options: {A:14, B:14, C:13, D:14}. Paid-up capital, voting rights cap (26% private), board composition Section 10A, chairman/CEO tenure Section 10B. Approved.
  - `BRBL-A-U03-B001` (Regulation of Banking Business): 82 items (13 cards, 63 MCQs, 6 calc items). 0 stubs (0.0%). Options: {A:16, B:16, C:16, D:15}. Section 19 subsidiary restrictions, Section 20 loan restrictions to directors, Section 21/35A RBI direction powers, CRR Section 42, SLR Section 24. Approved.
  - `BRBL-A-U04-B001` (Returns, Inspection, Winding Up, Mergers & Acquisitions): 81 items (13 cards, 62 MCQs, 6 calc items). 0 stubs (0.0%). Options: {A:16, B:15, C:15, D:16}. Section 27 monthly returns, Section 35 inspection powers, Section 36AE acquisition of undertakings, Section 44A voluntary amalgamation 2/3 majority requirement. Approved.
  - `BRBL-A-U05-B001` (Public, Private, Rural, Differentiated, Co-operative & Local Area Banks): 88 items (15 cards, 66 MCQs, 7 calc items). 0 stubs (0.0%). Options: {A:17, B:16, C:16, D:17}. SBI Act 1955, RRB Act 1976 (50:15:35 capital split), Small Finance Banks and Payment Banks (₹200 cr / ₹100 cr net worth, 75% PSL for SFB, 25% unbanked rural branches), Multi-State Co-operative Societies Act, Section 56 BR Act. Approved.
  - `BRBL-A-U06-B001` (Non-Banking Financial Companies / NBFCs): 69 items (12 cards, 51 MCQs, 6 calc/threshold items). 0 stubs (0.0%). Options: {A:13, B:12, C:13, D:13}. Net Owned Funds (₹2 cr / ₹10 cr), 50-50 principal business test, RBI Scale Based Regulation (Base, Middle, Upper, Top layers), CRAR 15% (Tier 1 10%), NPA 90-day norm. Approved.
  - `BRBL-A-U07-B001` (Financial Sector Legislative Reforms & FSDC): 61 items (11 cards, 46 MCQs, 4 period/structure items). 0 stubs (0.0%). Options: {A:12, B:12, C:11, D:11}. FSLRC recommendations, FSDC chairperson (Union Finance Minister), Sub-Committee chairperson (Governor RBI), regulatory architecture, appellate tribunals. Approved. **BRBL Module A complete (all 7 units).**
- **BRBL Module B Sign-off**:
  - `BRBL-B-U01-B001` (Prevention of Money Laundering Act, 2002): 52 items (11 cards, 39 MCQs, 2 period/penalty items). 0 stubs (0.0%). Options: {A:10, B:10, C:9, D:10}. Section 3 offence, Section 4 rigorous imprisonment (3 to 7 years, up to 10 for NDPS), Section 12 5-year record retention and reporting to FIU-IND, Section 13 monetary penalties. Approved.
- **Instruction to Authoring Agent (Claude)**:
  - All audited batches in BRBL Module A (Units 1 to 7 complete) and BRBL Module B Unit 1 are **APPROVED**.
  - Continue authoring remaining units of **BRBL Module B (Regulation and Conduct of Banking Business)**. Courseware is available in `content/sources/books/` (S04). Keep maintaining 0 stub options and deterministic test coverage.
