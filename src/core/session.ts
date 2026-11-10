/**
 * Practice attempts, timed mocks, study sessions and the Today recommendation. Pure functions: callers
 * persist the returned records together with the returned event drafts in one atomic batch.
 */
import type { AttemptSession, ExamConfig, LearnerEvent, ObjectiveId, PaperId, QuestionItem, Sm2Rating, Sm2ReviewState, StudyCard } from '../types/contracts.ts';
import type { ContentIndex } from './content.ts';
import { gradeQuestion, type GradeResult } from './grading.ts';
import type { AttemptRecord, AttemptResult, ExamContextRecord, NewEvent, PackRecord, StepProgress, StudySession, StudyStep } from './model.ts';
import { SM2_VERSION, effectiveRating } from './sm2.ts';

// ---- time estimates (product choices, shown to the learner as estimates) ----------------------------------
export const READING_WORDS_PER_MINUTE = 180;
export const SELF_CHECK_SECONDS = 25;
/** Used only for planning estimates when no verified exam configuration exists. Never shown as official. */
export const PLANNING_PACE_SECONDS = 72;

export const wordCount = (md: string): number => md.split(/\s+/).filter(Boolean).length;
export function cardSeconds(card: StudyCard): number {
  const words = wordCount(card.core_explanation_md) + (card.card_type === 'worked_example' ? card.worked_steps.reduce((n, s) => n + wordCount(s.description) + 6, 0) : 0);
  return Math.max(30, Math.round((words / READING_WORDS_PER_MINUTE) * 60)) + SELF_CHECK_SECONDS;
}
/** Mock pace baseline: configured duration divided by configured question count. */
export function paceSeconds(config: ExamConfig | null): number | null {
  return config && config.question_count > 0 ? config.duration_seconds / config.question_count : null;
}

// ---- deterministic shuffle ------------------------------------------------------------------------------
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  const rand = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); const tmp = out[i]!; out[i] = out[j]!; out[j] = tmp; }
  return out;
}

// ---- access -----------------------------------------------------------------------------------------------
/** Whether a unit of an installed pack may be opened. `entitled` comes from verified offline entitlement. */
export function unitAccessible(record: PackRecord, unitId: string, entitled: boolean): boolean {
  return record.kind === 'fixture' || record.access === 'free' || entitled || record.free_unit_ids.includes(unitId);
}

// ---- attempts ---------------------------------------------------------------------------------------------
export interface AttemptArgs {
  attemptId: string; learnerId: string; paperId: PaperId; context: ExamContextRecord; record: PackRecord;
  questions: readonly QuestionItem[]; title: string; origin: AttemptRecord['origin']; nowMs: number;
}

/** Keeps case-study questions together and in their authored order. */
function orderWithCases(questions: readonly QuestionItem[], seed: string, shuffle: boolean): QuestionItem[] {
  const groups = new Map<string, QuestionItem[]>();
  for (const q of questions) { const k = q.case_study_id ?? `single:${q.id}`; groups.set(k, [...(groups.get(k) ?? []), q]); }
  const list = [...groups.values()];
  return (shuffle ? seededShuffle(list, seed) : list).flat();
}

function baseAttempt(a: AttemptArgs, mode: 'practice' | 'mock', ordered: QuestionItem[], expiresAt: string | null): AttemptRecord {
  const attempt: AttemptSession = {
    attempt_id: a.attemptId, learner_id: a.learnerId, paper_id: a.paperId, exam_context_id: a.context.exam_context_id,
    exam_config_version: a.context.config?.config_version ?? 'UNVERIFIED', pack_id: a.record.pack.pack_id, pack_version: a.record.pack.pack_version,
    mode, status: 'active', started_at: new Date(a.nowMs).toISOString(), expires_at_iso: expiresAt, submitted_at: null, score_summary: null,
    question_order: ordered.map(q => ({ item_id: q.id, item_revision: q.revision })), saved_responses: {}, flagged_item_ids: [],
  };
  return { attempt, title: a.title, fixture: a.record.kind === 'fixture', current_index: 0, timings_ms: {}, submitted_item_ids: [], outcomes: {}, result: null, origin: a.origin };
}

export function buildPracticeAttempt(a: AttemptArgs, limit?: number): AttemptRecord | null {
  const ordered = orderWithCases(a.questions, a.attemptId, false).slice(0, limit ?? a.questions.length);
  return ordered.length ? baseAttempt(a, 'practice', ordered, null) : null;
}

export type MockBuild = { ok: true; record: AttemptRecord; questionCount: number; durationSeconds: number; full: boolean } | { ok: false; reason: string };

/**
 * A mock follows the exam configuration. When the available question pool is smaller than the configured
 * count, a shorter mock is built at the same pace (duration scales with the number of questions) and is
 * labelled as a short mock; it never yields an official-style pass/fail.
 */
export function buildMockAttempt(a: AttemptArgs): MockBuild {
  const config = a.context.config;
  if (!config) return { ok: false, reason: 'The exam configuration for this session has not been verified yet, so timed mocks are unavailable.' };
  if (!a.questions.length) return { ok: false, reason: 'No assessed questions are available for this paper yet.' };
  const ordered = orderWithCases(a.questions, a.attemptId, true).slice(0, config.question_count);
  const pace = config.duration_seconds / config.question_count;
  const durationSeconds = Math.round(ordered.length * pace);
  const record = baseAttempt(a, 'mock', ordered, new Date(a.nowMs + durationSeconds * 1000).toISOString());
  return { ok: true, record, questionCount: ordered.length, durationSeconds, full: ordered.length === config.question_count };
}

export function attemptClock(attempt: AttemptSession, nowMs: number): { remainingMs: number | null; expired: boolean } {
  if (!attempt.expires_at_iso) return { remainingMs: null, expired: false };
  const remaining = Date.parse(attempt.expires_at_iso) - nowMs;
  return { remainingMs: Math.max(0, remaining), expired: remaining <= 0 };
}

export function withResponse(record: AttemptRecord, itemId: string, response: string | null): AttemptRecord {
  const saved = { ...record.attempt.saved_responses };
  if (response === null || response === '') delete saved[itemId]; else saved[itemId] = response;
  return { ...record, attempt: { ...record.attempt, saved_responses: saved } };
}
export function withFlag(record: AttemptRecord, itemId: string, flagged: boolean): AttemptRecord {
  const set = new Set(record.attempt.flagged_item_ids);
  if (flagged) set.add(itemId); else set.delete(itemId);
  return { ...record, attempt: { ...record.attempt, flagged_item_ids: [...set] } };
}
export function withTiming(record: AttemptRecord, itemId: string, addMs: number): AttemptRecord {
  return { ...record, timings_ms: { ...record.timings_ms, [itemId]: (record.timings_ms[itemId] ?? 0) + Math.max(0, Math.round(addMs)) } };
}

function answerDraft(record: AttemptRecord, q: QuestionItem, response: string, isCorrect: boolean, elapsedMs: number, revealedPrior: boolean, occurredAt: string): NewEvent {
  return {
    event_type: 'answer_submitted', assessment: 'objective', attempt_id: record.attempt.attempt_id, mode: record.attempt.mode,
    submitted_response: response, is_correct: isCorrect, elapsed_ms: Math.max(0, Math.round(elapsedMs)), answer_was_revealed_prior: revealedPrior,
    exam_context_id: record.attempt.exam_context_id, pack_id: record.attempt.pack_id, pack_version: record.attempt.pack_version,
    item_id: q.id, item_revision: q.revision, paper_id: q.paper_id, objective_ids: q.objective_ids as ObjectiveId[], occurred_at: occurredAt,
  };
}

export type PracticeSubmit =
  | { ok: false; grade: Extract<GradeResult, { status: 'invalid' }> }
  | { ok: true; grade: Extract<GradeResult, { status: 'graded' }>; record: AttemptRecord; events: NewEvent[] };

/** Explicit submission of one practice answer. Invalid numeric input is returned for correction, not graded. */
export function submitPracticeAnswer(record: AttemptRecord, q: QuestionItem, response: string, revealedPrior: boolean, nowMs: number): PracticeSubmit {
  if (record.submitted_item_ids.includes(q.id)) throw new Error('This answer was already submitted.');
  const grade = gradeQuestion(q, response);
  if (grade.status === 'invalid') return { ok: false, grade };
  const next: AttemptRecord = {
    ...withResponse(record, q.id, grade.normalized_response),
    submitted_item_ids: [...record.submitted_item_ids, q.id], outcomes: { ...record.outcomes, [q.id]: grade.is_correct },
  };
  next.timings_ms = record.timings_ms;
  return { ok: true, grade, record: next, events: [answerDraft(next, q, grade.normalized_response, grade.is_correct, record.timings_ms[q.id] ?? 0, revealedPrior, new Date(nowMs).toISOString())] };
}

export function finishPractice(record: AttemptRecord, nowMs: number): AttemptRecord {
  return { ...record, attempt: { ...record.attempt, status: 'submitted', submitted_at: new Date(nowMs).toISOString() } };
}

/**
 * Grades a mock at submission or expiry. Saved responses are graded; unanswered questions score zero and
 * produce no answer event. A pass/fail summary is recorded only for a full-length mock with a verified
 * numeric pass mark.
 */
export function gradeMock(record: AttemptRecord, lookup: (id: string) => QuestionItem | undefined, context: ExamContextRecord, nowMs: number, reason: 'submitted' | 'expired'): { record: AttemptRecord; events: NewEvent[] } {
  const config = context.config;
  if (!config) throw new Error('Cannot grade a mock without its exam configuration.');
  const defaultMarks = config.total_marks / config.question_count;
  const penalty = Number(config.wrong_answer_penalty);
  const at = reason === 'expired' && record.attempt.expires_at_iso ? record.attempt.expires_at_iso : new Date(nowMs).toISOString();
  const events: NewEvent[] = [];
  let obtained = 0, total = 0, correct = 0, wrong = 0, unanswered = 0;
  const per: AttemptResult['per_question'] = record.attempt.question_order.map(ref => {
    const q = lookup(ref.item_id);
    const marks = q?.marks ?? defaultMarks;
    total += marks;
    const response = record.attempt.saved_responses[ref.item_id] ?? null;
    if (!q || response === null) { unanswered += 1; return { item_id: ref.item_id, answered: false, is_correct: false, marks: 0, response: null }; }
    const grade = gradeQuestion(q, response);
    const ok = grade.status === 'graded' && grade.is_correct;
    if (ok) { correct += 1; obtained += marks; } else { wrong += 1; obtained -= penalty * marks; }
    events.push(answerDraft(record, q, grade.status === 'graded' ? grade.normalized_response : response, ok, record.timings_ms[ref.item_id] ?? 0, false, at));
    return { item_id: ref.item_id, answered: true, is_correct: ok, marks: ok ? marks : -penalty * marks, response };
  });
  const marksObtained = Math.max(0, Math.round(obtained * 100) / 100);
  const totalMarks = Math.round(total * 100) / 100;
  const full = record.attempt.question_order.length === config.question_count;
  const result: AttemptResult = { graded_at: at, reason, per_question: per, marks_obtained: marksObtained, total_marks: totalMarks, correct, wrong, unanswered };
  const attempt: AttemptSession = {
    ...record.attempt, status: reason === 'expired' ? 'expired' : 'submitted', submitted_at: at,
    score_summary: full && context.pass_marks !== null ? { marks_obtained: marksObtained, total_marks: totalMarks, passed: marksObtained >= context.pass_marks } : null,
  };
  return { record: { ...record, attempt, result }, events };
}

// ---- study sessions ---------------------------------------------------------------------------------------
export const emptyProgress = (): StepProgress => ({ revealed: false, completed: false, answer_event_id: null, answered_correct: null, response: null, rated: false });

export interface SessionArgs {
  sessionId: string; learnerId: string; paperId: PaperId; examContextId: string; record: PackRecord;
  kind: StudySession['kind']; title: string; reason: string; steps: StudyStep[]; estimateSeconds: number; nowMs: number;
}
export function buildSession(a: SessionArgs): StudySession {
  return {
    session_id: a.sessionId, learner_id: a.learnerId, paper_id: a.paperId, exam_context_id: a.examContextId,
    pack_id: a.record.pack.pack_id, pack_version: a.record.pack.pack_version, kind: a.kind, title: a.title, reason: a.reason,
    steps: a.steps, cursor: 0, progress: {}, started_at: new Date(a.nowMs).toISOString(), completed_at: null,
    estimate_seconds: a.estimateSeconds, status: 'active',
  };
}
export const cardStep = (card: StudyCard, type: StudyStep['type'] = 'card'): StudyStep => ({ type, item_id: card.id, item_revision: card.revision, relearn: false });

const RECALL: Record<Sm2Rating, 'forgot' | 'partial' | 'recalled'> = { Again: 'forgot', Hard: 'partial', Good: 'recalled', Easy: 'recalled' };

function eventBase(session: StudySession, card: StudyCard, occurredAt: string) {
  return {
    exam_context_id: session.exam_context_id, pack_id: session.pack_id, pack_version: session.pack_version,
    item_id: card.id, item_revision: card.revision, paper_id: card.paper_id, objective_ids: card.objective_ids as ObjectiveId[], occurred_at: occurredAt,
  };
}

/** Answering a question-backed self-check inside a study step (objective evidence). */
export function answerSelfCheckQuestion(session: StudySession, stepIndex: number, q: QuestionItem, response: string, elapsedMs: number, nowMs: number):
  | { ok: false; grade: Extract<GradeResult, { status: 'invalid' }> }
  | { ok: true; grade: Extract<GradeResult, { status: 'graded' }>; session: StudySession; events: NewEvent[] } {
  const step = session.steps[stepIndex];
  const prior = session.progress[String(stepIndex)] ?? emptyProgress();
  if (!step || prior.answered_correct !== null) throw new Error('This self-check was already answered.');
  const grade = gradeQuestion(q, response);
  if (grade.status === 'invalid') return { ok: false, grade };
  const events: NewEvent[] = step.relearn ? [] : [{
    event_type: 'answer_submitted', assessment: 'objective', attempt_id: session.session_id, mode: 'practice',
    submitted_response: grade.normalized_response, is_correct: grade.is_correct, elapsed_ms: Math.max(0, Math.round(elapsedMs)),
    answer_was_revealed_prior: prior.revealed,
    exam_context_id: session.exam_context_id, pack_id: session.pack_id, pack_version: session.pack_version,
    item_id: q.id, item_revision: q.revision, paper_id: q.paper_id, objective_ids: q.objective_ids as ObjectiveId[], occurred_at: new Date(nowMs).toISOString(),
  }];
  const progress: StepProgress = { ...prior, revealed: true, answered_correct: grade.is_correct, response: grade.normalized_response };
  return { ok: true, grade, session: { ...session, progress: { ...session.progress, [String(stepIndex)]: progress } }, events };
}

/** Links the just-saved answer event to the step so the following rating can reference it. */
export function linkAnswerEvent(session: StudySession, stepIndex: number, eventId: string): StudySession {
  const prior = session.progress[String(stepIndex)] ?? emptyProgress();
  return { ...session, progress: { ...session.progress, [String(stepIndex)]: { ...prior, answer_event_id: eventId } } };
}

export function revealStep(session: StudySession, stepIndex: number): StudySession {
  const prior = session.progress[String(stepIndex)] ?? emptyProgress();
  return { ...session, progress: { ...session.progress, [String(stepIndex)]: { ...prior, revealed: true } } };
}

/**
 * Completes a step with the learner's rating. Records, exactly once per step: a self_check event (for a
 * self-assessed check), the sm2_review event and, for first study, lesson_completed. A relearning retry
 * records nothing. An Again rating (or a wrong linked answer) queues one relearning retry at the end.
 */
export function rateStep(session: StudySession, stepIndex: number, card: StudyCard, rating: Sm2Rating, nowMs: number): { session: StudySession; events: NewEvent[]; effective: Sm2Rating } {
  const step = session.steps[stepIndex];
  const prior = session.progress[String(stepIndex)] ?? emptyProgress();
  if (!step) throw new Error('Unknown step.');
  if (prior.rated) return { session, events: [], effective: rating };
  const effective = effectiveRating(rating, prior.answered_correct);
  const at = new Date(nowMs).toISOString();
  const base = eventBase(session, card, at);
  const events: NewEvent[] = [];
  if (!step.relearn) {
    if (card.self_check.mode === 'self_assessed') events.push({ ...base, event_type: 'self_check', assessment: 'self_assessed', recall: RECALL[effective] });
    events.push({ ...base, event_type: 'sm2_review', sm2_rating: effective, based_on_answer_event_id: prior.answer_event_id, algorithm_version: SM2_VERSION });
    if (step.type === 'card') events.push({ ...base, event_type: 'lesson_completed', assessment: 'ungraded' });
  }
  const steps = [...session.steps];
  if (effective === 'Again' && !step.relearn) steps.push({ ...step, relearn: true });
  const progress = { ...session.progress, [String(stepIndex)]: { ...prior, revealed: true, rated: true, completed: true } };
  const cursor = Math.min(stepIndex + 1, steps.length);
  const done = cursor >= steps.length;
  return { session: { ...session, steps, progress, cursor, status: done ? 'completed' : 'active', completed_at: done ? at : null }, events, effective };
}

// ---- selection and recommendation -------------------------------------------------------------------------
export interface PlanContext {
  index: ContentIndex; paperId: PaperId; examContextId: string; learnerId: string;
  events: readonly LearnerEvent[]; due: readonly Sm2ReviewState[]; missedObjectiveIds: readonly string[];
  entitled: boolean; orderedUnitIds: readonly string[];
}

const answeredItemIds = (ctx: PlanContext): Set<string> => new Set(ctx.events.filter(e => e.event_type === 'answer_submitted' && e.learner_id === ctx.learnerId && e.paper_id === ctx.paperId && e.exam_context_id === ctx.examContextId).map(e => e.item_id));
const completedCardIds = (ctx: PlanContext): Set<string> => new Set(ctx.events.filter(e => e.event_type === 'lesson_completed' && e.learner_id === ctx.learnerId && e.paper_id === ctx.paperId && e.exam_context_id === ctx.examContextId).map(e => e.item_id));

export function accessibleCards(ctx: PlanContext): StudyCard[] {
  const record = ctx.index.packFor(ctx.paperId);
  if (!record) return [];
  const order = new Map(ctx.orderedUnitIds.map((id, i) => [id, i]));
  return ctx.index.cards(ctx.paperId).filter(c => unitAccessible(record, c.unit_id, ctx.entitled))
    .sort((a, b) => (order.get(a.unit_id) ?? 1e6) - (order.get(b.unit_id) ?? 1e6));
}
export function accessibleQuestions(ctx: PlanContext, unitId?: string): QuestionItem[] {
  const record = ctx.index.packFor(ctx.paperId);
  if (!record) return [];
  return ctx.index.questions(ctx.paperId, unitId).filter(q => unitAccessible(record, q.unit_id, ctx.entitled));
}
/** Unseen questions first, so practice measures unseen performance before repeats. */
export function unseenFirst(ctx: PlanContext, questions: readonly QuestionItem[]): QuestionItem[] {
  const seen = answeredItemIds(ctx);
  return [...questions.filter(q => !seen.has(q.id)), ...questions.filter(q => seen.has(q.id))];
}
export function nextUnstudiedCards(ctx: PlanContext): StudyCard[] {
  const done = completedCardIds(ctx);
  return accessibleCards(ctx).filter(c => !done.has(c.id));
}
export function remediationCards(ctx: PlanContext): StudyCard[] {
  const missed = new Set(ctx.missedObjectiveIds);
  return accessibleCards(ctx).filter(c => c.objective_ids.some(o => missed.has(o)));
}
export function remediationQuestions(ctx: PlanContext): QuestionItem[] {
  const missed = new Set(ctx.missedObjectiveIds);
  return unseenFirst(ctx, accessibleQuestions(ctx).filter(q => q.objective_ids.some(o => missed.has(o))));
}

/** Steps for a 5/10-minute preset: due reviews, then missed objectives, then new material, within the budget. */
export function presetSteps(ctx: PlanContext, minutes: number): { steps: StudyStep[]; estimateSeconds: number; reason: string } {
  const budget = minutes * 60;
  const steps: StudyStep[] = []; const used = new Set<string>(); let total = 0; const parts: string[] = [];
  const tryAdd = (card: StudyCard, type: StudyStep['type']): boolean => {
    const cost = type === 'review' ? SELF_CHECK_SECONDS + 20 : cardSeconds(card);
    if (used.has(card.id) || (steps.length > 0 && total + cost > budget)) return false;
    steps.push(cardStep(card, type)); used.add(card.id); total += cost; return true;
  };
  let n = 0;
  for (const s of ctx.due) { const c = ctx.index.card(s.item_id); if (c && tryAdd(c, 'review')) n += 1; }
  if (n) parts.push(`${n} due review${n === 1 ? '' : 's'}`);
  n = 0;
  for (const c of remediationCards(ctx)) if (total < budget && tryAdd(c, completedCardIds(ctx).has(c.id) ? 'review' : 'card')) n += 1;
  if (n) parts.push(`${n} card${n === 1 ? '' : 's'} on missed objectives`);
  n = 0;
  for (const c of nextUnstudiedCards(ctx)) if (total < budget && tryAdd(c, 'card')) n += 1;
  if (n) parts.push(`${n} new card${n === 1 ? '' : 's'}`);
  return { steps, estimateSeconds: total, reason: parts.join(', ') };
}

export interface Recommendation {
  kind: 'resume_attempt' | 'resume_session' | 'reviews' | 'remediation' | 'learn' | 'practice' | 'none';
  title: string; reason: string; minutes: number | null; ref: string | null;
}

export function recommend(ctx: PlanContext, active: { attempt: AttemptRecord | null; session: StudySession | null }, unitTitle: (id: string) => string): Recommendation {
  if (active.attempt) {
    const a = active.attempt;
    const left = a.attempt.question_order.length - (a.attempt.mode === 'mock' ? Object.keys(a.attempt.saved_responses).length : a.submitted_item_ids.length);
    return { kind: 'resume_attempt', title: `Resume ${a.attempt.mode === 'mock' ? 'mock' : 'practice'}: ${a.title}`, reason: a.attempt.mode === 'mock' ? 'Your timed mock is still running. The clock did not pause.' : `You have ${left} question${left === 1 ? '' : 's'} left in this set.`, minutes: null, ref: a.attempt.attempt_id };
  }
  if (active.session) {
    const s = active.session; const left = s.steps.length - s.cursor;
    return { kind: 'resume_session', title: `Resume: ${s.title}`, reason: `You stopped with ${left} step${left === 1 ? '' : 's'} left.`, minutes: Math.max(1, Math.round((s.estimate_seconds * left) / Math.max(1, s.steps.length) / 60)), ref: s.session_id };
  }
  const dueCards = ctx.due.filter(s => ctx.index.card(s.item_id));
  if (dueCards.length) return { kind: 'reviews', title: `Review ${dueCards.length} due card${dueCards.length === 1 ? '' : 's'}`, reason: 'These are scheduled for today or earlier. Reviewing on time keeps them in memory.', minutes: Math.max(1, Math.round((dueCards.length * (SELF_CHECK_SECONDS + 20)) / 60)), ref: null };
  const rem = remediationCards(ctx);
  if (rem.length) return { kind: 'remediation', title: 'Revisit objectives you missed', reason: `Recent first-attempt answers were wrong on ${ctx.missedObjectiveIds.length} objective${ctx.missedObjectiveIds.length === 1 ? '' : 's'}.`, minutes: Math.max(1, Math.round(rem.slice(0, 4).reduce((n, c) => n + cardSeconds(c), 0) / 60)), ref: null };
  const next = nextUnstudiedCards(ctx);
  if (next.length) {
    const unitId = next[0]!.unit_id; const inUnit = next.filter(c => c.unit_id === unitId);
    return { kind: 'learn', title: `Study: ${unitTitle(unitId)}`, reason: `${inUnit.length} card${inUnit.length === 1 ? '' : 's'} you have not studied yet in this unit.`, minutes: Math.max(1, Math.round(inUnit.reduce((n, c) => n + cardSeconds(c), 0) / 60)), ref: unitId };
  }
  const qs = accessibleQuestions(ctx);
  if (qs.length) return { kind: 'practice', title: 'Practise questions', reason: 'You have studied every available card. Practice shows whether you can apply them.', minutes: Math.max(1, Math.round((Math.min(10, qs.length) * PLANNING_PACE_SECONDS) / 60)), ref: null };
  return { kind: 'none', title: 'No study content is available for this paper yet', reason: 'Content for this paper has not been published. Choose another paper or check the coverage map.', minutes: null, ref: null };
}
