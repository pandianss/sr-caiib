# Batch ABM-C-U01-B002 — evidence and review record

Paper ABM, Module C unit 1 (courseware unit 17), part 2: pricing of advances (objective LO_08). Thirty-five items: 7 concept cards, 1 worked example, 22 choice questions and 5 numerical questions. Record written 15 November 2026.

## Evidence

Courseware source `S01`: printed pp. 410 to 413 (PDF pp. 425 to 428), which reproduce the Interest Rate on Advances guidelines of 2016 as updated on 12 September 2023. Primary source `RBI_IRA_2025`, the Reserve Bank of India (Commercial Banks - Interest Rates on Advances) Directions, 2025 of 28 November 2025, was read in full (20 pages, text extract at `content/sources/primary/rbi-dor-2025-161.txt`, not committed) and is the basis of every fact. The courseware and the 2025 Directions agree on every point used (MCLR components and formula, tenor premium, publication, external benchmark, spread and reset rules, exemptions). The courseware's dates for the external benchmark requirement (1 October 2019 and 1 April 2020) are not in the 2025 text and are not taught.

## Limits

The 2025 copy is the 28 November 2025 text; amendments after that date were not searched for. The agricultural interest provisions are not taught beyond a mention. Printed pp. 414 onward were not read. Session applicability: **in force at the 30 June 2026 cut-off on its face**.

## Drafts and originality

The courseware's text and its bulleted lists were compared with every item. Cards are tables and procedures; the worked example uses new figures (marginal cost 8.00 per cent, CRR 4 per cent, operating cost 0.50, tenor premium 0.20, spread 0.40 and 0.60) and the numerical questions use further figures; the bucket illustration reuses the Directions' own illustration (15.1, 11.8, 9.3), which is regulatory text and is cited as such. Answer positions are spread across A to D by construction.

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | `tests/content/batch-abm-c-u01-b002.test.ts` recomputes the build-up, the bucket count and all numerical answers, and checks that the key phrases appear in the local copy of the Directions when it is present |
| Source support | passed against the primary source | Read in full |
| Session applicability | passed on its face | Later amendments not searched for |
| Originality | passed | See above |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.

## Coverage after this batch

LO_08 has teaching and assessment. Module C unit 1 still has LO_05, LO_06 and LO_07 gaps and unread courseware pages (printed pp. 414 onward).
