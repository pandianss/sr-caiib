# Batch BFM-A-U01-B004 — evidence and review record

Paper BFM, unit "Exchange Rates and Forex Business" (`BFM::MOD_A::U01`), objective LO_05 (dealing room).
Six items. Written 12 November 2026 by Claude Sonnet 5.5 (the session was switched from Fable 5.2 at the
owner's request after the pages were read).

## Evidence

Source `S03`, scanned pages read directly (printed page n = PDF page n + 17): printed pp. 14, 15, 16, 17, 18, 19.
Eleven facts in `staging.json`, each with printed page and heading.

**A source error was found and not reused.** The book's illustration of settlement risk (pp. 18-19) says
EUR 1,000,000 bought at 1.1550 means USD 1,550,000 is to be remitted; 1,000,000 x 1.1550 is 1,155,000. The batch
uses its own figures and a test confirms the slip (`tests/content/batch-b004.test.ts`). Worth reporting to the
publisher.

## Drafts and originality

| Draft | What it is | Compared with the book |
| --- | --- | --- |
| D001 concept card | Front, mid and back office as three jobs (take risk / measure risk / record and settle) | The book gives a three-column table of duties (p. 17) and prose (pp. 14-17). This card has no table, different wording and a "which job is it" framing; the duties named are the book's facts |
| D002 concept card | Five dealing-room risks | The book defines operational, exchange, credit, settlement, liquidity, gap and market risk in separate paragraphs (pp. 18-19). Selection (five), wording and grouping are new |
| D003 worked example | Settlement exposure against replacement cost, one deal, two failure points | The book's example of Bank A (Frankfurt) and Bank B (New York) shows settlement risk without numbers that work. New currencies' amounts, rates and the contrast with pre-settlement loss are original |
| D004 question | Which office settles and reconciles | Not in the book's self-tests (p. 14 Check Your Progress B, Terminal Questions) |
| D005 question | Name the risk when one leg is paid and the counterparty fails | New scenario; distractors drawn from other risks in the unit |
| D006 numerical | Cost of replacing a failed forward purchase | New figures and structure |

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `validate:staging`, `import:staging` |
| Calculations | passed | `tests/content/batch-b004.test.ts` (one test bug found and fixed: dollar amounts must use Western digit grouping) |
| Source support | passed | Pages read directly |
| Session applicability | not applicable | Regulatory material on the same pages (RBI internal control guidelines, board-fixed limits, FEDAI month-end revaluation) was deliberately **not** used |
| Originality | passed against the pages read | Not compared with printed pp. 20-32 |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent, same model family as the author** (automated, not independent). Published under
the owner's decision of 11 November 2026.

## Coverage after this batch

LO_05 is taught (two cards, one worked example) and assessed (three questions) but incomplete: the funds
position and currency position, the integrated treasury and its functions, and internal control limits remain.
