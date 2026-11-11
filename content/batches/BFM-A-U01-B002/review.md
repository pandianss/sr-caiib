# Batch BFM-A-U01-B002 — evidence and review record

Paper BFM, unit "Exchange Rates and Forex Business" (`BFM::MOD_A::U01`). Six **draft** items; nothing published.
Record written 11 November 2026.

## Evidence

Source `S03` *Bank Financial Management* (updated edition 2026), read **directly from the scanned pages** with
`scripts/render-page.mjs` (printed page n = PDF page n + 17). Pages read for this batch: printed pp. 5, 6, 10,
12, 13; pp. 9, 11, 33, 35-43 were read for batch B001. The notebook was not used.

All ten facts in `staging.json` were written from those pages and carry their printed page and heading.

## Drafts and originality

| Draft | What it is | Compared with the book |
| --- | --- | --- |
| D001 concept card | Market and participants, grouped by motive (steerer / price makers and go-betweens / users) | The book lists six participant types one by one (p. 5); the grouping, wording and order here are new |
| D002 formula card | Forward rate = spot + margin | Formula and the premium/discount terms are the book's facts (p. 10); wording, assumptions, error list and self-check figures are new |
| D003 worked example | EUR export receipt priced through the dollar, bid × bid | The book shows a GBP/INR two-way cross in one sentence (p. 12) and an import-side GBP example with margin (Example 4, pp. 36-37). This is an export-side EUR case with its own figures and a "follow the money" explanation |
| D004 question | Which participant steadies the rate from reserves | No similar item among Check Your Progress or Terminal Questions 1-6 |
| D005 numerical | Premium in paise from spot and forward rates | Inverse of the book's illustrations, which give the premium and ask for the forward rate |
| D006 numerical | Spread of a derived two-way EUR/INR quote | Not in the book's examples |

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | Independent recomputation in `tests/content/batch-b002.test.ts`, including checks that no figure sits on a rounding tie |
| Source support | passed | Pages read directly, listed above |
| Session applicability | pending | No regulatory figure is used in this batch, but the unit's FEDAI material still needs a primary-source check |
| Originality | passed against the pages read | Not compared with printed pp. 7-8, 14-29, 31-32, 34 |
| Question quality | partly checked | One defensible answer confirmed by recomputation; no human read-through |

Rounding a derived cross rate to four decimals is given in D003 and D006 as a working instruction. The book
shows four-decimal quotes but states no general rule, so the items do not present it as a regulation.

**Reviewer: the coding agent that also wrote the drafts** (automated, not independent). No human review.

## Coverage after this batch

LO_01: taught (two cards), thinly assessed. LO_02: unchanged. LO_03: customer rates and cross rates covered;
forward rates partly. LO_04-LO_07: nothing yet. The unit still counts as not drafted in the ledger because a
topic reaches a stage only when every objective does.

Next: `BFM-A-U01-B003` — value-date lesson and an indirect-quote question (LO_02), a customer forward-rate
worked example (LO_03), then factors determining exchange rates (LO_04).
