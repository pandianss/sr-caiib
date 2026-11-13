# Batch ABM-A-U05-B001 — evidence and review record

Paper ABM, Module A unit 5 "Time Series" (`ABM::MOD_A::U05`). Thirty-six items: 8 concept or formula cards, 5 worked examples, 13 choice questions and 10 numerical questions. Record written 14 November 2026.

## Evidence

Source `S01` *Advanced Bank Management* (CAIIB courseware), scanned pages read directly with `scripts/render-page.mjs` (printed page n = PDF page n + 15). Pages read: printed pp. 87 to 104 (PDF pp. 102 to 119), the whole unit including keywords and terminal questions. Printed p. 86 (title page) was not read. All 11 facts in `staging.json` carry a printed page and section. No regulation is stated, so session applicability is not applicable.

## Courseware checks

The test reproduces the courseware's ship-loading example (Sum y 1,114, Sum xy 1,266, Sum x squared 168, b = 7.536, forecast 237) and its watch-sales parabola (b = 22.7, c = 5.07, a = 39.3) from the printed data; both agree with the text. The courseware's seasonal-index and dress-sales tables were not recomputed (the items use new data). Its "Table 15.4" and "Table 15.3" captions on printed pp. 93 to 95 are mis-numbered cross-references and carry no content.

## Drafts and originality

The courseware's examples (ships loaded, watch sales, bushels, rooms per quarter, dress sales) and its sixteen terminal questions were compared with every item.

| Area | Relationship to the book |
| --- | --- |
| Cards D001 to D008 | Reorganised into component tables, a coded-time rule, a six-step seasonal procedure and a direction-of-use rule. Banking examples are new; no sentence or table is reproduced |
| Worked examples D009 to D013 | Same standard methods as the book (coded linear trend, parabola by the three equations, per cent of trend, ratio to moving average, deseasonalising) with new data: new-account counts, digital payments, branch profit and a 16-quarter cash-demand series. D012 uses a centred moving average cross-checked in the test by a different route (weights 1, 2, 2, 2, 1 over 8) |
| Questions D014 to D026 | New scenario items. None repeats a terminal question |
| Numerical D027 to D036 | New figures; no book number set is reused |

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | `tests/content/batch-abm-a-u05-b001.test.ts` recomputes the coded trend, parabola, per cent of trend, the full seasonal-index procedure by an independent weighting formula, and every numerical answer, and grades each. 400/404 is not a tie at 4 decimals |
| Source support | passed | Pages read directly (not p. 86) |
| Session applicability | not applicable | No regulatory content |
| Originality | passed against the pages read | See table |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.

## Coverage after this batch

All five objectives of unit 5 have teaching and assessment. The AR, MA and ARMA models are taught only at the courseware's descriptive level. Next: unit 6, Theory of Probability (printed p. 105 = PDF p. 120).
