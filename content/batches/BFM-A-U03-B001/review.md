# Batch BFM-A-U03-B001 — evidence and review record

Paper BFM, unit "Correspondent Banking and NRI Accounts" (`BFM::MOD_A::U03`), objectives LO_01, LO_02, LO_03.
Ten items. Written 12 November 2026 by Claude Sonnet 5.5.

## Evidence

Source `S03`, scanned pages read directly (printed page n = PDF page n + 17): printed pp. 62–69 (introduction,
correspondent banking, account and other services, Nostro/Vostro/Loro, SWIFT, CHIPS, Fedwire, CHAPS, TARGET,
RTGSplus/EBA, RTGS/NEFT in India, NRI heading). Six facts in `staging.json`, each with a printed-page locator.

## Drafts and originality

| Draft | What it is | Compared with the book |
| --- | --- | --- |
| D001 concept card | Why banks use correspondents, respondent vs correspondent | Book gives prose (pp. 62–63); new framing as a choice between branches and an agent |
| D002 concept card | Sorting services by "does it need an account" | Book lists services (pp. 64–65) in two groups; new test question and regrouping, own wording |
| D003 concept card | Nostro/Vostro/Loro by who is speaking; mirror account | Book gives one example each; no example reused here |
| D004 worked example | Reconciling a mirror balance with a statement | New figures and scenario; the book only says the mirror is used for reconciliation |
| D005 question | A euro account in Germany: what is it called | New scenario (book example uses USD and named banks) |
| D006 question | Which service needs no account | New |
| D007 numerical | Expected statement balance | New figures |
| D008 question | SWIFT description | New; distractors describe CHIPS, a central bank and an RBI network |
| D009 question | Which system nets USD payments through the Federal Reserve | New |
| D010 concept card | Messaging versus settlement; net versus gross | Book describes each system separately (pp. 66–68); the message/settle/net/gross comparison is new |

## Deliberately left out

RTGS/NEFT rules (minimum amounts, hours, settlement intervals) are RBI rules that change; FATF due-diligence text;
CHAPS's settlement mode (the book says it nets like CHIPS, which is doubtful and unchecked); membership and volume
figures; NRI banking (next batch, regulation-heavy).

## Review status

| Check | Status |
| --- | --- |
| Structure and mapping | passed (`validate:staging`, `import:staging`) |
| Calculations | passed (`tests/content/batch-u03-b001.test.ts`) |
| Source support | passed (pages read directly) |
| Session applicability | not applicable (no regulatory rule stated) |
| Originality | passed against the pages read |
| Question quality | D006 is a negative-stem question; wrong options are plausible account-based services |
