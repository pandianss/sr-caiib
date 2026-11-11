# Batch BFM-A-U01-B001 — evidence and review record

Paper BFM, Module A, unit "Exchange Rates and Forex Business" (`BFM::MOD_A::U01`). Six **draft** items.
Nothing here is published. Record written 11 November 2026.

## Files

| File | What it is |
| --- | --- |
| `staging.json` | Facts (own wording, printed-page locators) and the six drafts, after audit revisions |
| `import-config.json` | Explicit unit/objective mapping, source metadata and exam context |
| `draft-bundle.json` | Importer output: canonical draft items, the staging batch, the configuration and draft → item IDs |

## Evidence: where the facts came from

- Source: `S03` *Bank Financial Management* (IIBF courseware, Macmillan, updated edition 2026, ISBN
  978-93-7537-222-6), as held in the owner's notebook `d5c1b149-…` ("Bank Financial Management").
- Method: three questions put to the notebook's chat on 11 Nov 2026 — (1) a fact brief with printed page and
  heading for each fact, (2) verbatim supporting sentences for the facts to be used, (3) an audit of the
  drafts. The full answers are in that notebook's chat history; they are not copied here.
- **Limit:** the notebook shows this book only as page images, so the pages were **not read directly**. Every
  locator and quotation is as reported by the notebook's model. That is an aid, not independent verification.

Corrections the verbatim check forced on the first fact brief (kept as a warning about relying on summaries):

| Brief claimed | Quotation showed | Action |
| --- | --- | --- |
| India "adopted direct quotation in 1993" | The page says only that India moved to a floating regime in 1993 | Claim not used |
| Merchant amounts "rounded to the nearest 0.25 paise" as a FEDAI rule | Rule 5(ix) says the rupee amount is rounded to the rupee or actual paise per bank policy; "nearest 0.25 paise" is an instruction inside one worked example | Fact F011 worded to Rule 5(ix) only |
| A defined "cash" value date on p. 9 | Defined under Keywords on p. 42 | Locator corrected (F009) |
| Ascending/descending forward points mean premium/discount | Not among the quoted sentences | Not used; forward rates left for the next batch |

## Audit findings and what was done

| Draft | Finding (notebook audit) | Disposition |
| --- | --- | --- |
| D001 statute card | Split into "three groups" and a "currency printed on it" test not in the book | **Revised**: follows the two limbs of the definition; test removed |
| D002 concept card | "Exporter gets the bid" ignores the customer margin | **Revised**: bid/offer side plus margin |
| D003 worked example | Tracks the structure of the book's inward/outward remittance example (p. 35) with new numbers | **Redesigned** as a comparison of two bank quotes with an implied-margin step |
| D004 question | Two options carried the same figure | **Revised**: four different figures. The audit also says the idea resembles a book example and a Check Your Progress item; needs a direct page comparison |
| D005 question | Mirrors the book's 1 Nov → 3 Nov spot example with new dates | **Redesigned** around a weekend so it tests the working-day rule |
| D006 numeric | Supported and independently designed; audit wanted four options | **Kept** as a typed numerical answer (IIBF sets numericals without options) |

The redesigned D003 and D005 and the revised D001, D002 and D004 have **not been re-audited**.

## Review status

| Check | Status | Evidence |
| --- | --- | --- |
| Structure and mapping | passed (automated) | `npm run validate:staging`, `npm run import:staging`; `tests/content/batch-calculations.test.ts` validates every item against the official catalogue |
| Calculations | passed (automated, independent recomputation) | Same test file: D003 rates, costs, hidden margin and saving; D006 answer, grading and three wrong-method values; D005 calendar; D004 figures |
| Source support | **pending** | Model-reported pages and quotations only; pages not read |
| Session applicability | **pending** | FEMA clause letter and FEDAI Rule 5 wording not checked against primary sources at the 30 June 2026 cut-off |
| Originality | **pending** | Model-assisted comparison only; direct comparison with printed pp. 4–43 needed |
| Question quality | partly checked | One defensible answer per question confirmed by recomputation; no human read-through |

Reviewer for all of the above: the coding agent (automated). No human review has taken place.

## Coverage after this batch

Objectives LO_01–LO_03 of the unit are **partly drafted**; LO_04–LO_07 have nothing. The unit therefore
counts as not drafted, not assessed, not reviewed and not published in the ledger.

Next batch: `BFM-A-U01-B002` — forward rates and cross rates (LO_03), value-date lesson (LO_02), market
organisation and participants (LO_01).
