# Batch ABM-B-U02-B002 — evidence and review record

Paper ABM, Module B unit 2 "Development of Human Resources" (`ABM::MOD_B::U02`; courseware unit 11), part 2: support systems, attitude development, career path planning, self-development, talent management and succession planning (objectives LO_05 to LO_09). Forty-five items: 14 concept cards and 31 choice questions. Record written 14 November 2026.

## Evidence

Source `S01` *Advanced Bank Management* (CAIIB courseware), scanned pages read directly with `scripts/render-page.mjs` (printed page n = PDF page n + 15). Pages read for this batch: printed pp. 215 to 245 (PDF pp. 230 to 260), including the Check Your Progress statements and the case studies on p. 245. Printed pp. 246 to 248 (the end of the unit: remaining case study, answer keys and terminal questions) were not read. All 19 facts in `staging.json` carry a printed page and section. No calculations are involved.

## Limits of the evidence

The unit is descriptive and rests on the courseware's account and on works it attributes to named authors (Rao 1988, Erikson, Levinson, Dalton, Thompson and Price 1977, Driver 1985, Schein, Schermerhorn, Hunt and Osborn, Pareek and Rao 1986, Pareek 1994 and 1997, Leftcourt, Levenson, Kotter, French and Raven, Schutz, Berne, Harris, Lewin, Luft and Ingham, Goleman, McKinsey). None was checked against the original, so the items attribute them as the courseware reports them. Survey figures quoted by the courseware (a 2006 Canadian small-business survey, a Gallup finding, Sirota Consulting share-price figures) were not checked and are not used in questions. The courseware's list of group stages includes "conforming", which the usual model does not; the lesson says so. Session applicability is **not checked** (no cut-off-dated rule is stated).

## Drafts and originality

The courseware's prose, lists, figures, case studies and Check Your Progress statements (printed pp. 216, 220, 227, 237, 244) were compared with every item.

| Area | Relationship to the book |
| --- | --- |
| Cards D001 to D014 | Reorganised as comparison tables (attitude components, attitude functions, change methods, career roles, power bases, ego states, Johari Window, EI components, replacement against succession planning) and procedural summaries (four steps of a career path). The courseware's enumerations that form the substance of the topic (five anchors, four career roles, the EI elements, the five talent management elements) keep its terms; the morale boosters are condensed and the examples reworded |
| Questions D015 to D045 | New scenario or definition items; none repeats a Check Your Progress statement; answer positions are spread across A to D by construction |

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | not applicable | None |
| Source support | passed for the courseware's account | Pages read directly (not pp. 246 to 248); cited works not checked |
| Session applicability | not checked | See above |
| Originality | passed against the pages read | See table |
| Question quality | partly checked | `tests/content/batch-abm-b-u02-b002.test.ts` checks structure and answer spread; no human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.

## Coverage after this batch

All nine objectives of Module B unit 2 (LO_01 to LO_09) now have teaching and assessment. Printed pp. 246 to 248 remain unread. Next: Module B unit 3, Human Implications of Organisations (courseware unit 12, printed p. 249 = PDF p. 264).
