# Review record: ABM-C-U02-B002

Paper ABM, Module C unit 2 (courseware unit 18, Analysis of Financial Statements), part 2: projected statements, purposes of analysis, rearrangement, funds flow, trend and common size analysis, ratio analysis, creative accounting and related party transactions (objectives LO_04 to LO_08, registered in this batch). Seventy-one items: 14 concept cards, 3 worked examples, 42 choice questions and 12 numerical questions. Record written 14 November 2026.

## Evidence

Courseware source `S01`: printed pp. 436 to 446 (PDF pp. 451 to 461), read as page images. No primary source was retrieved. All facts are the courseware's account; the related party facts, which quote Ind AS 24, are marked `needs_review`, as is the PAT ratio fact (see below).

## Limits and conflicts

- The courseware prints the PAT ratio with Profit Before Tax in the numerator; the label and description say PAT. PAT over net sales is taught and the fact is `needs_review`.
- Ratio formulas are the courseware's own definitions: ROCE = EBITDA over total of the asset side; interest coverage = EBITDA over interest on all borrowings (its check-your-progress treats EBIT-based interest cover as false); Vanquish ratio = long term debt over EBITDA. Other books define some of these differently. Each question names the courseware formula or gives the figures.
- The 1.33 : 1 current ratio benchmark is the courseware's statement and is not checked against current RBI instructions.
- Ind AS 24 text was not checked against the Standard.
- The IRR is taught as a definition only.
- Unit 18 is now fully read (printed pp. 423 to 446), including the summary, keywords and check-your-progress answers.

## Drafts and originality

Cards are tables and step lists written for this app; formulas and definitions are facts. Worked examples and numerical questions use new figures (including a balance sheet summary with current assets of Rs 600 lakh and a firm with consumption of Rs 1,460 lakh). The courseware's check-your-progress items were not reused. Answer positions are spread across A to D by construction. Distractor explanations are brief.

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | `tests/content/batch-abm-c-u02-b002.test.ts` recomputes the three worked examples and all twelve numerical answers |
| Source support | courseware only | Related party and PAT facts `needs_review`; no primary source retrieved |
| Session applicability | not established for Ind AS statements | See limits |
| Originality | passed | See above |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.

## Coverage after this batch

LO_01 to LO_08 of Module C unit 2 have teaching and assessment; the whole of courseware unit 18 has been used. Statutory statements in LO_01 and LO_02 remain unchecked (recorded in the ledger).
