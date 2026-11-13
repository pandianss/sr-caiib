# Batch ABM-B-U05-B002 — evidence and review record

Paper ABM, Module B unit 5 "Performance Management" (`ABM::MOD_B::U05`; courseware unit 14), part 2: competence and competency, competency mapping, assessment centres and the behavioural event interview (objectives LO_04 and LO_05). Thirty-three items: 9 concept cards and 24 choice questions. Record written 15 November 2026.

## Evidence

Source `S01` *Advanced Bank Management* (CAIIB courseware), scanned pages read directly with `scripts/render-page.mjs` (printed page n = PDF page n + 15). Pages read for this batch: printed pp. 313, 324 to 337 (PDF pp. 328 and 339 to 352), including the end-of-unit summary, case study, Check Your Progress statements (p. 333 to 334), terminal questions and the annexure (Potential Appraisal Report). Assessment centre workshops as a method are introduced on p. 313 and taught here. The case study on pp. 334 to 336 and the terminal questions were read but not used. All 14 facts in `staging.json` carry a printed page and section. No calculations are involved.

## Limits of the evidence

The unit is descriptive. Competency and mapping definitions attributed to Spencer and Spencer (1993), Lucia and Lepsinger (1999), Gomes (2007), McClelland (1973), Parry (1996), Nedunchezhian and Prabhakar (2007), Dhar (2006) and Garrette, and the assessment centre standards of the Task Force on Development of Assessment Centre Standards (1979), were not checked against the originals. The history of assessment centres (OSS, German and British military practice, AT and T, the Bell System in 1958) is reported as the courseware states it. The seven elements of an assessment centre are taught as the courseware's list; published guidelines have been revised since 1979 and this course does not claim the list to be the current international standard. The courseware's step 5 of the BEI contains a garbled sentence; the lesson gives its evident meaning. Session applicability is **not checked** (no cut-off-dated rule is stated).

## Drafts and originality

The courseware's prose, lists, the competence-versus-competency table, the seven essential elements and the BEI steps, and the Check Your Progress statements on printed p. 333 to 334 were compared with every item.

| Area | Relationship to the book |
| --- | --- |
| Cards D001 to D009 | Reorganised into comparison tables (competence against competency, the three competency levels, the five mapping layers, the two mapping approaches, the seven elements, the seven exercises with what each reveals, the planning and conducting steps and the five BEI steps). The courseware's enumerations that are the substance of the topic keep its terms |
| Questions D010 to D033 | New scenario or definition items; none repeats a Check Your Progress statement; answer positions are balanced 6 each across A to D by construction |

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | not applicable | None |
| Source support | passed for the courseware's account | Pages read directly; cited authors and standards not checked |
| Session applicability | not checked | See above |
| Originality | passed against the pages read | See table |
| Question quality | partly checked | `tests/content/batch-abm-b-u05-b002.test.ts` checks structure and answer spread; no human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.

## Coverage after this batch

All five objectives of Module B unit 5 (LO_01 to LO_05) have teaching and assessment. Next: Module B unit 6, Conflict Management and Negotiation (courseware unit 15, printed p. 339 = PDF p. 354).
