import { PAPER_NAMES } from '../../core/catalogue.ts';
import { DEFAULT_EVIDENCE_CONFIG } from '../../core/evidence.ts';
import { formatDate } from '../../core/time.ts';
import { go, useApp } from '../hooks.ts';
import { model } from '../model.ts';
import { Banner, Button, Empty, Icon, More, ProgressRing, Tag, minutesLabel } from '../ui.tsx';

const pct = (n: number | null): string => (n === null ? '—' : `${Math.round(n)}%`);

export function Today() {
  const s = useApp(); const paper = s.prefs.active_paper; const rec = model.recommendation(); const record = s.index.packFor(paper);
  const due = model.due(); const elsewhere = [...s.attempts.filter(a => a.attempt.status === 'active' && a.attempt.paper_id !== paper).map(a => ({ id: a.attempt.attempt_id, kind: 'attempt' as const, title: a.title, paper: a.attempt.paper_id })), ...s.sessions.filter(x => x.status === 'active' && x.paper_id !== paper).map(x => ({ id: x.session_id, kind: 'session' as const, title: x.title, paper: x.paper_id }))];
  const r = model.readiness(); const studied = r.snapshot.completed_objectives;
  const cat = model.catalogueFor(paper);
  const studiedCards = new Set(s.events.filter(e => e.event_type === 'lesson_completed' && e.learner_id === s.prefs.learner_id && e.exam_context_id === s.prefs.exam_context_id).map(e => e.item_id));
  const run = async () => {
    let id: string | null = null;
    if (rec.kind === 'resume_attempt' && rec.ref) return go(`attempt/${rec.ref}`);
    if (rec.kind === 'resume_session' && rec.ref) return go(`session/${rec.ref}`);
    if (rec.kind === 'reviews') id = await model.startReviews();
    else if (rec.kind === 'remediation') id = await model.startRemediation();
    else if (rec.kind === 'learn' && rec.ref) id = await model.startUnit(rec.ref);
    else if (rec.kind === 'practice') { const a = await model.startPractice('preset', null); if (a) go(`attempt/${a}`); return; }
    if (id) go(`session/${id}`);
  };
  const preset = async (m: 5 | 10) => { const id = await model.startPreset(m); if (id) go(`session/${id}`); };
  return (
    <>
      <div className="section"><h1>Today</h1><p className="support">What to do next in {PAPER_NAMES[paper]}</p></div>
      {elsewhere.map(e => <Banner key={e.id} action={<Button variant="outlined" onClick={() => { void model.setPaper(e.paper).then(() => go(`${e.kind}/${e.id}`)); }}>Resume</Button>}>You have an unfinished {e.kind === 'attempt' ? 'practice or mock' : 'study session'} in {PAPER_NAMES[e.paper]}: {e.title}. It is saved and waiting.</Banner>)}
      {rec.kind === 'none' ? (
        <Empty title={rec.title} action={<div className="actions"><Button variant="filled" href="#/coverage">See the coverage map</Button></div>}>{record ? rec.reason : `Lessons and questions for ${PAPER_NAMES[paper]} have not been published yet. Nothing is hidden behind payment here: the content does not exist yet. Use the paper selector to choose another paper.`}</Empty>
      ) : (
        <section className="card primary hero" data-paper={paper} aria-labelledby="rec-title">
          <div className="row between"><span className="eyebrow">{rec.kind.startsWith('resume') ? 'Continue where you stopped' : rec.kind === 'reviews' ? 'Your revision, ready' : 'Recommended next'}</span><Icon name={rec.kind === 'reviews' ? 'clock' : 'learn'} /></div>
          <h1 id="rec-title">{rec.title}</h1>
          <p>{rec.reason}</p>
          <p className="label">{minutesLabel(rec.minutes)}{rec.minutes !== null ? ' (estimate)' : ''}</p>
          <Button variant="filled" block onClick={() => void run()}>{rec.kind.startsWith('resume') ? 'Resume' : 'Start'}<Icon name="chevron" size={20} /></Button>
        </section>
      )}
      {record && rec.kind !== 'none' && (
        <section className="section" aria-labelledby="quick">
          <h2 id="quick">Or choose a short session</h2>
          <p className="support">Due reviews first, then objectives you missed, then new cards, sized to fit the time. You can stop early; progress is saved after every step.</p>
          <div className="actions"><Button variant="tonal" onClick={() => void preset(5)}>5 minutes</Button><Button variant="tonal" onClick={() => void preset(10)}>10 minutes</Button></div>
                  </section>
      )}
      {record && (
        <section className="section" aria-labelledby="module-progress">
          <div className="row between"><h2 id="module-progress">Your study by module</h2><Button href="#/learn">Continue learning <Icon name="chevron" size={18} /></Button></div>
          <p className="support">Published cards studied in this exam session. Study progress is separate from assessed accuracy.</p>
          <div className="module-grid">{cat?.modulesOf(paper).map(m => {
            const cards = cat.unitsOf(m.id).flatMap(u => s.index.cards(paper, u.id));
            const done = cards.filter(c => studiedCards.has(c.id)).length;
            return <a className="module-card" href="#/learn" key={m.id}>
              <ProgressRing done={done} total={cards.length} label={m.title ?? m.id} />
              <span className="grow"><strong>{m.title ?? m.id}</strong><span className="support">{cards.length ? `${done} of ${cards.length} published cards studied` : 'No cards published yet'}</span></span><Icon name="chevron" size={20} />
            </a>;
          })}</div>
        </section>
      )}
      {record && (
        <section className="section" aria-labelledby="prog">
          <h2 id="prog">Progress in this paper</h2>
          <div className="stat-grid">
            {due.length > 0 ? <button type="button" className="stat tap" onClick={() => void model.startReviews().then(id => { if (id) go(`session/${id}`); })}><b>{due.length}</b><span className="support">review{due.length === 1 ? '' : 's'} due · start</span></button> : <div className="stat"><b>0</b><span className="support">reviews due</span></div>}
            <div className="stat"><b>{studied}{r.snapshot.mapped_objectives_total !== null ? ` / ${r.snapshot.mapped_objectives_total}` : ''}</b><span className="support">objectives studied</span></div>
            <div className="stat"><b>{r.snapshot.eligible_accuracy_questions ? pct(r.snapshot.assessed_accuracy_pct) : '—'}</b><span className="support">{r.snapshot.eligible_accuracy_questions ? `first-attempt accuracy (${r.snapshot.eligible_accuracy_questions} questions)` : 'no scored practice yet'}</span></div>
          </div>
          <div className="row"><Button variant="outlined" href="#/performance">Detailed performance</Button></div>
        </section>
      )}
      <p className="support">{s.sync === 'local_only' ? 'Progress is saved on this device only.' : s.sync === 'pending' ? `${s.pendingSync} action${s.pendingSync === 1 ? '' : 's'} saved on this device and waiting to sync.` : s.sync === 'syncing' ? 'Syncing…' : s.sync === 'error' ? 'Sync could not finish. Your progress is safe on this device and will be retried.' : `Synced to ${s.prefs.account?.email ?? 'your account'}.`}
        {(s.sync === 'pending' || s.sync === 'error') && s.online && <> <Button onClick={() => void model.syncNow()}>Sync now</Button></>}</p>
    </>
  );
}

export function Performance() {
  const s = useApp(); const paper = s.prefs.active_paper; const r = model.readiness(); const snap = r.snapshot; const cfg = DEFAULT_EVIDENCE_CONFIG;
  const mocks = s.attempts.filter(a => a.attempt.mode === 'mock' && a.attempt.status !== 'active' && a.attempt.paper_id === paper && a.result).sort((a, b) => (a.attempt.started_at < b.attempt.started_at ? 1 : -1));
  const sufficient = snap.evidence_status === 'sufficient_evidence';
  return (
    <>
      <div className="section"><h1>Performance</h1><p className="support">{PAPER_NAMES[paper]} · evidence from {formatDate(snap.window_start)} to {formatDate(snap.window_end)}</p></div>
      <section className="section" aria-labelledby="sep"><h2 id="sep">What the evidence shows</h2>
        <dl className="kv">
          <dt>Study coverage</dt><dd>{snap.study_coverage_pct === null ? `${snap.completed_objectives} objective${snap.completed_objectives === 1 ? '' : 's'} studied; total not yet known` : `${pct(snap.study_coverage_pct)} (${snap.completed_objectives} of ${snap.mapped_objectives_total} objectives)`}</dd>
          <dt>Assessed accuracy</dt><dd>{snap.eligible_accuracy_questions ? `${pct(snap.assessed_accuracy_pct)} on ${snap.eligible_accuracy_questions} first-attempt question${snap.eligible_accuracy_questions === 1 ? '' : 's'}` : 'No scored first attempts in the last 30 days'}</dd>
          <dt>Pace</dt><dd>{snap.speed_score_pct === null ? `${snap.eligible_timed_questions} timed question${snap.eligible_timed_questions === 1 ? '' : 's'}${model.context()?.config ? '' : '; target pace unavailable until the exam configuration is verified'}` : `${pct(snap.speed_score_pct)} on ${snap.eligible_timed_questions} timed questions`}</dd>
          <dt>Reviews due</dt><dd>{model.due().length}</dd>
          <dt>Repeat answers</dt><dd>{r.repeats} (kept separate; repeats never raise accuracy)</dd>
        </dl>
        <p className="support">Study coverage means a lesson was completed and its self-check submitted. It is not mastery. Self-rated recall never counts as a correct answer.</p>
      </section>
      <section className="section" aria-labelledby="weak"><h2 id="weak">Areas to revisit</h2>
        {r.modules.length === 0 ? <p className="support">No syllabus structure is available for this paper yet.</p> : (
          <ul className="list">{r.modules.map(m => (
            <li key={m.moduleId}><div className="item" aria-disabled="true"><span className="grow"><span className="title">{m.title}</span><span className="meta" style={{ display: 'block' }}>{m.status === 'not_enough_practice' ? `Not enough practice yet (${m.sample} of ${cfg.weakMinSample} first-attempt questions needed)` : `${Math.round(m.accuracyPct ?? 0)}% correct on ${m.sample} first-attempt questions`}</span></span>
              {m.status === 'weak' ? <Tag kind="bad">Needs work</Tag> : m.status === 'ok' ? <Tag kind="ok">On track</Tag> : <Tag>Not enough practice yet</Tag>}</div></li>))}</ul>)}
        <p className="support">An area is flagged below {cfg.weakAccuracyPct}% only after {cfg.weakMinSample} distinct first-attempt questions in {cfg.windowDays} days. These thresholds are this app's choice, not an IIBF rule.</p>
        {r.highConfidenceErrors > 0 && <Banner kind="warn">{r.highConfidenceErrors} answer{r.highConfidenceErrors === 1 ? ' was' : 's were'} wrong although you rated the card as known. Those cards return tomorrow, and a different question on the same objective is the real test.</Banner>}
      </section>
      <section className="section" aria-labelledby="cri"><h2 id="cri">Experimental readiness index</h2>
        {sufficient ? <div className="stat"><b>{Math.round(snap.cri_score ?? 0)} / 100</b><span className="support">experimental study indicator</span></div> : <Banner>Insufficient evidence. A number is shown only with at least {cfg.criMinSample} scored and {cfg.criMinSample} timed first-attempt questions and a known objective total. You have {snap.eligible_accuracy_questions} scored and {snap.eligible_timed_questions} timed{snap.mapped_objectives_total === null ? '; the objective total for this paper is not yet known' : ''}.</Banner>}
        <More summary="How this is calculated"><p>CRI = 0.4 × study coverage + 0.4 × assessed accuracy + 0.2 × pace, each on a 0–100 scale, for this paper and session over the last {cfg.windowDays} days.</p><p className="support">Pace is the average of (correct × the lesser of 1 and target seconds ÷ your seconds); a wrong answer scores zero. Timings under 1 second or over 10 minutes are left out. This index is this app's own experimental indicator. It is not an IIBF measure, not a pass probability and not a guarantee.</p></More>
      </section>
      <section className="section" aria-labelledby="mk"><h2 id="mk">Mock results</h2>
        {mocks.length === 0 ? <p className="support">No completed mocks for this paper.</p> : <ul className="list">{mocks.map(a => <li key={a.attempt.attempt_id}><a className="item" href={`#/attempt/${a.attempt.attempt_id}`}><span className="grow"><span className="title">{a.result!.marks_obtained} of {a.result!.total_marks} marks</span><span className="meta" style={{ display: 'block' }}>{formatDate(a.attempt.started_at)} · {a.attempt.question_order.length} questions · {a.attempt.status === 'expired' ? 'time expired' : 'submitted'}</span></span></a></li>)}</ul>}
      </section>
    </>
  );
}
