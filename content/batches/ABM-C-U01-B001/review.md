# Batch ABM-C-U01-B001 — evidence and review record

Paper ABM, Module C unit 1 "Overview of Credit Management" (`ABM::MOD_C::U01`; courseware unit 17). Forty-six items: 12 concept cards, 2 worked examples, 26 choice questions and 6 numerical questions. Record written 15 November 2026.

## Evidence

Source `S01` *Advanced Bank Management* (CAIIB courseware), scanned pages read directly (printed page n = PDF page n + 15): the title page (p. 393) and printed pp. 394 to 410 (PDF pp. 409 to 425). The remainder of the unit (printed pp. 410 onward: the rest of the interest-rate guidance and the material after it, including the insolvency process named in the unit objectives) was **not read**; objective LO_07 is only partly covered and the topic is not complete.

Primary source `RBI_PSL_2025` (RBI Priority Sector Lending - Targets and Classification Directions, 2025; fetched 15 November 2026, registered with its hash). It confirms paragraph 7.1 and 7.2 targets and the 8.1 district weights; its page is the consolidated text updated as on 11 September 2026 and lists amendment directions of 19 January 2026 and 7 August 2026.

## What is taught and what is held back

| Taught | Basis |
| --- | --- |
| Importance and history of credit, principles of credit, types of borrowers and governing laws, fund and non-fund credit, loan policy, appraisal, post-sanction stages | Courseware (descriptive; the governing-law list is flagged `needs_review` for one year given in the courseware) |
| Priority sector structure, targets of 40, 18, 14, 10, 7.5 and 12 per cent for domestic banks, other banks' totals, district weights | Courseware **and** the 2025 Directions agree |
| MSME classification thresholds | Courseware's statement of the 21 March 2025 notification; notification not retrieved (`needs_review`) |
| Credit exposure norms (20, 25, 10, 5 and 0.25 per cent of Tier 1) | Courseware's account of the 2019 Large Exposures Framework; current direction not retrieved (`needs_review`) |
| Benchmark pricing idea (EBLR, MCLR) | Courseware citing 2016 Directions updated in 2023; only the idea taught (`needs_review`) |

**Held back (not taught, recorded as a gap on LO_05, LO_06 and LO_07):** every priority sector eligibility amount in the courseware (farm credit, small and marginal farmer criteria, export credit, housing, education, social infrastructure, renewable energy, start-up and weaker section limits), because amendment directions of 2026 were not read; the loan system (60 per cent loan component), the large borrower framework (Rs 10,000 crore), the 45-day payment rule for MSEs, the collateral-free MSE limits, the composite loan, the revival framework and the MSE credit growth advice, which rest on older circulars not checked against the 30 June 2026 position.

## Drafts and originality

The courseware's prose, lists, tables of borrowers, targets and classification, and the structure of the loan policy and appraisal sections were compared with every item. Cards are reorganised into comparison tables and questions; worked examples use new figures (ANBC of Rs 5,00,000 crore; Tier 1 of Rs 40,000 crore). Answer positions are spread across A to D by construction.

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | `tests/content/batch-abm-c-u01-b001.test.ts` recomputes both worked examples and all six numerical answers and, when the local copy of the Directions is present, checks that the target percentages appear in its text |
| Source support | passed for the courseware's account and for the targets (primary) | Printed pp. 410 onward unread |
| Session applicability | partly checked | Targets agree with the 2025 text; later amendments of 2026 not read; other regulatory figures not checked |
| Originality | passed against the pages read | See above |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.

## Coverage after this batch

LO_01 to LO_04 have teaching and assessment. LO_05, LO_06 and LO_07 have teaching and assessment with recorded gaps. Next: read the remainder of the unit if any, then Module C unit 2 (Analysis of Financial Statements).
