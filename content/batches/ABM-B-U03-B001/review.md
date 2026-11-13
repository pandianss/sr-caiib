# Batch ABM-B-U03-B001 — evidence and review record

Paper ABM, Module B unit 3 "Human Implications of Organisations" (`ABM::MOD_B::U03`; courseware unit 12), part 1: human behaviour and individual differences, personality, diversity and gender issues (objectives LO_01 to LO_03). Thirty-one items: 10 concept cards and 21 choice questions. Record written 14 November 2026.

## Evidence

Source `S01` *Advanced Bank Management* (CAIIB courseware), scanned pages read directly with `scripts/render-page.mjs` (printed page n = PDF page n + 15). Pages read for this batch: printed pp. 250 to 263 (PDF pp. 265 to 278). The whole of the unit (printed pp. 250 to 283) was read; printed pp. 263 to 283 (motivation theories, motivation techniques, role concept and analysis) belong to the next batch, and objectives LO_04 to LO_06 are registered with no items, so the topic is not complete. Printed p. 249 (title page) and the last terminal-question page were not read in detail. All 10 facts in `staging.json` carry a printed page and section. No calculations are involved.

## Limits of the evidence

The unit is descriptive and attributes theories and findings to named authors (Lewin, Maddi, Cattell, Eysenck, Friedman, Meyer and Rosenman, Erikson, Freud, Carl Rogers, Holland, Kanter 1977, Powell 1987, a UK 2001 labour market survey, McKinsey 2021). None was checked against the original, so the items attribute them as the courseware reports them.

**Legal statements on gender, held out of the lessons.** The courseware's account of Indian law on gender (the Equal Remuneration Act 1976, the Factories Act 1948, the Hindu Succession Act 1956 as amended, and section 354 of the Indian Penal Code added by the Criminal Law (Amendment) Act 2013) is its own and was not checked against primary sources or the 30 June 2026 cut-off. Some of these have since been replaced or reorganised (for example the Indian Penal Code by the Bharatiya Nyaya Sanhita from 1 July 2024, and wage and factory laws by the labour codes). The lessons and questions therefore do not teach these provisions; the card says so, and the ledger records a gap on LO_03 until the current law is checked. The Sexual Harassment of Women at Work Place (Prevention, Prohibition and Redressal) Act 2013 and its commencement date of 9 December 2013 are reported as the courseware states them (the Act remains the principal statute, but this was not verified for the cut-off). Session applicability is therefore **not checked** for this batch.

## Drafts and originality

The courseware's prose, lists, tables (including Holland's typology and the brain-hemisphere table) and Check Your Progress statements (printed pp. 255, 257, 259) were compared with every item.

| Area | Relationship to the book |
| --- | --- |
| Cards D001 to D010 | Reorganised into comparison tables (four groups of behavioural factors, views of man, seven assumptions, Type A against Type B, Erikson's eight stages with workplace parallels, four personality theories, three diversity approaches). Holland's six types and the hemisphere dimensions are condensed from the courseware's tables, keeping the terms and the examples of occupations that are the substance of the topic |
| Questions D011 to D031 | New scenario or definition items; none repeats a Check Your Progress statement; answer positions are spread across A to D by construction |

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | not applicable | None |
| Source support | passed for the courseware's account | Pages read directly; cited works not checked |
| Session applicability | not checked | See above; legal provisions left out |
| Originality | passed against the pages read | See table |
| Question quality | partly checked | `tests/content/batch-abm-b-u03-b001.test.ts` checks structure and answer spread; no human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.

## Coverage after this batch

Objectives LO_01 and LO_02 have teaching and assessment; LO_03 has teaching and assessment but carries a recorded gap (the courseware's legal statements on gender are not taught pending verification). LO_04 to LO_06 are open. Next: `ABM-B-U03-B002` from printed p. 263.
