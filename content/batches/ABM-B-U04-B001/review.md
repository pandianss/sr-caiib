# Batch ABM-B-U04-B001 — evidence and review record

Paper ABM, Module B unit 4 "Employees' Feedback and Reward System" (`ABM::MOD_B::U04`; courseware unit 13). Forty-five items: 11 concept cards, 3 worked examples, 24 choice questions and 7 numerical questions. Record written 14 November 2026.

## Evidence

Source `S01` *Advanced Bank Management* (CAIIB courseware), scanned pages read directly with `scripts/render-page.mjs` (printed page n = PDF page n + 15). Pages read: printed pp. 287 to 304 (PDF pp. 302 to 319), including the objectives, summary, Check Your Progress statements and the start of the Kotak case study. Printed pp. 305 to 306 (end of the case study, terminal questions, further reading) and the unit title page (p. 286) were not read. All 13 facts in `staging.json` carry a printed page and section.

## Limits of the evidence and applicability

- **Banking wage practice (fact F013, `needs_review`).** The courseware describes the Bipartite Settlement mechanism and the Performance Linked Incentive (PLI) introduced by the IXth Bipartite Settlement signed on 11 November 2020 and applicable from FY 2020-21. This reflects its writing date; later settlements may have superseded the details. It was **not checked** against the cut-off of 30 June 2026. The card teaches the mechanism (Indian Banks' Association and workmen's unions, binding on member banks, five-year period, tribunals earlier) and states the PLI as the courseware's account, and no question asks for the PLI matrix values.
- **Labour Codes (fact F008, `needs_review`).** The courseware says 29 labour laws were amalgamated into four Labour Codes (Wages 2019, Social Security 2020, Occupational Safety, Health and Working Conditions 2020, Industrial Relations 2020). It gives no commencement date and none was checked, so the card does not say from when the Codes apply and warns the learner to check.
- Company illustrations (Google, Whole Foods Market, Taj Hotels, Kotak) are the courseware's quotations and are used only as illustrations. Schuster (1982) and Armstrong and Murlis were not checked against the originals.
- The courseware's own "five pillars" and "six elements" of rewards overlap; both lists are kept as given.

Session applicability is therefore **not checked** for the regulatory and banking-practice statements.

## Drafts and originality

The courseware's prose, lists, figures (total rewards model, strategy diagram, job classification diagram), tables (factor comparison, point rating, compa-ratio) and Check Your Progress statements (printed pp. 289 and 303) were compared with every item.

| Area | Relationship to the book |
| --- | --- |
| Cards D001 to D011 | Reorganised into comparison tables (formal and informal feedback, nine climate dimensions, favourable and unfavourable climate, job groups and the words for their pay, four job evaluation methods, fixed variable and mixed pay). The courseware's lists that are the substance of the topic (nine climate dimensions, six total reward elements, four wage concepts, five compa-ratio zones, ten design steps) keep its terms. The book's toolmaker and receptionist examples are used only as the stated illustrations inside the lessons |
| Worked examples D012 to D014 | The factor comparison, point method and compa-ratio methods with new data (a customer service associate, a loan clerk, a team of relationship officers) |
| Questions D015 to D038 | New scenario or definition items; none repeats a Check Your Progress statement; answer positions are spread across A to D by construction |
| Numerical D039 to D045 | New figures |

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | `tests/content/batch-abm-b-u04-b001.test.ts` reproduces the courseware's toolmaker (Rs 54), receptionist (120 points) and compa-ratios (87.5, 95.8, 100, 108.3, 116.7), recomputes every worked example and numerical answer, grades each, and checks that the 91.7 answer is not a rounding tie |
| Source support | passed for the courseware's account | Pages read directly (not pp. 286, 305, 306) |
| Session applicability | not checked for F008 and F013 | See above |
| Originality | passed against the pages read | See table |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.

## Coverage after this batch

All six objectives of Module B unit 4 have teaching and assessment, with the caveats on banking wage practice and the Labour Codes recorded in the ledger. Next: Module B unit 5, Performance Management (courseware unit 14, printed p. 307 = PDF p. 322).
