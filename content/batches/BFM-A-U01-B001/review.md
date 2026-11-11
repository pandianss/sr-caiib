# Batch BFM-A-U01-B001 — evidence and review record

Paper BFM, Module A, unit "Exchange Rates and Forex Business" (`BFM::MOD_A::U01`). Six **draft** items.
Nothing here is published. Record last updated 11 November 2026.

## Files

| File | What it is |
| --- | --- |
| `staging.json` | Facts (own wording, printed-page locators) and the six drafts in their current form |
| `import-config.json` | Explicit unit/objective mapping, source metadata and exam context |
| `draft-bundle.json` | Importer output: canonical draft items, the staging batch, the configuration and draft → item IDs |

## Evidence

Source: `S03` *Bank Financial Management* (IIBF courseware, Macmillan, updated edition 2026, ISBN
978-93-7537-222-6; `content/sources/registry.json`). Printed page n is PDF page n + 17.

Two passes were made:

1. **Through the owner's notebook** (model-mediated): a fact brief, verbatim supporting sentences and an audit
   of the first drafts. Its first brief contained errors that the verbatim pass exposed (India "adopted direct
   quotation in 1993"; "nearest 0.25 paise" presented as a FEDAI rule; a wrong page for the cash value date).
2. **By reading the scanned pages directly** from the full PDF with `scripts/render-page.mjs`. Pages read:
   copyright page; printed pp. 4, 9, 11, 12, 30, 33, 35, 36, 37, 38, 39, 40, 41, 42, 43.

Result of the direct read, fact by fact:

| Fact | Page read | Result |
| --- | --- | --- |
| F001 FEMA definition, two limbs, "Section 2" | p. 4 | Confirmed as worded |
| F002–F004 direct and indirect quotes; GBP, EUR, AUD, NZD | p. 11 | Confirmed |
| F005 bid and offer from the quoting bank's side | pp. 12, 33 | Confirmed |
| F006 margin deducted when buying, added when selling | p. 35 | Confirmed |
| F007 indirect quote: bank sells at the lower figure | pp. 11, 38 | **Inference**, not a stated rule: p. 11 shows an indirect quote with the higher figure first; p. 38 uses the phrase "sell low" for a sale of rupees. Marked `needs_review` |
| F008 tom, spot, forward | pp. 9, 42 | Confirmed |
| F009 ready/cash = same day | p. 42 | Confirmed |
| F010 Saturdays and Sundays postpone settlement | p. 9 | Confirmed |
| F011 FEDAI Rule 5(ix) rounding per bank policy | p. 30 | Confirmed; statement reworded to follow the rule's own terms |

The notebook's audit was also wrong in one place: it said D004 adapts "Example 1 (page 33)" and a Check Your
Progress item. Page 33 has no example, and the self-test items there are fill-in-the-blanks on other points.

## What changed in the drafts

| Draft | After notebook audit | After reading the pages |
| --- | --- | --- |
| D001 statute card | Revised to the two limbs of the definition | No change needed |
| D002 concept card | Revised to mention the customer margin | No change needed |
| D003 worked example | Redesigned as a comparison of two bank quotes | Confirmed different in design from Examples 1–10 |
| D004 question | Four different figures | Confirmed different from Terminal Question 5 (a definition item) |
| D005 question | Redesigned around a weekend | Confirmed different from the 1 Nov 2021 illustrations and Terminal Question 4 |
| D006 numeric | Kept | **Redesigned**: the first version (rate plus margin, then rupee amount) was too close to Example 1(b) on p. 35. It now asks for the margin given the amount debited |

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging`, item validation in `tests/content/batch-calculations.test.ts` |
| Calculations | passed | Independent recomputation in the same test file (D003, D005, D006, D004 figures) |
| Source support | passed for F001–F006 and F008–F011; F007 is an inference | Pages read directly, listed above |
| Session applicability | **pending** | FEMA clause letter and FEDAI Rule 5 not yet checked against primary sources as at the 30 June 2026 cut-off |
| Originality | passed against the pages read | Wording, examples 1–10, Check Your Progress (C) and Terminal Questions 1–6 compared. Not compared: printed pp. 5–8, 10, 13–29, 31–32, 34, which hold no worked examples used here |
| Question quality | partly checked | One defensible answer per question confirmed by recomputation; no human read-through |

**Reviewer: the coding agent that also wrote the drafts.** This is an automated, non-independent review. No
person has reviewed these items.

## Coverage after this batch

Objectives LO_01–LO_03 are partly drafted; LO_04–LO_07 have nothing. In the ledger the unit counts as source
available, not drafted, not assessed, not reviewed, not published.

Next batch: `BFM-A-U01-B002` — forward rates and cross rates (LO_03), a value-date lesson (LO_02), market
organisation and participants (LO_01).
