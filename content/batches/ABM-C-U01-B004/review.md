# Review record: ABM-C-U01-B004

Paper ABM, Module C unit 1 (courseware unit 17), gap closure: priority sector eligibility limits (LO_05), MSME classification and collateral-free MSE loans (LO_06), verified against primary sources instead of the courseware. Fifty-one items: 8 concept cards, 2 worked examples, 35 choice questions and 6 numerical questions. Record written 14 November 2026.

## Evidence

- `RBI_PSL_2025`: Chapter III paragraphs 9 to 17 read in full from the consolidated page (updated as on 11 September 2026). Footnotes show the amount-bearing paragraphs were substituted or inserted by the Amendment Directions of 19 January 2026, before the 30 June 2026 cut-off. The Amendments of 7 August and 11 September 2026 (after the cut-off) are attached only to the ANBC exclusion for FCNR(B) and NRE deposits, which is not taught.
- `MSME_SO_1364E_2025`: the Gazette notification of 21 March 2025 (Hindi and English) with the principal S.O. 2119(E) text, read in English; the thresholds, composite criteria, aggregation by PAN, ITR linkage, export exclusion and Udyam registration all match the items.
- `RBI_MSME_AMEND_2026`: the quoted text of paragraph 4.1 and the effective date, read through a page-reading tool. The local file is an extract of that text, not the PDF.

## Limits

- The base MSME Master Direction and paragraph 6.5 (deleted by the amendment) were not read. Composite loan limit, 45-day payment rule, revival framework, credit growth advice and CPTS are still not taught (ledger gap kept).
- The courseware's Rs 50,000 service charge guideline was not found in the paragraphs read and is not taught again.
- Items in ABM-C-U01-B001 are unchanged. The MSME card D010 there (courseware account) is now consistent with the notification; its D012 card still states the courseware's EBLR dates, recorded as a caveat on LO_07.
- Amendments after the sources' dates were not searched for beyond what the PSL page lists.

## Drafts and originality

Tables and procedures are written afresh from the primary paragraphs; limits and categories are regulatory facts. Worked examples and numerical questions use new figures. Answer positions are spread across A to D by construction. Distractor explanations are brief.

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | `tests/content/batch-abm-c-u01-b004.test.ts` recomputes the classification, housing and export examples and all numerical answers, and checks key phrases against the three local source copies |
| Source support | passed against primary sources | Collateral-free text from a tool extract |
| Session applicability | passed on its face | Post-cut-off PSL amendments identified and excluded |
| Originality | passed | See above |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.
