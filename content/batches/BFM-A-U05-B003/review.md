# Batch BFM-A-U05-B003 — evidence and review record

Paper BFM, unit "Facilities for Exporters and Importers" (`BFM::MOD_A::U05`), objective LO_04 (export finance and the Gold Card scheme).
Seventeen items. Written 14 November 2026 by Claude Sonnet 5.5.

## Evidence

Courseware S03 printed pp. 137-147 was read directly (printed page n = PDF page n + 17). The courseware's export finance details are largely superseded, so every rule taught was checked against
RBI's consolidated Credit Facilities Directions (`RBI_CF_2025`, RBI/DOR/2025-26/154 of 28 November 2025, Chapter XV Export Credit), saved locally and fingerprinted in `content/sources/registry.json`.
The Directions of 28 November 2025 were in force at the 30 June 2026 cut-off. The saved page is a later version (updated 1 October 2026); earlier versions were not retrieved, so a change to Chapter XV between the cut-off and October 2026 cannot be excluded.

## Where the courseware differs from the Directions

- **Packing credit period.** The courseware gives a normal 180 days extendable to 360 (printed p. 138); the Directions leave the period to the bank and keep the 360-day outer limit for export credit status.
- **Sanction illustration and interest.** The courseware links rates to MCLR from 1 April 2016 and uses a sample sanction; neither is taught. The Directions refer to RBI's interest-rate directions.
- **FOB deduction** (13-14% for sea, 25% for air) is a bank practice rule in the courseware and is not in Chapter XV; not taught.
- **Undrawn balances.** The courseware says up to 10% of the export value and a 90-day concessional advance (printed p. 143); the Directions describe bills drawn at 90-98% of FOB with the bank lending on commercial judgement. The Directions are taught.
- **Foreign currency credit.** The courseware uses LIBOR and says SOFR or another reference rate should be substituted; the Directions use a widely accepted Alternative Reference Rate. PCFC's maximum is 360 days, not the courseware's 180.
- **Normal Transit Period.** The 25-day figure is a FEDAI rule not retrieved; no item states a number of days.

## Drafts and originality

| Draft | What it is | Compared with the sources |
| --- | --- | --- |
| D001-D006 cards | Packing credit under today's rules; liquidation and relaxations; the running account; post-shipment periods and undrawn balances; PCFC and EBR; the Gold Card | Own groupings and framing of the Directions' paragraphs |
| D007 worked example | Usance credit deadline and Gold Card stand-by limit | New dates and figures |
| D008 numerical | Gold Card stand-by limit | New figures |
| D009-D017 questions | The 360-day rule; substitution of contract; who gets a running account; usance period; PCFC; recourse; Gold Card eligibility; processing time; deadline date | New stems and figures; answers vary in position |

## Review status

| Check | Status |
| --- | --- |
| Structure and mapping | passed |
| Calculations | passed (`tests/content/batch-u05-b003.test.ts`) |
| Source support | passed (the Directions saved and read for each rule taught) |
| Session applicability | passed with the note about the October 2026 version of the page |
| Originality | passed against the pages read |
