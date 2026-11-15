# Review record: BRBL-A-U04-B001

Courseware S04 (Banking Regulations and Business Laws), Module A unit 4, printed pp. 63-82 (PDF pp. 82-101): accounts, audit, returns, records, inspection and scrutiny, Board for Financial Supervision, acquisition, amalgamation, moratorium, winding up and penalties, drafted for BRBL::MOD_A::U04. Items: 81 (10 concept cards, 62 choice questions and 9 numerical questions). Record written 14 November 2026.

## Evidence

Pages read from the rendered scan; section numbers, periods and rules are as the courseware states them and no Act text was retrieved.

## Limits and what was held back

- Section numbers, periods and majorities are courseware statements not checked against the Acts at 30 June 2026 (Banking Laws (Amendment) Act 2025)
- Held back: every rupee amount of fines and penal interest, the Rs 250 preferential payment limit, the date for foreign banks to display accounts, the preservation periods of the 1985 Rules
- The courseware ten year retention under the PML Act conflicts with the five year minimum in the Rules it quotes; five years is taught, ten is not
- Supervision structure (BFS, Department of Supervision, DAKSH) is a courseware account not checked against Reserve Bank notices
- Numerical items are periods, thresholds, a two-thirds majority and a fine multiple with invented balances

## Drafts and originality

Tables and procedures are written afresh; any worked examples and numerical questions use new figures. Answer positions are spread across A to D by construction. Distractor explanations are brief.

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | `tests/content/batch-brbl-a-u04-b001.test.ts` recomputes the worked examples and numerical answers |
| Source support | Courseware only (needs primary-text check) | See limits |
| Session applicability | see limits | Courseware statements are as at the courseware's date unless a primary source is cited |
| Originality | passed | See above |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.
