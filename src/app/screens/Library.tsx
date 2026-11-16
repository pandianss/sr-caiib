import { useEffect, useState } from 'react';
import type { PaperId, StudyCard } from '../../types/contracts.ts';
import { PAPER_NAMES } from '../../core/catalogue.ts';
import { allCalculators, runCalculator, type CalcResult } from '../../core/calculators.ts';
import { formatIndian, mustDec } from '../../core/decimal.ts';
import { formatDate } from '../../core/time.ts';
import { CARD_TYPE_LABEL } from '../content.tsx';
import { go, paperAvailability, useApp } from '../hooks.ts';
import { model } from '../model.ts';
import { PURCHASES_VISIBLE } from '../platform.ts';
import { Banner, Button, Chip, Empty, Icon, More, Sheet, Tabs, Tag } from '../ui.tsx';

type Tab = 'search' | 'formulas' | 'statutes' | 'calculators' | 'bookmarks' | 'downloads';
const TABS: { id: Tab; label: string }[] = [{ id: 'search', label: 'Search' }, { id: 'formulas', label: 'Formulas' }, { id: 'statutes', label: 'Statutes' }, { id: 'calculators', label: 'Calculators' }, { id: 'bookmarks', label: 'Bookmarks' }, { id: 'downloads', label: 'Downloads' }];
const remember = (k: string, v: string) => { try { sessionStorage.setItem(k, v); } catch { /* optional */ } };
const recall = (k: string): string => { try { return sessionStorage.getItem(k) ?? ''; } catch { return ''; } };

export function Library({ tab }: { tab?: string }) {
  const current = (TABS.find(t => t.id === tab)?.id ?? 'search') as Tab;
  return (
    <>
      <div className="section"><h1>Library</h1></div>
      <Tabs tabs={TABS} value={current} onChange={t => go(`library/${t}`)} label="Library sections" />
      <div role="tabpanel" aria-label={TABS.find(t => t.id === current)?.label} className="section">
        {current === 'search' && <Search />}{current === 'formulas' && <CardList type="formula" />}{current === 'statutes' && <CardList type="statute" />}
        {current === 'calculators' && <Calculators />}{current === 'bookmarks' && <Bookmarks />}{current === 'downloads' && <OfflinePackInspector />}
      </div>
    </>
  );
}

function Search() {
  const s = useApp(); const paper = s.prefs.active_paper;
  const [query, setQuery] = useState(() => recall('lib.q')); const [all, setAll] = useState(() => recall('lib.scope') === 'all');
  useEffect(() => { remember('lib.q', query); remember('lib.scope', all ? 'all' : 'paper'); }, [query, all]);
  const hits = query.trim().length >= 2 ? s.index.search(query, all ? 'all' : paper) : [];
  return (
    <>
      <div className="field"><label htmlFor="q">Search lessons, formulas and references</label><div className="input-row"><input id="q" className="input" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="For example: growth" autoComplete="off" /></div></div>
      <div className="chips" role="group" aria-label="Search scope"><Chip selected={!all} onClick={() => setAll(false)}>This paper: {PAPER_NAMES[paper]}</Chip><Chip selected={all} onClick={() => setAll(true)}>All downloaded papers</Chip></div>
      <p className="support" role="status">{query.trim().length < 2 ? 'Type at least two characters. Search covers content downloaded on this device and works offline.' : `${hits.length} result${hits.length === 1 ? '' : 's'} in ${all ? 'all downloaded papers' : PAPER_NAMES[paper]}.`}</p>
      {query.trim().length >= 2 && hits.length === 0 && <Empty title="No results" action={!all ? <Button variant="tonal" onClick={() => setAll(true)}>Search all downloaded papers</Button> : undefined}>Nothing downloaded matches “{query}”. Check the spelling or try a shorter term. Unpublished topics cannot be found here.</Empty>}
      <ul className="list">{hits.map(h => <li key={h.item.id}><a className="item" href={`#/library/item/${encodeURIComponent(h.item.id)}`}><span className="grow"><span className="title">{h.title}</span><span className="meta" style={{ display: 'block' }}>{model.unitOpen(h.paper_id, h.item.unit_id) ? h.snippet : 'Part of the CAIIB pass'}</span></span>{!model.unitOpen(h.paper_id, h.item.unit_id) && <Tag kind="info"><Icon name="lock" size={14} /> In the pass</Tag>}{all && <Tag>{h.paper_id}</Tag>}<Icon name="chevron" /></a></li>)}</ul>
    </>
  );
}

function CardList({ type }: { type: StudyCard['card_type'] }) {
  const s = useApp(); const paper = s.prefs.active_paper; const cat = model.catalogueFor(paper);
  const cards = s.index.cards(paper).filter(c => c.card_type === type && model.unitOpen(paper, c.unit_id));
  const refs = type === 'statute' ? s.index.references(paper).filter(r => model.unitOpen(paper, r.unit_id)) : [];
  if (!cards.length && !refs.length) return <Empty title={`No ${type === 'formula' ? 'formulas' : 'statutory references'} available for ${PAPER_NAMES[paper]}`}>They appear here when lessons for this paper are published and downloaded.</Empty>;
  return (
    <>
      <p className="support">{PAPER_NAMES[paper]}</p>
      <ul className="list">{cards.map(c => <li key={c.id}><a className="item" href={`#/library/item/${encodeURIComponent(c.id)}`}><span className="grow"><span className="title">{c.title}</span><span className="meta" style={{ display: 'block' }}>{c.card_type === 'statute' ? `${c.statute_spec.act_or_direction_name}${c.statute_spec.section_or_clause ? ` · ${c.statute_spec.section_or_clause}` : ''}` : cat?.unit(c.unit_id)?.title}</span></span><Icon name="chevron" /></a></li>)}</ul>
      {refs.length > 0 && <><h2>Reference entries</h2><ul className="list">{refs.map(r => <li key={r.id}><a className="item" href={`#/library/item/${encodeURIComponent(r.id)}`}><span className="grow"><span className="title">{r.title}</span><span className="meta" style={{ display: 'block' }}>{r.context.kind === 'current_reference' ? `Current reference as of ${formatDate(r.context.as_of_date)}` : 'Exam-session reference'}</span></span><Icon name="chevron" /></a></li>)}</ul></>}
    </>
  );
}

function Calculators() {
  const defs = allCalculators(); const [key, setKey] = useState(() => recall('lib.calc') || defs[0]!.key); const def = defs.find(d => d.key === key) ?? defs[0]!;
  const [values, setValues] = useState<Record<string, string>>({}); const [result, setResult] = useState<CalcResult | null>(null);
  useEffect(() => { setValues({}); setResult(null); remember('lib.calc', key); }, [key]);
  const errors = result && !result.ok ? result.errors : {};
  return (
    <>
      <p className="support">Deterministic tools for study. They are closed during timed mocks.</p>
      <div className="chips" role="group" aria-label="Calculator">{defs.map(d => <Chip key={d.key} selected={d.key === key} onClick={() => setKey(d.key)}>{d.title}</Chip>)}</div>
      <form className="section" onSubmit={e => { e.preventDefault(); setResult(runCalculator(key, values)); }} noValidate>
        <h2>{def.title}</h2><p className="support">{def.summary}</p>
        {def.inputs.map(i => (
          <div className="field" key={i.key}><label htmlFor={`c-${i.key}`}>{i.label}</label>
            <div className="input-row"><input id={`c-${i.key}`} className="input" inputMode="decimal" autoComplete="off" value={values[i.key] ?? ''} aria-invalid={errors[i.key] ? true : undefined} aria-describedby={errors[i.key] ? `e-${i.key}` : undefined} onChange={e => { setValues({ ...values, [i.key]: e.target.value }); setResult(null); }} /><span className="unit">{i.unit}</span></div>
            {errors[i.key] && <span className="error" id={`e-${i.key}`} role="alert">{errors[i.key]}</span>}</div>))}
        <Button variant="filled" type="submit">Calculate</Button>
        {result?.ok && (<div className="banner ok" role="status"><Icon name="check" /><div className="grow"><strong>{def.output_unit.startsWith('₹') ? `₹ ${formatIndian(mustDec(result.value), def.output_decimals)}${def.output_unit.slice(1)}` : `${result.value} ${result.unit}`}</strong><div>Rounded to {def.output_decimals} decimal places (half up).</div></div></div>)}
        {result?.ok && <More summary="Working" open><ol className="steps">{result.steps.map((st, i) => <li key={i}><div><div>{st.description}</div><div className="calc" tabIndex={0}>{st.expression} = <strong>{st.result}</strong></div></div></li>)}</ol></More>}
        <More summary="Formula and assumptions"><p><strong>{def.formula}</strong></p><ul style={{ margin: 0, paddingLeft: '1.25rem' }}>{def.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul></More>
      </form>
    </>
  );
}

function Bookmarks() {
  const s = useApp(); const paper = s.prefs.active_paper;
  const rows = s.bookmarks.map(b => ({ b, item: s.index.item(b.item_id) })).sort((x, y) => (x.b.created_at < y.b.created_at ? 1 : -1));
  const mine = rows.filter(r => r.b.paper_id === paper), other = rows.filter(r => r.b.paper_id !== paper);
  if (!rows.length) return <Empty title="No bookmarks yet">Use the bookmark button on a card to keep it here.</Empty>;
  const list = (items: typeof rows) => <ul className="list">{items.map(({ b, item }) => <li key={b.item_id}>{item && item.item_type !== 'question' && item.item_type !== 'case_study' ? <a className="item" href={`#/library/item/${encodeURIComponent(b.item_id)}`}><span className="grow"><span className="title">{item.title}</span><span className="meta" style={{ display: 'block' }}>{PAPER_NAMES[b.paper_id]}{item.item_type === 'card' ? ` · ${CARD_TYPE_LABEL[item.card_type]}` : ''}</span></span><Icon name="chevron" /></a> : <div className="item" aria-disabled="true"><span className="grow"><span className="title">Bookmarked item</span><span className="meta" style={{ display: 'block' }}>{PAPER_NAMES[b.paper_id]} · its content is not downloaded on this device</span></span><Button onClick={() => void model.toggleBookmark(b.item_id, b.paper_id)}>Remove</Button></div>}</li>)}</ul>;
  return <>{mine.length > 0 ? <><h2>{PAPER_NAMES[paper]}</h2>{list(mine)}</> : <p className="support">No bookmarks in {PAPER_NAMES[paper]}.</p>}{other.length > 0 && <><h2>Other papers</h2>{list(other)}</>}</>;
}

export function OfflinePackInspector() {
  const s = useApp(); const [confirm, setConfirm] = useState<PaperId | null>(null); const [usage, setUsage] = useState<string | null>(null);
  useEffect(() => { void navigator.storage?.estimate?.().then(e => { if (e.usage !== undefined && e.quota) setUsage(`${(e.usage / 1_048_576).toFixed(1)} MB used of about ${(e.quota / 1_048_576).toFixed(0)} MB available to this app`); }).catch(() => {}); }, [s.allRecords.length]);
  return (
    <>
      <p className="support">Downloaded content and the app itself work without a connection. Papers that are not downloaded, or not yet published, are not available offline.{usage ? ` ${usage}.` : ''}</p>
      <ul className="list pack-list">{model.studyPapers().map(paper => {
        const record = s.index.packFor(paper); const entries = model.entryFor(paper); const dl = s.downloads[paper]; const update = s.updates.find(u => u.paper_id === paper);
        const installable = entries.find(e => e.kind === 'fixture' || e.access === 'free') ?? entries[0]; const a = paperAvailability(s, paper);
        const full = entries.find(e => e.kind === 'published' && e.access === 'full');
        return (
          <li key={paper}>
            <div className="row between"><div className="grow"><strong>{PAPER_NAMES[paper]}</strong>
              <div className="support">{record ? `Version ${record.pack.pack_version} · ${record.pack.items.filter(i => i.item_type === 'card').length} cards, ${record.pack.items.filter(i => i.item_type === 'question').length} questions · installed ${formatDate(record.installed_at)}` : entries.length ? 'Published but not downloaded on this device.' : 'No content has been published for this paper yet.'}</div></div><Tag kind={a.kind}>{a.label}</Tag></div>
            {dl?.state === 'downloading' && <Banner>Downloading and checking the content… Keep the app open.</Banner>}
            {dl?.state === 'failed' && <Banner kind="error" action={installable && <Button variant="outlined" onClick={() => void model.installPack(update ?? installable)}>Retry</Button>}>{dl.message}</Banner>}
            {update && dl?.state !== 'downloading' && <Banner kind="warn" action={<Button variant="outlined" onClick={() => void model.installPack(update)}>Update</Button>}>Update available (version {update.pack_version}): {update.change_summary} Unfinished sessions keep the version they started with.</Banner>}
            <div className="row" style={{ marginTop: '0.5rem' }}>
              {!record && installable && dl?.state !== 'downloading' && <Button variant="tonal" onClick={() => void model.installPack(installable)}><Icon name="download" size={18} />Download</Button>}
              {record && full && record.pack.pack_id !== full.pack_id && (model.entitled(paper) ? <Button variant="tonal" onClick={() => void model.installPack(full)}><Icon name="download" size={18} />Download full paper</Button> : PURCHASES_VISIBLE ? <Button href="#/account">Full paper is part of the pass</Button> : <span className="support">The full paper arrives in a later update.</span>)}
              {record && <Button variant="danger" onClick={() => setConfirm(paper)}>Remove download</Button>}
            </div>
          </li>);
      })}</ul>
      {confirm && <Sheet title={`Remove ${PAPER_NAMES[confirm]} from this device?`} onClose={() => setConfirm(null)}>
        <p>The lessons and questions are removed from this device. Your history, review schedule and bookmarks are kept, and you can download the paper again when online.</p>
        <div className="actions"><Button variant="outlined" onClick={() => setConfirm(null)}>Keep</Button><Button variant="filled" onClick={() => { const p = confirm; setConfirm(null); void model.removePaperContent(p); }}>Remove</Button></div></Sheet>}
    </>
  );
}
