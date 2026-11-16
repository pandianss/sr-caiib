import { useEffect, useState } from 'react';
import type { QuestionItem, Sm2Rating, StudyCard } from '../../types/contracts.ts';
import { PAPER_NAMES } from '../../core/catalogue.ts';
import { emptyProgress } from '../../core/session.ts';
import { CARD_TYPE_LABEL, CardBody, QuestionView, Sources } from '../content.tsx';
import { go, useApp, useStopwatch } from '../hooks.ts';
import { model } from '../model.ts';
import { Announce, Banner, Button, Empty, IconButton, More, Tag } from '../ui.tsx';

const RATINGS: { rating: Sm2Rating; label: string; hint: string }[] = [
  { rating: 'Again', label: 'Again', hint: 'Could not recall' }, { rating: 'Hard', label: 'Hard', hint: 'Recalled with effort' },
  { rating: 'Good', label: 'Good', hint: 'Recalled' }, { rating: 'Easy', label: 'Easy', hint: 'Instant' },
];

function Frame({ title, subtitle, onExit, children }: { title: string; subtitle: string; onExit: () => void; children: React.ReactNode }) {
  return (
    <div className="app focused study-player">
      <a className="skip" href="#main">Skip to content</a>
      <header className="appbar"><IconButton icon="close" label="Exit session. Your progress is saved." onClick={onExit} /><div className="grow"><strong>{title}</strong><div className="support">{subtitle}</div></div></header>
      <main className="main" id="main" tabIndex={-1}>{children}</main>
    </div>
  );
}

export function StudyPlayer({ id }: { id: string }) {
  const s = useApp(); const session = model.session(id);
  const [response, setResponse] = useState(''); const [error, setError] = useState<string | null>(null); const [announce, setAnnounce] = useState(''); const [busy, setBusy] = useState(false);
  const cursor = session?.cursor ?? 0;
  const lap = useStopwatch(`${id}:${cursor}`);
  useEffect(() => { setResponse(''); setError(null); document.getElementById('main')?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [id, cursor]);
  const [resumed] = useState(() => Boolean(session && (session.cursor > 0 || Object.keys(session.progress).length > 0)));

  if (!session || session.learner_id !== s.prefs.learner_id) return <Frame title="Session" subtitle="" onExit={() => go('today')}><Empty title="This session is not available" action={<Button variant="filled" href="#/today">Go to Today</Button>} /></Frame>;
  const total = session.steps.length; const exit = () => go('today');

  if (session.status !== 'active') {
    const done = Object.values(session.progress).filter(p => p.rated).length;
    // Relearning retries are not evidence, so they are left out of the summary counts.
    const answered = session.steps.map((st, i) => (st.relearn ? undefined : session.progress[String(i)])).filter(p => p !== undefined && p.answered_correct !== null); const correct = answered.filter(p => p?.answered_correct).length;
    const relearned = session.steps.filter(st => st.relearn).length; const next = model.recommendation();
    return (
      <Frame title={session.title} subtitle={PAPER_NAMES[session.paper_id]} onExit={exit}>
        <div className="section"><h1>{session.status === 'completed' ? 'Session complete' : 'Session ended'}</h1><p className="support">{done} of {total} steps finished. Everything you did is saved.</p></div>
        <div className="stat-grid">
          <div className="stat"><b>{session.steps.filter((st, i) => !st.relearn && session.progress[String(i)]?.rated).length}</b><span className="support">cards studied or reviewed</span></div>
          {answered.length > 0 && <div className="stat"><b>{correct} / {answered.length}</b><span className="support">self-check questions correct</span></div>}
          <div className="stat"><b>{relearned}</b><span className="support">to see again tomorrow</span></div>
        </div>
        {relearned > 0 && <Banner>Cards you could not recall are scheduled for tomorrow. Seeing them again today helps, but only a later review counts as evidence that you know them.</Banner>}
        <section className="card primary"><span className="label">Next step</span><h2>{next.title}</h2><p>{next.reason}</p><div className="actions"><Button variant="filled" href="#/today">Go to Today</Button></div></section>
      </Frame>
    );
  }

  const step = session.steps[cursor]!; const card: StudyCard | undefined = model.pinnedCard(session, step.item_id);
  if (!card) return <Frame title={session.title} subtitle="" onExit={exit}><Empty title="This card's content is no longer on this device" action={<Button variant="filled" onClick={() => { void model.endSession(id).then(exit); }}>End session</Button>}>Download the paper again from Library to continue. Your recorded progress is kept.</Empty></Frame>;
  const prog = session.progress[String(cursor)] ?? emptyProgress();
  const question: QuestionItem | undefined = card.self_check.mode === 'question' ? model.pinnedQuestion(session, card.self_check.question_id) : undefined;
  const isReview = step.type === 'review' && !step.relearn; const cat = model.catalogueFor(session.paper_id); // a second look shows the lesson again
  const objectives = card.objective_ids.map(o => cat?.objective(o)?.title ?? '').filter(Boolean);
  const answered = prog.answered_correct !== null;
  const showTeaching = !isReview || prog.revealed || answered;

  const submit = async () => {
    if (!question) return; setBusy(true); setError(null);
    const r = await model.sessionAnswer(id, cursor, question, response, lap());
    setBusy(false);
    if (!r.ok) { setError(r.message); setAnnounce(r.message); return; }
    setAnnounce(r.correct ? 'Correct.' : 'Not correct. The explanation is shown below.');
  };
  const rate = async (rating: Sm2Rating) => { setBusy(true); const eff = await model.sessionRate(id, cursor, card, rating); setBusy(false); if (eff) setAnnounce(eff === 'Again' && !step.relearn ? 'Saved. This card will return at the end of this session and again tomorrow.' : 'Saved.'); };

  return (
    <Frame title={session.title} subtitle={`${PAPER_NAMES[session.paper_id]} · step ${cursor + 1} of ${total}`} onExit={exit}>
      <Announce message={announce} />
      <div className="progress thick" role="progressbar" aria-label="Session progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={cursor}><span style={{ width: `${(cursor / total) * 100}%` }} /></div>
      {resumed && cursor === session.cursor && <Banner>Resumed. You are back at the step where you stopped; earlier steps are already saved.</Banner>}
      <div className="section">
        <div className="row"><Tag kind="info">{CARD_TYPE_LABEL[card.card_type]}</Tag>{step.relearn && <Tag kind="warn">Second look</Tag>}{step.type === 'review' && !step.relearn && <Tag>Review</Tag>}</div>
        <h1>{card.title}</h1>
        {objectives.length > 0 && <p className="support"><strong>Objective:</strong> {objectives.join('; ')}</p>}
        {step.relearn && <p className="support">You marked this as not recalled. This second look is for learning only and is not counted as evidence.</p>}
      </div>

      {showTeaching ? <CardBody card={card} /> : <Banner>Try to recall before you look. The explanation appears after you answer.</Banner>}

      <section className="card" aria-labelledby="sc">
        <h2 id="sc">Check yourself</h2>
        {question ? (
          <>
            <QuestionView q={question} response={answered ? prog.response ?? '' : response} onResponse={v => { setResponse(v); setError(null); }} disabled={answered || busy} feedback={answered ? { correct: Boolean(prog.answered_correct) } : null} error={error} />
            {!answered && <Button variant="filled" block disabled={busy} onClick={() => void submit()}>Submit answer</Button>}
          </>
        ) : (
          <>
            <p className="lesson">{card.self_check.mode === 'self_assessed' ? card.self_check.prompt_text : ''}</p>
            {!prog.revealed ? <Button variant="filled" block disabled={busy} onClick={() => void model.sessionReveal(id, cursor)}>Show answer</Button>
              : <div className="feedback" style={{ background: 'var(--surface-container-high)' }}><strong>Expected takeaway</strong><p>{card.self_check.mode === 'self_assessed' ? card.self_check.expected_takeaway : ''}</p></div>}
          </>
        )}
      </section>

      {(question ? answered : prog.revealed) && !prog.rated && (
        <section className="section sticky-actions" aria-labelledby="rate">
          {step.relearn ? (
            <><h2 id="rate">Second look done</h2><p className="support">Nothing new is recorded for this retry. The card is still scheduled for tomorrow.</p>
              <Button variant="filled" block disabled={busy} onClick={() => void rate('Good')}>Continue</Button></>
          ) : question && prog.answered_correct === false ? (
            <><h2 id="rate">This one comes back</h2><p className="support">Your answer was not correct, so the card is scheduled for tomorrow{step.relearn ? '' : ' and once more at the end of this session'}. A confident rating cannot override a wrong answer.</p>
              <Button variant="filled" block disabled={busy} onClick={() => void rate('Again')}>Continue</Button></>
          ) : (
            <><h2 id="rate">How well did you recall it?</h2><p className="support">Your rating sets when you see this card next. It is recorded separately from right and wrong answers.</p>
              <div className="rating">{RATINGS.filter(r => !(question && r.rating === 'Again')).map(r => <Button key={r.rating} variant={r.rating === 'Good' ? 'filled' : 'tonal'} className={`rate-${r.rating.toLowerCase()}`} disabled={busy} onClick={() => void rate(r.rating)}><span>{r.label}</span><small>{r.hint}</small></Button>)}</div></>
          )}
        </section>
      )}
      <More summary="Source and applicability"><Sources item={card} /></More>
    </Frame>
  );
}
