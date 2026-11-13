# Batch BFM-A-U02-B003 — evidence and review record

Paper BFM, unit "Liberalised Remittance Scheme (LRS) and other Remittance Facilities for Residents" (`BFM::MOD_A::U02`), objectives LO_03, LO_04 and LO_06.
Fifteen items. Written 13 November 2026 by Claude Sonnet 5.5.

## Evidence

The primary source is RBI's Master Direction on the LRS (`RBI_MD_LRS`, FED Master Direction No. 7/2015-16, page shows "updated as on
September 06, 2024"), saved locally and fingerprinted in `content/sources/registry.json`. It is dated before the 30 June 2026 cut-off. The courseware (S03 printed pp. 49-58)
was read directly and used to decide what to teach; where it differs from the Master Direction, the Master Direction is followed.

## Where the courseware differs from the Master Direction

- **Overseas investment.** The courseware (printed pp. 55-57) teaches the 2004 overseas direct investment procedure (Form ODI Parts I and II, annual performance reports, 30-day and 60-day rules). The Master Direction says that these are now governed by the Overseas Investment Rules, Regulations and Directions of 2022. Those texts were not retrieved, so the procedure is not taught.
- **Cash and foreign currency notes for travel** (printed p. 51: Rs 50,000 cash and note limits by destination) and **daily XBRL reporting** (printed pp. 57-58) are not in the Master Direction retrieved; not taught.
- **Reporting** is taught as the Master Direction states it: remittances are reported in FETERS and banks follow the Master Direction on Reporting under FEMA, whose text was not retrieved.
- **IFSC remittances**, which the courseware states from July 2023, are taught from the Master Direction's own wording.

## Drafts and originality

| Draft | What it is | Compared with the sources |
| --- | --- | --- |
| D001 card | History of the limit (the 2013 cut and 2015 rise) | New framing of the Master Direction's table |
| D002 card | Current account purposes inside the ceiling; the employer-borne exception | Own grouping |
| D003 card | Emigration, medical and studies routes above the ceiling | Own grouping |
| D004 card | Capital account routes and the IFSC window | Own wording |
| D005 card | Bank duties and reporting on each remittance | Own checklist |
| D006 worked example | Student estimate above the ceiling | New figures |
| D007–D015 questions | Limit history; employer-borne business trip; studies; IFSC; bank duties; reporting; capital routes; foreign currency account; numerical release on estimate | New stems and figures; correct answers vary in position |

## Review status

| Check | Status |
| --- | --- |
| Structure and mapping | passed |
| Calculations | passed (`tests/content/batch-u02-b003.test.ts`) |
| Source support | passed (Master Direction saved and read in full) |
| Session applicability | passed: dated before the cut-off, no later update seen |
| Originality | passed against the pages read |
