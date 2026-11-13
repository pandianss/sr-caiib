# Batch ABM-A-U06-B002 — evidence and review record

Paper ABM, Module A unit 6 "Theory of Probability", part 2: binomial, Poisson and normal distributions, credit risk, value at risk and option valuation (`ABM::MOD_A::U06`, objectives LO_04 to LO_09). Forty-six items: 11 concept or formula cards, 6 worked examples, 14 choice questions and 15 numerical questions. Record written 14 November 2026.

## Evidence

Source `S01` *Advanced Bank Management* (CAIIB courseware), scanned pages read directly with `scripts/render-page.mjs` (printed page n = PDF page n + 15). Pages read: printed pp. 120 to 133 (PDF pp. 135 to 148) in full. All 9 facts in `staging.json` carry a printed page and section. The unit states no regulation, so session applicability is not applicable; the credit-risk "90 days past due" criterion is reported as the courseware states it and is not checked against RBI's asset classification rules (it is a probability-course definition, not a regulatory item).

## Courseware differences

| Courseware | What the items teach |
| --- | --- |
| Expected loss printed as PD x EAD x (1 - LGD) (printed p. 126), while LGD is defined as the part of the loan lost | PD x LGD x EAD. For Problem 2 the printed result is Rs 3,010; the standard form gives Rs 3,990. Problem 1 gives the same answer either way (PD 100 per cent, LGD 50 per cent). Fact F005 is `needs_review`; the card tells the learner both forms. This is the one place a book-based exam question and the standard definition could disagree |
| Binomial mode for integer M stated as "M - 2 and M" and then "M - 1 and M" (printed p. 120) | M - 1 and M (checked by computing the n = 9, p = 0.5 probabilities) |
| Poisson example P(X >= 2) = 0.538 for lambda = 1.8 (printed p. 122) | 0.5372 when recomputed; the fact records both |
| VaR figures called "daily" for one-month inputs (printed p. 128) | Items state the period of the inputs (monthly) |
| Black-Scholes put printed with N(d2), N(d1) (printed p. 132) | Put by put-call parity only; no put formula in N(d) form is taught |
| Binomial option pricing formula, stated without derivation | Only the assumptions are taught; no numerical binomial pricing is asked |

The courseware's other examples (binomial 119/128 and the n = 60, p = 0.7 summary figures; Poisson 0.0723, 0.0144, 0.223, 0.0127; normal 0.8351, 0.9772, 0.1587, 0.1112; VaR -2,940 and -20,750) were recomputed in the test and agree, apart from the points above.

## Drafts and originality

The courseware's examples (births per hour, accidents, misprints, incomes, battery life, credit and VaR problems, option discussion) and its terminal questions were compared with every item.

| Area | Relationship to the book |
| --- | --- |
| Cards D001 to D011 | Reorganised around which-model-to-use decisions and effect tables for option factors. Banking examples are new. The option-factor table restates the book's bullet list with a short reason for each direction |
| Worked examples D012 to D017 | Same methods as the book with new data: defaults among ten loans, failed ATM transactions, cash demand, a term loan, a one-month portfolio and option bounds. The binomial example is cross-checked by enumerating all 1,024 outcomes |
| Questions D018 to D031 | New scenario items; none repeats a terminal question |
| Numerical D032 to D046 | New figures. D041 uses the standard normal area 0.4772 as the book does |

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | `tests/content/batch-abm-a-u06-b002.test.ts` recomputes the courseware examples and every worked example and numerical answer by routes independent of the closed forms (log-factorials, enumeration of Bernoulli outcomes, Simpson integration of the normal density), grades each, and checks that 4-decimal answers are not rounding ties |
| Source support | passed | Pages read directly |
| Session applicability | not applicable | No regulatory content |
| Originality | passed against the pages read | See table |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.

## Coverage after this batch

All nine objectives of unit 6 have teaching and assessment. Next: unit 7, Estimation (printed p. 134 = PDF p. 149).
