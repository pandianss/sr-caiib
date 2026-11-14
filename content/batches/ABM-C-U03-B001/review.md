# Review record: ABM-C-U03-B001

Paper ABM, Module C unit 3 (courseware unit 19, Working Capital Finance), part 1: working capital concept, operating cycle, assessment methods (holding norms, Tandon, cash budget, projected turnover), bills finance mechanics and letter of credit limit assessment (objectives LO_01 to LO_03, registered together with LO_04 and LO_05 for the next batch). Forty-four items: 8 concept cards, 4 worked examples, 24 choice questions and 8 numerical questions. Record written 14 November 2026.

## Evidence

Courseware source `S01`: printed pp. 448 to 455 and 458 and 462 to 463 (PDF pp. 463 to 470, 473 and 477 to 478), read as page images. The content is method and arithmetic; no primary regulation is needed. The Tandon committee methods are described as the courseware states them (historical, still used in some banks' calculations); no current RBI instruction on them was retrieved.

## Limits and what was held back

- The Nayak Committee method is taught only as the 25 per cent turnover / 20 per cent bank / 5 per cent margin idea. The courseware's Rs 5 crore micro and small enterprise rule, the compulsory use of the turnover method and the 31.25 and 37.5 per cent digital relaxations (post-demonetisation) are not taught: unchecked.
- The courseware's account of RBI guidelines for working capital finance to the information technology and software industry (a 2015 master circular) is not taught.
- The courseware's claim that the Tandon inventory norms are not mandatory is not taught.
- Regulatory sections of unit 19 (bills discounting, TReDS, non-fund based limits, commercial paper, factoring, forfaiting, rupee trade credit) are in the next batch.

## Drafts and originality

The polythene bags example, the cash budget table and the LC example of the courseware were not reused; the worked examples and numerical questions use new figures. Tables and procedures are written afresh. Answer positions are spread across A to D by construction. Distractor explanations are brief.

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | `tests/content/batch-abm-c-u03-b001.test.ts` recomputes the four worked examples and all eight numerical answers |
| Source support | courseware only (method) | No primary source needed for arithmetic; Tandon methods historical |
| Session applicability | not applicable to the arithmetic | See limits |
| Originality | passed | See above |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.
