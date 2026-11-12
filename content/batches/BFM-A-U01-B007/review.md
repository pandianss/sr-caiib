# Batch BFM-A-U01-B007 — evidence and review record (HELD BACK)

Paper BFM, unit "Exchange Rates and Forex Business" (`BFM::MOD_A::U01`), objective LO_07 (RBI and FEDAI guidelines).
Six draft items. Written 12 November 2026 by Claude Sonnet 5.5. **None is published and none is in any publish
specification** (a test enforces this).

## Why it is held back

Every item restates a FEDAI rule as the courseware gives it (printed pp. 28 and 30: Rule 1 hours of business and
known holiday; Rule 6 cancellation, extension and automatic cancellation). Applicability at the 30 June 2026
cut-off could not be checked:

- FEDAI's own rulebook and RBI's press release recognising FEDAI as a self-regulatory organisation could not be
  retrieved (RBI's pages redirected to the home page; fedai.org.in was not found by search).
- The only copy of the rules found is an older third-party list with 14 rules and different numbering (for example
  "Rule 5 - Clean Instruments", "Rule 7 - Exchange Contracts"), whereas the courseware numbers Foreign Exchange
  Contracts as Rule 5 and early delivery/cancellation as Rule 6. So the courseware follows a newer numbering that
  could not be confirmed.
- Web results suggest Rule 1 was revised from 14 February 2022 (the courseware already allows Saturday and Sunday
  retail handling) and that new RBI export and import regulations were notified on 13 January 2026 (effective
  1 October 2026), which may supersede printed pp. 29-32. Neither was confirmed from a primary page.

Not used at all: printed pp. 29-32 (export, import, clean instrument rules, Rule 7-8, FBIL note) and p. 28's list of
FEDAI roles (the book's own p. 31 says benchmark-rate administration moved to FBIL).

Release condition: obtain FEDAI's current rulebook (or RBI's text) and compare Rules 1 and 6. If they agree,
add these items to a publish specification; if not, revise first.

## Evidence

Source `S03`, scanned pages read directly: printed pp. 28, 29 and 30 (the last read in batch B001). Another
check against the notebook's earlier brief: it said an uncancelled contract is cancelled on the "third working
day"; the page says "the third day from the maturity date", which is what the items use.

## Originality

| Draft | Compared with the book |
| --- | --- |
| D001, D002 | Statute cards restate the rules in new words and order; the rules are the book's facts |
| D003 | Same method as the book's Example 10 (p. 40: contracted amount against cancellation amount), with its own rates, margin and direction (a purchase contract, TT selling rate) and a different final decision; not reproduced |
| D004, D005, D006 | New scenarios and figures; no similar item in the self-tests or Terminal Questions |

## Review status

| Check | Status |
| --- | --- |
| Structure and mapping | passed (`validate:staging`, `import:staging`) |
| Calculations | passed (`tests/content/batch-b007.test.ts`; one test bug found and fixed) |
| Source support (book pages) | passed |
| Session applicability | **pending: blocks publication** |
| Originality | passed against the pages read |
| Question quality | partly checked; no human read-through |

Reviewer: the coding agent (automated, not independent).
