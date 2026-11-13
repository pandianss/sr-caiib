# Batch BFM-A-U02-B001 — evidence and review record

Paper BFM, unit "Liberalised Remittance Scheme (LRS) and other Remittance Facilities for Residents" (`BFM::MOD_A::U02`), objectives LO_01 to LO_04.
Nineteen items. Written 13 November 2026 by Claude Sonnet 5.5.

## Evidence

Courseware S03 printed pp. 46-60 was read directly (printed page n = PDF page n + 17). The scheme's rules are regulation-sensitive, so each
was checked against RBI's own FAQ on the scheme (`RBI_FAQ_LRS`, updated 6 April 2023, saved locally and fingerprinted in
`content/sources/registry.json`). The page is dated before the 30 June 2026 cut-off. No later change to the USD 2,50,000 limit or the conditions was
found, but a notice RBI issued after that FAQ could have been missed; this is recorded in the batch's `unresolved` field.

## Where the sources differ from the courseware

- The courseware (printed p. 50) says "no restrictions on the frequency of remittances"; the FAQ adds the cumulative limit and the rule that bringing proceeds back does not restore the limit. Both are taught.
- The courseware's definitions of the Foreign Exchange Management Act sections and penalties, the ODI procedures (Form ODI Part I and II, APRs; printed pp. 55-57), cash and foreign currency note limits for travel (printed p. 51) and daily XBRL reporting were not checked against current sources and are not taught.
- The courseware's TCS description (5% above Rs 7 lakh, 2020) is superseded; see batch BFM-A-U02-B002.

## Drafts and originality

| Draft | What it is | Compared with the sources |
| --- | --- | --- |
| D001 card | Current versus capital account by "does it change what you own abroad" | New framing of the FAQ introduction |
| D002 card | The LRS in one view | Own summary; FAQ and book use Q&A and bullets |
| D003 card | What the LRS will not pay for, with a pattern to remember | Own grouping |
| D004 card | Permitted purposes grouped as travel, people, health, education | Own grouping |
| D005 card | Capital account conditions | Own wording |
| D006 card | Family members and the sole proprietor | New |
| D007 card | Rupee gift or loan to an NRI relative | Own wording of the FAQ conditions |
| D008 worked example | Headroom after four remittances with a proprietorship | New figures |
| D009–D019 questions | Eligibility, limit logic, prohibited items, classification, PAN, currency, capital account, proprietor, loan, unspent exchange, numerical headroom | New stems and figures; correct answers placed in varied positions |

## Review status

| Check | Status |
| --- | --- |
| Structure and mapping | passed (`validate:staging`, `import:staging`) |
| Calculations | passed (`tests/content/batch-u02-b001.test.ts`) |
| Source support | passed (primary FAQ saved and read) |
| Session applicability | passed with the note on later notices |
| Originality | passed against the pages read |
