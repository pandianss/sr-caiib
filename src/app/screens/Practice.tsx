import { useEffect, useRef, useState } from 'react';
import type { CaseStudyItem } from '../../types/contracts.ts';
import { PAPER_NAMES } from '../../core/catalogue.ts';
import { parseNumericInput } from '../../core/grading.ts';
import type { AttemptRecord } from '../../core/model.ts';
import { accessibleQuestions, attemptClock, remediationQuestions } from '../../core/session.ts';
import { formatDateTime } from '../../core/time.ts';
import { QuestionView } from '../content.tsx';
import { go, useApp, useNow, useStopwatch } from '../hooks.ts';
import { model } from '../model.ts';
import { Announce, Banner, Button, Empty, Icon, IconButton, Md, More, Sheet, Tag, formatClock } from '../ui.tsx';

export function Practice() {
  const s = useApp(); const paper = s.prefs.active_paper; const record = s.index.packFor(paper); const [mockSheet, setMockSheet] = useState(false);
  const plan = model.plan(); const all = accessibleQuestions(plan); const cat = model.catalogueFor(paper); const active = model.activeAttempt();
  const numeric = all.filter(q => q.question_type === 'numeric_input' && !q.case_study_id).length; const rem = remediationQuestions(plan).filter(q => !q.case_study_id).length;
  const cases = s.index.caseStudies(paper).filter(c => model.unitOpen(paper, c.unit_id)); const mock = model.mockAvailability(); const ctx = model.context();
  const units = (cat?.unitsOfPaper(paper) ?? []).map(u => ({ u, n: all.filter(q => q.unit_id === u.id && !q.case_study_id).length })).filter(x => x.n > 0);
  const start = async (kind: 'unit' | 'remediation' | 'numeric' | 'case_study' | 'preset', ref: string | null) => { const id = await model.startPractice(kind, ref); if (id) go(`attempt/${id}`); };
  if (!record) return <><div className="section"><h1>Practice</h1><p className="support">{PAPER_NAMES[paper]}</p></div><Empty title="No questions are available for this paper yet" action={<Button variant="filled" href="#/coverage">See the coverage map</Button>}>Questions are published only after their sources, answers and calculations have been reviewed.</Empty></>;
  return (
    <>
      <div className="section"><h1>Practice</h1><p className="support">{PAPER_NAMES[paper]} Â· {all.length} question{all.length === 1 ? '' : 's'} available to you</p></div>
      {active && <Banner kind="warn" action={<Button variant="outlined" onClick={() => { void model.setPaper(active.attempt.paper_id).then(() => go(`attempt/${active.attempt.attempt_id}`)); }}>Resume</Button>}>Unfinished {active.attempt.mode === 'mock' ? 'timed mock' : 'practice set'}: {active.title} ({PAPER_NAMES[active.attempt.paper_id]}). Finish or end it before starting another.</Banner>}
      <section className="section" aria-labelledby="p1"><h2 id="p1">Practise by type</h2>
        <p className="support">You choose or type an answer, then press Submit. Feedback and the explanation appear after each submission. Questions you have not seen come first.</p>
        <ul className="list">
          <li><button type="button" className="item" onClick={() => void start('preset', null)}><span className="grow"><span className="title">Mixed practice</span><span className="meta" style={{ display: 'block' }}>Up to 10 questions across this paper</span></span><Icon name="chevron" /></button></li>
          <li><button type="button" className="item" onClick={() => void start('remediation', null)} disabled={!rem} aria-disabled={!rem}><span className="grow"><span className="title">Missed objectives</span><span className="meta" style={{ display: 'block' }}>{rem ? `${rem} question${rem === 1 ? '' : 's'} on objectives you answered wrongly` : 'Nothing to remediate: no objective has more wrong than right first attempts'}</span></span>{rem > 0 && <Icon name="chevron" />}</button></li>
          <li><button type="button" className="item" onClick={() => void start('numeric', null)} disabled={!numeric} aria-disabled={!numeric}><span className="grow"><span className="title">Numerical questions</span><span className="meta" style={{ display: 'block' }}>{numeric ? `${numeric} questions answered by typing a number` : 'None available yet'}</span></span>{numeric > 0 && <Icon name="chevron" />}</button></li>
        </ul>
      </section>
      {units.length > 0 && <section className="section" aria-labelledby="p2"><h2 id="p2">Practise by topic</h2><ul className="list">{units.map(({ u, n }) => <li key={u.id}><button type="button" className="item" onClick={() => void start('unit', u.id)}><span className="grow"><span className="title">{u.title ?? u.id}</span><span className="meta" style={{ display: 'block' }}>{n} question{n === 1 ? '' : 's'}</span></span><Icon name="chevron" /></button></li>)}</ul></section>}
      {cases.length > 0 && <section className="section" aria-labelledby="p3"><h2 id="p3">Case studies</h2><ul className="list">{cases.map(c => <li key={c.id}><button type="button" className="item" onClick={() => void start('case_study', c.id)}><span className="grow"><span className="title">{c.title}</span><span className="meta" style={{ display: 'block' }}>{c.question_ids.length} linked questions; the scenario stays available while you answer</span></span><Icon name="chevron" /></button></li>)}</ul></section>}
      <section className="section" aria-labelledby="p4"><h2 id="p4">Timed mock</h2>
        {mock.ok ? (<><p className="support">{mock.questionCount} questions in {Math.round(mock.durationSeconds / 60)} minutes{mock.full ? '' : `. This is a short mock: the question pool is smaller than the ${ctx?.config?.question_count}-question exam configuration, so the time is scaled to the same pace and no pass or fail is shown`}.</p>
          <Button variant="filled" disabled={Boolean(active)} onClick={() => setMockSheet(true)}>Start a timed mock</Button></>) : <Banner>{mock.reason}</Banner>}
      </section>
      {mockSheet && mock.ok && (
        <Sheet title="Before you start" onClose={() => setMockSheet(false)}>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><strong>{mock.questionCount} questions, {Math.round(mock.durationSeconds / 60)} minutes.</strong> About {Math.round(mock.durationSeconds / mock.questionCount)} seconds a question on average; you may spend the time as you like.</li>
            <li><strong>The clock does not pause.</strong> It runs to a fixed end time even if you close the app or lose connection.</li>
            <li><strong>Answers save as you go.</strong> You can move between questions, change answers and flag questions to revisit.</li>
            <li><strong>When time ends, saved answers are submitted automatically.</strong> Unanswered questions score zero{ctx?.config && Number(ctx.config.wrong_answer_penalty) > 0 ? `; a wrong answer loses ${ctx.config.wrong_answer_penalty} of the question's marks` : '; wrong answers carry no penalty in this configuration'}.</li>
            <li><strong>Explanations appear after you submit</strong>, not during the mock. Worked solutions and calculators stay closed until then.</li>
          </ul>
          <div className="actions"><Button variant="outlined" onClick={() => setMockSheet(false)}>Not now</Button><Button variant="filled" onClick={() => { void model.startMock().then(id => { setMockSheet(false); if (id) go(`attempt/${id}`); }); }}>Start the clock</Button></div>
        </Sheet>)}
    </>
  );
}

function Scenario({ cs }: { cs: CaseStudyItem }) {
  return (<div className="section"><h2>{cs.title}</h2><Md text={cs.scenario_narrative_md} className="lesson" />{cs.reference_tables_md.map((t, i) => <Md key={i} text={t} />)}</div>);
}

function Frame({ a, right, children, wide }: { a: AttemptRecord; right?: React.ReactNode; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="app focused">
      <a className="skip" href="#main">Skip to content</a>
      <header className="appbar"><IconButton icon="close" label={a.attempt.status === 'active' ? 'Leave. Your answers are saved and you can resume.' : 'Close'} onClick={() => go('practice')} />
        <div className="grow"><strong>{a.title}</strong><div className="support">{PAPER_NAMES[a.attempt.paper_id]} Â· {a.attempt.mode === 'mock' ? 'Timed mock' : 'Practice'}{a.fixture ? ' Â· engineering sample' : ''}</div></div>{right}</header>
      <main className={`main${wide ? ' wide' : ''}`} id="main" tabIndex={-1}>{children}</main>
    </div>
  );
}

export function AttemptScreen({ id }: { id: string }) {
  const s = useApp(); const a = model.attempt(id);
  if (!a || a.attempt.learner_id !== s.prefs.learner_id) return <div className="app focused"><main className="main"><Empty title="This attempt is not available" action={<Button variant="filled" href="#/practice">Go to Practice</Button>} /></main></div>;
  if (a.attempt.status !== 'active') return <Results a={a} />;
  if (!model.attemptAllowed(a)) return <Frame a={a}><Empty title="Renew or refresh your pass to continue" action={<Button variant="filled" href="#/account">Account and pass</Button>}>Your saved answers are kept. This set uses content from the CAIIB pass, and access needs to be confirmed online.</Empty></Frame>;
  return a.attempt.mode === 'mock' ? <MockPlayer a={a} /> : <PracticePlayer a={a} />;
}

function useQuestion(a: AttemptRecord) {
  const ref = a.attempt.question_order[a.current_index]; const q = ref ? model.pinnedQuestion(a.attempt, ref.item_id) : undefined;
  const csItem = q?.case_study_id ? model.pinnedItem(a.attempt.pack_id, a.attempt.pack_version, q.case_study_id) : undefined;
  return { q, cs: csItem?.item_type === 'case_study' ? csItem : undefined };
}

function PracticePlayer({ a }: { a: AttemptRecord }) {
  const id = a.attempt.attempt_id; const { q, cs } = useQuestion(a); const total = a.attempt.question_order.length; const idx = a.current_index;
  const [error, setError] = useState<string | null>(null); const [announce, setAnnounce] = useState(''); const [busy, setBusy] = useState(false); const [confirmEnd, setConfirmEnd] = useState(false);
  const lap = useStopwatch(`${id}:${idx}`);
  // The field is driven by local state so typing is never delayed by saving; each change is also saved as a draft.
  const [draft, setDraft] = useState('');
  const qid = q?.id ?? '';
  useEffect(() => { setDraft(a.attempt.saved_responses[qid] ?? ''); setError(null); document.getElementById('main')?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [id, idx, qid]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!q) return <Frame a={a}><Empty title="This question's content is no longer on this device" action={<Button variant="filled" onClick={() => void model.practiceFinish(id)}>End this set</Button>}>Your submitted answers are kept.</Empty></Frame>;
  const submitted = a.submitted_item_ids.includes(q.id); const response = submitted ? a.attempt.saved_responses[q.id] ?? '' : draft; const last = idx === total - 1;
  const resumed = a.submitted_item_ids.length > 0 && !submitted && idx === a.submitted_item_ids.length;
  const submit = async () => {
    setBusy(true); const r = await model.practiceSubmit(id, q, response, lap()); setBusy(false);
    if (!r.ok) { setError(r.message); setAnnounce(r.message); return; }
    setError(null); setAnnounce(r.correct ? 'Correct. Explanation shown below.' : 'Not correct. Explanation shown below.');
  };
  const next = async () => { if (last) await model.practiceFinish(id); else await model.attemptGoto(id, idx + 1, 0); };
  const body = (
    <div className="section">
      <QuestionView q={q} number={idx + 1} total={total} response={response} onResponse={v => { setDraft(v); setError(null); void model.attemptSetResponse(id, q.id, v); }} disabled={submitted || busy} feedback={submitted ? { correct: Boolean(a.outcomes[q.id]) } : null} error={error} />
      <div className="sticky-actions"><div className="actions">
        {!submitted ? <Button variant="filled" disabled={busy} onClick={() => void submit()}>Submit answer</Button> : <Button variant="filled" onClick={() => void next()}>{last ? 'Finish and see results' : 'Next question'}</Button>}
      </div>{!submitted && <p className="support" style={{ marginTop: '0.5rem' }}>Nothing is marked until you press Submit.</p>}</div>
    </div>);
  return (
    <Frame a={a} wide={Boolean(cs)} right={<Button onClick={() => setConfirmEnd(true)}>End</Button>}>
      <Announce message={announce} />
      <div className="progress" role="progressbar" aria-label="Questions submitted" aria-valuemin={0} aria-valuemax={total} aria-valuenow={a.submitted_item_ids.length}><span style={{ width: `${(a.submitted_item_ids.length / total) * 100}%` }} /></div>
      {resumed && <Banner>Resumed. Your {a.submitted_item_ids.length} submitted answer{a.submitted_item_ids.length === 1 ? ' is' : 's are'} saved.</Banner>}
      {cs ? <div className="split"><aside className="pane card" aria-label="Case scenario"><details className="more" open><summary>Scenario: {cs.title}</summary><div><Scenario cs={cs} /></div></details></aside>{body}</div> : body}
      {confirmEnd && <Sheet title="End this practice set?" onClose={() => setConfirmEnd(false)}><p>{a.submitted_item_ids.length} of {total} answered. Submitted answers stay in your history; the rest are left unanswered.</p><div className="actions"><Button variant="outlined" onClick={() => setConfirmEnd(false)}>Keep going</Button><Button variant="filled" onClick={() => { setConfirmEnd(false); void model.practiceFinish(id); }}>End and see results</Button></div></Sheet>}
    </Frame>
  );
}

function MockPlayer({ a }: { a: AttemptRecord }) {
  const id = a.attempt.attempt_id; const { q, cs } = useQuestion(a); const total = a.attempt.question_order.length; const idx = a.current_index;
  const now = useNow(1000); const clock = attemptClock(a.attempt, now); const lap = useStopwatch(`${id}:${idx}`);
  const [nav, setNav] = useState(false); const [confirm, setConfirm] = useState(false); const [draft, setDraft] = useState(''); const [error, setError] = useState<string | null>(null); const [announce, setAnnounce] = useState('');
  const warned = useRef({ five: false, one: false }); const expiring = useRef(false);
  const itemId = q?.id ?? '';
  useEffect(() => { setDraft(a.attempt.saved_responses[itemId] ?? ''); setError(null); document.getElementById('main')?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [id, idx, itemId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (clock.expired && !expiring.current) { expiring.current = true; void model.mockSubmit(id, 'expired', lap()); }
    const rem = clock.remainingMs ?? 0;
    if (rem <= 300_000 && rem > 60_000 && !warned.current.five) { warned.current.five = true; setAnnounce('Five minutes remaining.'); }
    if (rem <= 60_000 && rem > 0 && !warned.current.one) { warned.current.one = true; setAnnounce('One minute remaining. Saved answers will be submitted when time ends.'); }
  }, [clock.expired, clock.remainingMs, id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!q) return <Frame a={a}><Empty title="This mock's content is no longer on this device" action={<Button variant="filled" onClick={() => void model.mockSubmit(id, 'submitted')}>Submit what is saved</Button>} /></Frame>;
  const answered = Object.keys(a.attempt.saved_responses).length; const flagged = a.attempt.flagged_item_ids.includes(q.id);
  const onResponse = (v: string) => {
    setDraft(v);
    if (q.question_type === 'single_choice') { void model.attemptSetResponse(id, q.id, v); setAnnounce('Answer saved.'); return; }
    if (v.trim() === '') { setError(null); void model.attemptSetResponse(id, q.id, null); return; }
    const parsed = parseNumericInput(v, q.numeric_rule);
    if (parsed.ok) { setError(null); void model.attemptSetResponse(id, q.id, parsed.normalized); } else { setError(`${parsed.message} This entry is not saved yet.`); void model.attemptSetResponse(id, q.id, null); }
  };
  const goto = (i: number) => { setNav(false); void model.attemptGoto(id, i, lap()); };
  const low = (clock.remainingMs ?? 0) <= 300_000;
  const body = (
    <div className="section">
      <QuestionView q={q} number={idx + 1} total={total} response={draft} onResponse={onResponse} error={error} />
      <p className="support" role="status">{a.attempt.saved_responses[q.id] !== undefined ? 'âœ“ Answer saved. You can change it until you submit the mock.' : 'No answer saved for this question.'}</p>
      <div className="sticky-actions"><div className="actions">
        <Button variant="outlined" disabled={idx === 0} onClick={() => goto(idx - 1)}>Previous</Button>
        <Button variant="tonal" onClick={() => void model.attemptFlag(id, q.id, !flagged)}><Icon name="flag" size={18} />{flagged ? 'Unflag' : 'Flag to revisit'}</Button>
        {idx < total - 1 ? <Button variant="filled" onClick={() => goto(idx + 1)}>Next</Button> : <Button variant="filled" onClick={() => setConfirm(true)}>Review and submit</Button>}
      </div></div>
    </div>);
  return (
    <Frame a={a} wide={Boolean(cs)} right={<><span className={`timer${low ? ' low' : ''}`} role="timer" aria-label={`Time remaining ${formatClock(clock.remainingMs ?? 0)}`}><Icon name="clock" size={18} /> {formatClock(clock.remainingMs ?? 0)}</span><Button onClick={() => setNav(true)}>Questions</Button></>}>
      <Announce message={announce} />
      <p className="support">{answered} of {total} answered Â· {a.attempt.flagged_item_ids.length} flagged Â· ends {formatDateTime(a.attempt.expires_at_iso!)}{low ? ' Â· under 5 minutes left' : ''}</p>
      {cs ? <div className="split"><aside className="pane card" aria-label="Case scenario"><details className="more" open><summary>Scenario: {cs.title}</summary><div><Scenario cs={cs} /></div></details></aside>{body}</div> : body}
      {nav && <Sheet title="Questions" onClose={() => setNav(false)}>
        <p className="support">Filled = answered. âš‘ = flagged. The outlined number is the current question.</p>
        <div className="qnav">{a.attempt.question_order.map((r, i) => { const ans = a.attempt.saved_responses[r.item_id] !== undefined; const fl = a.attempt.flagged_item_ids.includes(r.item_id); return <button type="button" key={r.item_id} className={`${ans ? 'answered' : ''} ${fl ? 'flagged' : ''}`} aria-current={i === idx ? 'true' : undefined} aria-label={`Question ${i + 1}, ${ans ? 'answered' : 'not answered'}${fl ? ', flagged' : ''}`} onClick={() => goto(i)}>{i + 1}</button>; })}</div>
        <Button variant="filled" block onClick={() => { setNav(false); setConfirm(true); }}>Review and submit</Button></Sheet>}
      {confirm && <Sheet title="Submit this mock?" onClose={() => setConfirm(false)}>
        <dl className="kv"><dt>Answered</dt><dd>{answered} of {total}</dd><dt>Unanswered</dt><dd>{total - answered} (score zero)</dd><dt>Flagged</dt><dd>{a.attempt.flagged_item_ids.length}</dd><dt>Time left</dt><dd>{formatClock(clock.remainingMs ?? 0)}</dd></dl>
        <p className="support">After submitting you cannot change answers. Explanations are shown with your result.</p>
        <div className="actions"><Button variant="outlined" onClick={() => setConfirm(false)}>Keep working</Button><Button variant="filled" onClick={() => { setConfirm(false); void model.mockSubmit(id, 'submitted', lap()); }}>Submit mock</Button></div></Sheet>}
    </Frame>
  );
}

function Results({ a }: { a: AttemptRecord }) {
  const mock = a.attempt.mode === 'mock'; const order = a.attempt.question_order; const [open, setOpen] = useState<string | null>(null);
  const rows = order.map((r, i) => {
    const q = model.pinnedQuestion(a.attempt, r.item_id); const per = a.result?.per_question.find(p => p.item_id === r.item_id);
    const answered = mock ? Boolean(per?.answered) : a.submitted_item_ids.includes(r.item_id); const correct = mock ? Boolean(per?.is_correct) : Boolean(a.outcomes[r.item_id]);
    return { i, q, id: r.item_id, answered, correct, response: mock ? per?.response ?? '' : a.attempt.saved_responses[r.item_id] ?? '' };
  });
  const correct = rows.filter(r => r.answered && r.correct).length, wrong = rows.filter(r => r.answered && !r.correct).length, unanswered = rows.filter(r => !r.answered).length;
  const cat = model.catalogueFor(a.attempt.paper_id); const missedObjectives = [...new Set(rows.filter(r => r.answered && !r.correct).flatMap(r => r.q?.objective_ids ?? []))];
  const next = model.recommendation(); const summary = a.attempt.score_summary;
  return (
    <Frame a={a}>
      <div className="section"><h1>{mock ? (a.attempt.status === 'expired' ? 'Time expired: mock submitted' : 'Mock submitted') : 'Practice complete'}</h1>
        {mock && a.attempt.status === 'expired' && <p className="support">The clock reached its end time, so your saved answers were submitted automatically.</p>}</div>
      <div className="stat-grid">
        {mock && a.result && <div className="stat"><b>{a.result.marks_obtained} / {a.result.total_marks}</b><span className="support">marks</span></div>}
        <div className="stat"><b>{correct}</b><span className="support">âœ“ correct</span></div><div className="stat"><b>{wrong}</b><span className="support">âœ— not correct</span></div><div className="stat"><b>{unanswered}</b><span className="support">unanswered</span></div>
      </div>
      {mock && (summary ? <Banner kind={summary.passed ? 'ok' : 'warn'}>{summary.passed ? 'This score meets' : 'This score is below'} the pass mark recorded for this session's configuration. A practice mock is not a prediction of your exam result.</Banner>
        : <Banner>No pass or fail is shown: {order.length !== model.state.contexts.find(c => c.exam_context_id === a.attempt.exam_context_id)?.config?.question_count ? 'this was a short mock, not a full-length paper' : 'the passing rule for this session has not been verified'}.</Banner>)}
      {missedObjectives.length > 0 && <section className="section" aria-labelledby="gain"><h2 id="gain">Objectives to revisit</h2><ul style={{ margin: 0, paddingLeft: '1.25rem' }}>{missedObjectives.map(o => <li key={o}>{cat?.objective(o)?.title ?? o}</li>)}</ul></section>}
      {wrong === 0 && correct > 0 && <Banner kind="ok">Every answered question was correct. Questions you had not seen before count toward your first-attempt accuracy.</Banner>}
      <section className="card primary"><span className="label">Recommended next</span><h2>{next.title}</h2><p>{next.reason}</p><div className="actions"><Button variant="filled" href="#/today">Go to Today</Button><Button variant="outlined" href="#/practice">More practice</Button></div></section>
      <section className="section" aria-labelledby="rev"><h2 id="rev">Review answers</h2>
        <ul className="list">{rows.map(r => (
          <li key={r.id}>
            <button type="button" className="item" aria-expanded={open === r.id} onClick={() => setOpen(open === r.id ? null : r.id)}>
              <span className="grow"><span className="title">Question {r.i + 1}</span><span className="meta" style={{ display: 'block' }}>{r.q ? r.q.stem_md.slice(0, 90) : 'Content no longer on this device'}{r.q && r.q.stem_md.length > 90 ? 'â€¦' : ''}</span></span>
              {!r.answered ? <Tag>Unanswered</Tag> : r.correct ? <Tag kind="ok">âœ“ Correct</Tag> : <Tag kind="bad">âœ— Not correct</Tag>}
            </button>
            {open === r.id && r.q && <div style={{ padding: '0 0 1rem' }}><QuestionView q={r.q} response={r.response} onResponse={() => {}} disabled feedback={{ correct: r.answered && r.correct }} />{!r.answered && <p className="support">You did not answer this question.</p>}</div>}
          </li>))}</ul>
      </section>
      <More summary="About this attempt"><dl className="kv"><dt>Started</dt><dd>{formatDateTime(a.attempt.started_at)}</dd>{a.attempt.submitted_at && <><dt>Finished</dt><dd>{formatDateTime(a.attempt.submitted_at)}</dd></>}<dt>Content version</dt><dd>{a.attempt.pack_id} v{a.attempt.pack_version}</dd><dt>Exam configuration</dt><dd>{a.attempt.exam_config_version}</dd></dl><p className="support">This attempt stays graded against the content version it started with, even if the content is updated later.</p></More>
    </Frame>
  );
}
