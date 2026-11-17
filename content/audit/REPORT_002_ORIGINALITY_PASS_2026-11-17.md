# REPORT 002: Originality pass against source courseware (AUD-010)

Date: 17 November 2026
Performed by: Claude (authoring agent), at the owner's request
Status: **corrections applied and republished locally; independent re-verification pending**

## Why

The project rule is that source PDFs establish facts, not reusable learner-facing expression. This pass checked every
published string against the source courseware text to find wording that was carried over.

## Scope and method

- **Content:** all 8,395 published items in the five packs (77,985 text fields, about 835,000 words).
- **Sources:** the five courseware books (ABM, BFM, ABFM, BRBL, CB), 3,297 scanned pages, converted to text with
  Windows OCR at 170 dpi; plus 253 primary documents (acts, RBI directions, FEDAI and IIBF documents) used only to
  tell statutory wording apart from the books' own wording.
- **Checks** (scripts in `scripts/originality/`):
  1. `scan.py`: longest verbatim word run per field (5-word shingles), share of the field covered, and a
     sentence-level fuzzy match with numbers masked.
  2. `qscan.py`: each question's stem and options against source pages, flagging pages that carry the books'
     own "Check Your Progress" questions.
  3. `numscan.py`: whether a numeric example's figures all sit together on one source page.
- OCR is imperfect, so a match can be missed where the scan misread a word. Shingles of five words were used to
  limit this. The OCR text is kept outside the repository (`.scratch/originality/`, git-ignored) because it is the
  publisher's text.

## Findings before correction

About 97 per cent of the text shared no run of eight or more words with the books. The problems were:

| Tier | What it means | Fields | Items |
| --- | --- | ---: | ---: |
| 1a | Question tracks a source "Check Your Progress" question | 63 | 63 |
| 1b | Question stem is a lifted source sentence, or options sit on the source page | 368 | 368 |
| 2 | Book-only verbatim run of 12 or more words | 359 | 257 |
| 3 | Sentence 70 per cent or more the source's wording | 447 | 303 |
| 4 | Long field, majority verbatim | 154 | 111 |
| 5 | Short field (8 to 19 words), wholly verbatim | 154 | 147 |
| | **Must-fix total** | **1,394** | **1,036** |
| 6 | Run of 8 to 11 words inside otherwise original text | 632 | 482 |
| L | Statutory or regulatory wording the books themselves quote | 739 | about 500 |

Central Banking held about half of the must-fix items. In that pack, distractor explanations repeat the correct
option's text, so one lifted option produced up to four flagged fields.

## Corrections

- 1,158 fields in 728 items were reworded in `content/batches/*/staging.json` and `draft-bundle.json`
  (ABM 299, BFM 93, ABFM 153, BRBL 146, CB 467). Old and new text for every field:
  `content/audit/evidence/originality-2026-11-17/rewrites.jsonl`.
- The 63 tier 1a questions received new stems. Where the options also matched the source, distractors and their
  explanations were replaced or reworded. Correct answers and answer keys were not changed.
- Facts, figures, formulas and terminology were kept. No numeric answer changed.
- Nine calculation tests find questions by the opening words of the stem; those lookups were updated to the new
  stems. No expected value changed.
- Packs republished: `ABM-2026DEC@49`, `BFM-2026DEC@55`, `ABFM-2026DEC@7`, `BRBL-2026DEC@2`, `CB-2026DEC@2`.
  Item identities are unchanged; item revisions were not advanced, following the AUD-004 precedent, so the pack
  version is what distinguishes the old text from the new.

## Result after correction

| Tier | Before | After |
| --- | ---: | ---: |
| 1a copied source question | 63 | 2 |
| 1b lifted stem | 368 | 101 |
| 2 book-only run of 12+ words | 359 | 77 |
| 3 fuzzy 70 per cent or more | 447 | 144 |
| 4 long, majority verbatim | 154 | 111 |
| 5 short, wholly verbatim | 154 | 90 |
| **Must-fix total (fields)** | **1,394** | **505** |

Checks after republishing: typecheck and lint clean; 695 of 695 tests pass; each pack equals its draft bundles and
`public/content/packs` equals each pack.

## What still flags

1. **Residual must-fix flags (505 fields).** The 80 that still flag after being reworded were read one by one:
   they are short factual questions and lists whose only overlap is proper names, Act titles, institution names
   or standard term lists (for example "When was the Bank of England founded?"). The remaining spans were left
   deliberately in the first pass as names, statutory wording, formulas or standard lists; they were judged when
   first read and were not re-read individually after the re-scan. The two remaining tier 1a hits match on an
   institution's name only.
2. **Statutory and regulatory wording (about 740 fields).** Not reworded. These repeat the words of an Act or an
   RBI direction that the book also quotes. Whether quoting law at this length is acceptable is a legal question
   for the owner.
3. **Runs of 8 to 11 words inside original text (about 620 fields).** Not reworded. Mostly terminology and names.
4. **Numeric examples (8 questions).** Their figures all appear together on one source page (list in
   `evidence/originality-2026-11-17/numeric-examples.json`). They were reworded but keep the source's numbers,
   because new numbers need new answer keys and recomputation tests.

## Open items

- **Independent re-verification.** The rewordings were written and checked by the authoring agent only. The
  publish specifications still name the independent auditor as reviewer for the pack as a whole; the reworded
  fields have not been through that review. Antigravity should verify the 728 items, with priority on the 63
  rewritten questions, and record the result here.
- **Decide** whether to renumber the eight numeric examples and whether to reword the 8 to 11 word runs.
- **Release.** The corrected packs exist only in this working tree. The Play Store build still carries the
  previous text until a new release is built and published.
- **Repeat the scan** for each elective (RM, ITDB, HRM, RB) before first publication.

## Reproducing

```
python scripts/originality/ocr.py "<book.pdf>" <ocr_dir>/<PAPER> 0 9999      # once per book; needs pymupdf, winocr
node scripts/originality/collect.mjs                                         # current text from draft bundles
python scripts/originality/scan.py  <ocr_dir> <cur_dir> flags.json <primary_text_dir>
python scripts/originality/qscan.py <ocr_dir> <cur_dir> qflags.json
python scripts/originality/tiers.py flags.json qflags.json tiers.json
python scripts/originality/numscan.py <ocr_dir> <cur_dir> numflags.json
```

`collect.mjs`, `worklist.py` and `apply.mjs` expect to run from a working folder two levels below the repository
root (they were run from `.scratch/originality/`).
