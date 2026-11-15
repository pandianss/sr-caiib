# Staging import contract

The importer converts source-linked editorial drafts into validated **draft items**. It does not publish content, verify banking facts, assess original authorship, recompute answers, or establish complete syllabus coverage.

## Files and command

Supply three inputs: the NotebookLM staging JSON, the verified curriculum catalogue, and an editor-created import configuration. The optional fourth argument is a **new** output path. Omit it to write the JSON bundle to stdout. Existing output files and input files are never overwritten.

```sh
npm run validate:staging -- data/staging-batch.sample.json
npm run import:staging -- data/staging-batch.sample.json data/catalogue.sample.json data/import-config.sample.json my-draft-bundle.json
```

The bundled data is explicitly synthetic, with two toy units. Its paper ID exercises routing and does not make it real syllabus content. For real use, replace all three inputs with the actual reviewed catalogue, source registry and content. Do not change the fixture origin to bypass the publication restriction.

## Explicit configuration

Use `StagingImportConfig` in `src/types/contracts.ts`; `data/import-config.sample.json` shows its shape. Required fields:

| Field | Meaning |
| --- | --- |
| `schema_version` | `staging-import-1` |
| `content_namespace` | Durable identifier for this content project/source notebook; keep stable for retries |
| `batch_id`, `paper_id`, `syllabus_version` | Must match the batch and catalogue |
| `origin` | `source_assisted` for actual source-derived drafts; `synthetic_fixture` for engineering data |
| `context` | Explicit exam ID and evidence-supported cutoff, or current-reference as-of date; no invented defaults |
| `context_source`, `syllabus_source` | Registry source IDs and visible locators supporting the context and baseline |
| `sources` | Exact source ID, authority, title, publication/effective dates (explicit null if unknown), optional URL |
| `mappings` | Exactly one mapping per draft: its draft ID, exact unit ID and one or more objective IDs belonging to that unit |

The module and paper are resolved through catalogue membership. Unit order and matching title words never choose a destination. A batch may contain more than one unit when each draft has its own explicit mapping. All records must belong to the batch paper.

The required exam cutoff and baseline cannot be unconfirmed at conversion time; retain such drafts in staging until the missing context is supplied. Unknown bibliographic dates may remain null. The presence of a source ID or date is not evidence that an editor actually verified it.

## Payload and relationship rules

- Preserve the exact card/question/case payload. Required answers, options, formulas, worked results, prerequisites and explanations cannot be supplied by fallback values.
- Each card provides `prerequisite_objective_ids` explicitly. Use verified catalogue IDs, or an empty list only when there are no known prerequisites. Unknown prerequisite mapping stays an unresolved staging issue.
- Use batch-local draft IDs in `case_study.question_ids`, `question.case_study_id`, and question-backed `self_check.question_id`. Include all referenced drafts in the same batch.
- Case membership must agree in both directions. The importer resolves all references to canonical IDs and retains worked solutions, table content and supplied marks.
- Unknown variants, unknown payload fields and attempts to set publication metadata are rejected, not silently discarded. Unsupported data remains in the original staging file until deliberately mapped.
- Numeric answers use the stated exact decimal precision and rounding. The supplied `tolerance` extension is deliberately excluded; an unspecified tolerance could accept an incorrect rounded answer. A future tolerance policy requires a documented grading method, justification and tests.

## Output, identity and failure handling

The `draft-import-1` envelope contains `source_batch`, `import_config`, `draft_item_map` and `items`. The full source batch preserves fact statements, locators, evidence flags, source IDs, unresolved issues and the next-batch hint. Store the complete envelope; the item array alone is not the evidence record. Update the syllabus ledger from `draft_item_map` after review.

Item IDs are SHA-256 hashes of an unambiguous, case-sensitive tuple: content namespace, syllabus version, paper ID, batch ID and draft ID. Repeating the same import produces the same identities. Different batches and namespaces produce different identities. Every new imported item starts at revision 1 and remains a draft with null review. Corrections to already retained/published items need an explicit revision workflow; the importer is not an upsert or migration service.

For an **unreviewed, undelivered draft** correction, edit its staging/config and run `node scripts/revise-draft.mjs content/batches/BATCH_ID`. The command validates the existing lineage and replacement import, retains the complete prior envelope in a numbered `draft-history/` snapshot and increments only canonical items whose content/context/citations changed. IDs remain stable; unchanged items retain their revisions. Evidence-only edits preserve canonical revisions but retain the old evidence envelope. New/removed identities and origin changes are rejected. The command refuses reviewed items and identities already present in a delivery pack; it never publishes or approves.

`register-draft-ledger.mjs` replays the ordered history against the catalogue. A revision without its complete preceding snapshots, a revision jump or changed content with a stale revision is rejected. Keep the history files with staging, config, current bundle and review evidence. Published corrections still require their separate editorial approval, new immutable pack version and retention of earlier pack/item versions for existing attempts.

All item and cross-reference checks finish before output is written. A missing or invalid record rejects the entire import with exit code 1; bad CLI usage returns 2. There is no partial-success output. An existing output is left untouched. Select a new output path for a corrected draft bundle and reconcile revisions explicitly. A storage/device failure during writing is outside the content-validation guarantee.

Do not pass this draft envelope directly to `validate:pack`, which expects a published delivery pack. Complete the actual source, applicability, originality, calculation and question-quality reviews before a separate publishing workflow constructs such a pack. No model or importer may invent a review record to satisfy that check.
