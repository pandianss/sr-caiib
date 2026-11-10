/** Typed persistence operations. Every learner action is saved before it is acknowledged to the UI. */
import type { LearnerEvent, PaperId } from '../types/contracts.ts';
import type {
  ActivePointer, AttemptRecord, Bookmark, CurriculumCatalogue, EntitlementRecord, NewEvent, PackRecord, Prefs,
  ReadingPosition, StoredEvent, StudySession,
} from '../core/model.ts';
import { DEFAULT_TIME_ZONE } from '../core/model.ts';
import type { Backend, Op } from './backend.ts';

const uuid = (): string => globalThis.crypto.randomUUID();
export const pointerKey = (examContextId: string, paperId: PaperId): string => `active:${examContextId}:${paperId}`;

export function defaultPrefs(timeZone?: string): Prefs {
  return {
    learner_id: `local-${uuid()}`, device_id: `dev-${uuid()}`, device_sequence: 0, onboarded: false,
    exam_context_id: null, selected_elective: null, active_paper: 'ABM', session_minutes: 10, theme: 'system',
    time_zone: timeZone ?? DEFAULT_TIME_ZONE, account: null,
  };
}

export type { NewEvent };

export class Store {
  readonly backend: Backend;
  constructor(backend: Backend) { this.backend = backend; }

  // ---- preferences -------------------------------------------------------------------------------------
  async loadPrefs(timeZone?: string): Promise<Prefs> {
    const existing = await this.backend.get<Prefs>('kv', 'prefs');
    if (existing) return existing;
    const created = defaultPrefs(timeZone);
    await this.backend.batch([{ table: 'kv', key: 'prefs', type: 'put', value: created }]);
    return created;
  }
  async savePrefs(prefs: Prefs): Promise<void> { await this.backend.batch([{ table: 'kv', key: 'prefs', type: 'put', value: prefs }]); }

  // ---- events ------------------------------------------------------------------------------------------
  /**
   * Appends events with fresh IDs and device sequence numbers, atomically with any related writes
   * (for example the attempt or study session that produced them).
   */
  async appendEvents(prefs: Prefs, drafts: NewEvent[], related: Op[] = []): Promise<{ prefs: Prefs; events: LearnerEvent[] }> {
    let seq = prefs.device_sequence;
    const events = drafts.map(d => ({ ...d, event_id: uuid(), learner_id: prefs.learner_id, device_id: prefs.device_id, device_sequence: ++seq }) as LearnerEvent);
    const next: Prefs = { ...prefs, device_sequence: seq };
    const ops: Op[] = events.map(e => ({ table: 'events', key: e.event_id, type: 'put', value: { event: e, synced: false } satisfies StoredEvent }));
    ops.push({ table: 'kv', key: 'prefs', type: 'put', value: next }, ...related);
    await this.backend.batch(ops);
    return { prefs: next, events };
  }
  async allEvents(): Promise<StoredEvent[]> { return this.backend.getAll<StoredEvent>('events'); }
  async pendingEvents(): Promise<LearnerEvent[]> { return (await this.allEvents()).filter(e => !e.synced).map(e => e.event); }
  async markSynced(eventIds: string[]): Promise<void> {
    const ops: Op[] = [];
    for (const id of eventIds) {
      const rec = await this.backend.get<StoredEvent>('events', id);
      if (rec && !rec.synced) ops.push({ table: 'events', key: id, type: 'put', value: { ...rec, synced: true } });
    }
    await this.backend.batch(ops);
  }
  /** Merges events downloaded from the server; existing IDs are left untouched (idempotent). */
  async mergeRemoteEvents(events: LearnerEvent[]): Promise<number> {
    const ops: Op[] = [];
    for (const e of events) if (!(await this.backend.get<StoredEvent>('events', e.event_id))) ops.push({ table: 'events', key: e.event_id, type: 'put', value: { event: e, synced: true } });
    await this.backend.batch(ops);
    return ops.length;
  }
  /** Re-labels local anonymous history to an account identity without changing event IDs. */
  async relabelLearner(prefs: Prefs, newLearnerId: string, account: { account_id: string; email: string }): Promise<Prefs> {
    const old = prefs.learner_id;
    const next: Prefs = { ...prefs, learner_id: newLearnerId, account };
    const ops: Op[] = [{ table: 'kv', key: 'prefs', type: 'put', value: next }];
    if (old !== newLearnerId) {
      for (const rec of await this.allEvents()) if (rec.event.learner_id === old) ops.push({ table: 'events', key: rec.event.event_id, type: 'put', value: { event: { ...rec.event, learner_id: newLearnerId }, synced: false } });
      for (const a of await this.attempts()) if (a.attempt.learner_id === old) ops.push({ table: 'attempts', key: a.attempt.attempt_id, type: 'put', value: { ...a, attempt: { ...a.attempt, learner_id: newLearnerId } } });
      for (const s of await this.sessions()) if (s.learner_id === old) ops.push({ table: 'sessions', key: s.session_id, type: 'put', value: { ...s, learner_id: newLearnerId } });
    }
    await this.backend.batch(ops);
    return next;
  }

  // ---- attempts and study sessions ---------------------------------------------------------------------
  attemptOp(record: AttemptRecord): Op { return { table: 'attempts', key: record.attempt.attempt_id, type: 'put', value: record }; }
  async saveAttempt(record: AttemptRecord): Promise<void> { await this.backend.batch([this.attemptOp(record)]); }
  async attempts(): Promise<AttemptRecord[]> { return this.backend.getAll<AttemptRecord>('attempts'); }
  async attempt(id: string): Promise<AttemptRecord | undefined> { return this.backend.get<AttemptRecord>('attempts', id); }
  sessionOp(session: StudySession): Op { return { table: 'sessions', key: session.session_id, type: 'put', value: session }; }
  async saveSession(session: StudySession): Promise<void> { await this.backend.batch([this.sessionOp(session)]); }
  async sessions(): Promise<StudySession[]> { return this.backend.getAll<StudySession>('sessions'); }

  // ---- bookmarks and reading position ------------------------------------------------------------------
  async bookmarks(): Promise<Bookmark[]> { return this.backend.getAll<Bookmark>('bookmarks'); }
  async setBookmark(bookmark: Bookmark, on: boolean): Promise<void> {
    await this.backend.batch([on ? { table: 'bookmarks', key: bookmark.item_id, type: 'put', value: bookmark } : { table: 'bookmarks', key: bookmark.item_id, type: 'delete' }]);
  }
  async positions(): Promise<ReadingPosition[]> { return this.backend.getAll<ReadingPosition>('positions'); }
  async savePosition(position: ReadingPosition): Promise<void> { await this.backend.batch([{ table: 'positions', key: position.key, type: 'put', value: position }]); }

  // ---- catalogues, packs and activation ----------------------------------------------------------------
  async saveCatalogue(catalogue: CurriculumCatalogue): Promise<void> {
    await this.backend.batch([{ table: 'kv', key: `catalogue:${catalogue.syllabus_version}`, type: 'put', value: catalogue }]);
  }
  async catalogue(version: string): Promise<CurriculumCatalogue | undefined> { return this.backend.get<CurriculumCatalogue>('kv', `catalogue:${version}`); }
  async packRecords(): Promise<PackRecord[]> { return this.backend.getAll<PackRecord>('packs'); }
  async pointer(examContextId: string, paperId: PaperId): Promise<ActivePointer | undefined> { return this.backend.get<ActivePointer>('kv', pointerKey(examContextId, paperId)); }
  async pointers(): Promise<ActivePointer[]> {
    const out: ActivePointer[] = [];
    for (const rec of await this.packRecords()) {
      const p = await this.pointer(rec.pack.exam_context_id, rec.pack.paper_id);
      if (p && !out.some(x => x.paper_id === p.paper_id && x.exam_context_id === p.exam_context_id)) out.push(p);
    }
    return out;
  }
  /**
   * Stores a fully verified pack and switches the active pointer in ONE atomic batch. The previously active
   * pack is kept as last-known-good. Nothing is deleted here.
   */
  async activatePack(record: PackRecord): Promise<ActivePointer> {
    const { paper_id, exam_context_id } = record.pack;
    const existing = await this.pointer(exam_context_id, paper_id);
    const pointer: ActivePointer = { paper_id, exam_context_id, current: record.key, previous: existing && existing.current !== record.key ? existing.current : existing?.previous ?? null };
    await this.backend.batch([
      { table: 'packs', key: record.key, type: 'put', value: record },
      { table: 'kv', key: pointerKey(exam_context_id, paper_id), type: 'put', value: pointer },
    ]);
    return pointer;
  }
  /** Reverts to the last-known-good pack, if one is retained. */
  async rollbackPack(examContextId: string, paperId: PaperId): Promise<ActivePointer | null> {
    const p = await this.pointer(examContextId, paperId);
    if (!p?.previous || !(await this.backend.get<PackRecord>('packs', p.previous))) return null;
    const next: ActivePointer = { ...p, current: p.previous, previous: p.current };
    await this.backend.batch([{ table: 'kv', key: pointerKey(examContextId, paperId), type: 'put', value: next }]);
    return next;
  }
  /** Pack keys that must be retained: active, last-known-good, or pinned by an unfinished attempt/session. */
  async pinnedPackKeys(): Promise<Set<string>> {
    const keep = new Set<string>();
    for (const p of await this.pointers()) { keep.add(p.current); if (p.previous) keep.add(p.previous); }
    for (const a of await this.attempts()) if (a.attempt.status === 'active') keep.add(`${a.attempt.pack_id}@${a.attempt.pack_version}`);
    for (const s of await this.sessions()) if (s.status === 'active') keep.add(`${s.pack_id}@${s.pack_version}`);
    return keep;
  }
  /** Removes packs that nothing depends on. Learner history is never touched. */
  async pruneUnusedPacks(): Promise<string[]> {
    const keep = await this.pinnedPackKeys();
    const removable = (await this.packRecords()).filter(r => !keep.has(r.key)).map(r => r.key);
    await this.backend.batch(removable.map(key => ({ table: 'packs' as const, key, type: 'delete' as const })));
    return removable;
  }
  /**
   * Explicit download removal for a paper. Refused while an unfinished attempt or study session still needs
   * the pack. History, bookmarks and review evidence are kept.
   */
  async removePaperContent(examContextId: string, paperId: PaperId): Promise<{ removed: boolean; reason?: string }> {
    const p = await this.pointer(examContextId, paperId);
    if (!p) return { removed: false, reason: 'Nothing is downloaded for this paper.' };
    const attempts = (await this.attempts()).filter(a => a.attempt.status === 'active' && a.attempt.paper_id === paperId && a.attempt.exam_context_id === examContextId);
    const sessions = (await this.sessions()).filter(s => s.status === 'active' && s.paper_id === paperId && s.exam_context_id === examContextId);
    if (attempts.length || sessions.length) return { removed: false, reason: 'An unfinished session still uses this content. Finish or end it first.' };
    const ops: Op[] = [{ table: 'kv', key: pointerKey(examContextId, paperId), type: 'delete' }, { table: 'packs', key: p.current, type: 'delete' }];
    if (p.previous) ops.push({ table: 'packs', key: p.previous, type: 'delete' });
    await this.backend.batch(ops);
    return { removed: true };
  }

  // ---- entitlement -------------------------------------------------------------------------------------
  async entitlement(): Promise<EntitlementRecord | undefined> { return this.backend.get<EntitlementRecord>('kv', 'entitlement'); }
  async saveEntitlement(record: EntitlementRecord | null): Promise<void> {
    await this.backend.batch([record ? { table: 'kv', key: 'entitlement', type: 'put', value: record } : { table: 'kv', key: 'entitlement', type: 'delete' }]);
  }
  async kvGet<T>(key: string): Promise<T | undefined> { return this.backend.get<T>('kv', key); }
  async kvPut(key: string, value: unknown): Promise<void> { await this.backend.batch([{ table: 'kv', key, type: 'put', value }]); }
}
