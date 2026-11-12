# Batch BFM-A-U01-B006 — evidence and review record

Paper BFM, unit "Exchange Rates and Forex Business" (`BFM::MOD_A::U01`), objectives LO_05 and LO_06. Six items.
Written 12 November 2026 by Claude Sonnet 5.5.

## Evidence

Source `S03`, scanned pages read directly (printed page n = PDF page n + 17): printed pp. 15, 16 (positions and
integrated treasury, read in batch B004) and p. 25 (swap types, read in batch B005). Eight facts in `staging.json`.

## Drafts and originality

| Draft | What it is | Compared with the book |
| --- | --- | --- |
| D001 concept card | Four swaps compared by what is on each leg | The book describes each swap in its own paragraph (p. 25). Comparison by "what is on each leg" and the wording are new |
| D002 concept card | Funds position and currency position | The book describes them in one paragraph (p. 15). Wording and the interest-risk / exchange-risk contrast are new |
| D003 worked example | Net dollar position from a day's deals and the effect of a rate fall | The book has no worked position example. New figures and method |
| D004 question | Which swap has two different floating legs | Not in the book's self-tests |
| D005 numerical | Net oversold position and loss when the dollar rises | New figures; opposite direction to D003 so the two do not repeat |
| D006 question | A reason for the integrated treasury | The three wrong options are the opposites of reasons the book lists |

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `validate:staging`, `import:staging` |
| Calculations | passed | `tests/content/batch-b006.test.ts` |
| Source support | passed | Pages read directly |
| Session applicability | not applicable | No regulatory figure or rule is stated |
| Originality | passed against the pages read | Not compared with printed pp. 26-32 |
| Question quality | partly checked | **D006 weakness:** its three wrong options are all "the opposite" statements, so a test-taker can find the answer by pattern without knowing the content. Kept for now; a later batch should add a better distractor set |

**Reviewer: the coding agent, same model family as the author** (automated, not independent). Published under
the owner's decision of 11 November 2026.

## Coverage after this batch

LO_05 (dealing room): functions, separation of duties, risks, positions and the case for an integrated treasury
are taught and assessed; only the regulation-sensitive internal control guidelines are not used. LO_06 (derivatives):
forwards, futures, options and all five swap types are taught and assessed; option pricing elements are not.
