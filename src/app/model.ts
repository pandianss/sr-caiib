/**
 * Application state and actions. Every learner action is written to local storage before the in-memory state
 * (and therefore the screen) changes. Network features are optional: free study never depends on them.
 */
import type { ElectivePaperId, LearnerEvent, PaperId, ProductOffer, PurchaseRecord, QuestionItem, SignedOfflineEntitlement, Sm2Rating, Sm2ReviewState, StudyCard } from '../types/contracts.ts';
import { validateCatalogue } from '../validation/contracts.ts';
import { indexCatalogue, type CatalogueIndex } from '../core/catalogue.ts';
import { ContentIndex } from '../core/content.ts';
import type { CoverageLedger } from '../core/coverage.ts';
import { evaluateEntitlement, entitles, mayContinueStartedSession, type EntitlementStatus, type PublicJwk } from '../core/entitlement.ts';
import { computeReadiness, highConfidenceErrors, missedObjectives, moduleEvidence, repeatAnswerCount, DEFAULT_EVIDENCE_CONFIG } from '../core/evidence.ts';
import { CLIENT_VERSION, type AppManifest, type AppPackEntry, type AttemptRecord, type Bookmark, type CurriculumCatalogue, type EntitlementRecord, type ExamContextRecord, type NewEvent, type PackRecord, type Prefs, type ReadingPosition, type StudySession, type StudyStep } from '../core/model.ts';
import { verifyPackBytes } from '../core/packs.ts';
import {
  accessibleQuestions, answerSelfCheckQuestion, attemptClock, buildMockAttempt, buildPracticeAttempt, buildSession, cardSeconds, cardStep, finishPractice, gradeMock, linkAnswerEvent,
  nextUnstudiedCards, paceSeconds, presetSteps, rateStep, recommend, remediationCards, remediationQuestions, revealStep, submitPracticeAnswer, unitAccessible, unseenFirst,
  withFlag, withResponse, withTiming, SELF_CHECK_SECONDS, type PlanContext, type Recommendation,
} from '../core/session.ts';
import { deriveReviewStates, dueReviews } from '../core/sm2.ts';
import { IdbBackend, MemoryBackend, StorageError, type Backend } from '../storage/backend.ts';
import { Store } from '../storage/store.ts';

export const FIXTURE_MODE = import.meta.env.MODE === 'fixtures';
const API = '/api/v1';
const uuid = (): string => crypto.randomUUID();

export type DownloadState = { state: 'idle' } | { state: 'downloading' } | { state: 'failed'; message: string } | { state: 'done' };
export interface OffersInfo { offers: ProductOffer[]; purchasing_enabled: boolean; purchasable_reason: string | null; simulated_payments: boolean; key_id: string | null; business_time_zone: string; offline_lease_days: number; support: string }
export type CheckoutState =
  | { step: 'idle' } | { step: 'creating' }
  | { step: 'awaiting_payment'; order_id: string; provider_order_id: string; amount_minor: number; key_id: string; simulated: boolean }
  | { step: 'verifying'; order_id: string } | { step: 'pending'; order_id: string; message: string }
  | { step: 'confirmed'; expires_at: string } | { step: 'failed'; message: string; order_id: string | null } | { step: 'cancelled'; order_id: string };
export type SyncState = 'local_only' | 'idle' | 'syncing' | 'pending' | 'error';

export interface AppState {
  phase: 'loading' | 'ready' | 'storage_error';
  bootError: string | null;
  contentError: string | null;
  prefs: Prefs;
  contexts: ExamContextRecord[];
  manifest: AppManifest;
  catalogues: Record<string, CurriculumCatalogue>;
  baselineVersion: string | null;
  ledger: CoverageLedger | null;
  allRecords: PackRecord[];
  index: ContentIndex;
  events: LearnerEvent[];
  pendingSync: number;
  reviews: Map<string, Sm2ReviewState>;
  attempts: AttemptRecord[];
  sessions: StudySession[];
  bookmarks: Bookmark[];
  positions: ReadingPosition[];
  entitlement: EntitlementStatus;
  online: boolean;
  downloads: Partial<Record<PaperId, DownloadState>>;
  updates: AppPackEntry[];
  token: string | null;
  apiReachable: boolean | null;
  offers: OffersInfo | null;
  purchases: PurchaseRecord[];
  checkout: CheckoutState;
  sync: SyncState;
  toast: string | null;
  returnTo: string | null;
}

class ApiError extends Error { readonly status: number; readonly code: string; constructor(status: number, code: string, message: string) { super(message); this.status = status; this.code = code; } }

export class AppModel {
  private listeners = new Set<() => void>();
  private store!: Store;
  private keys: PublicJwk[] = [];
  state: AppState = {
    phase: 'loading', bootError: null, contentError: null, prefs: null as unknown as Prefs, contexts: [], manifest: { generated_at: '', packs: [] }, catalogues: {}, baselineVersion: null, ledger: null,
    allRecords: [], index: new ContentIndex([]), events: [], pendingSync: 0, reviews: new Map(), attempts: [], sessions: [], bookmarks: [], positions: [],
    entitlement: { state: 'none' }, online: typeof navigator === 'undefined' ? true : navigator.onLine, downloads: {}, updates: [], token: null, apiReachable: null, offers: null, purchases: [],
    checkout: { step: 'idle' }, sync: 'local_only', toast: null, returnTo: null,
  };

  subscribe = (fn: () => void): (() => void) => { this.listeners.add(fn); return () => this.listeners.delete(fn); };
  getState = (): AppState => this.state;
  private set(patch: Partial<AppState>): void { this.state = { ...this.state, ...patch }; this.listeners.forEach(l => l()); }
  toast(message: string | null): void { this.set({ toast: message }); }

  // ---- boot ---------------------------------------------------------------------------------------------------
  async boot(backend?: Backend): Promise<void> {
    try {
      this.store = new Store(backend ?? new IdbBackend());
      const prefs = await this.store.loadPrefs(Intl.DateTimeFormat().resolvedOptions().timeZone);
      this.state = { ...this.state, prefs };
      await this.loadStatic();
      await this.reloadLocal();
      this.set({ phase: 'ready', token: (await this.store.kvGet<string>('auth_token')) ?? null });
    } catch (e) {
      this.set({ phase: 'storage_error', bootError: e instanceof StorageError ? e.message : 'Local storage could not be opened.' });
      return;
    }
    window.addEventListener('online', () => { this.set({ online: true }); void this.afterOnline(); });
    window.addEventListener('offline', () => this.set({ online: false }));
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void this.tick(); });
    await this.installStarterPacks();
    await this.tick();
    void this.afterOnline();
  }
  /** Used after a storage failure when the learner chooses to continue without saving. */
  async bootTemporary(): Promise<void> { await this.boot(new MemoryBackend()); this.toast('Running without saved progress for this visit.'); }

  private async fetchJson<T>(path: string): Promise<T> {
    const res = await fetch(`${import.meta.env.BASE_URL}content/${path}`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
    return res.json() as Promise<T>;
  }
  /** Loads catalogue, exam contexts, manifest and ledger; falls back to the last saved copies when offline. */
  private async loadStatic(): Promise<void> {
    let fresh: { manifest: AppManifest; contexts: ExamContextRecord[]; ledger: CoverageLedger; baseline: CurriculumCatalogue } | null = null;
    try {
      const [manifest, contexts, ledger, baseline] = await Promise.all([this.fetchJson<AppManifest>('manifest.json'), this.fetchJson<ExamContextRecord[]>('exam-contexts.json'), this.fetchJson<CoverageLedger>('coverage.json'), this.fetchJson<CurriculumCatalogue>('catalogue.json')]);
      if (!validateCatalogue(baseline).ok) throw new Error('catalogue invalid');
      fresh = { manifest, contexts, ledger, baseline };
      await this.store.kvPut('static', fresh); await this.store.saveCatalogue(baseline);
    } catch {
      fresh = (await this.store.kvGet<typeof fresh>('static')) ?? null;
      if (!fresh) { this.state = { ...this.state, contentError: 'The syllabus and content list could not be loaded. Connect to the internet and reload.' }; return; }
    }
    const visible = fresh.contexts.filter(c => FIXTURE_MODE || c.kind !== 'fixture');
    const manifest = { ...fresh.manifest, packs: fresh.manifest.packs.filter(p => FIXTURE_MODE || p.kind !== 'fixture') };
    this.state = { ...this.state, manifest, contexts: visible, ledger: fresh.ledger, baselineVersion: fresh.baseline.syllabus_version, catalogues: { ...this.state.catalogues, [fresh.baseline.syllabus_version]: fresh.baseline }, contentError: null };
  }

  private async reloadLocal(): Promise<void> {
    const [stored, attempts, sessions, bookmarks, positions, allRecords, pointers, entRecord] = await Promise.all([this.store.allEvents(), this.store.attempts(), this.store.sessions(), this.store.bookmarks(), this.store.positions(), this.store.packRecords(), this.store.pointers(), this.store.entitlement()]);
    const ctx = this.state.prefs.exam_context_id;
    const active = pointers.filter(p => p.exam_context_id === ctx).map(p => allRecords.find(r => r.key === p.current)).filter((r): r is PackRecord => Boolean(r));
    const catalogues = { ...this.state.catalogues };
    for (const r of allRecords) if (!catalogues[r.pack.syllabus_version]) { const c = await this.store.catalogue(r.pack.syllabus_version); if (c) catalogues[r.pack.syllabus_version] = c; }
    const events = stored.map(s => s.event);
    this.keys = (await this.store.kvGet<PublicJwk[]>('entitlement_keys')) ?? [];
    const entitlement = await evaluateEntitlement(entRecord, this.keys, this.state.prefs.learner_id, Date.now());
    if (entRecord && Date.now() > Date.parse(entRecord.last_seen_device_time)) await this.store.saveEntitlement({ ...entRecord, last_seen_device_time: new Date().toISOString() });
    const pending = stored.filter(s => !s.synced).length;
    this.set({
      events, attempts, sessions, bookmarks, positions, allRecords, catalogues, index: new ContentIndex(active), pendingSync: pending, entitlement,
      reviews: deriveReviewStates(events, this.state.prefs.time_zone), updates: this.computeUpdates(allRecords, pointers.map(p => p.current)),
      sync: this.state.prefs.account ? (pending ? 'pending' : 'idle') : 'local_only',
    });
  }
  private computeUpdates(records: PackRecord[], currentKeys: string[]): AppPackEntry[] {
    const ctx = this.state.prefs.exam_context_id;
    return this.state.manifest.packs.filter(e => e.exam_context_id === ctx && records.some(r => r.pack.pack_id === e.pack_id && currentKeys.includes(r.key) && r.pack.pack_version !== e.pack_version));
  }

  // ---- derived selectors ---------------------------------------------------------------------------------------
  get paper(): PaperId { return this.state.prefs.active_paper; }
  context(): ExamContextRecord | null { return this.state.contexts.find(c => c.exam_context_id === this.state.prefs.exam_context_id) ?? null; }
  catalogueFor(paper: PaperId): CatalogueIndex | null {
    const version = this.state.index.packFor(paper)?.pack.syllabus_version ?? this.state.baselineVersion;
    const cat = version ? this.state.catalogues[version] : undefined;
    return cat ? indexCatalogue(cat) : null;
  }
  entitled(paper: PaperId): boolean { return entitles(this.state.entitlement, paper); }
  studyPapers(): PaperId[] { const e = this.state.prefs.selected_elective; return ['ABM', 'BFM', 'ABFM', 'BRBL', ...(e ? [e] : [])] as PaperId[]; }
  entryFor(paper: PaperId): AppPackEntry[] { return this.state.manifest.packs.filter(e => e.paper_id === paper && e.exam_context_id === this.state.prefs.exam_context_id); }
  due(paper: PaperId = this.paper): Sm2ReviewState[] { const ctx = this.state.prefs.exam_context_id; return ctx ? dueReviews(this.state.reviews.values(), paper, ctx, Date.now(), this.state.prefs.time_zone) : []; }
  private scope(paper: PaperId) { return { learnerId: this.state.prefs.learner_id, paperId: paper, examContextId: this.state.prefs.exam_context_id ?? '' }; }
  plan(paper: PaperId = this.paper): PlanContext {
    const s = this.state;
    return {
      index: s.index, paperId: paper, examContextId: s.prefs.exam_context_id ?? '', learnerId: s.prefs.learner_id, events: s.events, due: this.due(paper),
      missedObjectiveIds: missedObjectives(s.events, this.scope(paper), s.index.activeRevisions(), Date.now(), DEFAULT_EVIDENCE_CONFIG.windowDays),
      entitled: this.entitled(paper), orderedUnitIds: this.catalogueFor(paper)?.unitsOfPaper(paper).map(u => u.id) ?? [],
    };
  }
  activeAttempt(paper?: PaperId): AttemptRecord | null { return this.state.attempts.find(a => a.attempt.status === 'active' && a.attempt.learner_id === this.state.prefs.learner_id && (!paper || a.attempt.paper_id === paper)) ?? null; }
  activeSession(paper?: PaperId): StudySession | null { return this.state.sessions.find(x => x.status === 'active' && x.learner_id === this.state.prefs.learner_id && (!paper || x.paper_id === paper)) ?? null; }
  recommendation(): Recommendation {
    const cat = this.catalogueFor(this.paper);
    return recommend(this.plan(), { attempt: this.activeAttempt(this.paper), session: this.activeSession(this.paper) }, id => cat?.unit(id)?.title ?? id);
  }
  readiness(paper: PaperId = this.paper) {
    const cat = this.catalogueFor(paper); const record = this.state.index.packFor(paper); const ctx = this.context();
    // The objective denominator is "available" only for a published pack whose paper baseline is verified.
    const verified = record?.kind === 'fixture' || this.state.ledger?.papers.find(p => p.paper_id === paper)?.baseline.status === 'verified';
    const objectives = cat && verified ? cat.objectivesOfPaper(paper).map(o => o.id) : null;
    const snapshot = computeReadiness({ events: this.state.events, scope: this.scope(paper), active: this.state.index.activeRevisions(), nowMs: Date.now(), mappedObjectives: objectives, targetSeconds: paceSeconds(ctx?.config ?? null) });
    return {
      snapshot, repeats: repeatAnswerCount(this.state.events, this.scope(paper)),
      modules: cat ? moduleEvidence(this.state.events, this.scope(paper), this.state.index.activeRevisions(), cat, Date.now()) : [],
      highConfidenceErrors: highConfidenceErrors(this.state.events, this.scope(paper)).length,
    };
  }
  /** Item lookup pinned to a specific installed pack version (attempts and sessions keep their starting pack). */
  pinnedItem(packId: string, packVersion: string, itemId: string) { return this.state.allRecords.find(r => r.pack.pack_id === packId && r.pack.pack_version === packVersion)?.pack.items.find(i => i.id === itemId); }
  pinnedQuestion(a: { pack_id: string; pack_version: string }, id: string): QuestionItem | undefined { const i = this.pinnedItem(a.pack_id, a.pack_version, id); return i?.item_type === 'question' ? i : undefined; }
  pinnedCard(a: { pack_id: string; pack_version: string }, id: string): StudyCard | undefined { const i = this.pinnedItem(a.pack_id, a.pack_version, id); return i?.item_type === 'card' ? i : undefined; }
  unitOpen(paper: PaperId, unitId: string): boolean { const r = this.state.index.packFor(paper); return r ? unitAccessible(r, unitId, this.entitled(paper)) : false; }

  // ---- preferences -----------------------------------------------------------------------------------------------
  private async savePrefs(patch: Partial<Prefs>): Promise<void> { const prefs = { ...this.state.prefs, ...patch }; await this.store.savePrefs(prefs); this.set({ prefs }); }
  async completeOnboarding(examContextId: string, elective: ElectivePaperId, minutes: 5 | 10): Promise<void> {
    await this.savePrefs({ onboarded: true, exam_context_id: examContextId, selected_elective: elective, session_minutes: minutes });
    await this.reloadLocal(); await this.installStarterPacks();
    const firstWithContent = this.studyPapers().find(p => this.state.index.packFor(p));
    if (firstWithContent) await this.savePrefs({ active_paper: firstWithContent });
  }
  /** Changing paper never touches attempts, sessions or history. */
  async setPaper(paper: PaperId): Promise<void> { await this.savePrefs({ active_paper: paper }); }
  async setElective(elective: ElectivePaperId): Promise<void> {
    const wasElectiveActive = this.state.prefs.active_paper === this.state.prefs.selected_elective;
    await this.savePrefs({ selected_elective: elective, ...(wasElectiveActive ? { active_paper: elective } : {}) });
    await this.installStarterPacks();
  }
  async setExamContext(id: string): Promise<void> { await this.savePrefs({ exam_context_id: id }); await this.reloadLocal(); await this.installStarterPacks(); }
  async setSessionMinutes(m: 5 | 10): Promise<void> { await this.savePrefs({ session_minutes: m }); }
  async setTheme(t: Prefs['theme']): Promise<void> { await this.savePrefs({ theme: t }); }

  // ---- packs -------------------------------------------------------------------------------------------------------
  private async fetchPackBytes(entry: AppPackEntry): Promise<Uint8Array> {
    const gated = entry.kind === 'published' && entry.access === 'full';
    const res = gated
      ? await fetch(`${API}/packs/${encodeURIComponent(entry.pack_id)}?version=${encodeURIComponent(entry.pack_version)}`, { headers: this.state.token ? { authorization: `Bearer ${this.state.token}` } : {} })
      : await fetch(`${import.meta.env.BASE_URL}content/${entry.path}`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status === 403 || res.status === 401 ? 'This content needs an active pass.' : `Download failed (HTTP ${res.status}).`);
    return new Uint8Array(await res.arrayBuffer());
  }
  /** Downloads, verifies and atomically activates one pack. Any failure leaves the current pack untouched. */
  async installPack(entry: AppPackEntry): Promise<boolean> {
    this.set({ downloads: { ...this.state.downloads, [entry.paper_id]: { state: 'downloading' } } });
    const failed = (message: string): boolean => { this.set({ downloads: { ...this.state.downloads, [entry.paper_id]: { state: 'failed', message } } }); return false; };
    try {
      let catalogue = this.state.catalogues[entry.syllabus_version] ?? (await this.store.catalogue(entry.syllabus_version));
      if (!catalogue) { catalogue = await this.fetchJson<CurriculumCatalogue>(`catalogues/${entry.syllabus_version}.json`); await this.store.saveCatalogue(catalogue); }
      const bytes = await this.fetchPackBytes(entry);
      const verified = await verifyPackBytes(bytes, entry, catalogue, CLIENT_VERSION, new Date().toISOString());
      if (!verified.ok) return failed(`${verified.message} Your existing content and progress are unchanged.`);
      await this.store.activatePack(verified.record);
      await this.store.pruneUnusedPacks();
      this.state = { ...this.state, catalogues: { ...this.state.catalogues, [catalogue.syllabus_version]: catalogue } };
      await this.reloadLocal();
      this.set({ downloads: { ...this.state.downloads, [entry.paper_id]: { state: 'done' } } });
      return true;
    } catch (e) {
      if (e instanceof StorageError && e.kind === 'quota') return failed('There is not enough free storage on this device. Free some space and retry. Nothing was removed.');
      return failed(`${this.state.online ? (e as Error).message : 'You are offline.'} Your existing content and progress are unchanged.`);
    }
  }
  /** First run / context change: activates bundled free and fixture packs that are not installed yet. */
  private async installStarterPacks(): Promise<void> {
    const ctx = this.state.prefs.exam_context_id; if (!ctx) return;
    const pointers = await this.store.pointers();
    for (const entry of this.state.manifest.packs) {
      if (entry.exam_context_id !== ctx || !(entry.kind === 'fixture' || entry.access === 'free')) continue;
      if (pointers.some(p => p.paper_id === entry.paper_id && p.exam_context_id === ctx)) continue; // installed: newer versions surface as "update available"
      await this.installPack(entry);
    }
  }
  async removePaperContent(paper: PaperId): Promise<void> {
    const ctx = this.state.prefs.exam_context_id; if (!ctx) return;
    const r = await this.store.removePaperContent(ctx, paper);
    this.toast(r.removed ? 'Downloaded content removed. Your history and bookmarks are kept.' : r.reason ?? 'Could not remove content.');
    await this.reloadLocal();
  }

  // ---- event persistence -------------------------------------------------------------------------------------------
  private async commit(drafts: NewEvent[], related: Parameters<Store['appendEvents']>[2] = []): Promise<LearnerEvent[]> {
    const { prefs, events } = await this.store.appendEvents(this.state.prefs, drafts, related);
    const all = [...this.state.events, ...events];
    this.state = { ...this.state, prefs, events: all, reviews: deriveReviewStates(all, prefs.time_zone), pendingSync: this.state.pendingSync + events.length, sync: prefs.account ? 'pending' : 'local_only' };
    return events;
  }
  private fail(e: unknown): void {
    this.toast(e instanceof StorageError && e.kind === 'quota' ? 'Could not save: device storage is full. Your last action was not recorded. Free some space and try again.' : 'Could not save your last action. Check device storage and try again.');
  }
  private replaceSession(s: StudySession): void { this.set({ sessions: [...this.state.sessions.filter(x => x.session_id !== s.session_id), s] }); }
  private replaceAttempt(a: AttemptRecord): void { this.set({ attempts: [...this.state.attempts.filter(x => x.attempt.attempt_id !== a.attempt.attempt_id), a] }); }

  // ---- study sessions ------------------------------------------------------------------------------------------------
  private async startSession(kind: StudySession['kind'], title: string, reason: string, steps: StudyStep[], estimate: number): Promise<string | null> {
    const record = this.state.index.packFor(this.paper); const ctx = this.state.prefs.exam_context_id;
    if (!record || !ctx || !steps.length) { this.toast('There is nothing available to study here yet.'); return null; }
    const existing = this.activeSession();
    try {
      if (existing) await this.store.saveSession({ ...existing, status: 'abandoned' }); // recorded progress and events are kept
      const s = buildSession({ sessionId: uuid(), learnerId: this.state.prefs.learner_id, paperId: this.paper, examContextId: ctx, record, kind, title, reason, steps, estimateSeconds: estimate, nowMs: Date.now() });
      await this.store.saveSession(s);
      this.set({ sessions: [...this.state.sessions.filter(x => x.session_id !== existing?.session_id), ...(existing ? [{ ...existing, status: 'abandoned' as const }] : []), s] });
      return s.session_id;
    } catch (e) { this.fail(e); return null; }
  }
  async startUnit(unitId: string): Promise<string | null> {
    const cards = this.state.index.cards(this.paper, unitId); const title = this.catalogueFor(this.paper)?.unit(unitId)?.title ?? 'Lesson';
    const pos = this.state.positions.find(p => p.key === `${this.state.prefs.learner_id}:${unitId}`);
    const startAt = pos ? Math.max(0, cards.findIndex(c => c.id === pos.item_id)) : 0;
    const ordered = [...cards.slice(startAt), ...cards.slice(0, startAt)];
    return this.startSession('lesson', title, startAt > 0 ? 'Continuing from where you stopped.' : '', ordered.map(c => cardStep(c)), ordered.reduce((n, c) => n + cardSeconds(c), 0));
  }
  async startReviews(): Promise<string | null> {
    const cards = this.due().map(d => this.state.index.card(d.item_id)).filter((c): c is StudyCard => Boolean(c));
    return this.startSession('review', 'Due reviews', 'Scheduled for today or earlier.', cards.map(c => cardStep(c, 'review')), cards.length * (SELF_CHECK_SECONDS + 20));
  }
  async startPreset(minutes: 5 | 10): Promise<string | null> {
    const p = presetSteps(this.plan(), minutes);
    return this.startSession('preset', `${minutes}-minute session`, p.reason, p.steps, p.estimateSeconds);
  }
  async startRemediation(): Promise<string | null> {
    const cards = remediationCards(this.plan()).slice(0, 6);
    return this.startSession('remediation', 'Missed objectives', 'Cards for objectives you answered wrongly on first attempt.', cards.map(c => cardStep(c)), cards.reduce((n, c) => n + cardSeconds(c), 0));
  }
  async startNextNew(): Promise<string | null> { const next = nextUnstudiedCards(this.plan())[0]; return next ? this.startUnit(next.unit_id) : null; }
  session(id: string): StudySession | undefined { return this.state.sessions.find(s => s.session_id === id); }
  async sessionReveal(id: string, index: number): Promise<void> {
    const s = this.session(id); if (!s) return;
    try { const next = revealStep(s, index); await this.store.saveSession(next); this.replaceSession(next); } catch (e) { this.fail(e); }
  }
  async sessionAnswer(id: string, index: number, q: QuestionItem, response: string, elapsedMs: number): Promise<{ ok: true; correct: boolean } | { ok: false; message: string }> {
    const s = this.session(id); if (!s) return { ok: false, message: 'Session not found.' };
    const r = answerSelfCheckQuestion(s, index, q, response, elapsedMs, Date.now());
    if (!r.ok) return { ok: false, message: r.grade.message };
    try {
      const saved = await this.commit(r.events, [this.store.sessionOp(r.session)]);
      const linked = saved[0] ? linkAnswerEvent(r.session, index, saved[0].event_id) : r.session;
      if (saved[0]) await this.store.saveSession(linked);
      this.replaceSession(linked);
      return { ok: true, correct: r.grade.is_correct };
    } catch (e) { this.fail(e); return { ok: false, message: 'Your answer could not be saved. Try again.' }; }
  }
  async sessionRate(id: string, index: number, card: StudyCard, rating: Sm2Rating): Promise<Sm2Rating | null> {
    const s = this.session(id); if (!s) return null;
    const r = rateStep(s, index, card, rating, Date.now());
    try {
      const pos: ReadingPosition = { key: `${s.learner_id}:${card.unit_id}`, unit_id: card.unit_id, item_id: s.steps[index + 1]?.item_id ?? card.id, updated_at: new Date().toISOString() };
      await this.commit(r.events, [this.store.sessionOp(r.session), { table: 'positions', key: pos.key, type: 'put', value: pos }]);
      this.set({ sessions: [...this.state.sessions.filter(x => x.session_id !== id), r.session], positions: [...this.state.positions.filter(p => p.key !== pos.key), pos] });
      return r.effective;
    } catch (e) { this.fail(e); return null; }
  }
  async endSession(id: string): Promise<void> {
    const s = this.session(id); if (!s || s.status !== 'active') return;
    try { const next = { ...s, status: 'abandoned' as const }; await this.store.saveSession(next); this.replaceSession(next); } catch (e) { this.fail(e); }
  }

  // ---- practice and mocks ----------------------------------------------------------------------------------------------
  attempt(id: string): AttemptRecord | undefined { return this.state.attempts.find(a => a.attempt.attempt_id === id); }
  private attemptArgs(questions: readonly QuestionItem[], title: string, origin: AttemptRecord['origin']) {
    const record = this.state.index.packFor(this.paper); const context = this.context();
    return record && context ? { attemptId: uuid(), learnerId: this.state.prefs.learner_id, paperId: this.paper, context, record, questions, title, origin, nowMs: Date.now() } : null;
  }
  /** Starting a new attempt is refused while another is unfinished, so work is never silently discarded. */
  private blockedByActive(): boolean {
    const a = this.activeAttempt();
    if (a) this.toast(`Finish or end your unfinished ${a.attempt.mode === 'mock' ? 'mock' : 'practice set'} (${a.title}) first.`);
    return Boolean(a);
  }
  async startPractice(kind: 'unit' | 'remediation' | 'numeric' | 'case_study' | 'preset', ref: string | null): Promise<string | null> {
    if (this.blockedByActive()) return null;
    const plan = this.plan(); const cat = this.catalogueFor(this.paper);
    let qs: QuestionItem[]; let title: string; let limit: number | undefined = 10;
    if (kind === 'unit' && ref) { qs = unseenFirst(plan, accessibleQuestions(plan, ref).filter(q => !q.case_study_id)); title = cat?.unit(ref)?.title ?? 'Topic practice'; }
    else if (kind === 'remediation') { qs = remediationQuestions(plan).filter(q => !q.case_study_id); title = 'Missed objectives'; }
    else if (kind === 'numeric') { qs = unseenFirst(plan, accessibleQuestions(plan).filter(q => q.question_type === 'numeric_input' && !q.case_study_id)); title = 'Numerical questions'; }
    else if (kind === 'case_study' && ref) { const cs = this.state.index.caseStudy(ref); qs = cs ? cs.question_ids.map(id => this.state.index.question(id)).filter((q): q is QuestionItem => Boolean(q)) : []; title = cs?.title ?? 'Case study'; limit = undefined; }
    else { qs = unseenFirst(plan, accessibleQuestions(plan).filter(q => !q.case_study_id)); title = 'Mixed practice'; }
    const args = this.attemptArgs(qs, title, { kind, ref });
    const record = args ? buildPracticeAttempt(args, limit) : null;
    if (!record) { this.toast('No questions are available for this selection yet.'); return null; }
    try { await this.store.saveAttempt(record); this.replaceAttempt(record); return record.attempt.attempt_id; } catch (e) { this.fail(e); return null; }
  }
  mockAvailability(): { ok: true; questionCount: number; durationSeconds: number; full: boolean } | { ok: false; reason: string } {
    const args = this.attemptArgs(accessibleQuestions(this.plan()), 'Timed mock', { kind: 'mock', ref: null });
    if (!args) return { ok: false, reason: 'No content is installed for this paper.' };
    const built = buildMockAttempt(args);
    return built.ok ? { ok: true, questionCount: built.questionCount, durationSeconds: built.durationSeconds, full: built.full } : built;
  }
  async startMock(): Promise<string | null> {
    if (this.blockedByActive()) return null;
    const args = this.attemptArgs(accessibleQuestions(this.plan()), 'Timed mock', { kind: 'mock', ref: null });
    const built = args ? buildMockAttempt(args) : null;
    if (!built?.ok) { this.toast(built ? built.reason : 'No content is installed for this paper.'); return null; }
    try { await this.store.saveAttempt(built.record); this.replaceAttempt(built.record); return built.record.attempt.attempt_id; } catch (e) { this.fail(e); return null; }
  }
  private async saveAttempt(next: AttemptRecord): Promise<boolean> { try { await this.store.saveAttempt(next); this.replaceAttempt(next); return true; } catch (e) { this.fail(e); return false; } }
  async attemptSetResponse(id: string, itemId: string, response: string | null): Promise<void> { const a = this.attempt(id); if (a?.attempt.status === 'active' && !a.submitted_item_ids.includes(itemId)) await this.saveAttempt(withResponse(a, itemId, response)); }
  async attemptFlag(id: string, itemId: string, flagged: boolean): Promise<void> { const a = this.attempt(id); if (a?.attempt.status === 'active') await this.saveAttempt(withFlag(a, itemId, flagged)); }
  async attemptGoto(id: string, index: number, spentMs: number): Promise<void> {
    const a = this.attempt(id); if (!a || a.attempt.status !== 'active') return;
    const current = a.attempt.question_order[a.current_index]?.item_id;
    const timed = current && !a.submitted_item_ids.includes(current) ? withTiming(a, current, spentMs) : a;
    await this.saveAttempt({ ...timed, current_index: Math.max(0, Math.min(index, a.attempt.question_order.length - 1)) });
  }
  async practiceSubmit(id: string, q: QuestionItem, response: string, spentMs: number): Promise<{ ok: true; correct: boolean } | { ok: false; message: string }> {
    const a = this.attempt(id); if (!a || a.attempt.status !== 'active') return { ok: false, message: 'This practice set is no longer active.' };
    const timed = withTiming(a, q.id, spentMs);
    const revealedBefore = this.state.events.some(e => e.item_id === q.id && e.learner_id === this.state.prefs.learner_id && e.event_type === 'answer_submitted'); // feedback was shown on an earlier attempt
    let r; try { r = submitPracticeAnswer(timed, q, response, revealedBefore, Date.now()); } catch { return { ok: false, message: 'This answer was already submitted.' }; }
    if (!r.ok) return { ok: false, message: r.grade.message };
    try { await this.commit(r.events, [this.store.attemptOp(r.record)]); this.replaceAttempt(r.record); return { ok: true, correct: r.grade.is_correct }; }
    catch (e) { this.fail(e); return { ok: false, message: 'Your answer could not be saved. Try again.' }; }
  }
  async practiceFinish(id: string): Promise<void> { const a = this.attempt(id); if (a?.attempt.status === 'active' && a.attempt.mode === 'practice') await this.saveAttempt(finishPractice(a, Date.now())); }
  async mockSubmit(id: string, reason: 'submitted' | 'expired', spentMs = 0): Promise<void> {
    let a = this.attempt(id); const ctx = a ? this.state.contexts.find(c => c.exam_context_id === a!.attempt.exam_context_id) : null;
    if (!a || a.attempt.status !== 'active' || a.attempt.mode !== 'mock' || !ctx) return;
    const current = a.attempt.question_order[a.current_index]?.item_id; if (current && spentMs) a = withTiming(a, current, spentMs);
    try {
      const graded = gradeMock(a, qid => this.pinnedQuestion(a!.attempt, qid), ctx, Date.now(), reason);
      await this.commit(graded.events, [this.store.attemptOp(graded.record)]); this.replaceAttempt(graded.record);
    } catch (e) { this.fail(e); }
  }
  /** Expires any mock whose persisted deadline has passed (also on reopen), and refreshes entitlement state. */
  async tick(): Promise<void> {
    if (this.state.phase !== 'ready') return;
    for (const a of this.state.attempts) if (a.attempt.status === 'active' && a.attempt.mode === 'mock' && attemptClock(a.attempt, Date.now()).expired) await this.mockSubmit(a.attempt.attempt_id, 'expired');
    const ent = await evaluateEntitlement(await this.store.entitlement(), this.keys, this.state.prefs.learner_id, Date.now());
    if (ent.state !== this.state.entitlement.state) this.set({ entitlement: ent });
  }
  /** Paid content already in progress may finish by its own deadline; new paid work needs valid access. */
  attemptAllowed(a: AttemptRecord): boolean {
    const record = this.state.allRecords.find(r => r.pack.pack_id === a.attempt.pack_id && r.pack.pack_version === a.attempt.pack_version);
    if (!record || record.access === 'free') return true;
    return mayContinueStartedSession(a.attempt.started_at, a.attempt.expires_at_iso, this.state.entitlement, Date.now()) || a.attempt.question_order.every(q => { const item = this.pinnedQuestion(a.attempt, q.item_id); return item ? record.free_unit_ids.includes(item.unit_id) : false; });
  }

  // ---- bookmarks ---------------------------------------------------------------------------------------------------------
  isBookmarked(itemId: string): boolean { return this.state.bookmarks.some(b => b.item_id === itemId); }
  async toggleBookmark(itemId: string, paper: PaperId): Promise<void> {
    const on = !this.isBookmarked(itemId); const b: Bookmark = { item_id: itemId, paper_id: paper, created_at: new Date().toISOString() };
    try { await this.store.setBookmark(b, on); this.set({ bookmarks: on ? [...this.state.bookmarks, b] : this.state.bookmarks.filter(x => x.item_id !== itemId) }); } catch (e) { this.fail(e); }
  }

  // ---- account, sync and purchases -----------------------------------------------------------------------------------------
  private async api<T>(method: string, path: string, body?: unknown): Promise<T> {
    let res: Response;
    try { res = await fetch(`${API}${path}`, { method, headers: { ...(this.state.token ? { authorization: `Bearer ${this.state.token}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }); }
    catch { this.set({ apiReachable: false }); throw new ApiError(0, 'unreachable', this.state.online ? 'The account service cannot be reached right now.' : 'You are offline.'); }
    const isJson = (res.headers.get('content-type') ?? '').includes('application/json');
    if (!isJson) { this.set({ apiReachable: false }); throw new ApiError(res.status, 'unreachable', 'The account service is not available.'); }
    this.set({ apiReachable: true });
    const data = await res.json() as { error?: { code: string; message: string } };
    if (!res.ok) {
      if (res.status === 401 && this.state.token) { await this.store.kvPut('auth_token', null); this.set({ token: null }); }
      throw new ApiError(res.status, data.error?.code ?? 'error', data.error?.message ?? 'Request failed.');
    }
    return data as T;
  }
  private async afterOnline(): Promise<void> {
    if (!this.state.online || this.state.phase !== 'ready') return;
    try { const k = await this.api<{ keys: PublicJwk[] }>('GET', '/entitlement/keys'); this.keys = k.keys; await this.store.kvPut('entitlement_keys', k.keys); } catch { /* optional service */ }
    if (this.state.token) { await this.refreshEntitlement(); await this.syncNow(); }
  }
  async loadOffers(): Promise<void> { try { this.set({ offers: await this.api<OffersInfo>('GET', '/offers') }); } catch { this.set({ offers: null }); } }
  async requestCode(email: string): Promise<string | null> { try { await this.api('POST', '/auth/request-code', { email }); return null; } catch (e) { return (e as Error).message; } }
  /** Development convenience: reads the code the local server logged. Unavailable outside the local simulation. */
  async devLastCode(email: string): Promise<string | null> { try { return (await this.api<{ code: string | null }>('GET', `/dev/last-code?email=${encodeURIComponent(email)}`)).code; } catch { return null; } }
  async verifyCode(email: string, code: string): Promise<string | null> {
    try {
      const r = await this.api<{ token: string; account: { account_id: string; email: string } }>('POST', '/auth/verify-code', { email, code });
      await this.store.kvPut('auth_token', r.token);
      // Local trial history is kept and relabelled to the account identity; event IDs do not change.
      const prefs = await this.store.relabelLearner(this.state.prefs, r.account.account_id, r.account);
      this.state = { ...this.state, prefs, token: r.token };
      await this.reloadLocal(); await this.refreshEntitlement(); void this.syncNow();
      return null;
    } catch (e) { return (e as Error).message; }
  }
  async signOut(): Promise<void> {
    try { await this.api('POST', '/auth/logout'); } catch { /* local sign-out still proceeds */ }
    await this.store.kvPut('auth_token', null);
    this.set({ token: null, purchases: [], checkout: { step: 'idle' } });
    this.toast('Signed out. Your study history stays on this device.');
  }
  private async storeEntitlement(signed: SignedOfflineEntitlement | null, serverTime: string): Promise<void> {
    if (signed) await this.store.saveEntitlement({ signed, last_trusted_server_time: serverTime, last_seen_device_time: new Date().toISOString() } satisfies EntitlementRecord);
    else await this.store.saveEntitlement(null); // the server says there is no active access (expired, refunded or revoked)
    const entitlement = await evaluateEntitlement(await this.store.entitlement(), this.keys, this.state.prefs.learner_id, Date.now());
    // A "payment verified" message must not outlive the access it announced (for example after a refund).
    this.set({ entitlement, ...(entitlement.state !== 'valid' && this.state.checkout.step === 'confirmed' ? { checkout: { step: 'idle' as const } } : {}) });
  }
  async refreshEntitlement(): Promise<boolean> {
    if (!this.state.token) return false;
    try {
      const r = await this.api<{ entitlement: SignedOfflineEntitlement | null; server_time: string }>('GET', '/entitlement');
      await this.storeEntitlement(r.entitlement, r.server_time);
      const acct = await this.api<{ purchases: PurchaseRecord[] }>('GET', '/account'); this.set({ purchases: acct.purchases });
      return true;
    } catch { return false; }
  }
  async restorePurchases(): Promise<string> {
    if (!this.state.token) return 'Sign in with the email you used to buy the pass.';
    try {
      const r = await this.api<{ purchases: PurchaseRecord[]; entitlement: SignedOfflineEntitlement | null; server_time: string }>('POST', '/purchases/restore');
      await this.storeEntitlement(r.entitlement, r.server_time); this.set({ purchases: r.purchases });
      if (r.entitlement) { await this.installEntitledPacks(); return 'Your pass has been restored on this device.'; }
      return r.purchases.length ? 'No active pass was found. Earlier purchases on this account have expired or were refunded.' : 'No purchase was found for this account. Check that you signed in with the email used to buy the pass.';
    } catch (e) { return (e as Error).message; }
  }
  private async installEntitledPacks(): Promise<void> {
    for (const paper of this.studyPapers()) { const full = this.entryFor(paper).find(e => e.kind === 'published' && e.access === 'full'); if (full && this.entitled(paper) && this.state.index.packFor(paper)?.key !== `${full.pack_id}@${full.pack_version}`) await this.installPack(full); }
  }
  setReturnTo(hash: string | null): void { this.set({ returnTo: hash }); }
  async startCheckout(productId: string): Promise<void> {
    this.set({ checkout: { step: 'creating' } });
    try {
      let key = await this.store.kvGet<string>('checkout_key');
      if (!key) { key = `ck_${uuid().replace(/-/g, '')}`; await this.store.kvPut('checkout_key', key); } // reused on retry so a retry never creates a second order
      const o = await this.api<{ order_id: string; provider_order_id: string; amount_minor: number; key_id: string; simulated: boolean }>('POST', '/checkout/orders', { product_id: productId, idempotency_key: key });
      await this.store.kvPut('pending_order', o.order_id);
      this.set({ checkout: { step: 'awaiting_payment', order_id: o.order_id, provider_order_id: o.provider_order_id, amount_minor: o.amount_minor, key_id: o.key_id, simulated: o.simulated } });
    } catch (e) { this.set({ checkout: { step: 'failed', message: (e as Error).message, order_id: null } }); }
  }
  /** Hand-back from the provider checkout. Access is decided by the server's verification, not by this call succeeding. */
  async completeCheckout(orderId: string, providerPaymentId: string, signature: string): Promise<void> {
    this.set({ checkout: { step: 'verifying', order_id: orderId } });
    try {
      const r = await this.api<{ status: string; entitlement: SignedOfflineEntitlement | null; server_time: string; purchase: PurchaseRecord | null }>('POST', '/checkout/verify', { order_id: orderId, provider_payment_id: providerPaymentId, signature });
      await this.applyOutcome(orderId, r);
    } catch (e) {
      if ((e as ApiError).code === 'unreachable') this.set({ checkout: { step: 'pending', order_id: orderId, message: 'We could not confirm your payment yet. Do not pay again: reopen this screen when you are online and we will check with the payment provider.' } });
      else this.set({ checkout: { step: 'failed', message: (e as Error).message, order_id: orderId } });
    }
  }
  private async applyOutcome(orderId: string, r: { status: string; entitlement: SignedOfflineEntitlement | null; server_time: string; purchase: PurchaseRecord | null }): Promise<void> {
    if (r.status === 'verified' && r.entitlement && r.purchase?.access_expires_at) {
      await this.storeEntitlement(r.entitlement, r.server_time); await this.store.kvPut('pending_order', null); await this.store.kvPut('checkout_key', null);
      this.set({ checkout: { step: 'confirmed', expires_at: r.purchase.access_expires_at } });
      await this.installEntitledPacks(); void this.refreshEntitlement();
    } else if (r.status === 'pending') this.set({ checkout: { step: 'pending', order_id: orderId, message: 'Your payment is still being processed by the provider. Do not pay again. Check again in a few minutes.' } });
    else { await this.store.kvPut('checkout_key', null); this.set({ checkout: { step: 'failed', order_id: orderId, message: r.status === 'refunded' ? 'This payment was refunded, so no access was granted.' : 'The payment did not go through. You have not been given access and can try again.' } }); }
  }
  /** Recovers a checkout interrupted by closing the app: asks the server, which asks the provider. */
  async recheckPendingOrder(): Promise<void> {
    const orderId = await this.store.kvGet<string>('pending_order'); if (!orderId || !this.state.token) return;
    this.set({ checkout: { step: 'verifying', order_id: orderId } });
    try { await this.applyOutcome(orderId, await this.api('GET', `/checkout/orders/${orderId}`)); }
    catch (e) { this.set({ checkout: { step: 'pending', order_id: orderId, message: (e as Error).message } }); }
  }
  async hasPendingOrder(): Promise<boolean> { return Boolean(await this.store.kvGet<string>('pending_order')); }
  async cancelCheckout(): Promise<void> { const c = this.state.checkout; if (c.step === 'awaiting_payment') this.set({ checkout: { step: 'cancelled', order_id: c.order_id } }); else this.set({ checkout: { step: 'idle' } }); }
  resetCheckout(): void { this.set({ checkout: { step: 'idle' } }); }
  /** LOCAL SIMULATION only: stands in for the provider's checkout window during development. */
  async simulatePayment(outcome: 'captured' | 'authorized' | 'failed'): Promise<void> {
    const c = this.state.checkout; if (c.step !== 'awaiting_payment' || !c.simulated) return;
    try { const p = await this.api<{ provider_payment_id: string; signature: string }>('POST', '/dev/sim/pay', { order_id: c.order_id, outcome }); await this.completeCheckout(c.order_id, p.provider_payment_id, p.signature); }
    catch (e) { this.set({ checkout: { step: 'failed', message: (e as Error).message, order_id: c.order_id } }); }
  }
  async simulateRefund(purchaseId: string): Promise<void> { try { await this.api('POST', '/dev/sim/refund', { purchase_id: purchaseId }); await this.refreshEntitlement(); this.toast('Simulated refund processed.'); } catch (e) { this.toast((e as Error).message); } }

  /** Uploads unsent events (idempotent by event ID) and merges events from other devices. */
  async syncNow(): Promise<void> {
    if (!this.state.token || !this.state.prefs.account) { this.set({ sync: 'local_only' }); return; }
    if (!this.state.online) { this.set({ sync: this.state.pendingSync ? 'pending' : 'idle' }); return; }
    this.set({ sync: 'syncing' });
    try {
      let pending = await this.store.pendingEvents();
      while (pending.length) {
        const batch = pending.slice(0, 400);
        const ack = await this.api<{ accepted_event_ids: string[]; duplicate_event_ids: string[]; rejected: { event_id: string }[] }>('POST', '/progress/events', { events: batch, after_cursor: null });
        const done = [...ack.accepted_event_ids, ...ack.duplicate_event_ids, ...ack.rejected.map(r => r.event_id)];
        await this.store.markSynced(done);
        if (!done.length) break; pending = pending.slice(batch.length);
      }
      let cursor = (await this.store.kvGet<string>(`sync_cursor:${this.state.prefs.learner_id}`)) ?? '0'; let more = true;
      while (more) {
        const ch = await this.api<{ events: LearnerEvent[]; next_cursor: string; has_more: boolean }>('GET', `/progress/changes?cursor=${encodeURIComponent(cursor)}`);
        await this.store.mergeRemoteEvents(ch.events); cursor = ch.next_cursor; more = ch.has_more;
        await this.store.kvPut(`sync_cursor:${this.state.prefs.learner_id}`, cursor);
      }
      await this.reloadLocal();
    } catch { this.set({ sync: 'error' }); }
  }
}

export const model = new AppModel();
export const PAPER_ORDER: PaperId[] = ['ABM', 'BFM', 'ABFM', 'BRBL', 'CB', 'RM', 'ITDB', 'HRM', 'RB'];
