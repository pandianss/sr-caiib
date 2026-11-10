import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveReviewStates, dueReviews, reviewKey, sm2Initial, sm2Next, sm2UpdateEase } from '../../src/core/sm2.ts';
import { accuracySample, computeReadiness, firstExposures, highConfidenceErrors, missedObjectives, moduleEvidence, repeatAnswerCount, studiedObjectives } from '../../src/core/evidence.ts';
import { indexCatalogue } from '../../src/core/catalogue.ts';
import { validateReadiness, validateReviewState } from '../../src/validation/contracts.ts';
import { addCalendarMonths, addDays, localDate } from '../../src/core/time.ts';
import type { LearnerEvent, ObjectiveId } from '../../src/types/contracts.ts';
import { CTX, DAY, T0, answerEvent, fixtureCatalogue, reviewEvent } from '../helpers.ts';

const TZ = 'Asia/Kolkata';
const scope = { learnerId: 'L1', paperId: 'BFM' as const, examContextId: CTX };

test('SM-2: ease update formula and floor', () => {
  assert.equal(sm2UpdateEase(2.5, 'Easy'), 2.6); assert.equal(sm2UpdateEase(2.5, 'Good'), 2.5);
  assert.equal(sm2UpdateEase(2.5, 'Hard'), 2.36); assert.equal(sm2UpdateEase(2.5, 'Again'), 1.96);
  assert.equal(sm2UpdateEase(1.4, 'Again'), 1.3); assert.equal(sm2UpdateEase(1.3, 'Hard'), 1.3);
});

test('SM-2: intervals 1, 6, then previous interval x previous ease (rounded)', () => {
  let s = sm2Initial();
  s = sm2Next(s, 'Good'); assert.deepEqual([s.repetition_count, s.interval_days, s.ease_factor], [1, 1, 2.5]);
  s = sm2Next(s, 'Good'); assert.deepEqual([s.repetition_count, s.interval_days], [2, 6]);
  s = sm2Next(s, 'Easy'); assert.deepEqual([s.repetition_count, s.interval_days, s.ease_factor], [3, 15, 2.6]); // 6 x 2.5 before the ease update
  s = sm2Next(s, 'Hard'); assert.deepEqual([s.repetition_count, s.interval_days, s.ease_factor], [4, 39, 2.46]); // 15 x 2.6
  s = sm2Next(s, 'Again'); assert.deepEqual([s.repetition_count, s.interval_days, s.ease_factor], [0, 1, 1.92]);
  s = sm2Next(s, 'Good'); assert.deepEqual([s.repetition_count, s.interval_days], [1, 1]);
});

test('SM-2: replaying the same review event does not create a second review', () => {
  const e = reviewEvent({ item: 'c1', rating: 'Good', atMs: T0, id: 'same' });
  const once = deriveReviewStates([e], TZ).get(reviewKey(CTX, 'c1'));
  const twice = deriveReviewStates([e, { ...e }, { ...e }], TZ).get(reviewKey(CTX, 'c1'));
  assert.deepEqual(twice, once); assert.equal(once?.repetition_count, 1);
  assert.equal(validateReviewState(once).ok, true);
});

test('SM-2: a wrong linked answer forces Again whatever the learner rated', () => {
  const a = answerEvent({ item: 'q1', correct: false, atMs: T0, id: 'ans1' });
  const rv = reviewEvent({ item: 'c1', rating: 'Easy', atMs: T0 + 1000, basedOn: 'ans1' });
  const s = deriveReviewStates([a, rv], TZ).get(reviewKey(CTX, 'c1'));
  assert.equal(s?.repetition_count, 0); assert.equal(s?.interval_days, 1); assert.equal(s?.due_date_iso, addDays(localDate(T0, TZ), 1));
  assert.deepEqual(highConfidenceErrors([a, rv], scope).map(x => x.itemId), ['q1']);
});

test('SM-2: early non-scheduled practice does not advance the schedule; Again always resets', () => {
  const first = reviewEvent({ item: 'c1', rating: 'Good', atMs: T0 });
  const sameDay = reviewEvent({ item: 'c1', rating: 'Easy', atMs: T0 + 3600_000 });
  const s1 = deriveReviewStates([first, sameDay], TZ).get(reviewKey(CTX, 'c1'));
  assert.equal(s1?.repetition_count, 1, 'early Easy ignored');
  const onDue = reviewEvent({ item: 'c1', rating: 'Good', atMs: T0 + DAY });
  const s2 = deriveReviewStates([first, sameDay, onDue], TZ).get(reviewKey(CTX, 'c1'));
  assert.deepEqual([s2?.repetition_count, s2?.interval_days], [2, 6]);
  const earlyAgain = reviewEvent({ item: 'c1', rating: 'Again', atMs: T0 + DAY + 1000 });
  const s3 = deriveReviewStates([first, sameDay, onDue, earlyAgain], TZ).get(reviewKey(CTX, 'c1'));
  assert.deepEqual([s3?.repetition_count, s3?.interval_days], [0, 1]);
});

test('SM-2: day boundary follows the learner time zone', () => {
  // 2026-11-10T19:00Z is already 11 Nov 00:30 in Asia/Kolkata but still 10 Nov in UTC.
  const at = Date.parse('2026-11-10T19:00:00.000Z');
  const e = reviewEvent({ item: 'c9', rating: 'Good', atMs: at });
  assert.equal(deriveReviewStates([e], TZ).get(reviewKey(CTX, 'c9'))?.due_date_iso, '2026-11-12');
  assert.equal(deriveReviewStates([e], 'UTC').get(reviewKey(CTX, 'c9'))?.due_date_iso, '2026-11-11');
  const states = [...deriveReviewStates([e], TZ).values()];
  assert.equal(dueReviews(states, 'BFM', CTX, Date.parse('2026-11-11T18:00:00Z'), TZ).length, 0); // 11 Nov 23:30 IST
  assert.equal(dueReviews(states, 'BFM', CTX, Date.parse('2026-11-11T18:31:00Z'), TZ).length, 1); // 12 Nov 00:01 IST
  assert.equal(dueReviews(states, 'ABFM', CTX, Date.parse('2026-11-20T00:00:00Z'), TZ).length, 0, 'other paper never sees it');
});

test('calendar months: six-month term clamps to the last valid day in the business time zone', () => {
  assert.equal(addCalendarMonths('2026-08-31T06:30:00.000Z', 6, TZ), '2027-02-28T06:30:00.000Z');
  assert.equal(addCalendarMonths('2027-08-31T06:30:00.000Z', 6, TZ), '2028-02-29T06:30:00.000Z');
  assert.equal(addCalendarMonths('2026-11-10T04:30:00.000Z', 6, TZ), '2027-05-10T04:30:00.000Z');
  // 30 Nov 20:00Z is 1 Dec 01:30 IST, so six months later is 1 Jun IST, i.e. 31 May 20:00Z.
  assert.equal(addCalendarMonths('2026-11-30T20:00:00.000Z', 6, TZ), '2027-05-31T20:00:00.000Z');
});

test('first exposure is derived; repeats, revealed answers and old revisions are excluded', () => {
  const active = new Map([['q1', 1], ['q2', 1], ['q3', 2], ['q4', 1]]);
  const events: LearnerEvent[] = [
    answerEvent({ item: 'q1', correct: false, atMs: T0 }),
    answerEvent({ item: 'q1', correct: true, atMs: T0 + 1000 }),       // repeat: ignored
    answerEvent({ item: 'q2', correct: true, atMs: T0 + 2000, revealed: true }),
    answerEvent({ item: 'q3', correct: true, atMs: T0 + 3000, revision: 1 }), // superseded revision
    answerEvent({ item: 'q4', correct: true, atMs: T0 + 4000 }),
    answerEvent({ item: 'q5', correct: true, atMs: T0 + 5000, paper: 'ABFM' }), // other paper
  ];
  const fx = firstExposures(events, scope, active);
  assert.deepEqual(fx.map(x => [x.event.item_id, x.reason]), [['q1', 'ok'], ['q2', 'answer_revealed'], ['q3', 'incompatible_revision'], ['q4', 'ok']]);
  const sample = accuracySample(events, scope, active, T0 + DAY, 30);
  assert.deepEqual([sample.total, sample.correct, sample.pct], [2, 1, 50]);
  assert.equal(repeatAnswerCount(events, scope), 1);
  // Order of arrival does not matter, and duplicate uploads do not double count.
  const shuffled = [...events].reverse().concat(events.map(e => ({ ...e })));
  assert.deepEqual(accuracySample(shuffled, scope, active, T0 + DAY, 30).pct, 50);
});

test('self-rated recall and lesson completion never count as correct answers', () => {
  const base = { learner_id: 'L1', device_id: 'D1', exam_context_id: CTX, pack_id: 'FIXTURE-BFM', pack_version: '1', item_id: 'c1', item_revision: 1, paper_id: 'BFM' as const, objective_ids: ['BFM::MOD_FIX::U01::LO_01' as ObjectiveId], occurred_at: new Date(T0).toISOString() };
  const events: LearnerEvent[] = [
    { ...base, event_id: 's1', device_sequence: 1, event_type: 'self_check', assessment: 'self_assessed', recall: 'recalled' },
    { ...base, event_id: 'l1', device_sequence: 2, event_type: 'lesson_completed', assessment: 'ungraded' },
  ];
  const sample = accuracySample(events, scope, new Map([['c1', 1]]), T0 + 1000, 30);
  assert.equal(sample.total, 0); assert.equal(sample.pct, null);
  assert.deepEqual([...studiedObjectives(events, scope)], ['BFM::MOD_FIX::U01::LO_01']);
  assert.equal(studiedObjectives([events[1]!], scope).size, 0, 'a completed lesson without a self-check is not studied coverage');
});

function manyAnswers(n: number, correctEvery: number, elapsedMs: number): { events: LearnerEvent[]; active: Map<string, number> } {
  const events: LearnerEvent[] = []; const active = new Map<string, number>();
  for (let i = 0; i < n; i++) { active.set(`q${i}`, 1); events.push(answerEvent({ item: `q${i}`, correct: i % correctEvery !== 0, atMs: T0 + i * 1000, elapsedMs })); }
  return { events, active };
}

test('CRI: insufficient evidence below 20 questions or without an objective denominator', () => {
  const { events, active } = manyAnswers(19, 4, 30_000);
  const objectives = fixtureCatalogue().objectives.filter(o => o.id.startsWith('BFM::')).map(o => o.id);
  const low = computeReadiness({ events, scope, active, nowMs: T0 + DAY, mappedObjectives: objectives, targetSeconds: 60 });
  assert.equal(low.evidence_status, 'insufficient_evidence'); assert.equal(low.cri_score, null); assert.equal(low.eligible_accuracy_questions, 19);
  assert.equal(validateReadiness(low).ok, true);
  const more = manyAnswers(25, 5, 30_000);
  const noDenominator = computeReadiness({ events: more.events, scope, active: more.active, nowMs: T0 + DAY, mappedObjectives: null, targetSeconds: 60 });
  assert.equal(noDenominator.evidence_status, 'insufficient_evidence'); assert.equal(noDenominator.cri_score, null);
  assert.equal(noDenominator.study_coverage_pct, null); assert.equal(noDenominator.mapped_objectives_total, null);
  assert.equal(noDenominator.assessed_accuracy_pct, 80, 'components are still shown');
  assert.equal(validateReadiness(noDenominator).ok, true);
});

test('CRI: formula 0.4C + 0.4A + 0.2S with speed capped at target pace and wrong answers scoring zero', () => {
  const { events, active } = manyAnswers(20, 5, 120_000); // 16 of 20 correct, each twice the 60 s target
  const objectives = fixtureCatalogue().objectives.filter(o => o.id.startsWith('BFM::')).map(o => o.id) as ObjectiveId[];
  const base = { learner_id: 'L1', device_id: 'D1', exam_context_id: CTX, pack_id: 'FIXTURE-BFM', pack_version: '1', item_revision: 1, paper_id: 'BFM' as const, occurred_at: new Date(T0).toISOString() };
  const study: LearnerEvent[] = [
    { ...base, item_id: 'c1', objective_ids: [objectives[0]!], event_id: 'l1', device_sequence: 900, event_type: 'lesson_completed', assessment: 'ungraded' },
    { ...base, item_id: 'c1', objective_ids: [objectives[0]!], event_id: 's1', device_sequence: 901, event_type: 'self_check', assessment: 'self_assessed', recall: 'partial' },
  ];
  const snap = computeReadiness({ events: [...events, ...study], scope, active, nowMs: T0 + DAY, mappedObjectives: objectives, targetSeconds: 60 });
  assert.equal(snap.evidence_status, 'sufficient_evidence');
  assert.equal(snap.assessed_accuracy_pct, 80); assert.equal(snap.speed_score_pct, 40); // 16 x 0.5 / 20
  assert.equal(snap.study_coverage_pct, 25); // 1 of 4 objectives (the answers map to the same objective, which is already counted)
  assert.ok(Math.abs((snap.cri_score ?? 0) - (0.4 * 25 + 0.4 * 80 + 0.2 * 40)) < 1e-9);
  assert.equal(validateReadiness(snap).ok, true);
  const fast = computeReadiness({ events: manyAnswers(20, 5, 10_000).events, scope, active, nowMs: T0 + DAY, mappedObjectives: objectives, targetSeconds: 60 });
  assert.equal(fast.speed_score_pct, 80, 'faster than target is capped at 1, so speed equals accuracy');
});

test('timing: idle-contaminated and invalid durations are excluded from speed only', () => {
  const active = new Map<string, number>(); const events: LearnerEvent[] = [];
  for (let i = 0; i < 22; i++) { active.set(`q${i}`, 1); events.push(answerEvent({ item: `q${i}`, correct: true, atMs: T0 + i, elapsedMs: i === 0 ? 0 : i === 1 ? 900_000 : i === 2 ? 500 : 60_000 })); }
  const snap = computeReadiness({ events, scope, active, nowMs: T0 + DAY, mappedObjectives: ['BFM::MOD_FIX::U01::LO_01' as ObjectiveId], targetSeconds: 60 });
  assert.equal(snap.eligible_accuracy_questions, 22); assert.equal(snap.eligible_timed_questions, 19);
  assert.equal(snap.evidence_status, 'insufficient_evidence', '19 timed questions is below the threshold of 20');
});

test('evidence window: answers older than 30 days leave the sample', () => {
  const active = new Map([['old', 1], ['new', 1]]);
  const events = [answerEvent({ item: 'old', correct: false, atMs: T0 - 31 * DAY }), answerEvent({ item: 'new', correct: true, atMs: T0 })];
  assert.deepEqual(accuracySample(events, scope, active, T0 + 1000, 30).total, 1);
});

test('weak areas need at least 10 distinct first responses; otherwise "not enough practice"', () => {
  const cat = indexCatalogue(fixtureCatalogue());
  const nine = manyAnswers(9, 1, 30_000); // all wrong
  const few = moduleEvidence(nine.events, scope, nine.active, cat, T0 + DAY).find(m => m.moduleId === 'BFM::MOD_FIX');
  assert.equal(few?.status, 'not_enough_practice');
  const ten = manyAnswers(10, 2, 30_000); // 50%
  const weak = moduleEvidence(ten.events, scope, ten.active, cat, T0 + DAY).find(m => m.moduleId === 'BFM::MOD_FIX');
  assert.deepEqual([weak?.status, weak?.sample, weak?.accuracyPct], ['weak', 10, 50]);
  assert.deepEqual(weak?.missedObjectiveIds, ['BFM::MOD_FIX::U01::LO_01']);
  const good = manyAnswers(10, 5, 30_000); // 80%
  assert.equal(moduleEvidence(good.events, scope, good.active, cat, T0 + DAY)[0]?.status, 'ok');
  assert.deepEqual(missedObjectives(nine.events, scope, nine.active, T0 + DAY, 30), ['BFM::MOD_FIX::U01::LO_01']);
  assert.deepEqual(missedObjectives(good.events, scope, good.active, T0 + DAY, 30), []);
});
