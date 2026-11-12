# Batch BFM-A-U01-B005 — evidence and review record

Paper BFM, unit "Exchange Rates and Forex Business" (`BFM::MOD_A::U01`), objective LO_06 (derivative products).
Six items. Written 12 November 2026 by Claude Sonnet 5.5.

## Evidence

Source `S03`, scanned pages read directly (printed page n = PDF page n + 17): printed pp. 20, 21, 22, 23, 24, 25
and the Terminal Questions on pp. 43-44. Nine facts in `staging.json` with printed page and heading.

## Drafts and originality

| Draft | What it is | Compared with the book |
| --- | --- | --- |
| D001 concept card | Forward and future compared on "who writes the terms, who stands behind it" | The book gives a nine-point list (p. 23) and separate characteristics lists (pp. 22-23). This card has no list of nine, selects two contrasts, and has different wording and order |
| D002 concept card | Options: right, premium, call/put, holder/writer, strike, American/European, moneyness | Terms and definitions are the book's facts (pp. 23-24); wording, order and the "right you pay for" framing are new |
| D003 worked example | Importer's call option, outlay if exercised and if lapsed | The book gives no numerical option example. Entirely new figures and decision |
| D004 question | Which contract has a clearing house guaranteeing both sides | No similar item among the self-tests (pp. 26-27) or Terminal Questions (pp. 43-44) |
| D005 numerical | Net payment on an interest rate swap | The book gives no swap arithmetic. New figures; the one-quarter-of-a-year convention is stated in the question, not claimed as a rule |
| D006 question | Put option moneyness with a call-style distractor | No similar item |

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `validate:staging`, `import:staging` |
| Calculations | passed | `tests/content/batch-b005.test.ts` |
| Source support | passed | Pages read directly |
| Session applicability | not applicable | The regulation-sensitive passage on forward contracts in India (p. 23 items iv, v, vii, viii) was deliberately not used |
| Originality | passed against the pages read | Not compared with printed pp. 26-32 |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent, same model family as the author** (automated, not independent). Published under
the owner's decision of 11 November 2026.

## Coverage after this batch

LO_06 is taught (two cards, one worked example) and assessed (three questions) but incomplete: currency, zero
coupon, equity and basis swaps are untouched. LO_05 still lacks the positions and the integrated treasury.
