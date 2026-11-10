import { PAPER_IDS } from '../types/contracts.ts';
import type { ContentItem, ContentPack, CurriculumCatalogue, LearnerEvent, ReadinessIndexSnapshot,
  ExamConfig, PackManifestEntry, AttemptSession, NotebookExtractionBatch, OfflineEntitlementClaims,
  PurchaseRecord, ProductOffer, Sm2ReviewState, ProgressUpload, ProgressAck, ProgressChanges,
  SignedOfflineEntitlement } from '../types/contracts.ts';

export interface Issue { path: string; message: string }
export type Result<T> = { ok: true; data: T } | { ok: false; issues: Issue[] };
type Obj = Record<string, unknown>;
class Check {
  issues: Issue[] = [];
  need(test: boolean, path: string, message: string): void { if (!test) this.issues.push({ path, message }); }
  obj(v: unknown, p: string): Obj {
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) return v as Obj;
    this.need(false, p, 'Expected object'); return {};
  }
  text(v: unknown, p: string): string { this.need(typeof v === 'string' && v.trim().length > 0, p, 'Expected nonempty string'); return typeof v === 'string' ? v : ''; }
  list(v: unknown, p: string, min = 0): unknown[] { this.need(Array.isArray(v) && v.length >= min, p, `Expected array with at least ${min} entries`); return Array.isArray(v) ? v : []; }
  strings(v: unknown, p: string, min = 0): string[] { return this.list(v, p, min).map((x, i) => this.text(x, `${p}[${i}]`)); }
  one(v: unknown, values: readonly string[], p: string): void { this.need(typeof v === 'string' && values.includes(v), p, `Expected one of ${values.join(', ')}`); }
  integer(v: unknown, p: string, min = 0): void { this.need(typeof v === 'number' && Number.isSafeInteger(v) && v >= min, p, `Expected safe integer >= ${min}`); }
  bool(v: unknown, p: string): void { this.need(typeof v === 'boolean', p, 'Expected boolean'); }
  date(v: unknown, p: string): void {
    const s = typeof v === 'string' ? v : '';
    this.need(/^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s, p, 'Expected real YYYY-MM-DD date');
  }
  time(v: unknown, p: string): void {
    const s = typeof v === 'string' ? v : '';
    const format = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
    this.need(format.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString() === (s.length === 20 ? s.replace('Z', '.000Z') : s), p, 'Expected valid UTC ISO timestamp');
  }
  decimal(v: unknown, p: string): string { const s = this.text(v, p); this.need(/^-?(0|[1-9]\d*)(\.\d+)?$/.test(s), p, 'Expected plain decimal string; no commas/exponent/NaN'); return s; }
  unique(a: readonly unknown[], p: string): void { this.need(new Set(a).size === a.length, p, 'Duplicate values'); }
  absent(o: Obj, fields: string[], p: string): void { fields.forEach(k => this.need(o[k] === undefined, `${p}.${k}`, 'Field is forbidden for this variant')); }
  done<T>(v: unknown): Result<T> { return this.issues.length ? { ok: false, issues: this.issues } : { ok: true, data: v as T }; }
}
const paper = (c: Check, v: unknown, p: string) => c.one(v, PAPER_IDS, p);
const roundings = ['HALF_UP', 'HALF_EVEN', 'TOWARD_ZERO', 'AWAY_FROM_ZERO', 'FLOOR', 'CEILING'];
function citation(c: Check, v: unknown, p: string): void {
  const o = c.obj(v, p); ['source_id', 'authority', 'title', 'locator'].forEach(k => c.text(o[k], `${p}.${k}`));
  ['publication_date', 'effective_date'].forEach(k => { if (o[k] !== null) c.date(o[k], `${p}.${k}`); });
  if (o.url !== undefined) { const s = c.text(o.url, `${p}.url`); try { c.need(['https:', 'http:'].includes(new URL(s).protocol), `${p}.url`, 'Expected HTTP(S) source URL'); } catch { c.need(false, `${p}.url`, 'Invalid URL'); } }
}
function review(c: Check, v: unknown, p: string, quantitative: boolean): void {
  const r = c.obj(v, p); c.time(r.verified_at, `${p}.verified_at`); c.text(r.reviewer_id, `${p}.reviewer_id`);
  c.one(r.method, ['human', 'automated', 'mixed'], `${p}.method`);
  c.need(r.source_verified === true && r.answer_checked === true, p, 'Source and answer checks must be recorded');
  c.one(r.calculations, quantitative ? ['verified'] : ['verified', 'not_applicable'], `${p}.calculations`);
}
export function validateCatalogue(value: unknown): Result<CurriculumCatalogue> {
  const c = new Check(), o = c.obj(value, '$'); c.text(o.syllabus_version, '$.syllabus_version');
  const ms = c.list(o.modules, '$.modules'), us = c.list(o.units, '$.units'), os = c.list(o.objectives, '$.objectives');
  const modules = new Set<unknown>(), units = new Set<unknown>(), objectives = new Set<unknown>();
  ms.forEach((v, i) => { const p = `$.modules[${i}]`, m = c.obj(v, p); paper(c, m.paper_id, `${p}.paper_id`); const id = c.text(m.id, `${p}.id`);
    if (m.title !== undefined) c.text(m.title, `${p}.title`);
    c.need(id.startsWith(`${m.paper_id}::MOD_`) && /^[A-Z]+::MOD_[A-Z0-9_]+$/.test(id), p, 'Invalid paper/module namespace'); c.need(!modules.has(id), p, 'Duplicate module'); modules.add(id); });
  us.forEach((v, i) => { const p = `$.units[${i}]`, u = c.obj(v, p), id = c.text(u.id, `${p}.id`); c.text(u.module_id, `${p}.module_id`);
    if (u.title !== undefined) c.text(u.title, `${p}.title`);
    c.need(modules.has(u.module_id) && id.startsWith(`${u.module_id}::U`) && /^::U[A-Za-z0-9_-]+$/.test(id.slice(String(u.module_id).length)), p, 'Unknown or mismatched parent module'); c.need(!units.has(id), p, 'Duplicate unit'); units.add(id); });
  os.forEach((v, i) => { const p = `$.objectives[${i}]`, x = c.obj(v, p), id = c.text(x.id, `${p}.id`); c.text(x.unit_id, `${p}.unit_id`);
    if (x.title !== undefined) c.text(x.title, `${p}.title`);
    if (x.description !== undefined) c.text(x.description, `${p}.description`);
    c.need(units.has(x.unit_id) && id.startsWith(`${x.unit_id}::LO_`) && /^::LO_[A-Za-z0-9_-]+$/.test(id.slice(String(x.unit_id).length)), p, 'Unknown or mismatched parent unit'); c.need(!objectives.has(id), p, 'Duplicate objective'); objectives.add(id); });
  return c.done(value);
}
function base(c: Check, o: Obj, cat: CurriculumCatalogue, p: string): void {
  c.text(o.id, `${p}.id`); c.need(o.schema_version === '2.0.0', p, 'Unsupported schema version'); c.integer(o.revision, `${p}.revision`, 1);
  c.need(o.syllabus_version === cat.syllabus_version, p, 'Syllabus version mismatch'); paper(c, o.paper_id, `${p}.paper_id`);
  c.need(cat.modules.some(m => m.id === o.module_id && m.paper_id === o.paper_id), `${p}.module_id`, 'Unknown module or wrong paper');
  c.need(cat.units.some(u => u.id === o.unit_id && u.module_id === o.module_id), `${p}.unit_id`, 'Unknown unit or wrong module');
  const ids = c.strings(o.objective_ids, `${p}.objective_ids`, 1); c.unique(ids, `${p}.objective_ids`);
  ids.forEach((id, idx) => c.need(cat.objectives.some(x => x.id === id && x.unit_id === o.unit_id), `${p}.objective_ids[${idx}]`, 'Unknown objective or wrong unit'));
  const ctx = c.obj(o.context, `${p}.context`); c.one(ctx.kind, ['exam', 'current_reference'], `${p}.context.kind`);
  if (ctx.kind === 'exam') { c.text(ctx.exam_context_id, `${p}.context.exam_context_id`); c.date(ctx.regulatory_cutoff_date, `${p}.context.regulatory_cutoff_date`); }
  else if (ctx.kind === 'current_reference') c.date(ctx.as_of_date, `${p}.context.as_of_date`);
  c.one(o.publication_state, ['draft', 'validated', 'published', 'retired'], `${p}.publication_state`);
  c.one(o.origin, ['original_authoring', 'source_assisted', 'synthetic_fixture'], `${p}.origin`);
  const reviewed = ['validated', 'published', 'retired'].includes(String(o.publication_state));
  c.list(o.citations, `${p}.citations`, reviewed ? 1 : 0).forEach((v, i) => citation(c, v, `${p}.citations[${i}]`));
  const quantitative = o.question_type === 'numeric_input' || ['formula', 'worked_example'].includes(String(o.card_type)) || o.item_type === 'calculator' || (o.worked_solution_steps != null);
  if (reviewed || o.review !== null) review(c, o.review, `${p}.review`, quantitative);
  if (o.publication_state === 'published') c.need(o.origin !== 'synthetic_fixture', p, 'Synthetic fixtures cannot be published');
  if (o.replaces_item_id !== undefined) c.text(o.replaces_item_id, `${p}.replaces_item_id`);
}
function steps(c: Check, v: unknown, p: string): void {
  const seen: unknown[] = []; c.list(v, p, 1).forEach((s, i) => { const o = c.obj(s, `${p}[${i}]`); c.integer(o.step_number, `${p}[${i}].step_number`, 1); seen.push(o.step_number);
    ['description', 'formula_or_substitution', 'intermediate_result'].forEach(k => c.text(o[k], `${p}[${i}].${k}`)); }); c.unique(seen, `${p}.step_numbers`);
}
function content(c: Check, value: unknown, cat: CurriculumCatalogue, p: string): void {
  const o = c.obj(value, p); base(c, o, cat, p); c.one(o.item_type, ['card', 'question', 'case_study', 'reference', 'calculator'], `${p}.item_type`);
  if (o.item_type === 'card') {
    ['title', 'core_explanation_md'].forEach(k => c.text(o[k], `${p}.${k}`)); if (o.expanded_explanation_md !== undefined) c.text(o.expanded_explanation_md, `${p}.expanded_explanation_md`);
    c.strings(o.prerequisite_objective_ids, `${p}.prerequisite_objective_ids`).forEach((id, idx) => c.need(cat.objectives.some(x => x.id === id), `${p}.prerequisite_objective_ids[${idx}]`, 'Unknown prerequisite'));
    const s = c.obj(o.self_check, `${p}.self_check`); c.one(s.mode, ['self_assessed', 'question'], `${p}.self_check.mode`);
    if (s.mode === 'self_assessed') { c.text(s.prompt_text, `${p}.self_check.prompt_text`); c.text(s.expected_takeaway, `${p}.self_check.expected_takeaway`); } else c.text(s.question_id, `${p}.self_check.question_id`);
    c.one(o.card_type, ['concept', 'formula', 'statute', 'worked_example'], `${p}.card_type`);
    if (o.card_type !== 'formula') c.absent(o, ['formula_spec'], p);
    if (o.card_type !== 'statute') c.absent(o, ['statute_spec'], p);
    if (o.card_type !== 'worked_example') c.absent(o, ['worked_steps', 'final_answer_with_unit'], p);
    if (o.card_type === 'formula') { const f = c.obj(o.formula_spec, `${p}.formula_spec`); c.text(f.latex_expression, `${p}.formula_spec.latex_expression`); c.strings(f.assumptions, `${p}.formula_spec.assumptions`); c.strings(f.common_errors, `${p}.formula_spec.common_errors`);
      c.list(f.variables, `${p}.formula_spec.variables`, 1).forEach((v, idx) => { const x = c.obj(v, `${p}.formula_spec.variables[${idx}]`); ['symbol', 'name', 'unit'].forEach(k => c.text(x[k], `${p}.formula_spec.variables[${idx}].${k}`)); }); }
    if (o.card_type === 'statute') { const s = c.obj(o.statute_spec, `${p}.statute_spec`); ['act_or_direction_name', 'rule_summary', 'applicability'].forEach(k => c.text(s[k], `${p}.statute_spec.${k}`));
      if (s.section_or_clause !== null) c.text(s.section_or_clause, `${p}.statute_spec.section_or_clause`); c.strings(s.exceptions, `${p}.statute_spec.exceptions`); c.strings(s.thresholds_or_penalties, `${p}.statute_spec.thresholds_or_penalties`); }
    if (o.card_type === 'worked_example') { steps(c, o.worked_steps, `${p}.worked_steps`); c.text(o.final_answer_with_unit, `${p}.final_answer_with_unit`); }
  }
  if (o.item_type === 'question') {
    c.need(c.obj(o.context, p).kind === 'exam', `${p}.context`, 'Scored questions need an exam context');
    c.one(o.difficulty, ['easy', 'medium', 'hard'], `${p}.difficulty`); c.one(o.question_type, ['single_choice', 'numeric_input'], `${p}.question_type`);
    c.text(o.stem_md, `${p}.stem_md`); c.text(o.correct_explanation_md, `${p}.correct_explanation_md`); if (o.case_study_id !== undefined) c.text(o.case_study_id, `${p}.case_study_id`);
    if (o.worked_solution_steps !== undefined) steps(c, o.worked_solution_steps, `${p}.worked_solution_steps`);
    if (o.marks !== undefined) c.need(typeof o.marks === 'number' && Number.isFinite(o.marks) && o.marks > 0, `${p}.marks`, 'Marks must be a positive number');
    if (o.question_type === 'single_choice') {
      c.absent(o, ['numeric_rule'], p); const opts = c.list(o.options, `${p}.options`); c.need(opts.length === 4, `${p}.options`, 'Exactly four options required');
      const ids = opts.map((v, idx) => { const x = c.obj(v, `${p}.options[${idx}]`); c.one(x.option_id, ['A', 'B', 'C', 'D'], `${p}.options[${idx}].option_id`); c.text(x.text_md, `${p}.options[${idx}].text_md`); c.text(x.explanation_md, `${p}.options[${idx}].explanation_md`); return x.option_id; });
      c.unique(ids, `${p}.options`); c.one(o.correct_option_id, ['A', 'B', 'C', 'D'], `${p}.correct_option_id`); c.need(ids.includes(o.correct_option_id), `${p}.correct_option_id`, 'Answer must identify an option');
    }
    if (o.question_type === 'numeric_input') {
      c.absent(o, ['options', 'correct_option_id'], p); const n = c.obj(o.numeric_rule, `${p}.numeric_rule`), s = c.decimal(n.expected_answer, `${p}.numeric_rule.expected_answer`);
      c.text(n.unit_label, `${p}.numeric_rule.unit_label`); c.integer(n.precision_decimals, `${p}.numeric_rule.precision_decimals`); c.need(typeof n.precision_decimals === 'number' && n.precision_decimals <= 12, `${p}.numeric_rule.precision_decimals`, 'Precision exceeds supported maximum 12');
      c.one(n.rounding_mode, roundings, `${p}.numeric_rule.rounding_mode`); c.text(n.rounding_instruction, `${p}.numeric_rule.rounding_instruction`); c.bool(n.allow_negative, `${p}.numeric_rule.allow_negative`);
      c.need(n.allow_negative === true || !s.startsWith('-'), `${p}.numeric_rule.expected_answer`, 'Negative answer forbidden');
      c.need((s.split('.')[1]?.length ?? 0) === n.precision_decimals, `${p}.numeric_rule.expected_answer`, 'Expected answer must have the stated decimal places');
      c.absent(n, ['tolerance'], `${p}.numeric_rule`);
    }
  }
  if (o.item_type === 'case_study') { c.text(o.title, `${p}.title`); c.text(o.scenario_narrative_md, `${p}.scenario_narrative_md`); const ids = c.strings(o.question_ids, `${p}.question_ids`, 1); c.unique(ids, `${p}.question_ids`); c.strings(o.reference_tables_md, `${p}.reference_tables_md`); }
  if (o.item_type === 'reference') { c.text(o.title, `${p}.title`); c.text(o.body_md, `${p}.body_md`); ['effective_from', 'effective_until'].forEach(k => { if (o[k] !== null) c.date(o[k], `${p}.${k}`); });
    if (typeof o.effective_from === 'string' && typeof o.effective_until === 'string') c.need(o.effective_from <= o.effective_until, p, 'Invalid effective date interval'); }
  if (o.item_type === 'calculator') { ['title', 'calculator_key', 'output_unit'].forEach(k => c.text(o[k], `${p}.${k}`)); c.strings(o.assumptions, `${p}.assumptions`);
    const keys = c.list(o.inputs, `${p}.inputs`, 1).map((v, idx) => { const x = c.obj(v, `${p}.inputs[${idx}]`); ['key', 'label', 'unit'].forEach(k => c.text(x[k], `${p}.inputs[${idx}].${k}`)); return x.key; }); c.unique(keys, `${p}.inputs`); }
}
export function validateContentItem(value: unknown, catalogue: CurriculumCatalogue): Result<ContentItem> {
  const checked = validateCatalogue(catalogue); if (!checked.ok) return checked;
  const c = new Check(); content(c, value, catalogue, '$'); return c.done(value);
}
export function validatePack(value: unknown, catalogue: CurriculumCatalogue): Result<ContentPack> {
  const checked = validateCatalogue(catalogue); if (!checked.ok) return checked;
  const c = new Check(), o = c.obj(value, '$'); c.need(o.schema_version === '2.0.0', '$', 'Unsupported schema version');
  ['pack_id', 'pack_version', 'exam_context_id'].forEach(k => c.text(o[k], `$.${k}`)); paper(c, o.paper_id, '$.paper_id');
  c.need(o.syllabus_version === catalogue.syllabus_version, '$', 'Syllabus mismatch');
  const items = c.list(o.items, '$.items', 1), byId = new Map<unknown, Obj>();
  items.forEach((v, i) => { const p = `$.items[${i}]`, x = c.obj(v, p); content(c, v, catalogue, p);
    c.need(!byId.has(x.id), p, 'Duplicate item ID'); byId.set(x.id, x);
    c.need(x.paper_id === o.paper_id, p, 'Mixed-paper pack'); c.need(x.publication_state === 'published', p, 'Delivery packs contain published items only');
    const ctx = c.obj(x.context, p); if (ctx.kind === 'exam') c.need(ctx.exam_context_id === o.exam_context_id, p, 'Exam context mismatch');
    else c.need(x.item_type === 'reference', p, 'Current context is reserved for reference entries in exam packs'); });
  items.forEach((v, i) => { const p = `$.items[${i}]`, x = c.obj(v, p);
    if (x.item_type === 'case_study') c.list(x.question_ids, p).forEach(id => { const q = byId.get(id); c.need(q?.item_type === 'question' && q.case_study_id === x.id, p, 'Case question missing or backlink mismatch'); });
    if (x.item_type === 'question' && x.case_study_id != null) { const cs = byId.get(x.case_study_id); c.need(cs?.item_type === 'case_study' && Array.isArray(cs.question_ids) && cs.question_ids.includes(x.id), p, 'Missing parent case or membership'); }
    if (x.item_type === 'card') { const s = c.obj(x.self_check, p); if (s.mode === 'question') c.need(byId.get(s.question_id)?.item_type === 'question', p, 'Self-check question absent from pack'); }
  }); return c.done(value);
}
export function validateEvent(value: unknown): Result<LearnerEvent> {
  const c = new Check(), o = c.obj(value, '$');
  ['event_id','learner_id','device_id','exam_context_id','pack_id','pack_version','item_id'].forEach(k => c.text(o[k], `$.${k}`));
  c.integer(o.device_sequence, '$.device_sequence'); c.integer(o.item_revision, '$.item_revision', 1); paper(c, o.paper_id, '$.paper_id');
  c.strings(o.objective_ids, '$.objective_ids', 1).forEach((id, idx) => c.need(id.startsWith(`${o.paper_id}::MOD_`), `$.objective_ids[${idx}]`, 'Objective paper mismatch')); c.time(o.occurred_at, '$.occurred_at');
  c.one(o.event_type, ['answer_submitted','self_check','sm2_review','lesson_completed'], '$.event_type');
  c.absent(o, ['is_first_exposure'], '$');
  if (o.event_type === 'answer_submitted') { c.text(o.attempt_id, '$.attempt_id'); c.one(o.mode, ['practice','mock'], '$.mode'); c.text(o.submitted_response, '$.submitted_response');
    c.bool(o.is_correct, '$.is_correct'); c.integer(o.elapsed_ms, '$.elapsed_ms'); c.bool(o.answer_was_revealed_prior, '$.answer_was_revealed_prior'); c.need(o.assessment === 'objective', '$.assessment', 'Expected objective assessment'); c.absent(o, ['sm2_rating'], '$'); }
  else { c.absent(o, ['is_correct','submitted_response'], '$');
    if (o.event_type === 'self_check') { c.need(o.assessment === 'self_assessed', '$.assessment', 'Expected self assessment'); c.one(o.recall, ['forgot','partial','recalled'], '$.recall'); c.absent(o, ['sm2_rating'], '$'); }
    if (o.event_type === 'lesson_completed') { c.need(o.assessment === 'ungraded', '$.assessment', 'Expected ungraded event'); c.absent(o, ['sm2_rating'], '$'); }
    if (o.event_type === 'sm2_review') { c.one(o.sm2_rating, ['Again','Hard','Good','Easy'], '$.sm2_rating'); c.text(o.algorithm_version, '$.algorithm_version'); if (o.based_on_answer_event_id !== null) c.text(o.based_on_answer_event_id, '$.based_on_answer_event_id'); }
  } return c.done(value);
}
export function validateReadiness(value: unknown): Result<ReadinessIndexSnapshot> {
  const c = new Check(), o = c.obj(value, '$'); paper(c, o.paper_id, '$.paper_id'); c.text(o.exam_context_id, '$.exam_context_id');
  ['calculated_at','window_start','window_end'].forEach(k => c.time(o[k], `$.${k}`));
  c.need(Date.parse(String(o.window_start)) <= Date.parse(String(o.window_end)), '$.window_end', 'Invalid evidence window'); c.need(o.formula_version === 'CRI_V1', '$.formula_version', 'Unknown CRI formula');
  ['completed_objectives','eligible_accuracy_questions','eligible_timed_questions'].forEach(k => c.integer(o[k], `$.${k}`));
  c.need(Number(o.eligible_timed_questions) <= Number(o.eligible_accuracy_questions), '$.eligible_timed_questions', 'Timed evidence must be a subset of assessed questions');
  if (o.mapped_objectives_total !== null) c.integer(o.mapped_objectives_total, '$.mapped_objectives_total', 1);
  ['study_coverage_pct','assessed_accuracy_pct','speed_score_pct','cri_score'].forEach(k => { const n = o[k]; if (n !== null) c.need(typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 100, `$.${k}`, 'Expected percentage or null'); });
  const denom = o.mapped_objectives_total, complete = o.completed_objectives;
  if (typeof denom === 'number' && typeof complete === 'number') { c.need(complete <= denom, '$.completed_objectives', 'Coverage exceeds objectives'); c.need(typeof o.study_coverage_pct === 'number' && Math.abs(o.study_coverage_pct - 100 * complete / denom) < 0.0001, '$.study_coverage_pct', 'Coverage calculation mismatch'); }
  else c.need(o.study_coverage_pct === null, '$.study_coverage_pct', 'Unknown denominator requires null coverage');
  const eligible = typeof denom === 'number' && denom > 0 && Number(o.eligible_accuracy_questions) >= 20 && Number(o.eligible_timed_questions) >= 20 && [o.study_coverage_pct,o.assessed_accuracy_pct,o.speed_score_pct].every(n => typeof n === 'number');
  c.need(o.evidence_status === (eligible ? 'sufficient_evidence' : 'insufficient_evidence'), '$.evidence_status', 'Evidence status mismatch');
  if (eligible) { const expected = 0.4 * Number(o.study_coverage_pct) + 0.4 * Number(o.assessed_accuracy_pct) + 0.2 * Number(o.speed_score_pct); c.need(typeof o.cri_score === 'number' && Math.abs(o.cri_score - expected) < 0.0001, '$.cri_score', 'CRI calculation mismatch'); }
  else c.need(o.cri_score === null, '$.cri_score', 'Insufficient evidence requires null score'); return c.done(value);
}
export function validateExamConfig(value: unknown): Result<ExamConfig> {
  const c = new Check(), o = c.obj(value, '$'); ['exam_context_id','config_version','syllabus_version','passing_rule_description','calculator_policy'].forEach(k => c.text(o[k], `$.${k}`));
  c.date(o.regulatory_cutoff_date, '$.regulatory_cutoff_date'); ['duration_seconds','question_count','total_marks'].forEach(k => c.integer(o[k], `$.${k}`, 1));
  c.need(!c.decimal(o.wrong_answer_penalty, '$.wrong_answer_penalty').startsWith('-'), '$.wrong_answer_penalty', 'Penalty magnitude must be nonnegative'); citation(c, o.official_source, '$.official_source'); c.time(o.verified_at, '$.verified_at'); return c.done(value);
}
export function validateManifest(value: unknown): Result<PackManifestEntry> {
  const c = new Check(), o = c.obj(value, '$'); ['pack_id','pack_version','exam_context_id','minimum_client_version','change_summary'].forEach(k => c.text(o[k], `$.${k}`));
  paper(c, o.paper_id, '$.paper_id'); c.need(o.schema_version === '2.0.0', '$.schema_version', 'Unknown schema'); c.integer(o.file_size_bytes, '$.file_size_bytes', 1);
  c.need(typeof o.sha256 === 'string' && /^[a-f0-9]{64}$/.test(o.sha256), '$.sha256', 'Expected lowercase SHA-256');
  try { c.need(new URL(String(o.download_url)).protocol === 'https:', '$.download_url', 'Download requires HTTPS'); } catch { c.need(false, '$.download_url', 'Invalid download URL'); } return c.done(value);
}
export function validateAttempt(value: unknown): Result<AttemptSession> {
  const c = new Check(), o = c.obj(value, '$'); ['attempt_id','learner_id','exam_context_id','exam_config_version','pack_id','pack_version'].forEach(k => c.text(o[k], `$.${k}`)); paper(c,o.paper_id,'$.paper_id');
  c.one(o.mode,['practice','mock'],'$.mode'); c.one(o.status,['active','submitted','expired'],'$.status'); c.time(o.started_at,'$.started_at');
  if (o.expires_at_iso !== null) c.time(o.expires_at_iso,'$.expires_at_iso');
  if (o.mode === 'mock') c.need(typeof o.expires_at_iso === 'string' && Date.parse(o.expires_at_iso) > Date.parse(String(o.started_at)), '$.expires_at_iso', 'Mock requires a later absolute deadline');
  if (o.submitted_at != null) { c.time(o.submitted_at, '$.submitted_at'); c.need(Date.parse(String(o.submitted_at)) >= Date.parse(String(o.started_at)), '$.submitted_at', 'Submission cannot predate start'); }
  if (o.score_summary != null) {
    const ss = c.obj(o.score_summary, '$.score_summary');
    c.need(typeof ss.marks_obtained === 'number' && Number.isFinite(ss.marks_obtained) && ss.marks_obtained >= 0, '$.score_summary.marks_obtained', 'Expected marks >= 0');
    c.need(typeof ss.total_marks === 'number' && Number.isFinite(ss.total_marks) && ss.total_marks >= 0, '$.score_summary.total_marks', 'Expected total marks >= 0');
    c.bool(ss.passed, '$.score_summary.passed');
    c.need(typeof ss.marks_obtained === 'number' && typeof ss.total_marks === 'number' && ss.marks_obtained <= ss.total_marks, '$.score_summary.marks_obtained', 'Marks cannot exceed total marks');
  }
  const ids = c.list(o.question_order,'$.question_order',1).map((v, idx) => { const x=c.obj(v, `$.question_order[${idx}]`); c.integer(x.item_revision, `$.question_order[${idx}].item_revision`, 1); return c.text(x.item_id, `$.question_order[${idx}].item_id`); }); c.unique(ids,'$.question_order');
  const responses=c.obj(o.saved_responses,'$.saved_responses'); Object.entries(responses).forEach(([id,response])=>{c.need(ids.includes(id),`$.saved_responses.${id}`,'Response to unknown question');c.text(response,`$.saved_responses.${id}`);});
  const flags=c.strings(o.flagged_item_ids,'$.flagged_item_ids'); c.unique(flags,'$.flagged_item_ids'); flags.forEach((id, idx)=>c.need(ids.includes(id),`$.flagged_item_ids[${idx}]`,'Unknown flagged question')); return c.done(value);
}
export function validateExtraction(value: unknown): Result<NotebookExtractionBatch> {
  const c=new Check(),o=c.obj(value,'$'); c.need(o.schema_version==='notebook-staging-1','$.schema_version','Unknown staging schema'); c.text(o.batch_id,'$.batch_id'); paper(c,o.paper_id,'$.paper_id'); c.text(o.unit_label,'$.unit_label');
  c.need(o.publication_state==='draft' && o.verified_at===null,'$.publication_state','Notebook output must remain unverified draft'); const sourceIds=c.strings(o.source_ids,'$.source_ids',1);c.unique(sourceIds,'$.source_ids');
  const facts=c.list(o.facts,'$.facts'), factIds=facts.map((v, i)=>{const f=c.obj(v,`$.facts[${i}]`);['fact_id','statement','source_id','locator'].forEach(k=>c.text(f[k],`$.facts[${i}].${k}`));c.bool(f.regulatory_sensitive,`$.facts[${i}].regulatory_sensitive`);c.one(f.evidence_status,['explicit','needs_review'],`$.facts[${i}].evidence_status`);c.need(sourceIds.includes(String(f.source_id)),`$.facts[${i}].source_id`,'Unknown source');return f.fact_id;});c.unique(factIds,'$.facts');
  const ids=c.list(o.drafts,'$.drafts').map((v, i)=>{const d=c.obj(v,`$.drafts[${i}]`);c.text(d.draft_id,`$.drafts[${i}].draft_id`);c.one(d.item_type,['card','question','case_study'],`$.drafts[${i}].item_type`);c.text(d.variant,`$.drafts[${i}].variant`);c.strings(d.fact_ids,`$.drafts[${i}].fact_ids`,1).forEach((id, idx)=>c.need(factIds.includes(id),`$.drafts[${i}].fact_ids[${idx}]`,'Unknown evidence fact'));c.obj(d.payload,`$.drafts[${i}].payload`);return d.draft_id;});c.unique(ids,'$.drafts');
  c.strings(o.unresolved,'$.unresolved');if(o.next_batch_hint!==null)c.text(o.next_batch_hint,'$.next_batch_hint');return c.done(value);
}
/** Verifies claim structure only; verify the signature, account binding and server status separately. */
export function validateEntitlementClaims(value: unknown): Result<OfflineEntitlementClaims> {
  const c=new Check(),o=c.obj(value,'$');['entitlement_id','learner_id','product_id','purchase_id'].forEach(k=>c.text(o[k],`$.${k}`));
  ['issued_at','access_expires_at','offline_until'].forEach(k=>c.time(o[k],`$.${k}`));c.integer(o.entitlement_version,'$.entitlement_version',1);
  const papers=c.strings(o.allowed_papers,'$.allowed_papers',1);c.unique(papers,'$.allowed_papers');papers.forEach((p, idx)=>paper(c,p,`$.allowed_papers[${idx}]`));
  c.need(Date.parse(String(o.issued_at)) < Date.parse(String(o.offline_until)) && Date.parse(String(o.offline_until)) <= Date.parse(String(o.access_expires_at)),'$.offline_until','Offline lease must fit within access term');return c.done(value);
}
export function validatePurchase(value: unknown): Result<PurchaseRecord> {
  const c=new Check(),o=c.obj(value,'$');['purchase_id','learner_id','product_id','provider_transaction_id'].forEach(k=>c.text(o[k],`$.${k}`));c.one(o.provider,['razorpay','google_play'],'$.provider');
  c.integer(o.amount_minor,'$.amount_minor',1);c.need(o.currency==='INR','$.currency','Expected INR');c.one(o.status,['pending','verified','failed','refunded','revoked'],'$.status');
  ['verified_at','access_starts_at','access_expires_at'].forEach(k=>{if(o[k]!=null)c.time(o[k],`$.${k}`);});
  if(o.refunded_at!=null)c.time(o.refunded_at,'$.refunded_at');
  if(o.status==='verified')c.need(typeof o.verified_at==='string' && typeof o.access_starts_at==='string' && typeof o.access_expires_at==='string' && Date.parse(o.access_starts_at)<Date.parse(o.access_expires_at),'$.verified_at','Verified purchase requires verification and a valid term');return c.done(value);
}
export function validateOffer(value: unknown): Result<ProductOffer> {
  const c=new Check(),o=c.obj(value,'$');['product_id','title','provider_product_id','term_description','content_availability_description'].forEach(k=>c.text(o[k],`$.${k}`));c.one(o.provider,['razorpay','google_play'],'$.provider');c.integer(o.amount_minor,'$.amount_minor',1);
  c.need(o.currency==='INR' && o.auto_renews===false,'$.currency','Initial offer must be INR and non-renewing');const ids=c.strings(o.included_papers,'$.included_papers',1);c.unique(ids,'$.included_papers');ids.forEach((p, idx)=>paper(c,p,`$.included_papers[${idx}]`));return c.done(value);
}
export function validateReviewState(value: unknown): Result<Sm2ReviewState> {
  const c=new Check(),o=c.obj(value,'$');['learner_id','item_id','exam_context_id','algorithm_version','learner_time_zone'].forEach(k=>c.text(o[k],`$.${k}`));paper(c,o.paper_id,'$.paper_id');c.integer(o.item_revision,'$.item_revision',1);
  c.integer(o.repetition_count,'$.repetition_count');c.integer(o.interval_days,'$.interval_days');c.need(typeof o.ease_factor==='number' && Number.isFinite(o.ease_factor) && o.ease_factor>=1.3,'$.ease_factor','Ease factor must be >=1.3');c.date(o.due_date_iso,'$.due_date_iso');if(o.last_reviewed_at!==null)c.time(o.last_reviewed_at,'$.last_reviewed_at');
  try {new Intl.DateTimeFormat('en',{timeZone:String(o.learner_time_zone)});} catch {c.need(false,'$.learner_time_zone','Unknown time zone');}return c.done(value);
}
export function validateProgressUpload(value: unknown): Result<ProgressUpload> {
  const c = new Check(), o = c.obj(value, '$');
  const events = c.list(o.events, '$.events');
  events.forEach((e, i) => {
    const res = validateEvent(e);
    if (!res.ok) res.issues.forEach(issue => c.issues.push({ path: `$.events[${i}]${issue.path.replace(/^\$/, '')}`, message: issue.message }));
  });
  if (o.after_cursor !== null) c.text(o.after_cursor, '$.after_cursor');
  return c.done(value);
}
export function validateProgressAck(value: unknown): Result<ProgressAck> {
  const c = new Check(), o = c.obj(value, '$');
  c.strings(o.accepted_event_ids, '$.accepted_event_ids');
  c.strings(o.duplicate_event_ids, '$.duplicate_event_ids');
  c.text(o.next_cursor, '$.next_cursor');
  const rejected = c.list(o.rejected, '$.rejected');
  rejected.forEach((r, i) => {
    const ro = c.obj(r, `$.rejected[${i}]`);
    c.text(ro.event_id, `$.rejected[${i}].event_id`);
    c.text(ro.reason, `$.rejected[${i}].reason`);
  });
  c.unique([...c.strings(o.accepted_event_ids, '$.accepted_event_ids'), ...c.strings(o.duplicate_event_ids, '$.duplicate_event_ids'), ...rejected.map(r => c.obj(r, '$.rejected').event_id)], '$.event_ids');
  return c.done(value);
}
export function validateProgressChanges(value: unknown): Result<ProgressChanges> {
  const c = new Check(), o = c.obj(value, '$');
  const events = c.list(o.events, '$.events');
  events.forEach((e, i) => {
    const res = validateEvent(e);
    if (!res.ok) res.issues.forEach(issue => c.issues.push({ path: `$.events[${i}]${issue.path.replace(/^\$/, '')}`, message: issue.message }));
  });
  c.text(o.next_cursor, '$.next_cursor');
  c.bool(o.has_more, '$.has_more');
  return c.done(value);
}
export function validateSignedEntitlement(value: unknown): Result<SignedOfflineEntitlement> {
  const c = new Check(), o = c.obj(value, '$');
  c.text(o.key_id, '$.key_id');
  c.text(o.signed_token, '$.signed_token');
  return c.done(value);
}
