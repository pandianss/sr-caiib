# Batch ABM-B-U01-B001 — evidence and review record

Paper ABM, Module B unit 1 "Fundamentals of Human Resource Management" (`ABM::MOD_B::U01`; courseware unit 10). Thirty-seven items: 12 concept cards and 25 choice questions. Record written 14 November 2026.

## Evidence

Source `S01` *Advanced Bank Management* (CAIIB courseware), scanned pages read directly with `scripts/render-page.mjs` (printed page n = PDF page n + 15). Pages read: printed pp. 174 to 195 (PDF pp. 189 to 210), the whole unit including the summary, keywords, check-your-progress statements and terminal questions. Printed p. 173 (the module opening) was not read in detail. All 16 facts in `staging.json` carry a printed page and section. No calculations are involved.

## Limits of the evidence

This unit is descriptive. Its content rests on the courseware's account and on works it cites (Schein 1979, Sheth 1992, Pareek and Rao 1981, De'Cenzo 1988, Mankidy 1998, Ulrich 1998, Miner 1969, Verma Prikshat and Kumar 2018, a CII HR Competency Model of 26 February 2004, the SHRM Competency Model). None of these was checked against the original, so the items attribute them as the courseware reports them. The courseware's statements on Indian legislation and institutions (Article 16(1), the Employment Exchanges Act 1959, the Apprentices Act 1961, the Bonded Labour System Act 1976, the Child Labour Act 1986, the Interstate Migrant Workmen Act 1979; IIPM, NILM, NIPM, ISTD, the National HRD Network) were not checked against primary sources, and some of these Acts have since been replaced or amended. Session applicability is therefore recorded as **not checked**, not as not applicable, and the cards say these facts are reported historically.

## Drafts and originality

The courseware's prose, its charts (the HR role chart on printed p. 187), its Check Your Progress statements and its twelve terminal questions were compared with every item.

| Area | Relationship to the book |
| --- | --- |
| Cards D001 to D012 | Reorganised as comparison tables (old and present HR perspective, HRM against HRD, the five roles, the two competency models, the stages of Indian development). The book's discursive passages are not reproduced; lists that are the substance of the topic (Pareek and Rao's five roles, the 9 plus 10 CII competencies, the nine SHRM competencies, Ulrich's four mandates, the three HR roles) keep the courseware's terminology as required for exam use, in new framing |
| Questions D013 to D037 | New scenario or definition items. They do not repeat the Check Your Progress statements or the terminal questions; the answer positions are spread across A to D by construction |

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | not applicable | None |
| Source support | passed for the courseware's account | Pages read directly; cited works not checked |
| Session applicability | not checked | Historical legislation and institutions reported as the courseware states them; no cut-off-dated rule is stated |
| Originality | passed against the pages read | See table |
| Question quality | partly checked | `tests/content/batch-abm-b-u01-b001.test.ts` checks structure, answer spread and the competency counts; no human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.

## Coverage after this batch

All six objectives of Module B unit 1 have teaching and assessment. Next: Module B unit 2, Development of Human Resources (courseware unit 11, printed p. 197 = PDF p. 212).
