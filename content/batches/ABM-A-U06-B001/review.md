# Batch ABM-A-U06-B001 — evidence and review record

Paper ABM, Module A unit 6 "Theory of Probability", part 1: counting, probability rules, random variables, expectation and variance (`ABM::MOD_A::U06`, objectives LO_01 to LO_03). Thirty-seven items: 8 concept or formula cards, 5 worked examples, 12 choice questions and 12 numerical questions. Record written 14 November 2026.

## Evidence

Source `S01` *Advanced Bank Management* (CAIIB courseware), scanned pages read directly with `scripts/render-page.mjs` (printed page n = PDF page n + 15). This batch uses printed pp. 106 to 119 (PDF pp. 121 to 134). The rest of the unit (printed pp. 120 to 133: binomial, Poisson and normal distributions, credit risk, value at risk, option valuation, terminal questions) was also read and is covered by batch `ABM-A-U06-B002`. Printed p. 105 (title page) was not read. All 10 facts in `staging.json` carry a printed page and section. No regulation is stated, so session applicability is not applicable.

## Courseware points

- Printed p. 107 gives the note "P(n, r) = r! - C(n, r)"; the relation is P(n, r) = r! x C(n, r). The items use the correct one (the test checks 336 = 6 x 56).
- The conditional probability section writes P(B/A) in places where P(A given B) is meant; the items use P(A | B) = P(A and B) / P(B).
- The courseware's Example 1 on printed p. 111 and its other counting examples were reproduced in the test (210, 45, 0.2143, 720, 240, 48, 8/13, 0.08, 0.52, 0.48, 0.75, E and V examples) and agree.
- The unit's terminal answer key (printed p. 133) has apparent errors (for example question 8, the probability that a number among the first 50 naturals is prime, is given as 21/25 where 15/50 is the count of primes). The key was not used.

## Drafts and originality

The courseware's examples (dice, coins, balls, magazines, RANDOM, SQUARE, red or picture card, stock odds, tests passed, marbles, expectation tables) and its eight terminal questions were compared with every item.

| Area | Relationship to the book |
| --- | --- |
| Cards D001 to D008 | Reorganised around decisions (order or not, which rule to use, valid-distribution checks). The event-types table groups the book's six headings with one comparison example; the odds-and-total-probability card uses new cases. No book sentence is reproduced |
| Worked examples D009 to D013 | Same standard methods as the book (combinations for a panel, glue method for adjacency, addition and conditional rules, total probability, expectation tables with a missing probability) with new banking settings and numbers. D009 and D010 are cross-checked in the test by enumerating every panel and every ordering |
| Questions D014 to D025 | New scenario items. The "mutually exclusive cannot be independent" item and the CDF-validity item test points the book states only implicitly |
| Numerical D026 to D037 | New figures. D028 (total of two dice) follows the book's dice setting but asks a different outcome; D029 uses three coins where the book uses two |

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | `tests/content/batch-abm-a-u06-b001.test.ts` recomputes every worked example (two by exhaustive enumeration), the courseware's own examples and every numerical answer, grades each, and checks the validity tests in the choice questions |
| Source support | passed | Pages read directly (not p. 105) |
| Session applicability | not applicable | No regulatory content |
| Originality | passed against the pages read | See table |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.

## Coverage after this batch

Objectives LO_01 to LO_03 of unit 6 have teaching and assessment. LO_04 to LO_09 (binomial, Poisson, normal, credit risk, value at risk, option valuation) are registered and still have no items, so the topic is not complete. Next: `ABM-A-U06-B002` (printed pp. 120 to 132 = PDF pp. 135 to 147).
