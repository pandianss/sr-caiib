# Review record: ABM-C-U02-B001

Paper ABM, Module C unit 2 (courseware unit 18, Analysis of Financial Statements), part 1: financial statements and their users, accounting concepts and standards, balance sheet and profit and loss formats, cash flow and funds flow (objectives LO_01 to LO_03, registered in this batch). Fifty items: 10 concept cards, 2 worked examples, 32 choice questions and 6 numerical questions. Record written 14 November 2026.

## Evidence

Courseware source `S01`: printed pp. 423 to 435 (PDF pp. 438 to 450), read as page images. No primary source was retrieved (the Companies Act 2013 and Schedule III, the Accounting Standards and Indian Accounting Standards, the Companies (Auditor's Report) Order, 2020). Facts that state law or the Schedule III formats (F002, F004, F006, F006b to F009 in staging) are marked `needs_review`; facts that state accounting method (F001, F003, F005, F010, F011) are marked `explicit` as statements of the courseware.

## Limits and what was held back

- Held back as date or count dependent and unchecked: Ind AS applicability dates and net worth thresholds, the number of Ind AS standards, the number of items in the 2020 Auditor's Report Order, and the thresholds defining a small company, one person company and start-up.
- The profit and loss format includes an "extraordinary items" line as shown in the courseware; whether it is still in the current format is unchecked.
- The balance sheet note lists are taught in outline only.
- The explanations of the basic accounting concepts are editorial glosses; the courseware only names the fourteen concepts.
- Printed pp. 436 onward were not read.

## Drafts and originality

Cards are tables and procedures written for this app; the courseware lists (formats, notes, components of cash flow) are factual structures and are reorganised, not copied. Worked examples and numerical questions use new figures. Answer positions are spread across A to D by construction. Distractor explanations are brief.

## Review status

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Structure and mapping | passed | `npm run validate:staging`, `npm run import:staging` |
| Calculations | passed | `tests/content/batch-abm-c-u02-b001.test.ts` recomputes both worked examples and all numerical answers |
| Source support | courseware only | Law and format statements are `needs_review`; no primary source retrieved |
| Session applicability | not established for statutory statements | See limits |
| Originality | passed | See above |
| Question quality | partly checked | No human read-through |

**Reviewer: the coding agent that also wrote the items** (automated, not independent), under the owner's decision of 11 November 2026.

## Coverage after this batch

LO_01 to LO_03 have teaching and assessment. Unit 18 objectives for projected statements, purpose of analysis, rearrangement, trend and ratio analysis, creative accounting and related party transactions are not yet registered.
