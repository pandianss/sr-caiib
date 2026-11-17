/** Content renderers shared by lessons, practice, mocks and the library. */
import { useId } from 'react';
import type { ContentItem, QuestionItem, StudyCard, WorkedStep } from '../types/contracts.ts';
import { formatDate } from '../core/time.ts';
import { model } from './model.ts';
import { Formula, Icon, InlineMd, McqOption, Md, More, Tag } from './ui.tsx';

export const CARD_TYPE_LABEL: Record<StudyCard['card_type'], string> = { concept: 'Concept', formula: 'Formula', statute: 'Statute or rule', worked_example: 'Worked example' };

/** Courseware and publisher editions are editorial evidence, kept on file but not shown to learners as the app's source. */
const COURSEWARE = /courseware|macmillan|study kit|workbook/i;
function publicCitations(item: ContentItem) {
  const seen = new Set<string>();
  return item.citations.filter(c => !COURSEWARE.test(`${c.title} ${c.authority}`)).filter(c => { const k = `${c.title}|${c.locator}`; if (seen.has(k)) return false; seen.add(k); return true; });
}

/** Concise provenance with expandable detail. Internal review flags and schema terms are never shown. */
export function Sources({ item }: { item: ContentItem }) {
  const record = model.state.index.recordOf(item.id) ?? model.state.allRecords.find(r => r.pack.items.some(i => i.id === item.id));
  if (record?.kind === 'fixture') return <p className="support"><Tag kind="warn">Engineering sample</Tag> Synthetic test material. Not exam content and not verified against any source.</p>;
  const ctx = model.state.contexts.find(c => item.context.kind === 'exam' && c.exam_context_id === item.context.exam_context_id);
  const verified = item.review ? formatDate(item.review.verified_at) : null;
  const line = item.context.kind === 'exam'
    ? `Applicable to ${ctx?.label ?? item.context.exam_context_id}${verified ? `; verified ${verified}` : ''}.`
    : `Current reference as of ${formatDate(item.context.as_of_date)}${verified ? `; last verified ${verified}` : ''}. Not updated in real time.`;
  const published = publicCitations(item);
  return (
    <div className="stack"><p className="support">{line}</p>
      {published.length > 0 && <More summary={`Public sources (${published.length})`}><ul className="list">{published.map((c, i) => (
        <li key={i} style={{ padding: '0.5rem 0' }}><strong>{c.title}</strong><div className="support">{c.authority} · {c.locator}{c.publication_date ? ` · published ${formatDate(c.publication_date)}` : ''}{c.effective_date ? ` · effective ${formatDate(c.effective_date)}` : ''}</div>{c.url && <a href={c.url} target="_blank" rel="noreferrer noopener">Open source</a>}</li>))}</ul>
        {item.context.kind === 'exam' && <p className="support">Regulatory cutoff for this session: {formatDate(item.context.regulatory_cutoff_date)}.</p>}</More>}
      {published.length === 0 && item.citations.length > 0 && <p className="support">Written independently for this app and checked against the syllabus study reference on file. No public regulator source is linked to this item yet.</p>}
    </div>
  );
}

export function Steps({ steps }: { steps: WorkedStep[] }) {
  return <ol className="steps">{[...steps].sort((a, b) => a.step_number - b.step_number).map(s => <li key={s.step_number}><div><div>{s.description}</div><div className="calc" tabIndex={0} role="group" aria-label={`Calculation: ${s.formula_or_substitution} gives ${s.intermediate_result}`}>{s.formula_or_substitution} = <strong>{s.intermediate_result}</strong></div></div></li>)}</ol>;
}

/** The teaching part of a card (without its self-check). */
export function CardBody({ card }: { card: StudyCard }) {
  return (
    <div className="section">
      <Md text={card.core_explanation_md} className="lesson" />
      {card.card_type === 'formula' && (<>
        <Formula latex={card.formula_spec.latex_expression} />
        <div className="section"><h3>Where</h3><dl className="defs">{card.formula_spec.variables.map(v => [<dt key={`${v.symbol}t`}>{v.symbol}</dt>, <dd key={`${v.symbol}d`}>{v.name} <span className="support">({v.unit})</span></dd>])}</dl></div>
        {card.formula_spec.assumptions.length > 0 && <div className="section"><h3>Assumptions</h3><ul className="md" style={{ margin: 0, paddingLeft: '1.25rem' }}>{card.formula_spec.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul></div>}
        {card.formula_spec.common_errors.length > 0 && <More summary="Common errors"><ul style={{ margin: 0, paddingLeft: '1.25rem' }}>{card.formula_spec.common_errors.map((a, i) => <li key={i}>{a}</li>)}</ul></More>}
      </>)}
      {card.card_type === 'statute' && (<>
        <div className="card rule"><h3>Rule</h3><p className="lesson">{card.statute_spec.rule_summary}</p>
          <dl className="kv"><dt>Source</dt><dd>{card.statute_spec.act_or_direction_name}</dd>{card.statute_spec.section_or_clause && <><dt>Section or clause</dt><dd>{card.statute_spec.section_or_clause}</dd></>}<dt>Applies to</dt><dd>{card.statute_spec.applicability}</dd></dl></div>
        {card.statute_spec.thresholds_or_penalties.length > 0 && <div className="section"><h3>Thresholds and consequences</h3><ul style={{ margin: 0, paddingLeft: '1.25rem' }}>{card.statute_spec.thresholds_or_penalties.map((a, i) => <li key={i}>{a}</li>)}</ul></div>}
        {card.statute_spec.exceptions.length > 0 && <More summary={`Exceptions (${card.statute_spec.exceptions.length})`}><ul style={{ margin: 0, paddingLeft: '1.25rem' }}>{card.statute_spec.exceptions.map((a, i) => <li key={i}>{a}</li>)}</ul></More>}
      </>)}
      {card.card_type === 'worked_example' && (<><Steps steps={card.worked_steps} /><div className="banner ok" role="group" aria-label="Final answer"><Icon name="check" /><div className="grow"><strong>Answer: {card.final_answer_with_unit}</strong></div></div></>)}
      {card.expanded_explanation_md && <More summary="More detail"><Md text={card.expanded_explanation_md} className="lesson" /></More>}
    </div>
  );
}

export interface Feedback { correct: boolean }
/**
 * One question. Selecting an option or typing never submits; the parent provides an explicit submit action.
 * With `feedback`, the correct answer and per-option explanations are shown (text and symbols, not colour alone).
 */
export function QuestionView({ q, response, onResponse, disabled, feedback, error, number, total, onSubmit }: { q: QuestionItem; response: string; onResponse: (v: string) => void; onSubmit?: () => void; disabled?: boolean; feedback?: Feedback | null; error?: string | null; number?: number; total?: number }) {
  const id = useId();
  return (
    <div className="section">
      <div className="row between">{number !== undefined && <span className="label">Question {number}{total ? ` of ${total}` : ''}</span>}<span className="label">{q.question_type === 'numeric_input' ? 'Numerical answer' : 'Choose one'} · {q.difficulty}</span></div>
      <Md text={q.stem_md} className="lesson" />
      {q.question_type === 'single_choice' ? (
        <fieldset className="options" disabled={disabled} aria-describedby={error ? `${id}-err` : undefined}>
          <legend className="sr-only">Answer options</legend>
          {q.options.map(o => {
            const chosen = response === o.option_id; const isCorrect = o.option_id === q.correct_option_id;
            const state = feedback ? (isCorrect ? 'verified_correct' : chosen ? 'examiner_trap' : 'resting') : chosen ? 'active_selected' : 'resting';
            return (
              <McqOption key={o.option_id} name={id} value={o.option_id} selected={chosen} state={state} onSelect={() => onResponse(o.option_id)}
                explanation={feedback ? <><span className="mark">{isCorrect ? '✓ Correct answer' : chosen ? '✗ Your answer' : 'Not correct'}{chosen && isCorrect ? ' (your answer)' : ''}.</span> {o.explanation_md}</> : undefined}>
                <InlineMd text={o.text_md} />
              </McqOption>);
          })}
        </fieldset>
      ) : (
        <div className="field">
          <label htmlFor={`${id}-n`}>Your answer</label>
          <div className="input-row"><input id={`${id}-n`} className="input" inputMode="decimal" enterKeyHint={onSubmit ? 'done' : undefined} onKeyDown={e => { if (e.key === 'Enter' && onSubmit && !disabled) { e.preventDefault(); onSubmit(); } }} autoComplete="off" value={response} disabled={disabled} aria-invalid={error ? true : undefined} aria-describedby={`${id}-unit ${id}-hint${error ? ` ${id}-err` : ''}`} onChange={e => onResponse(e.target.value)} /><span className="unit" id={`${id}-unit`} aria-label={`Unit: ${q.numeric_rule.unit_label}`}>{q.numeric_rule.unit_label}</span></div>
          <p className="support" id={`${id}-hint`}>{q.numeric_rule.rounding_instruction} Enter digits only{q.numeric_rule.allow_negative ? '; a minus sign is allowed' : ''}, without commas or units.</p>
          {feedback && <p><strong>{feedback.correct ? '✓ Correct.' : '✗ Not correct.'}</strong> Expected answer: <strong>{q.numeric_rule.expected_answer} {q.numeric_rule.unit_label}</strong></p>}
        </div>
      )}
      {error && <p className="field"><span className="error" id={`${id}-err`} role="alert">{error}</span></p>}
      {feedback && (
        <div className={`feedback ${feedback.correct ? 'correct' : 'incorrect'}`}>
          <strong>{feedback.correct ? '✓ Correct' : '✗ Not correct'}</strong><Md text={q.correct_explanation_md} />
        </div>)}
      {feedback && q.worked_solution_steps && <More summary="Worked solution"><Steps steps={q.worked_solution_steps} /></More>}
    </div>
  );
}
