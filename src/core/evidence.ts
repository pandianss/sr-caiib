/**
 * Evidence semantics for accuracy, timing, study coverage, weakness and the experimental readiness index.
 *
 * EVIDENCE_POLICY_V1:
 * - Events are de-duplicated by event_id and ordered by (occurred_at, device_id, device_sequence).
 * - First exposure is DERIVED: the earliest answer_submitted event for an item within a learner + exam
 *   context. Later answers to the same item are repeats and never enter the accuracy sample.
 * - A first exposure is ineligible when the answer was revealed beforehand, or when its item revision is
 *   not the revision in the currently active pack (version-compatibility rule: evidence recorded against a
 *   superseded or removed revision is kept for audit but excluded from scored samples).
 * - Timed evidence is the subset of eligible first exposures with elapsed time between MIN_VALID_MS and
 *   IDLE_CUTOFF_MS; anything outside is treated as invalid or idle-contaminated and excluded from speed only.
 * - Self-assessed recall and lesson completion never count as correct answers.
 */
import type { LearnerEvent, ObjectiveId, PaperId, ReadinessIndexSnapshot } from '../types/contracts.ts';
import type { CatalogueIndex } from './catalogue.ts';
import { orderEvents } from './sm2.ts';

export const EVIDENCE_POLICY_VERSION = 'EVIDENCE_POLICY_V1';
export const MIN_VALID_MS = 1_000;
export const IDLE_CUTOFF_MS = 10 * 60_000;
export const DAY_MS = 86_400_000;

export interface EvidenceConfig {
  windowDays: number;            // product choice: 30
  weakAccuracyPct: number;       // product choice: flag below 60%
  weakMinSample: number;         // product choice: at least 10 distinct first-response questions
  criMinSample: number;          // 20 eligible questions for both accuracy and timing
}
export const DEFAULT_EVIDENCE_CONFIG: EvidenceConfig = { windowDays: 30, weakAccuracyPct: 60, weakMinSample: 10, criMinSample: 20 };

export type AnswerEvent = Extract<LearnerEvent, { event_type: 'answer_submitted' }>;
/** Current revision of each item in the active packs; items absent from this map are ineligible. */
export type ActiveRevisions = ReadonlyMap<string, number>;

export interface Scope { learnerId: string; paperId: PaperId; examContextId: string }

const inScope = (e: LearnerEvent, s: Scope) => e.learner_id === s.learnerId && e.paper_id === s.paperId && e.exam_context_id === s.examContextId;

export interface Exposure { event: AnswerEvent; eligible: boolean; reason: 'ok' | 'answer_revealed' | 'incompatible_revision' }

/** One record per item: its first answer event and whether that exposure is eligible scored evidence. */
export function firstExposures(events: readonly LearnerEvent[], scope: Scope, active: ActiveRevisions): Exposure[] {
  const firsts = new Map<string, AnswerEvent>();
  for (const e of orderEvents(events)) {
    if (e.event_type !== 'answer_submitted' || !inScope(e, scope)) continue;
    if (!firsts.has(e.item_id)) firsts.set(e.item_id, e);
  }
  return [...firsts.values()].map(event => {
    if (event.answer_was_revealed_prior) return { event, eligible: false, reason: 'answer_revealed' as const };
    if (active.get(event.item_id) !== event.item_revision) return { event, eligible: false, reason: 'incompatible_revision' as const };
    return { event, eligible: true, reason: 'ok' as const };
  });
}

export function repeatAnswerCount(events: readonly LearnerEvent[], scope: Scope): number {
  const seen = new Set<string>(); let repeats = 0;
  for (const e of orderEvents(events)) {
    if (e.event_type !== 'answer_submitted' || !inScope(e, scope)) continue;
    if (seen.has(e.item_id)) repeats += 1; else seen.add(e.item_id);
  }
  return repeats;
}

export interface AccuracySample { total: number; correct: number; pct: number | null; windowStart: string; windowEnd: string; exposures: Exposure[] }

export function accuracySample(events: readonly LearnerEvent[], scope: Scope, active: ActiveRevisions, nowMs: number, windowDays: number): AccuracySample {
  const start = nowMs - windowDays * DAY_MS;
  const exposures = firstExposures(events, scope, active).filter(x => x.eligible && Date.parse(x.event.occurred_at) >= start && Date.parse(x.event.occurred_at) <= nowMs);
  const correct = exposures.filter(x => x.event.is_correct).length;
  return {
    total: exposures.length, correct, pct: exposures.length ? (100 * correct) / exposures.length : null,
    windowStart: new Date(start).toISOString(), windowEnd: new Date(nowMs).toISOString(), exposures,
  };
}

export const timingValid = (elapsedMs: number): boolean => elapsedMs >= MIN_VALID_MS && elapsedMs <= IDLE_CUTOFF_MS;

/** Mean of correct x min(1, target/elapsed) over eligible timed first exposures, as a percentage. */
export function speedScore(sample: AccuracySample, targetSeconds: number): { total: number; pct: number | null } {
  const timed = sample.exposures.filter(x => timingValid(x.event.elapsed_ms));
  if (!timed.length || !(targetSeconds > 0)) return { total: timed.length, pct: null };
  const sum = timed.reduce((acc, x) => acc + (x.event.is_correct ? Math.min(1, targetSeconds / (x.event.elapsed_ms / 1000)) : 0), 0);
  return { total: timed.length, pct: (100 * sum) / timed.length };
}

/** Objectives with a completed lesson AND a submitted self-check (self-assessed or question-backed). */
export function studiedObjectives(events: readonly LearnerEvent[], scope: Scope): Set<ObjectiveId> {
  const completed = new Set<ObjectiveId>(), checked = new Set<ObjectiveId>();
  for (const e of orderEvents(events)) {
    if (!inScope(e, scope)) continue;
    if (e.event_type === 'lesson_completed') e.objective_ids.forEach(o => completed.add(o));
    if (e.event_type === 'self_check' || e.event_type === 'answer_submitted') e.objective_ids.forEach(o => checked.add(o));
  }
  return new Set([...completed].filter(o => checked.has(o)));
}

export interface ReadinessInput {
  events: readonly LearnerEvent[]; scope: Scope; active: ActiveRevisions; nowMs: number;
  /** Verified objective denominator for the paper, or null when the baseline is incomplete. */
  mappedObjectives: readonly ObjectiveId[] | null;
  /** Mock pace baseline (duration / question count) from the verified exam configuration, or null. */
  targetSeconds: number | null;
  config?: EvidenceConfig;
}

export function computeReadiness(input: ReadinessInput): ReadinessIndexSnapshot {
  const cfg = input.config ?? DEFAULT_EVIDENCE_CONFIG;
  const sample = accuracySample(input.events, input.scope, input.active, input.nowMs, cfg.windowDays);
  const speed = input.targetSeconds ? speedScore(sample, input.targetSeconds) : { total: sample.exposures.filter(x => timingValid(x.event.elapsed_ms)).length, pct: null };
  const studied = studiedObjectives(input.events, input.scope);
  const denominator = input.mappedObjectives && input.mappedObjectives.length > 0 ? input.mappedObjectives.length : null;
  const completed = input.mappedObjectives ? input.mappedObjectives.filter(o => studied.has(o)).length : studied.size;
  const coverage = denominator ? (100 * completed) / denominator : null;
  const eligible = denominator !== null && sample.total >= cfg.criMinSample && speed.total >= cfg.criMinSample
    && coverage !== null && sample.pct !== null && speed.pct !== null;
  return {
    paper_id: input.scope.paperId, exam_context_id: input.scope.examContextId,
    calculated_at: new Date(input.nowMs).toISOString(), window_start: sample.windowStart, window_end: sample.windowEnd,
    formula_version: 'CRI_V1', evidence_status: eligible ? 'sufficient_evidence' : 'insufficient_evidence',
    study_coverage_pct: coverage, assessed_accuracy_pct: sample.pct, speed_score_pct: speed.pct,
    cri_score: eligible ? 0.4 * coverage! + 0.4 * sample.pct! + 0.2 * speed.pct! : null,
    mapped_objectives_total: denominator, completed_objectives: completed,
    eligible_accuracy_questions: sample.total, eligible_timed_questions: speed.total,
  };
}

export interface ModuleEvidence {
  moduleId: string; title: string; sample: number; correct: number; accuracyPct: number | null;
  status: 'weak' | 'ok' | 'not_enough_practice'; missedObjectiveIds: ObjectiveId[];
}

/** Module-level weakness from distinct first-response questions in the window (product-rule thresholds). */
export function moduleEvidence(events: readonly LearnerEvent[], scope: Scope, active: ActiveRevisions, catalogue: CatalogueIndex, nowMs: number, cfg: EvidenceConfig = DEFAULT_EVIDENCE_CONFIG): ModuleEvidence[] {
  const sample = accuracySample(events, scope, active, nowMs, cfg.windowDays);
  return catalogue.modulesOf(scope.paperId).map(m => {
    const mine = sample.exposures.filter(x => x.event.objective_ids.some(o => catalogue.moduleOfObjective(o)?.id === m.id));
    const correct = mine.filter(x => x.event.is_correct).length;
    const pct = mine.length ? (100 * correct) / mine.length : null;
    const missed = new Set<ObjectiveId>();
    mine.filter(x => !x.event.is_correct).forEach(x => x.event.objective_ids.forEach(o => { if (catalogue.moduleOfObjective(o)?.id === m.id) missed.add(o); }));
    const status = mine.length < cfg.weakMinSample ? 'not_enough_practice' : pct !== null && pct < cfg.weakAccuracyPct ? 'weak' : 'ok';
    return { moduleId: m.id, title: m.title ?? m.id, sample: mine.length, correct, accuracyPct: pct, status, missedObjectiveIds: [...missed] };
  });
}

/** Objectives whose most recent eligible first exposure was wrong: remediation targets regardless of module sample. */
export function missedObjectives(events: readonly LearnerEvent[], scope: Scope, active: ActiveRevisions, nowMs: number, windowDays: number): ObjectiveId[] {
  const sample = accuracySample(events, scope, active, nowMs, windowDays);
  const wrong = new Map<ObjectiveId, number>(), right = new Map<ObjectiveId, number>();
  for (const x of sample.exposures) for (const o of x.event.objective_ids) (x.event.is_correct ? right : wrong).set(o, ((x.event.is_correct ? right : wrong).get(o) ?? 0) + 1);
  return [...wrong.keys()].filter(o => (wrong.get(o) ?? 0) > (right.get(o) ?? 0)).sort();
}

/**
 * High-confidence errors: an incorrect objective answer whose linked self-rating was Good or Easy.
 * These item IDs need a later transfer question or unseen variant; repeating the same item is not proof.
 */
export function highConfidenceErrors(events: readonly LearnerEvent[], scope: Scope): { itemId: string; objectiveIds: ObjectiveId[]; occurredAt: string }[] {
  const ordered = orderEvents(events).filter(e => inScope(e, scope));
  const answers = new Map(ordered.filter((e): e is AnswerEvent => e.event_type === 'answer_submitted').map(e => [e.event_id, e]));
  const out: { itemId: string; objectiveIds: ObjectiveId[]; occurredAt: string }[] = [];
  for (const e of ordered) {
    if (e.event_type !== 'sm2_review' || !e.based_on_answer_event_id) continue;
    const a = answers.get(e.based_on_answer_event_id);
    if (a && !a.is_correct && (e.sm2_rating === 'Good' || e.sm2_rating === 'Easy')) out.push({ itemId: a.item_id, objectiveIds: a.objective_ids, occurredAt: a.occurred_at });
  }
  return out;
}
