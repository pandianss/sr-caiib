# Batch BFM-A-U03-B003 — evidence and review record

Paper BFM, unit "Correspondent Banking and NRI Accounts" (`BFM::MOD_A::U03`), objectives LO_04 (NRI/PIO definitions and accounts)
and LO_05 (advances against non-resident deposits; housing loans to NRIs). Fourteen items. Written 13 November 2026 by Claude Sonnet 5.5.

## Evidence

All of this is RBI regulation, so each rule was checked against primary RBI pages, saved locally (not committed) and
fingerprinted in `content/sources/registry.json`. The courseware (S03, printed pp. 69-83, all read directly; printed page n = PDF page n + 17) was used to
decide what to teach and as corroboration.

| Source | Used for | Notes |
| --- | --- | --- |
| `RBI_FAQ_NRACC` (RBI "Accounts in India by Non-residents", dated 16 Jan 2025) | NRI and PIO definitions; the NRE, NRO, FCNR(B) and SNRR accounts; loans against deposits | Dated before the 30 June 2026 cut-off |
| `RBI_MD_INR_LENDING` (RBI Master Direction on INR borrowing and lending with NRIs/PIOs; page shows "updated as on September 08, 2026") | Housing loan terms (section 4) | The update date is after the cut-off; the section's terms agree with the 2026 courseware, so they are treated as applicable at the cut-off |

## Where the sources differ from the courseware

- NRE fixed deposits: the courseware says a minimum period of one year; RBI says one to three years, with banks free to accept longer. No item states a maximum.
- Housing-loan repayment: RBI also allows a relative in India to repay by account-to-account transfer; the courseware omits it. The items include it.
- Rent credits: the courseware's case study sends rent to NRO; RBI says current income such as rent can also be an NRE credit if the dealer is satisfied it has not lost repatriable character. No item tests where rent is credited.

## Deliberately left out

Income-tax residency tests (Finance Act), RFC accounts for returning NRIs (no primary source found), OCBs, SNRR seven-year limit
and NRO-to-SNRR bar (courseware only; not found in the RBI FAQ), and facilities to NRIs for investing (LO_06, next batch).

## Drafts and originality

| Draft | What it is | Compared with the sources |
| --- | --- | --- |
| D001 card | NRI or PIO with a "passport and residence" test | Own framing of FAQ Q1/Q2 definitions, which are statutory wording |
| D002 card | NRE versus NRO by the character of the money | New framing; the book tabulates the accounts separately |
| D003 card | USD 1 million NRO allowance | New |
| D004 card | FCNR(B) and SNRR | New framing |
| D005 card | Loans against non-resident deposits | Own wording; RBI's table lists the rules |
| D006 card | NRI housing loans | Own wording of the section-4 conditions |
| D007 worked example | Remaining allowance across three remittances | New figures; the book's case studies are not reused |
| D008 numerical | Remaining allowance with an NRE transfer | New figures |
| D009–D014 questions | NRI definition; where a gift goes; SNRR; housing-loan statement; deposit with a loan; NRO limit | New; correct answers vary in position |

## Review status

| Check | Status |
| --- | --- |
| Structure and mapping | passed (`validate:staging`, `import:staging`) |
| Calculations | passed (`tests/content/batch-u03-b003.test.ts`) |
| Source support | passed (primary pages saved and read) |
| Session applicability | passed with the note above on the Master Direction update date |
| Originality | passed against the pages read |
