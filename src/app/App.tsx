import { useEffect, useState, type ReactNode } from 'react';
import type { ElectivePaperId, PaperId } from '../types/contracts.ts';
import { ELECTIVE_PAPERS, PAPER_NAMES, isElective } from '../core/catalogue.ts';
import { FIXTURE_MODE, model } from './model.ts';
import { go, paperAvailability, useApp, useRoute } from './hooks.ts';
import { Banner, Button, Chip, Empty, Icon, IconButton, Sheet, Tag } from './ui.tsx';
import { Today, Performance } from './screens/Home.tsx';
import { Learn, UnitScreen, ItemScreen } from './screens/Learn.tsx';
import { StudyPlayer } from './screens/Study.tsx';
import { Practice, AttemptScreen } from './screens/Practice.tsx';
import { Library } from './screens/Library.tsx';
import { Coverage } from './screens/Coverage.tsx';
import { Account } from './screens/Account.tsx';

function PaperSheet({ onClose }: { onClose: () => void }) {
  const s = useApp(); const papers = model.studyPapers();
  const others = ELECTIVE_PAPERS.filter(p => p !== s.prefs.selected_elective);
  return (
    <Sheet title="Choose a paper" onClose={onClose}>
      <ul className="list" aria-label="Your papers">
        {papers.map(p => { const a = paperAvailability(s, p); return (
          <li key={p}><button type="button" className="item" aria-current={p === s.prefs.active_paper ? 'true' : undefined} onClick={() => { void model.setPaper(p); onClose(); }}>
            <span className="grow"><span className="title">{PAPER_NAMES[p]} <span className="meta">({p})</span></span><span className="meta" style={{ display: 'block' }}>{isElective(p) ? 'Your elective' : 'Compulsory'}</span></span>
            <Tag kind={a.kind}>{a.label}</Tag>{p === s.prefs.active_paper && <Icon name="check" />}
          </button></li>); })}
      </ul>
      <div className="section">
        <h2>Change elective</h2>
        <p className="support">You study four compulsory papers and one elective. Changing elective keeps the history of your previous elective.</p>
        <div className="chips">{others.map(p => <Chip key={p} selected={false} onClick={() => { void model.setElective(p as ElectivePaperId); }}>{PAPER_NAMES[p]}</Chip>)}</div>
      </div>
    </Sheet>
  );
}

function Onboarding() {
  const s = useApp();
  const [ctx, setCtx] = useState(s.contexts[0]?.exam_context_id ?? ''); const [elective, setElective] = useState<ElectivePaperId | null>(null); const [minutes, setMinutes] = useState<5 | 10>(10);
  const chosen = s.contexts.find(c => c.exam_context_id === ctx);
  const available = s.manifest.packs.filter(p => p.exam_context_id === ctx && (p.kind === 'fixture' || p.access === 'free'));
  return (
    <div className="app"><main className="main" id="main">
      <div className="section"><h1>Set up your CAIIB study</h1><p className="support">Three choices to start. You can change them later in Settings. No account is needed to study.</p></div>
      <fieldset className="section" style={{ border: 0, padding: 0, margin: 0 }}><legend><h2>Target exam session</h2></legend>
        <div className="chips">{s.contexts.map(c => <Chip key={c.exam_context_id} selected={ctx === c.exam_context_id} onClick={() => setCtx(c.exam_context_id)}>{c.label}</Chip>)}</div>
        {chosen && chosen.status !== 'verified' && <Banner kind="warn">{chosen.note}</Banner>}
      </fieldset>
      <fieldset className="section" style={{ border: 0, padding: 0, margin: 0 }}><legend><h2>Your elective paper</h2></legend>
        <p className="support">Choose the elective you registered for. We do not assume one for you.</p>
        <div className="chips">{ELECTIVE_PAPERS.map(p => <Chip key={p} selected={elective === p} onClick={() => setElective(p as ElectivePaperId)}>{PAPER_NAMES[p]}</Chip>)}</div>
      </fieldset>
      <fieldset className="section" style={{ border: 0, padding: 0, margin: 0 }}><legend><h2>Usual session length</h2></legend>
        <div className="chips">{([5, 10] as const).map(m => <Chip key={m} selected={minutes === m} onClick={() => setMinutes(m)}>{m} minutes</Chip>)}</div>
      </fieldset>
      <div className="section"><h2>What you can study on this device now</h2>
        {available.length ? <ul className="list">{available.map(p => <li key={p.pack_id}><div className="item" aria-disabled="true"><span className="grow"><span className="title">{PAPER_NAMES[p.paper_id]}</span><span className="meta" style={{ display: 'block' }}>{p.unit_ids.length} unit{p.unit_ids.length === 1 ? '' : 's'}: {p.item_counts.cards} cards, {p.item_counts.questions} questions. Works offline after setup.</span></span>{p.kind === 'fixture' && <Tag kind="warn">Engineering sample</Tag>}</div></li>)}</ul>
          : <Banner>No study content has been published for this session yet. You can still set up and view the syllabus coverage map; lessons will appear here when they are published.</Banner>}
      </div>
      <Button variant="filled" block disabled={!ctx || !elective} onClick={() => { if (elective) void model.completeOnboarding(ctx, elective, minutes).then(() => go('today')); }}>Start</Button>
      {!elective && <p className="support" role="status">Choose your elective to continue.</p>}
    </main></div>
  );
}

function Settings() {
  const s = useApp();
  return (
    <>
      <div className="section"><h1>Settings</h1></div>
      <div className="section"><h2>Appearance</h2><div className="chips" role="group" aria-label="Theme">{(['system', 'light', 'dark'] as const).map(t => <Chip key={t} selected={s.prefs.theme === t} onClick={() => void model.setTheme(t)}>{t === 'system' ? 'Follow device' : t === 'light' ? 'Light' : 'Dark'}</Chip>)}</div>
        <p className="support">Text size follows your browser and device text-size setting.</p></div>
      <div className="section"><h2>Target exam session</h2><div className="chips">{s.contexts.map(c => <Chip key={c.exam_context_id} selected={s.prefs.exam_context_id === c.exam_context_id} onClick={() => void model.setExamContext(c.exam_context_id)}>{c.label}</Chip>)}</div>
        <p className="support">Changing session keeps all history. Unfinished sessions stay tied to the session they were started in.</p></div>
      <div className="section"><h2>Elective</h2><div className="chips">{ELECTIVE_PAPERS.map(p => <Chip key={p} selected={s.prefs.selected_elective === p} onClick={() => void model.setElective(p as ElectivePaperId)}>{PAPER_NAMES[p]}</Chip>)}</div></div>
      <div className="section"><h2>Usual session length</h2><div className="chips">{([5, 10] as const).map(m => <Chip key={m} selected={s.prefs.session_minutes === m} onClick={() => void model.setSessionMinutes(m)}>{m} minutes</Chip>)}</div></div>
      <div className="section"><h2>Study data</h2><p className="support">Reviews are scheduled by calendar day in the time zone {s.prefs.time_zone}. Progress is saved on this device{s.prefs.account ? ` and synced to ${s.prefs.account.email}` : '; sign in under Account to keep a recoverable copy'}.</p>
        <div className="row"><Button variant="outlined" href="#/account">Account and pass</Button><Button variant="outlined" href="#/coverage">Syllabus coverage map</Button></div></div>
    </>
  );
}

const NAV = [{ id: 'today', label: 'Today', icon: 'today' }, { id: 'learn', label: 'Learn', icon: 'learn' }, { id: 'practice', label: 'Practice', icon: 'practice' }, { id: 'library', label: 'Library', icon: 'library' }];

function Shell({ route, children }: { route: string[]; children: ReactNode }) {
  const s = useApp(); const [sheet, setSheet] = useState(false);
  const top = route[0] ?? 'today'; const section = NAV.some(n => n.id === top) ? top : null; const secondary = !section || route.length > 1;
  const nav = (cls: string) => <nav className={cls} aria-label="Primary">{NAV.map(n => <a key={n.id} href={`#/${n.id}`} aria-current={section === n.id ? 'page' : undefined}><span className="pill"><Icon name={n.icon} /></span>{n.label}</a>)}</nav>;
  return (
    <div className="app with-nav">
      <a className="skip" href="#main">Skip to content</a>
      {FIXTURE_MODE && <div className="fixture-bar" role="note">Engineering build with synthetic sample content. Not exam material.</div>}
      {nav('rail')}
      <header className="appbar">
        {secondary && <IconButton icon="back" label="Back" onClick={() => window.history.length > 1 ? window.history.back() : go('today')} />}
        <div className="grow"><button type="button" className="paper-select" onClick={() => setSheet(true)} aria-haspopup="dialog" aria-label={`Paper: ${PAPER_NAMES[s.prefs.active_paper]}. Change paper`}>
          <span><small>Paper</small><strong>{PAPER_NAMES[s.prefs.active_paper]}</strong></span><Icon name="expand" /></button></div>
        {!s.online && <Tag kind="warn"><Icon name="offline" size={16} /> Offline</Tag>}
        <IconButton icon="account" label="Account and pass" href="#/account" />
        <IconButton icon="settings" label="Settings" href="#/settings" />
      </header>
      <main className="main" id="main" tabIndex={-1}>
        {s.contentError && <Banner kind="error">{s.contentError}</Banner>}
        {children}
      </main>
      {nav('navbar')}
      {sheet && <PaperSheet onClose={() => setSheet(false)} />}
    </div>
  );
}

export function App() {
  const s = useApp(); const route = useRoute();
  useEffect(() => {
    const apply = () => { const dark = s.prefs?.theme === 'dark' || (s.prefs?.theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches); document.documentElement.dataset.theme = dark ? 'dark' : 'light'; };
    apply(); const mq = window.matchMedia('(prefers-color-scheme: dark)'); mq.addEventListener('change', apply); return () => mq.removeEventListener('change', apply);
  }, [s.prefs?.theme]);
  // Move focus to the new screen on navigation, except when the learner is arrowing through a tab list.
  useEffect(() => { if (document.activeElement?.getAttribute('role') === 'tab') return; document.getElementById('main')?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [route.join('/')]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!s.toast) return; const t = setTimeout(() => model.toast(null), 7000); return () => clearTimeout(t); }, [s.toast]);

  if (s.phase === 'loading') return <div className="app"><main className="main"><Empty title="Loading your study data…" /></main></div>;
  if (s.phase === 'storage_error') return (
    <div className="app"><main className="main"><Empty title="Your progress cannot be saved on this device right now" action={<div className="actions"><Button variant="filled" onClick={() => window.location.reload()}>Try again</Button><Button variant="outlined" onClick={() => void model.bootTemporary()}>Continue without saving</Button></div>}>
      {s.bootError} This can happen in private browsing or when storage is blocked or full. Nothing has been deleted.</Empty></main></div>);
  if (!s.prefs.onboarded) return s.contexts.length ? <Onboarding /> : <div className="app"><main className="main"><Empty title="Setup needs a connection" action={<Button variant="filled" onClick={() => window.location.reload()}>Retry</Button>}>{s.contentError ?? 'The session list could not be loaded.'}</Empty></main></div>;

  const toast = s.toast && <div className="snackbar" role="status"><span style={{ flex: 1 }}>{s.toast}</span><Button onClick={() => model.toast(null)}>Dismiss</Button></div>;
  const [a, b, c] = route;
  if (a === 'session' && b) return <><StudyPlayer id={b} />{toast}</>;
  if (a === 'attempt' && b) return <><AttemptScreen id={b} />{toast}</>;
  let screen: ReactNode;
  if (a === 'learn' && b === 'unit' && c) screen = <UnitScreen unitId={c} />;
  else if (a === 'learn') screen = <Learn />;
  else if (a === 'practice') screen = <Practice />;
  else if (a === 'library' && b === 'item' && c) screen = <ItemScreen itemId={c} />;
  else if (a === 'library') screen = <Library tab={b} />;
  else if (a === 'coverage') screen = <Coverage paper={b as PaperId | undefined} />;
  else if (a === 'account') screen = <Account />;
  else if (a === 'performance') screen = <Performance />;
  else if (a === 'settings') screen = <Settings />;
  else screen = <Today />;
  return <><Shell route={route}>{screen}</Shell>{toast}</>;
}

