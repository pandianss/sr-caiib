# Batch BFM-A-U01-B010 — evidence and review record

Paper BFM, units "Exchange Rates and Forex Business" (`BFM::MOD_A::U01`, objectives LO_01 and LO_05) and "Liberalised Remittance Scheme and other Remittance Facilities for Residents" (`BFM::MOD_A::U02`, objective LO_01).
Twenty-eight items. Written 14 November 2026 by Claude Sonnet 5.5.

## Evidence

Three primary documents were downloaded, saved locally and fingerprinted in `content/sources/registry.json`:

| Source | Used for |
| --- | --- |
| `FEMA_ACT_1999` (the Act as amended, copy hosted by the Directorate of Enforcement) | The definitions of foreign currency, foreign exchange, capital and current account transactions, authorised person and residence (section 2); sections 3 to 6, 10 to 12 and 13 |
| `RBI_ICG_2011` (RBI Internal Control Guidelines, 3 February 2011) | Organisation of the dealing department, brokers, risk control, documentation, Nostro reconciliation, Vostro risk, auditing |
| `RBI_MD_RISK` (RBI Master Direction on Risk Management and Inter-Bank Dealings, page updated 1 October 2026) | NOOPL (25% of total capital), the shorthand method, AGL (six times total capital) |

## Limits of the evidence

- The Internal Control Guidelines are the only text of the dealing room controls found. RBI's site still hosts them, but a withdrawal notice from RBI's 2025 consolidation could not be searched for; some content predates later changes. Items state the controls and do not test dated details.
- The Master Direction page is the version of 1 October 2026; updates on 22 September 2026 and 1 October 2026 fall after the cut-off and earlier versions were not retrieved. The NOOPL and AGL parameters match the courseware's general description.
- The Act copy carries amendments up to 2017; none later to the sections used was found. The courseware's compounding limit of ₹2,00,000 (from RBI's 2025 compounding guidelines) is not in the Act and is not taught.

## What this batch closes

It teaches the FEMA definition that was held back since batch BFM-A-U01-B001 (unit 1, LO_01), the RBI dealing room controls (unit 1, LO_05) and the statutory sections the courseware cites for the Liberalised Remittance Scheme (unit 2, LO_01).

## Drafts and originality

| Draft | What it is | Compared with the sources |
| --- | --- | --- |
| D001-D004 cards | Foreign exchange, capital and current account; sections 3 to 6; sections 10 to 12; section 13 | Own summaries of statute; no section text is copied |
| D005-D009 cards | Dealing room organisation and controls; back office and brokers; risks, limits and documents; Nostro and Vostro and audit; NOOPL, shorthand method and AGL | Own groupings of the RBI guidelines |
| D010-D011 worked examples | Net open position and limits; penalty arithmetic | New figures |
| D012-D025 questions | Definitions; classification; section 5; section 10(5); section 13; segregation; tapes; brokers; settlement risk; documentation; Nostro frequency; NOOPL; shorthand method | New stems; answers vary in position |
| D026-D028 numericals | AGL ceiling; overall net position; maximum penalty | New figures |

## Review status

| Check | Status |
| --- | --- |
| Structure and mapping | passed |
| Calculations | passed (`tests/content/batch-u01-b010.test.ts`) |
| Source support | passed (three primary documents saved and read) |
| Session applicability | passed with the notes above |
| Originality | passed against the pages read |
