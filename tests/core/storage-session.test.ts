import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { IdbBackend, MemoryBackend, StorageError } from '../../src/storage/backend.ts';
import { Store } from '../../src/storage/store.ts';
import { verifyPackBytes } from '../../src/core/packs.ts';
import { ContentIndex } from '../../src/core/content.ts';
import { indexCatalogue } from '../../src/core/catalogue.ts';
import { CLIENT_VERSION, type AttemptRecord, type PackRecord, type Prefs } from '../../src/core/model.ts';
import {
  answerSelfCheckQuestion, attemptClock, buildMockAttempt, buildPracticeAttempt, buildSession, cardStep, finishPractice, gradeMock, linkAnswerEvent,
  presetSteps, rateStep, recommend, submitPracticeAnswer, unitAccessible, withFlag, withResponse, withTiming, type PlanContext,
} from '../../src/core/session.ts';
import { deriveReviewStates, dueReviews } from '../../src/core/sm2.ts';
import { validateAttempt, validateEvent } from '../../src/validation/contracts.ts';
import type { PaperId, QuestionItem } from '../../src/types/contracts.ts';
import { CTX, DAY, T0, fixtureBytes, fixtureCatalogue, fixtureContext, fixtureEntry, fixtureRecord } from '../helpers.ts';

const nowIso = new Date(T0).toISOString();
async function installed(store: Store, paper: PaperId): Promise<PackRecord> {
  const v = await verifyPackBytes(fixtureBytes(paper), await fixtureEntry(paper), fixtureCatalogue(), CLIENT_VERSION, nowIso);
  assert.equal(v.ok, true, JSON.stringify(v));
  if (!v.ok) throw new Error('unreachable');
  await store.activatePack(v.record);
  return v.record;
}
const correctResponse = (q: QuestionItem): string => (q.question_type === 'single_choice' ? q.correct_option_id : q.numeric_rule.expected_answer);
const wrongResponse = (q: QuestionItem): string => (q.question_type === 'single_choice' ? (q.correct_option_id === 'A' ? 'B' : 'A') : '1');

for (const [name, make] of [
  ['memory', () => new MemoryBackend()],
  ['IndexedDB', () => new IdbBackend(new IDBFactory(), `t-${Math.random()}`)],
] as const) {
  test(`${name} backend: batches are atomic and values survive a new backend instance`, async () => {
    const backend = make();
    await backend.batch([{ table: 'kv', key: 'a', type: 'put', value: { n: 1 } }, { table: 'events', key: 'e1', type: 'put', value: { x: 'y' } }]);
    assert.deepEqual(await backend.get('kv', 'a'), { n: 1 });
    await backend.batch([{ table: 'kv', key: 'a', type: 'delete' }, { table: 'kv', key: 'b', type: 'put', value: 2 }]);
    assert.equal(await backend.get('kv', 'a'), undefined);
    assert.deepEqual(await backend.getAll('events'), [{ x: 'y' }]);
  });
}

test('IndexedDB: data written by one instance is read by a fresh instance (app restart)', async () => {
  const factory = new IDBFactory();
  const first = new Store(new IdbBackend(factory, 'restart'));
  let prefs = await first.loadPrefs('Asia/Kolkata');
  await installed(first, 'BFM');
  const record = (await first.packRecords())[0]!;
  const q = record.pack.items.find((i): i is QuestionItem => i.item_type === 'question')!;
  const attempt = buildPracticeAttempt({ attemptId: 'A1', learnerId: prefs.learner_id, paperId: 'BFM', context: fixtureContext(), record, questions: [q], title: 't', origin: { kind: 'unit', ref: null }, nowMs: T0 })!;
  const sub = submitPracticeAnswer(attempt, q, correctResponse(q), false, T0 + 5000);
  assert.equal(sub.ok, true); if (!sub.ok) return;
  ({ prefs } = await first.appendEvents(prefs, sub.events, [first.attemptOp(sub.record)]));
  await first.setBookmark({ item_id: q.id, paper_id: 'BFM', created_at: nowIso }, true);
  await first.savePosition({ key: `${prefs.learner_id}:U1`, unit_id: 'U1', item_id: 'c2', updated_at: nowIso });

  const second = new Store(new IdbBackend(factory, 'restart'));
  const prefs2 = await second.loadPrefs();
  assert.equal(prefs2.learner_id, prefs.learner_id); assert.equal(prefs2.device_sequence, 1);
  assert.equal((await second.allEvents()).length, 1);
  assert.deepEqual((await second.attempt('A1'))?.submitted_item_ids, [q.id]);
  assert.equal((await second.bookmarks()).length, 1); assert.equal((await second.positions())[0]?.item_id, 'c2');
  assert.equal((await second.pointer(CTX, 'BFM'))?.current, 'FIXTURE-BFM@1');
  assert.equal((await second.pendingEvents()).length, 1, 'unsent events survive restart');
});

test('a failed save does not acknowledge the action: event and attempt stay unchanged together', async () => {
  const backend = new MemoryBackend(); const store = new Store(backend);
  const prefs = await store.loadPrefs();
  const record = fixtureRecord('BFM'); const q = record.pack.items.find((i): i is QuestionItem => i.item_type === 'question')!;
  const attempt = buildPracticeAttempt({ attemptId: 'A1', learnerId: prefs.learner_id, paperId: 'BFM', context: fixtureContext(), record, questions: [q], title: 't', origin: { kind: 'unit', ref: null }, nowMs: T0 })!;
  await store.saveAttempt(attempt);
  const sub = submitPracticeAnswer(attempt, q, correctResponse(q), false, T0);
  assert.equal(sub.ok, true); if (!sub.ok) return;
  backend.failNextBatch = new StorageError('quota', 'Device storage is full.');
  await assert.rejects(store.appendEvents(prefs, sub.events, [store.attemptOp(sub.record)]), /storage is full/);
  assert.equal((await store.allEvents()).length, 0); assert.deepEqual((await store.attempt('A1'))?.submitted_item_ids, []);
  assert.equal((await store.loadPrefs()).device_sequence, 0);
});

test('pack verification rejects truncated, corrupted, mismatched and incompatible downloads', async () => {
  const cat = fixtureCatalogue(); const bytes = fixtureBytes('BFM'); const entry = await fixtureEntry('BFM');
  const stage = async (b: Uint8Array, e = entry, version = CLIENT_VERSION) => { const r = await verifyPackBytes(b, e, cat, version, nowIso); return r.ok ? 'ok' : r.stage; };
  assert.equal(await stage(bytes), 'ok');
  assert.equal(await stage(bytes.slice(0, bytes.length - 10)), 'size');
  const flipped = new Uint8Array(bytes); flipped[100] = flipped[100] === 65 ? 66 : 65;
  assert.equal(await stage(flipped), 'checksum');
  assert.equal(await stage(bytes, { ...entry, paper_id: 'ABFM' }), 'identity');
  assert.equal(await stage(bytes, { ...entry, minimum_client_version: '9.0.0' }), 'compatibility');
  assert.equal(await stage(bytes, { ...entry, kind: 'published' }), 'schema', 'synthetic fixtures can never be installed as published content');
  const garbage = new TextEncoder().encode('{not json'); const { sha256Hex } = await import('../../src/core/packs.ts');
  assert.equal(await stage(garbage, { ...entry, file_size_bytes: garbage.byteLength, sha256: await sha256Hex(garbage) }), 'parse');
});

test('activation is atomic, keeps the last-known-good pack, and can roll back', async () => {
  const backend = new MemoryBackend(); const store = new Store(backend);
  const v1 = await installed(store, 'BFM');
  const v2: PackRecord = { ...v1, key: 'FIXTURE-BFM@2', pack: { ...v1.pack, pack_version: '2' } };
  backend.failNextBatch = new StorageError('quota', 'Device storage is full.');
  await assert.rejects(store.activatePack(v2));
  assert.equal((await store.pointer(CTX, 'BFM'))?.current, 'FIXTURE-BFM@1', 'failed update leaves the valid pack active');
  assert.equal((await store.packRecords()).length, 1);
  await store.activatePack(v2);
  assert.deepEqual(await store.pointer(CTX, 'BFM'), { paper_id: 'BFM', exam_context_id: CTX, current: 'FIXTURE-BFM@2', previous: 'FIXTURE-BFM@1' });
  assert.equal((await store.rollbackPack(CTX, 'BFM'))?.current, 'FIXTURE-BFM@1');
  assert.equal((await store.packRecords()).length, 2, 'both versions retained');
});

test('an active attempt pins its pack; removal is refused and history is preserved', async () => {
  const store = new Store(new MemoryBackend()); let prefs = await store.loadPrefs();
  const v1 = await installed(store, 'BFM'); const idx = new ContentIndex([v1]);
  const qs = idx.questions('BFM').slice(0, 3);
  const attempt = buildPracticeAttempt({ attemptId: 'A1', learnerId: prefs.learner_id, paperId: 'BFM', context: fixtureContext(), record: v1, questions: qs, title: 't', origin: { kind: 'unit', ref: null }, nowMs: T0 })!;
  const sub = submitPracticeAnswer(attempt, qs[0]!, correctResponse(qs[0]!), false, T0);
  assert.equal(sub.ok, true); if (!sub.ok) return;
  ({ prefs } = await store.appendEvents(prefs, sub.events, [store.attemptOp(sub.record)]));
  const v2: PackRecord = { ...v1, key: 'FIXTURE-BFM@2', pack: { ...v1.pack, pack_version: '2' } };
  const v3: PackRecord = { ...v1, key: 'FIXTURE-BFM@3', pack: { ...v1.pack, pack_version: '3' } };
  await store.activatePack(v2); await store.activatePack(v3);
  assert.deepEqual(await store.pruneUnusedPacks(), [], 'v1 is pinned by the active attempt');
  assert.deepEqual(await store.removePaperContent(CTX, 'BFM'), { removed: false, reason: 'An unfinished session still uses this content. Finish or end it first.' });
  await store.saveAttempt(finishPractice(sub.record, T0 + 1000));
  assert.deepEqual(await store.pruneUnusedPacks(), ['FIXTURE-BFM@1']);
  assert.deepEqual(await store.removePaperContent(CTX, 'BFM'), { removed: true });
  assert.equal((await store.allEvents()).length, 1, 'removing content keeps learner history');
  assert.equal((await store.attempts()).length, 1);
});

test('paper isolation: BFM never returns ABFM content, search scope is explicit', async () => {
  const idx = new ContentIndex([fixtureRecord('BFM'), fixtureRecord('ABFM'), fixtureRecord('CB')]);
  for (const p of ['BFM', 'ABFM', 'CB'] as const) {
    assert.ok(idx.items(p).length > 0);
    assert.ok(idx.items(p).every(i => i.paper_id === p && i.id.startsWith(`FIX-${p}-`)), p);
    assert.ok(idx.cards(p).every(c => c.module_id === `${p}::MOD_FIX`));
  }
  assert.equal(idx.items('ABM').length, 0);
  const scoped = idx.search('flat growth', 'BFM'); assert.ok(scoped.length > 0); assert.ok(scoped.every(h => h.paper_id === 'BFM'));
  const all = idx.search('flat growth', 'all'); assert.deepEqual([...new Set(all.map(h => h.paper_id))].sort(), ['ABFM', 'BFM', 'CB']);
  assert.ok(all.every(h => h.item.item_type !== 'question'), 'questions are not exposed through search');
  assert.equal(idx.search('zzzz-not-there', 'all').length, 0);
});

test('practice: explicit submission, invalid numeric input is not consumed, double submit is refused', async () => {
  const record = fixtureRecord('BFM'); const idx = new ContentIndex([record]);
  const numeric = idx.questions('BFM').find(q => q.question_type === 'numeric_input')!; const choice = idx.questions('BFM').find(q => q.question_type === 'single_choice' && !q.case_study_id)!;
  let attempt = buildPracticeAttempt({ attemptId: 'A1', learnerId: 'L1', paperId: 'BFM', context: fixtureContext(), record, questions: [numeric, choice], title: 't', origin: { kind: 'unit', ref: null }, nowMs: T0 })!;
  assert.equal(validateAttempt(attempt.attempt).ok, true);
  attempt = withResponse(attempt, numeric.id, '12'); // a selection/entry alone submits nothing
  assert.deepEqual(attempt.submitted_item_ids, []);
  const invalid = submitPracticeAnswer(attempt, numeric, '1,234', false, T0);
  assert.equal(invalid.ok, false);
  attempt = withTiming(attempt, numeric.id, 41_000);
  const good = submitPracticeAnswer(attempt, numeric, numeric.numeric_rule.expected_answer, false, T0 + 41_000);
  assert.equal(good.ok, true); if (!good.ok) return;
  assert.equal(good.grade.is_correct, true); assert.equal(good.events.length, 1);
  const ev = { ...good.events[0]!, event_id: 'e', learner_id: 'L1', device_id: 'D', device_sequence: 1 };
  assert.equal(validateEvent(ev).ok, true, JSON.stringify(validateEvent(ev)));
  assert.equal(good.events[0]!.event_type === 'answer_submitted' && good.events[0]!.elapsed_ms, 41_000);
  assert.throws(() => submitPracticeAnswer(good.record, numeric, '5', false, T0), /already submitted/);
  const bad = submitPracticeAnswer(good.record, choice, wrongResponse(choice), true, T0);
  assert.equal(bad.ok && bad.grade.is_correct, false);
  assert.equal(bad.ok && bad.events[0]!.event_type === 'answer_submitted' && bad.events[0]!.answer_was_revealed_prior, true);
});

test('mock: persisted absolute deadline, backgrounding does not pause, expiry grades saved answers only', async () => {
  const record = fixtureRecord('BFM'); const idx = new ContentIndex([record]); const ctx = fixtureContext();
  const built = buildMockAttempt({ attemptId: 'M1', learnerId: 'L1', paperId: 'BFM', context: ctx, record, questions: idx.questions('BFM'), title: 'Mock', origin: { kind: 'mock', ref: null }, nowMs: T0 });
  assert.equal(built.ok, true); if (!built.ok) return;
  assert.equal(built.questionCount, 20); assert.equal(built.durationSeconds, 1200); assert.equal(built.full, true);
  assert.equal(built.record.attempt.expires_at_iso, new Date(T0 + 1_200_000).toISOString());
  assert.equal(validateAttempt(built.record.attempt).ok, true);
  // Case-study questions stay together.
  const order = built.record.attempt.question_order.map(r => r.item_id); const csIdx = order.map((id, i) => (id.includes('-CSQ-') ? i : -1)).filter(i => i >= 0);
  if (csIdx.length > 1) assert.equal(csIdx[csIdx.length - 1]! - csIdx[0]!, csIdx.length - 1);

  // Persist, "close the app", reopen 15 minutes later: remaining time is derived from the stored deadline.
  const store = new Store(new MemoryBackend()); await store.saveAttempt(built.record);
  const reopened = (await store.attempt('M1'))!;
  assert.deepEqual(attemptClock(reopened.attempt, T0 + 900_000), { remainingMs: 300_000, expired: false });
  assert.deepEqual(attemptClock(reopened.attempt, T0 + 1_200_000), { remainingMs: 0, expired: true });

  let a: AttemptRecord = reopened; const q = (i: number) => idx.question(order[i]!)!;
  a = withResponse(a, order[0]!, correctResponse(q(0))); a = withResponse(a, order[1]!, correctResponse(q(1))); a = withResponse(a, order[2]!, wrongResponse(q(2)));
  a = withFlag(a, order[3]!, true); a = withResponse(a, order[4]!, 'A'); a = withResponse(a, order[4]!, null); // cleared answer is unanswered
  const graded = gradeMock(a, id => idx.question(id), ctx, T0 + 2_000_000, 'expired');
  assert.equal(graded.record.attempt.status, 'expired'); assert.equal(graded.record.attempt.submitted_at, a.attempt.expires_at_iso, 'expiry is stamped at the deadline, not at reopen time');
  assert.deepEqual([graded.record.result?.correct, graded.record.result?.wrong, graded.record.result?.unanswered], [2, 1, 17]);
  assert.equal(graded.record.result?.marks_obtained, 2); assert.equal(graded.record.result?.total_marks, 20);
  assert.deepEqual(graded.record.attempt.score_summary, { marks_obtained: 2, total_marks: 20, passed: false });
  assert.equal(graded.events.length, 3, 'unanswered questions produce no answer event');
  assert.equal(validateAttempt(graded.record.attempt).ok, true);
});

test('mock: unavailable without a verified configuration; short pools scale duration and give no pass/fail', () => {
  const record = fixtureRecord('BFM'); const idx = new ContentIndex([record]); const ctx = fixtureContext();
  const none = buildMockAttempt({ attemptId: 'M', learnerId: 'L1', paperId: 'BFM', context: { ...ctx, status: 'unverified', config: null, pass_marks: null }, record, questions: idx.questions('BFM'), title: 'm', origin: { kind: 'mock', ref: null }, nowMs: T0 });
  assert.equal(none.ok, false);
  const few = idx.questions('BFM').filter(q => !q.case_study_id).slice(0, 5);
  const short = buildMockAttempt({ attemptId: 'M2', learnerId: 'L1', paperId: 'BFM', context: ctx, record, questions: few, title: 'm', origin: { kind: 'mock', ref: null }, nowMs: T0 });
  assert.equal(short.ok, true); if (!short.ok) return;
  assert.deepEqual([short.questionCount, short.durationSeconds, short.full], [5, 300, false]);
  let a = short.record; for (const q of few) a = withResponse(a, q.id, correctResponse(q));
  const graded = gradeMock(a, id => idx.question(id), ctx, T0 + 1000, 'submitted');
  assert.equal(graded.record.result?.marks_obtained, 5); assert.equal(graded.record.attempt.score_summary, null);
  const penal = gradeMock(withResponse(short.record, few[0]!.id, wrongResponse(few[0]!)), id => idx.question(id), { ...ctx, config: { ...ctx.config!, wrong_answer_penalty: '0.25' } }, T0 + 1000, 'submitted');
  assert.equal(penal.record.result?.marks_obtained, 0, 'marks never go below zero');
});

test('study session: events are recorded once, wrong self-check forces Again and queues one relearning retry', async () => {
  const store = new Store(new MemoryBackend()); let prefs: Prefs = await store.loadPrefs('Asia/Kolkata');
  const record = await installed(store, 'BFM'); const idx = new ContentIndex([record]);
  const statute = idx.cards('BFM').find(c => c.card_type === 'statute')!; const concept = idx.cards('BFM').find(c => c.card_type === 'concept')!;
  let s = buildSession({ sessionId: 'S1', learnerId: prefs.learner_id, paperId: 'BFM', examContextId: CTX, record, kind: 'lesson', title: 'Unit', reason: '', steps: [cardStep(statute), cardStep(concept)], estimateSeconds: 120, nowMs: T0 });
  const q = idx.question(statute.self_check.mode === 'question' ? statute.self_check.question_id : '')!;
  const ans = answerSelfCheckQuestion(s, 0, q, wrongResponse(q), 20_000, T0 + 20_000);
  assert.equal(ans.ok, true); if (!ans.ok) return;
  let saved = await store.appendEvents(prefs, ans.events, [store.sessionOp(ans.session)]); prefs = saved.prefs;
  s = linkAnswerEvent(ans.session, 0, saved.events[0]!.event_id);
  assert.throws(() => answerSelfCheckQuestion(s, 0, q, correctResponse(q), 1, T0), /already answered/);
  const rated = rateStep(s, 0, statute, 'Easy', T0 + 30_000);
  assert.equal(rated.effective, 'Again'); assert.equal(rated.session.steps.length, 3); assert.equal(rated.session.steps[2]?.relearn, true);
  assert.deepEqual(rated.events.map(e => e.event_type), ['sm2_review', 'lesson_completed']);
  saved = await store.appendEvents(prefs, rated.events, [store.sessionOp(rated.session)]); prefs = saved.prefs; s = rated.session;
  assert.deepEqual(rateStep(s, 0, statute, 'Good', T0).events, [], 'rating the same step again records nothing');

  const r2 = rateStep(s, 1, concept, 'Good', T0 + 60_000);
  assert.deepEqual(r2.events.map(e => e.event_type), ['self_check', 'sm2_review', 'lesson_completed']);
  saved = await store.appendEvents(prefs, r2.events, [store.sessionOp(r2.session)]); prefs = saved.prefs; s = r2.session;
  assert.equal(s.status, 'active'); assert.equal(s.cursor, 2);
  // The relearning retry: answering correctly records no evidence at all.
  const retry = answerSelfCheckQuestion(s, 2, q, correctResponse(q), 5000, T0 + 70_000);
  assert.equal(retry.ok && retry.events.length, 0);
  const r3 = rateStep(retry.ok ? retry.session : s, 2, statute, 'Easy', T0 + 80_000);
  assert.deepEqual(r3.events, []); assert.equal(r3.session.status, 'completed');

  const events = (await store.allEvents()).map(e => e.event);
  for (const e of events) assert.equal(validateEvent(e).ok, true, JSON.stringify(validateEvent(e)));
  const states = deriveReviewStates(events, 'Asia/Kolkata');
  const due = dueReviews(states.values(), 'BFM', CTX, T0 + DAY, 'Asia/Kolkata');
  assert.deepEqual(due.map(d => d.item_id).sort(), [concept.id, statute.id].sort(), 'both cards are due tomorrow; the retry did not promote the failed card');
  assert.equal(states.get(`${CTX}|${statute.id}`)?.repetition_count, 0);
});

test('recommendation priority: resume, then due reviews, then missed objectives, then new material', () => {
  const record = fixtureRecord('BFM'); const idx = new ContentIndex([record]); const cat = indexCatalogue(fixtureCatalogue());
  const ctx: PlanContext = { index: idx, paperId: 'BFM', examContextId: CTX, learnerId: 'L1', events: [], due: [], missedObjectiveIds: [], entitled: false, orderedUnitIds: cat.unitsOfPaper('BFM').map(u => u.id) };
  const title = (id: string) => cat.unit(id)?.title ?? id;
  assert.equal(recommend(ctx, { attempt: null, session: null }, title).kind, 'learn');
  assert.equal(recommend({ ...ctx, missedObjectiveIds: ['BFM::MOD_FIX::U02::LO_01'] }, { attempt: null, session: null }, title).kind, 'remediation');
  const concept = idx.cards('BFM')[0]!;
  const due = [{ learner_id: 'L1', item_id: concept.id, item_revision: 1, paper_id: 'BFM' as const, exam_context_id: CTX, algorithm_version: 'SM2_V1', repetition_count: 1, ease_factor: 2.5, interval_days: 1, due_date_iso: '2026-11-10', learner_time_zone: 'Asia/Kolkata', last_reviewed_at: null }];
  assert.equal(recommend({ ...ctx, due, missedObjectiveIds: ['BFM::MOD_FIX::U02::LO_01'] }, { attempt: null, session: null }, title).kind, 'reviews');
  const session = buildSession({ sessionId: 'S', learnerId: 'L1', paperId: 'BFM', examContextId: CTX, record, kind: 'lesson', title: 'x', reason: '', steps: [cardStep(concept)], estimateSeconds: 60, nowMs: T0 });
  assert.equal(recommend({ ...ctx, due }, { attempt: null, session }, title).kind, 'resume_session');
  assert.equal(recommend({ ...ctx, index: new ContentIndex([]) }, { attempt: null, session: null }, title).kind, 'none');
  const five = presetSteps({ ...ctx, due }, 5), ten = presetSteps({ ...ctx, due }, 10);
  assert.equal(five.steps[0]?.type, 'review'); assert.ok(five.estimateSeconds <= 300 || five.steps.length === 1);
  assert.ok(ten.steps.length >= five.steps.length); assert.ok(ten.estimateSeconds <= 600);
});

test('access: paid units need entitlement, free units and fixtures do not', () => {
  const full = fixtureRecord('BFM', { kind: 'published', access: 'full', free_unit_ids: ['BFM::MOD_FIX::U01'] });
  assert.equal(unitAccessible(full, 'BFM::MOD_FIX::U01', false), true);
  assert.equal(unitAccessible(full, 'BFM::MOD_FIX::U02', false), false);
  assert.equal(unitAccessible(full, 'BFM::MOD_FIX::U02', true), true);
  assert.equal(unitAccessible(fixtureRecord('BFM'), 'BFM::MOD_FIX::U02', false), true);
});

test('account linking relabels history without changing event IDs or losing anything', async () => {
  const store = new Store(new MemoryBackend()); let prefs = await store.loadPrefs();
  const record = fixtureRecord('BFM'); const q = record.pack.items.find((i): i is QuestionItem => i.item_type === 'question')!;
  const attempt = buildPracticeAttempt({ attemptId: 'A1', learnerId: prefs.learner_id, paperId: 'BFM', context: fixtureContext(), record, questions: [q], title: 't', origin: { kind: 'unit', ref: null }, nowMs: T0 })!;
  const sub = submitPracticeAnswer(attempt, q, correctResponse(q), false, T0); if (!sub.ok) throw new Error('x');
  const saved = await store.appendEvents(prefs, sub.events, [store.attemptOp(sub.record)]); prefs = saved.prefs;
  await store.markSynced([saved.events[0]!.event_id]);
  const linked = await store.relabelLearner(prefs, 'acct-42', { account_id: 'acct-42', email: 'learner@example.test' });
  const events = await store.allEvents();
  assert.equal(events.length, 1); assert.equal(events[0]!.event.event_id, saved.events[0]!.event_id);
  assert.equal(events[0]!.event.learner_id, 'acct-42'); assert.equal(events[0]!.synced, false, 'relabelled history is queued for upload');
  assert.equal((await store.attempt('A1'))?.attempt.learner_id, 'acct-42'); assert.equal(linked.account?.account_id, 'acct-42');
});
