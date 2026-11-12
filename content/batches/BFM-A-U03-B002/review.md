# Batch BFM-A-U03-B002 — evidence and review record

Paper BFM, unit "Correspondent Banking and NRI Accounts" (`BFM::MOD_A::U03`), objective LO_03 (RTGS, NEFT, CHAPS).
Nine items. Written 12 November 2026 by Claude Sonnet 5.5.

## Evidence

The RTGS and NEFT rules are regulation-sensitive, so they were checked against primary sources rather than the
courseware alone. Pages were fetched on 12 November 2026, saved locally (not committed) and fingerprinted in
`content/sources/registry.json`:

| Source | Used for | Notes |
| --- | --- | --- |
| `RBI_FAQ_RTGS` (RBI RTGS FAQs, page dated 14 Oct 2026) | RTGS definition, gross settlement, finality, Rs 2,00,000 minimum, no ceiling, 24x7x365 | Page date is after the 30 June 2026 cut-off. The minimum and the 24x7 operation date from 2020 and agree with the 2026 courseware (S03 printed p. 68), so they are treated as applicable at the cut-off |
| `RBI_FAQ_NEFT` (RBI NEFT FAQs, page dated 2 Sep 2024) | Half-hourly batches, 24x7x365, no RBI limit with member-bank limits under Board approval, Rs 50,000 cash remittance cap, two-hour credit | Dated before the cut-off |
| `BOE_CHAPS` (Bank of England CHAPS page, undated) | CHAPS settles gross in the Bank's RTGS | Contradicts courseware printed p. 67 (net); see below |
| `S03` printed pp. 67–69 | Corroboration of RTGS minimum and 24x7 | Courseware figures for RTGS/NEFT agree with RBI; its older NEFT statements (hourly; 30 minutes to credit) are not used |

## Courseware discrepancy

S03 printed p. 67 says CHAPS "works on the same principles as CHIPS" on a net settlement basis. The Bank of England
says CHAPS payments between direct participants settle individually, gross, in its RTGS system. D004 tells the
learner about the difference and no scored question tests the settlement mode. Published item B001 D010 says only
that CHAPS is the British counterpart of CHIPS handling payments in London, which is consistent with both. This
does not change what the courseware says; it flags it.

## Drafts and originality

| Draft | What it is | Compared with the sources |
| --- | --- | --- |
| D001 concept card | RTGS read word by word, with floor, ceiling, hours | Own wording; courseware p. 68 gives a paragraph |
| D002 concept card | NEFT batches, limits, cash remittance, credit time | Own wording; the courseware's older bullets are not reused |
| D003 worked example | Three payments tested against the RTGS floor | New figures |
| D004 concept card | CHAPS caution | New |
| D005–D009 questions | RTGS minimum; NEFT settlement; cash cap; why RTGS is final; who may limit NEFT | New stems and options; correct answers placed in different positions |

## Review status

| Check | Status |
| --- | --- |
| Structure and mapping | passed (`validate:staging`, `import:staging`) |
| Source support | passed (primary pages read and saved) |
| Session applicability | passed with the note above on the RTGS page date |
| Calculations | not applicable (comparisons only; checked in `tests/content/batch-u03-b002.test.ts`) |
| Originality | passed against the pages read |
