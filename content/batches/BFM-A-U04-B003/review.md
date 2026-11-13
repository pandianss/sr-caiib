# Batch BFM-A-U04-B003 — evidence and review record

Paper BFM, unit "Documentary Letters of Credit" (`BFM::MOD_A::U04`), objectives LO_05 and LO_06.
Twenty-one items drafted; eighteen published, three held back. Written 13 November 2026 by Claude Sonnet 5.5.

## Evidence

Courseware S03 printed pp. 105-110 was read directly (printed page n = PDF page n + 17). The document checklists follow the courseware and the
UCP structure already taught. The two parts that are regulation-sensitive were checked against RBI primary pages, saved locally and fingerprinted in `content/sources/registry.json`:

| Source | Used for | Notes |
| --- | --- | --- |
| `RBI_MD_IMPORT` (Master Direction - Import of Goods and Services, page shows updated as on 12 January 2026) | Evidence of import (section C.7.1: bill of entry number, port code and date in IDPMS; post, courier and bonded alternatives; delivery against acceptance with up to three months for genuine delay; ORM) and credit reports on overseas suppliers (section C.6.3, USD 300,000) | In force at the 30 June 2026 cut-off |
| `RBI_EXIM_DIRECTIONS_2026` (RBI circular of 16 January 2026) | The Import Master Direction is superseded by new directions in force from 1 October 2026 | Issued before the cut-off, in force after it; only the circular was retrieved, not the new directions' text |

## Held back

| Draft | Why |
| --- | --- |
| Crystallisation worked example, usance-crystallisation question and the rupee numerical | The courseware attributes the rule (bank-set period for sight bills, bill selling rate or forward rate, usance on the due date) to FEDAI guidelines (printed p. 108). The FEDAI rulebook could not be retrieved; the rule cannot be confirmed as applicable at the cut-off. The arithmetic is tested but the items are not published |

## Where the courseware needs care

- It cites UCP 500 article numbers for insurance points (for example "Article 34"); in UCP 600 they are in Article 28. The items cite no old numbers.
- The courseware says an insurance document "must not be issued by the broker"; that point is tied to the old numbering and was not checked against UCP 600, so it is not taught.
- The courseware's "three months" follow-up of bills of entry and the half-yearly report to RBI (printed p. 109) describe an older practice; the Master Direction's current wording is taught instead.

## Drafts and originality

| Draft | What it is | Compared with the source |
| --- | --- | --- |
| D001-D007 cards | Draft and invoice; bill of lading; insurance; supporting documents; evidence of import; safeguards for banks; risks | Own checklists and framing |
| D008 worked example | Invoice value and 110% insurance on a CIF credit | New figures |
| D009 worked example (held) | Crystallisation at the bill selling rate and a forward rate | New figures |
| D010-D021 questions | Draft; invoice value; bill of lading; minimum insurance; certificate of origin; evidence of import; delivery against acceptance; supplier credit report; unretired sight bill; risks; crystallisation (held); rupee numerical (held) | New stems and figures; answers vary in position |

## Review status

| Check | Status |
| --- | --- |
| Structure and mapping | passed |
| Calculations | passed (`tests/content/batch-u04-b003.test.ts`, including the held items) |
| Source support | passed for published items (pages read; RBI Master Direction saved and read) |
| Session applicability | passed for published items; crystallisation held for lack of a FEDAI source |
| Originality | passed against the pages read |
