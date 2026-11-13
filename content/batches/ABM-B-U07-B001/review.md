# Batch ABM-B-U07-B001 — evidence and review record

Paper ABM, Module B unit 7 "HRM and Information Technology" (`ABM::MOD_B::U07`; courseware unit 16). Forty-six items: 10 concept cards and 36 choice questions. Record written 15 November 2026.

## Evidence

Source `S01` *Advanced Bank Management* (CAIIB courseware), scanned pages read directly with `scripts/render-page.mjs` (printed page n = PDF page n + 15). Pages read: printed pp. 363 to 390 (PDF pp. 378 to 405), the whole unit including the summary, keywords, Check Your Progress statements, terminal questions and further readings. Printed p. 362 (title page) was not read in detail. All 14 facts in `staging.json` carry a printed page and section. No calculations are involved.

## Limits of the evidence

The unit is descriptive and partly drawn from web sources and vendor material (the courseware cites business-jargon and software-comparison websites, a Forbes article and an HRIS vendor's module names). Authors and sources named by the courseware (Khanna, Prabhat, Mankidy, Sharad Kumar, Bernard Marr, Strohmeier 2007, Wilcox 1997, Nonaka and others 1995, Doug Laney and Gartner) were not checked against the originals, and the courseware's market-size figures for knowledge management were not used. Statements about Indian banks (HRIS implemented for about three decades, public sector banks losing staff to new private sector and foreign banks, e-learning as the commonly used method in banks) reflect the courseware's writing date and were not checked against any bank's practice or the cut-off of 30 June 2026. Technology changes quickly: the content is taught at the level of concepts (what an HRIS, HRMS, e-HRM, VILT, AR and VR are for), and no question depends on a named vendor or product. Session applicability is **not checked**.

## Drafts and originality

The courseware's prose, lists (the HRIS advantages, the eight KM steps, the ten KM benefits, the e-learning advantages and disadvantages), figures and Check Your Progress statements (printed pp. 367, 376, 378 and 388) were compared with every item.

| Area | Relationship to the book |
| --- | --- |
| Cards D001 to D010 | Reorganised into comparison tables (HRIS against HRMS, the three tiers and five activities of e-HRM, four research approaches, five KM components and eight steps, four technology training types with e-learning advantages and disadvantages, business intelligence against analytics, the 3Vs). The long KM benefits list is condensed to its headings; vendor and product names are not reproduced |
| Questions D011 to D046 | New scenario or definition items; none repeats a Check Your Progress statement; answer positions are balanced 9 each across A to D by construction |

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | not applicable | None |
| Source support | passed for the courseware's account | Pages read directly; cited works and web sources not checked |
| Session applicability | not checked | See above |
| Originality | passed against the pages read | See table |
| Question quality | partly checked | `tests/content/batch-abm-b-u07-b001.test.ts` checks structure and answer spread; no human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.

## Coverage after this batch

All seven objectives of Module B unit 7 have teaching and assessment. This completes ABM Module B (Human Resource Management, courseware units 10 to 16). Next: ABM Module C, Credit Management (courseware unit 17 onwards, printed p. 393 = PDF p. 408), then Module D.
