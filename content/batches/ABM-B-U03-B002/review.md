# Batch ABM-B-U03-B002 — evidence and review record

Paper ABM, Module B unit 3 "Human Implications of Organisations" (`ABM::MOD_B::U03`; courseware unit 12), part 2: theories of motivation, techniques of motivating employees, and the concept and analysis of role (objectives LO_04 to LO_06). Forty-four items: 12 concept cards and 32 choice questions. Record written 14 November 2026.

## Evidence

Source `S01` *Advanced Bank Management* (CAIIB courseware), scanned pages read directly with `scripts/render-page.mjs` (printed page n = PDF page n + 15). Pages read for this batch: printed pp. 263 to 283 (PDF pp. 278 to 298). Printed pp. 284 to 285 (the end of the unit) were not read in detail. All 14 facts in `staging.json` carry a printed page and section. No calculations are involved.

## Limits of the evidence

The unit is descriptive and attributes theories to named authors (Taylor, Mayo, Maslow 1954 and 1968, Herzberg 1959, Alderfer, McClelland, Vroom, Adams, Porter and Lawler, Skinner, Kendra Cherry). None was checked against the original; the items attribute them as the courseware reports them. Herzberg's study is described as reported (about 200 accountants and engineers in eleven industries in Pittsburgh). The reference to Article 43A of the Constitution of India (workers' participation in management as a Directive Principle) is the courseware's statement and was not checked against the Constitution as amended; it appears in one card only as the courseware's statement and no question asks for the Article number. Session applicability is **not checked** (no cut-off-dated rule is stated).

## Courseware difference

The courseware calls behaviour that leads to a punishing consequence and is therefore not repeated "negative reinforcement" (printed p. 274). In the standard terminology that is punishment, while negative reinforcement is the removal of an unpleasant consequence so that a behaviour is repeated. Fact F009 is `needs_review`; the card teaches the standard distinction in a three-row table, tells the learner how the courseware uses the term, and the question on it (D032) is worded with the standard definition and a note on the courseware's usage.

## Drafts and originality

The courseware's prose, lists and Check Your Progress statements (printed pp. 266, 269, 274, 282) were compared with every item.

| Area | Relationship to the book |
| --- | --- |
| Cards D001 to D012 | Reorganised into comparison tables (scientific management against human relations, motivators against hygiene factors, ERG against Maslow, motive against goal, enlargement against enrichment against rotation, the nine role stress forms with a bank example each). Lists that are the substance of the topic (the six motivators and ten hygiene factors, the seven QWL factors, Vroom's three elements, Adams' ways of reducing inequity) keep the courseware's terms |
| Questions D013 to D044 | New scenario or definition items; none repeats a Check Your Progress statement; answer positions are balanced 8 each across A to D by construction |

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | not applicable | None |
| Source support | passed for the courseware's account | Pages read directly; cited works not checked |
| Session applicability | not checked | See above |
| Originality | passed against the pages read | See table |
| Question quality | partly checked | `tests/content/batch-abm-b-u03-b002.test.ts` checks structure and answer spread; no human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.

## Coverage after this batch

All six objectives of Module B unit 3 have teaching and assessment; LO_03 carries the gap recorded for the gender-law statements. Next: Module B unit 4, Employees' Feedback and Reward System (courseware unit 13, printed p. 286 = PDF p. 301).
