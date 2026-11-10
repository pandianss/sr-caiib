/**
 * Deterministic SM-2 scheduler (algorithm version SM2_V1).
 *
 * Rules:
 * - Ratings map to quality grades Again=1, Hard=3, Good=4, Easy=5. Ease starts at 2.5 with floor 1.3.
 * - Success (q >= 3): the next interval is chosen from the PREVIOUS repetition count and ease factor
 *   (1 day, 6 days, then round(previous interval x previous ease)); then the ease is updated and the
 *   repetition count incremented.
 * - Again: repetitions reset to 0, next interval is 1 day, ease is updated with q=1. The in-session
 *   relearning retry is not a review event and never counts as independent mastery evidence.
 * - A review linked to an incorrect objective answer is always treated as Again, whatever the learner rated.
 * - Only a scheduled review advances the schedule: a non-Again rating given before the due date leaves the
 *   schedule unchanged (extra early practice is not a spaced repetition).
 * - Day boundary: a review belongs to the calendar day of its timestamp in the learner's configured time
 *   zone; an item is due when that local date is on or after its due date.
 * - Reconciliation: state is a fold over de-duplicated sm2_review events ordered by
 *   (occurred_at, device_id, device_sequence), so replays and multi-device merges are idempotent.
 */
import type { LearnerEvent, PaperId, Sm2Rating, Sm2ReviewState } from '../types/contracts.ts';
import { addDays, localDate } from './time.ts';

export const SM2_VERSION = 'SM2_V1';
export const SM2_INITIAL_EASE = 2.5;
export const SM2_MIN_EASE = 1.3;

const QUALITY: Record<Sm2Rating, number> = { Again: 1, Hard: 3, Good: 4, Easy: 5 };

export interface Sm2Core { repetition_count: number; ease_factor: number; interval_days: number }

export const sm2Initial = (): Sm2Core => ({ repetition_count: 0, ease_factor: SM2_INITIAL_EASE, interval_days: 0 });

export function sm2UpdateEase(ease: number, rating: Sm2Rating): number {
  const q = QUALITY[rating];
  const next = ease + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  return Math.max(SM2_MIN_EASE, Math.round(next * 10_000) / 10_000);
}

export function sm2Next(prev: Sm2Core, rating: Sm2Rating): Sm2Core {
  const ease = sm2UpdateEase(prev.ease_factor, rating);
  if (rating === 'Again') return { repetition_count: 0, ease_factor: ease, interval_days: 1 };
  const interval = prev.repetition_count === 0 ? 1
    : prev.repetition_count === 1 ? 6
    : Math.max(1, Math.round(prev.interval_days * prev.ease_factor));
  return { repetition_count: prev.repetition_count + 1, ease_factor: ease, interval_days: interval };
}

/** A wrong objective answer cannot be converted into success by a confident self-rating. */
export function effectiveRating(rating: Sm2Rating, linkedAnswerCorrect: boolean | null): Sm2Rating {
  return linkedAnswerCorrect === false ? 'Again' : rating;
}

export type Sm2ReviewEvent = Extract<LearnerEvent, { event_type: 'sm2_review' }>;
type AnswerEvent = Extract<LearnerEvent, { event_type: 'answer_submitted' }>;

export function orderEvents<T extends LearnerEvent>(events: readonly T[]): T[] {
  const seen = new Set<string>();
  const unique = events.filter(e => (seen.has(e.event_id) ? false : (seen.add(e.event_id), true)));
  return unique.sort((a, b) =>
    a.occurred_at < b.occurred_at ? -1 : a.occurred_at > b.occurred_at ? 1
    : a.device_id < b.device_id ? -1 : a.device_id > b.device_id ? 1
    : a.device_sequence - b.device_sequence);
}

export function applyReview(prev: Sm2ReviewState | null, event: Sm2ReviewEvent, linkedAnswerCorrect: boolean | null, timeZone: string): Sm2ReviewState {
  const day = localDate(event.occurred_at, timeZone);
  const rating = effectiveRating(event.sm2_rating, linkedAnswerCorrect);
  if (prev && rating !== 'Again' && day < prev.due_date_iso) return prev; // early, unscheduled practice
  const core = sm2Next(prev ?? sm2Initial(), rating);
  return {
    learner_id: event.learner_id, item_id: event.item_id, item_revision: event.item_revision,
    paper_id: event.paper_id, exam_context_id: event.exam_context_id, algorithm_version: SM2_VERSION,
    repetition_count: core.repetition_count, ease_factor: core.ease_factor, interval_days: core.interval_days,
    due_date_iso: addDays(day, core.interval_days), learner_time_zone: timeZone, last_reviewed_at: event.occurred_at,
  };
}

/** Folds all review events into per-item state. Keyed by `${exam_context_id}|${item_id}`. */
export function deriveReviewStates(events: readonly LearnerEvent[], timeZone: string): Map<string, Sm2ReviewState> {
  const ordered = orderEvents(events);
  const answers = new Map<string, AnswerEvent>();
  for (const e of ordered) if (e.event_type === 'answer_submitted') answers.set(e.event_id, e);
  const states = new Map<string, Sm2ReviewState>();
  for (const e of ordered) {
    if (e.event_type !== 'sm2_review') continue;
    const key = reviewKey(e.exam_context_id, e.item_id);
    const linked = e.based_on_answer_event_id ? answers.get(e.based_on_answer_event_id) : undefined;
    states.set(key, applyReview(states.get(key) ?? null, e, linked ? linked.is_correct : null, timeZone));
  }
  return states;
}

export const reviewKey = (examContextId: string, itemId: string): string => `${examContextId}|${itemId}`;

export function dueReviews(states: Iterable<Sm2ReviewState>, paperId: PaperId, examContextId: string, nowMs: number, timeZone: string): Sm2ReviewState[] {
  const today = localDate(nowMs, timeZone);
  return [...states]
    .filter(s => s.paper_id === paperId && s.exam_context_id === examContextId && s.due_date_iso <= today)
    .sort((a, b) => (a.due_date_iso < b.due_date_iso ? -1 : a.due_date_iso > b.due_date_iso ? 1 : a.item_id < b.item_id ? -1 : 1));
}
