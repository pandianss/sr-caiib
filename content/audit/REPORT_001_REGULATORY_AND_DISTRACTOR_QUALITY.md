# Audit Report 001: Regulatory Correction, Distractor Quality & Case Studies

- **Report ID**: `AUD-RPT-001`
- **Date**: 14 November 2026
- **Auditor**: Antigravity (Independent Review Agent)
- **Assignee**: Claude (Authoring Agent)
- **Target Papers**: `ABM`, `ABFM`, `BFM`

---

## 1. Finding AUD-001 (CRITICAL): Erroneous SMA-0 Rule for Revolving Credit

### Affected Items:
1. **Concept Card**: `item_6ab66b56ae34b53c24889e47655d6763948fa746c9776aebc96122cef17316c2`
   - Location: `content/batches/ABM-C-U01-B003/draft-bundle.json` (Draft `D006`)
   - Current Title: *Special mention accounts: early warning before an NPA*
2. **Question**: `item_fad13bd3adb9295ed4781b612ed7241c504746fcf635073fa3d7205f7934c394`
   - Location: `content/batches/ABM-C-U01-B003/draft-bundle.json` (Draft `D050`)

### The Defect:
- In the card's table for revolving facilities (Cash Credit/Overdraft), the text asserts:  
  `SMA-0 | Revolving facilities such as cash credit | None: this category does not exist`
- In question `D050`, the distractor states:  
  `[A] 1 to 30 days -> There is no SMA-0 for revolving facilities.`
- The card's expanded explanation states:  
  `*Source note:* this card follows the courseware; the 2025 asset classification Directions do not contain the SMA bands, so the card is held at needs_review.`

### The Regulatory Standard:
Under the **Reserve Bank of India (Prudential Framework for Resolution of Stressed Assets) Directions** (Circular DBR.No.BP.BC.45/21.04.048/2018-19 dated June 7, 2019 / Master Directions 2025 `RBI_RSA_2025`, Para 5, Table 1):
- **SMA-0 exists for revolving facilities** (Cash Credit / Overdraft).
- **Trigger**: Outstanding balance remains continuously in excess of the sanctioned limit or drawing power, whichever is lower, for a period of **1 to 30 days**.
- SMA-1 is excess for **31 to 60 days**.
- SMA-2 is excess for **61 to 90 days**.

### Prescribed Correction for Claude:
1. Update `content/batches/ABM-C-U01-B003/staging.json` and `draft-bundle.json`:
   - Replace the table cell for SMA-0 under revolving facilities with:  
     `Outstanding balance remains continuously in excess of the sanctioned limit or drawing power (whichever is lower) for 1 to 30 days`
   - In question `D050`, update the explanation for option `[A]` from *"There is no SMA-0 for revolving facilities."* to:  
     *"1 to 30 days continuous excess is the definition of SMA-0 for revolving credit."*
   - Update the citation to point to `RBI_RSA_2025` (Resolution of Stressed Assets Directions) rather than stating it was missing from `RBI_IRACP_2025`.
2. Run `npm run import:staging` for batch `ABM-C-U01-B003`.

---

## 2. Finding AUD-002 (HIGH): Elimination of Stub Explanations in ABFM

### Affected Scope:
- Batches `ABFM-A-U01-B001`, `ABFM-A-U02-B001`, `ABFM-A-U03-B001`, `ABFM-A-U04-B001` (283 questions).

### The Defect:
- 100% of questions in ABFM Module A have throwaway explanations:
  - Correct answers are given 1-word explanations: `"Correct."` or `"Stated."`
  - Incorrect options are given 2-word dismissals: `"Not so."` or `"Not stated."`
- Example (`ABFM-A-U01-B001`, Draft `D016`):
  ```
  Q: Scientific management or Taylorism mainly aimed at
    [A] Motivating through hygiene factors -> Not so.
    [B] Improving economic efficiency and labour productivity by analysing workflows -> Correct.
    [C] Building learning organisations -> Not so.
    [D] Business model innovation -> Not so.
  ```

### Prescribed Correction for Claude:
- Rewrite distractor explanations so each conveys why the option is inapplicable:
  * `[A] Motivating through hygiene factors`: *"Hygiene factors are part of Herzberg's two-factor motivation theory, not Taylor's scientific management."*
  * `[C] Building learning organisations`: *"The learning organisation concept was developed by Peter Senge, not Frederick Taylor."*
  * `[D] Business model innovation`: *"Scientific management focused on factory-floor task efficiency and workflow analysis rather than business model design."*
  * `[B] (Correct)`: *"Taylorism analyzed workflows to systematically eliminate wasted motions and maximize worker productivity."*
- Going forward, apply this standard to all new batches in ABFM Modules B, C, D and BRBL.

---

## 3. Finding AUD-003 (HIGH): Authoring Realistic Banking Case Studies

### Requirement:
- Create at least **2 Case Studies** (`item_type: "case"`) in each major analytical module:
  1. **BFM Module A**: Letter of Credit discrepancy / Forex merchant rate calculation case.
  2. **BFM Module B**: Capital Adequacy / CRAR and RWA computation case.
  3. **ABM Module C**: Working Capital Assessment (Tandon Method II MPBF) case.
  4. **ABM Module C**: Corporate Insolvency Resolution Process (CIRP) timeline and Committee of Creditors voting case.
- Each case study must contain:
  - A realistic banking narrative (150–300 words).
  - 3 to 4 connected questions with `case_id` pointing to the case item.
