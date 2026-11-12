# Batch BFM-A-U01-B003 — evidence and review record

Paper BFM, unit "Exchange Rates and Forex Business" (`BFM::MOD_A::U01`). Six items. Record written 12 November 2026.

## Evidence

Source `S03` *Bank Financial Management* (updated edition 2026), scanned pages read directly
(`scripts/render-page.mjs`; printed page n = PDF page n + 17). Pages read for this batch: printed pp. 7 and 8;
pp. 9, 10, 12, 35, 40 and 42 were read for earlier batches and are relied on again. All ten facts in
`staging.json` carry their printed page and heading.

## Drafts and originality

| Draft | What it is | Compared with the book |
| --- | --- | --- |
| D001 concept card | Value dates, as a four-row summary with the working-day rule | The book treats each value date under its own heading with dated bank-to-bank illustrations (pp. 8-9) and lists them again as keywords (p. 42). The summary table, wording and the "why two days" note are new; no book table is reproduced |
| D002 concept card | Factors grouped as slow forces, frictions and expectations | The book's three headings (fundamental, technical, speculation) are kept as terms; the framing by time-scale, the wording and the selection are new |
| D003 worked example | Importer's forward rate with a break-even against waiting | Uses the same method as the book's forward-booking examples (spot + premium + margin, pp. 37-39). Figures, the single-premium setup and the break-even decision are new. **Closest item in the batch to a book example**; kept because the method cannot be taught otherwise and the task differs |
| D004 numerical | Dollars received for pounds sold on a GBP/USD quote | The book states which side applies (p. 12) but sets no such calculation |
| D005 question | Two-stage effect of high interest rates | Terminal Question 3 asks which factor has no effect; different task |
| D006 question | Classifying a move after controls are lifted | No similar item |

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | `tests/content/batch-b003.test.ts` |
| Source support | passed | Pages read directly |
| Session applicability | not applicable | No regulatory figure or rule is stated in this batch |
| Originality | passed against the pages read, with the note on D003 above | Not compared with printed pp. 14-29, 31-32, 34 |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent). Published under the
owner's decision of 11 November 2026 to accept agent-only review.

## Coverage after this batch

LO_01 taught, thinly assessed. LO_02, LO_03, LO_04 taught and assessed. LO_05 (dealing room), LO_06
(derivatives), LO_07 (RBI and FEDAI guidelines): nothing yet, so the topic is still not complete.
