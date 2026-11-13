# Batch BFM-A-U03-B004 — evidence and review record

Paper BFM, unit "Correspondent Banking and NRI Accounts" (`BFM::MOD_A::U03`), objective LO_06 (facilities to NRIs).
Eleven items. Written 13 November 2026 by Claude Sonnet 5.5.

## Evidence

Courseware S03 printed pp. 79-82 was read directly (printed page n = PDF page n + 17). Because the investment rules changed in
June 2026, each rule was checked against RBI primary pages, saved locally (not committed) and fingerprinted in
`content/sources/registry.json`.

| Source | Used for | Notes |
| --- | --- | --- |
| `RBI_APDIR_14_2026` (A.P. (DIR Series) Circular No. 14, 15 June 2026) | Schedule III route widened to all individuals resident outside India, with enhanced limits | Before the 30 June 2026 cut-off. It does not give the new limit figures |
| `RBI_FEMA_395_2019` (Mode of Payment and Reporting Regulations, amended upto 13 June 2026) | Schedule III (repatriation) and Schedule IV (non-repatriation) payment modes and sale-proceeds treatment | Before the cut-off |
| `RBI_FAQ_IMMOV` (RBI FAQ on purchase of immovable property, updated 6 April 2023) | What NRIs and OCIs may buy, sell and gift; payment modes; repatriation of sale proceeds; restricted nationalities | Before the cut-off |

## Where the sources differ from the courseware

- **Portfolio Investment Scheme limits.** The courseware (printed p. 80) gives 5% for an individual and 10% for all NRIs together. The Third Amendment Rules, 2026 (S.O. 3030(E), 12 June 2026) and RBI's circular of 15 June 2026 widen eligibility and enhance the limits, which was before the 30 June 2026 cut-off. The RBI circular gives no figures. Secondary commentary (EY, TaxGuru) says below 10% and 24%; the Rules text was not retrieved, so no item states the new figures. The card tells learners the direction of change.
- **Mutual fund proceeds.** The regulations let the NRI choose between remitting and a permitted account for mutual fund sale proceeds on the repatriation route; the courseware does not say this.
- **Restricted nationalities.** The courseware lists ten countries; the RBI FAQ lists eleven (adds the Democratic People\'s Republic of Korea).
- **Non-repatriation proceeds.** Courseware and regulations agree: proceeds to NRO only.

## Deliberately left out

Government securities, treasury bills, PSU bonds, money-market funds and company fixed deposits (printed pp. 81-82), the ten-year
lock-in, conditions on investing in a firm, the section 6(5) repatriation exception, and the new Schedule III limit figures. They are listed
in the batch's `unresolved` field and the ledger gaps.

## Drafts and originality

| Draft | What it is | Compared with the sources |
| --- | --- | --- |
| D001 card | Repatriation versus non-repatriation routes | Own comparison; the regulations are in schedule form |
| D002 card | June 2026 change in the share route | New |
| D003 card | What an NRI may do with property | Own structure; FAQ is a table |
| D004 card | Conditions for repatriating sale proceeds | Own wording |
| D005 worked example | Three flats, the two-property cap | New scenario |
| D006–D011 questions | Where non-repatriable proceeds go; payment modes; what NRIs cannot buy; property payment; two-property cap; who may use the route | New; correct answers vary in position |

## Review status

| Check | Status |
| --- | --- |
| Structure and mapping | passed (`validate:staging`, `import:staging`) |
| Calculations | passed (`tests/content/batch-u03-b004.test.ts`; one counting example) |
| Source support | passed for what is taught (primary pages saved and read) |
| Session applicability | passed: all three primary sources are dated before the cut-off |
| Originality | passed against the pages read |
