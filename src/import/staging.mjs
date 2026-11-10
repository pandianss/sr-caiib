import { createHash } from 'node:crypto';
import { validateExtraction, validateCatalogue, validateContentItem } from '../validation/contracts.ts';

export class ImportError extends Error {
  constructor(message) { super(message); this.name = 'ImportError'; }
}
function need(condition, path, message) {
  if (!condition) throw new ImportError(`${path}: ${message}`);
}
function object(value, path) {
  need(value !== null && typeof value === 'object' && !Array.isArray(value), path, 'Expected object');
  return value;
}
function text(value, path) {
  need(typeof value === 'string' && value.trim().length > 0, path, 'Expected nonempty string');
  return value;
}
function list(value, path, min = 0) {
  need(Array.isArray(value) && value.length >= min, path, `Expected array with at least ${min} entries`);
  return value;
}
function keys(value, allowed, path) {
  for (const key of Object.keys(value)) need(allowed.includes(key), `${path}.${key}`, 'Unsupported field; retain it in staging until explicitly mapped');
}
function checked(result, label) {
  if (!result.ok) throw new ImportError(`${label}:\n${result.issues.map(i => `  ${i.path}: ${i.message}`).join('\n')}`);
  return result.data;
}
function date(value, path) {
  const valid = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value));
  need(valid && new Date(value).toISOString().slice(0, 10) === value, path, 'Expected real YYYY-MM-DD date; do not guess missing dates');
}
/** Accept one complete fenced JSON document, or plain JSON; never strip arbitrary surrounding text. */
export function parseJsonDocument(raw) {
  const trimmed = raw.replace(/^\uFEFF/, '').trim();
  const fenced = /^```(?:json)?[ \t]*\r?\n([\s\S]*?)\r?\n```$/i.exec(trimmed);
  return JSON.parse(fenced ? fenced[1] : trimmed);
}
const commonCard = ['title', 'prerequisite_objective_ids', 'core_explanation_md', 'expanded_explanation_md', 'self_check'];
const cardVariants = {
  concept: [], formula: ['formula_spec'], statute: ['statute_spec'],
  worked_example: ['worked_steps', 'final_answer_with_unit'],
};
const commonQuestion = ['difficulty', 'stem_md', 'correct_explanation_md', 'worked_solution_steps', 'case_study_id', 'marks'];
const questionVariants = { single_choice: ['options', 'correct_option_id'], numeric_input: ['numeric_rule'] };

/** Validates and converts a whole batch, or throws before returning any output. Never publishes. */
export function importStaging(rawBatch, rawCatalogue, rawConfig) {
  const batch = checked(validateExtraction(rawBatch), 'Invalid staging envelope');
  const catalogue = checked(validateCatalogue(rawCatalogue), 'Invalid curriculum catalogue');
  need(batch.drafts.length > 0, '$.drafts', 'No drafts to import; keep the evidence-only batch in staging');
  const config = object(rawConfig, '$.import_config');
  keys(config, ['schema_version', 'content_namespace', 'batch_id', 'paper_id', 'syllabus_version', 'origin', 'context', 'context_source', 'syllabus_source', 'sources', 'mappings'], '$.import_config');
  need(config.schema_version === 'staging-import-1', '$.import_config.schema_version', 'Expected staging-import-1');
  text(config.content_namespace, '$.import_config.content_namespace');
  need(config.batch_id === batch.batch_id, '$.import_config.batch_id', 'Must match this staging batch');
  need(config.paper_id === batch.paper_id, '$.import_config.paper_id', 'Must match this staging paper');
  need(config.syllabus_version === catalogue.syllabus_version, '$.import_config.syllabus_version', 'Must match the supplied verified catalogue');
  need(['source_assisted', 'synthetic_fixture'].includes(config.origin), '$.import_config.origin', 'Declare source_assisted or synthetic_fixture explicitly');
  const context = object(config.context, '$.import_config.context');
  if (context.kind === 'exam') {
    keys(context, ['kind', 'exam_context_id', 'regulatory_cutoff_date'], '$.import_config.context');
    text(context.exam_context_id, '$.import_config.context.exam_context_id');
    date(context.regulatory_cutoff_date, '$.import_config.context.regulatory_cutoff_date');
  } else {
    need(context.kind === 'current_reference', '$.import_config.context.kind', 'Unknown context kind');
    keys(context, ['kind', 'as_of_date'], '$.import_config.context');
    date(context.as_of_date, '$.import_config.context.as_of_date');
  }
  const sources = new Map();
  for (const [i, value] of list(config.sources, '$.import_config.sources', 1).entries()) {
    const path = `$.import_config.sources[${i}]`, source = object(value, path);
    keys(source, ['source_id', 'authority', 'title', 'publication_date', 'effective_date', 'url'], path);
    for (const key of ['source_id', 'authority', 'title']) text(source[key], `${path}.${key}`);
    need(!sources.has(source.source_id), path, 'Duplicate source ID');
    for (const key of ['publication_date', 'effective_date']) if (source[key] !== null) date(source[key], `${path}.${key}`);
    if (source.url !== undefined) {
      text(source.url, `${path}.url`);
      let valid = false;
      try { valid = ['https:', 'http:'].includes(new URL(source.url).protocol); } catch { /* Report below. */ }
      need(valid, `${path}.url`, 'Expected HTTP(S) source URL');
    }
    sources.set(source.source_id, source);
  }
  for (const id of batch.source_ids) need(sources.has(id), '$.import_config.sources', `Missing exact source metadata for ${id}`);
  for (const key of ['context_source', 'syllabus_source']) {
    const ref = object(config[key], `$.import_config.${key}`);
    keys(ref, ['source_id', 'locator'], `$.import_config.${key}`);
    need(sources.has(ref.source_id), `$.import_config.${key}.source_id`, 'Source must exist in the registry');
    text(ref.locator, `$.import_config.${key}.locator`);
  }
  const drafts = new Map(batch.drafts.map(d => [d.draft_id, d]));
  const mappings = new Map();
  for (const [i, value] of list(config.mappings, '$.import_config.mappings', 1).entries()) {
    const path = `$.import_config.mappings[${i}]`, mapping = object(value, path);
    keys(mapping, ['draft_id', 'unit_id', 'objective_ids'], path);
    need(drafts.has(mapping.draft_id), `${path}.draft_id`, 'Mapping names an unknown draft');
    need(!mappings.has(mapping.draft_id), path, 'Duplicate draft mapping');
    const unit = catalogue.units.find(u => u.id === mapping.unit_id);
    need(Boolean(unit), `${path}.unit_id`, 'Exact catalogue unit ID required; no first-unit fallback');
    const module = catalogue.modules.find(m => m.id === unit.module_id);
    need(module?.paper_id === batch.paper_id, path, 'Mapped unit belongs to another paper');
    const objectives = list(mapping.objective_ids, `${path}.objective_ids`, 1);
    need(new Set(objectives).size === objectives.length, `${path}.objective_ids`, 'Duplicate objective IDs');
    for (const id of objectives) need(catalogue.objectives.some(o => o.id === id && o.unit_id === unit.id), `${path}.objective_ids`, `Unknown objective or wrong unit: ${id}`);
    mappings.set(mapping.draft_id, { ...mapping, module_id: unit.module_id });
  }
  for (const draft of batch.drafts) need(mappings.has(draft.draft_id), '$.import_config.mappings', `Explicit mapping missing for ${draft.draft_id}`);
  // Case-sensitive, unambiguous tuple hashing prevents names/punctuation/batch collisions.
  const itemIds = new Map(batch.drafts.map(d => [d.draft_id, `item_${createHash('sha256').update(JSON.stringify([config.content_namespace, catalogue.syllabus_version, batch.paper_id, batch.batch_id, d.draft_id])).digest('hex')}`]));
  function reference(id, expectedType, path) {
    need(drafts.get(id)?.item_type === expectedType, path, `Expected a ${expectedType} draft ID in this same batch: ${id}`);
    return itemIds.get(id);
  }
  const facts = new Map(batch.facts.map(f => [f.fact_id, f]));
  const items = batch.drafts.map((draft, index) => {
    const path = `$.drafts[${index}]`, mapping = mappings.get(draft.draft_id);
    const payload = structuredClone(object(draft.payload, `${path}.payload`));
    let discriminators;
    if (draft.item_type === 'card') {
      need(Object.hasOwn(cardVariants, draft.variant), `${path}.variant`, 'Unknown card variant');
      keys(payload, [...commonCard, ...cardVariants[draft.variant]], `${path}.payload`);
      if (payload.self_check?.mode === 'question') payload.self_check.question_id = reference(payload.self_check.question_id, 'question', `${path}.payload.self_check.question_id`);
      discriminators = { item_type: 'card', card_type: draft.variant };
    } else if (draft.item_type === 'question') {
      need(Object.hasOwn(questionVariants, draft.variant), `${path}.variant`, 'Unknown question variant');
      keys(payload, [...commonQuestion, ...questionVariants[draft.variant]], `${path}.payload`);
      if (payload.case_study_id !== undefined) payload.case_study_id = reference(payload.case_study_id, 'case_study', `${path}.payload.case_study_id`);
      discriminators = { item_type: 'question', question_type: draft.variant };
    } else {
      keys(payload, ['title', 'scenario_narrative_md', 'question_ids', 'reference_tables_md'], `${path}.payload`);
      payload.question_ids = list(payload.question_ids, `${path}.payload.question_ids`, 1).map(id => reference(id, 'question', `${path}.payload.question_ids`));
      discriminators = { item_type: 'case_study' };
    }
    const citations = draft.fact_ids.map(id => {
      const fact = facts.get(id);
      return { ...structuredClone(sources.get(fact.source_id)), locator: fact.locator };
    });
    const item = {
      ...payload, ...discriminators, id: itemIds.get(draft.draft_id), schema_version: '2.0.0', revision: 1,
      syllabus_version: catalogue.syllabus_version, paper_id: batch.paper_id,
      module_id: mapping.module_id, unit_id: mapping.unit_id, objective_ids: [...mapping.objective_ids],
      context: structuredClone(context), citations, origin: config.origin, publication_state: 'draft', review: null,
    };
    return checked(validateContentItem(item, catalogue), `Draft ${draft.draft_id} cannot be imported`);
  });
  const byId = new Map(items.map(item => [item.id, item]));
  for (const item of items) {
    if (item.item_type === 'case_study') for (const id of item.question_ids) {
      need(byId.get(id)?.case_study_id === item.id, `case ${item.id}`, 'Every case question needs a matching case_study_id backlink');
    }
    if (item.item_type === 'question' && item.case_study_id !== undefined) {
      need(byId.get(item.case_study_id)?.question_ids.includes(item.id), `question ${item.id}`, 'Parent case must list this question');
    }
  }
  return {
    schema_version: 'draft-import-1', publication_state: 'draft',
    source_batch: structuredClone(batch), import_config: structuredClone(config),
    draft_item_map: batch.drafts.map(d => ({ batch_id: batch.batch_id, draft_id: d.draft_id, item_id: itemIds.get(d.draft_id) })),
    items,
  };
}
