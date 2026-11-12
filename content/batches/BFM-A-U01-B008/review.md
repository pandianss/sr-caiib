# Batch BFM-A-U01-B008 — evidence and review record

Paper BFM, unit "Exchange Rates and Forex Business" (`BFM::MOD_A::U01`), objectives LO_02, LO_05, LO_06.
Six items. Written 12 November 2026 by Claude Sonnet 5.5.

## Evidence

Source `S03`, scanned pages read directly (printed page n = PDF page n + 17): printed p. 11 (direct and indirect
quotes), p. 16 (integrated treasury functions), p. 22 (futures pricing) and p. 24 (option pricing elements),
all read in earlier batches. Four facts in `staging.json`.

## Drafts and originality

| Draft | What it is | Compared with the book |
| --- | --- | --- |
| D001 concept card | The five elements of an option's price as "five dials" | The book lists the five elements as a bullet list (p. 24). Framing and wording are new; the elements are the book's facts |
| D002 formula card | Direct rate = fixed rupees / foreign units | The book states the two quotation styles (p. 11) but no conversion formula. New |
| D003 worked example | Comparing a direct and an indirect quote for an import payment | New figures and decision; the book has no such comparison |
| D004 question | Which is not one of the five option pricing elements | New |
| D005 numerical | Rupee price from ₹100 = USD 1.2000 | New figures |
| D006 question | A function of an integrated treasury, with distractors that are central-bank or regulator tasks | Replaces the weaker question in B006 (see below) |

## Known weakness left in a published item

B006 D006 (published in pack v5) has three wrong options that are all "the opposite" of a real reason, so the
answer can be guessed by pattern. A published item cannot be replaced in place: corrections need a revision
workflow that has not been built. B008 D006 covers the same fact with better distractors; B006 D006 stays
published and flagged until a retire/revise step exists.

## Review status

| Check | Status |
| --- | --- |
| Structure and mapping | passed (`validate:staging`, `import:staging`) |
| Calculations | passed (`tests/content/batch-b008.test.ts`, including checks that the 4-decimal roundings are not ties) |
| Source support | passed (pages read directly) |
| Session applicability | not applicable (no regulatory rule stated) |
| Originality | passed against the pages read |
| Question quality | partly checked; D004 is a negative-stem question ("NOT one of") |

Reviewer: the coding agent (automated, not independent). Published under the owner's decision of 11 November 2026.
