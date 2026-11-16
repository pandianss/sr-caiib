import { PAPER_NAMES } from '../../core/catalogue.ts';
import { topicGap } from '../../core/coverage.ts';
import { cardSeconds } from '../../core/session.ts';
import { CARD_TYPE_LABEL, CardBody, Sources } from '../content.tsx';
import { go, useApp } from '../hooks.ts';
import { model } from '../model.ts';
import { Banner, Button, Empty, Icon, IconButton, Md, More, Tag } from '../ui.tsx';

function useStudied(): Set<string> {
  const s = useApp();
  return new Set(s.events.filter(e => e.event_type === 'lesson_completed' && e.learner_id === s.prefs.learner_id && e.exam_context_id === s.prefs.exam_context_id).map(e => e.item_id));
}

export function Learn() {
  const s = useApp(); const paper = s.prefs.active_paper; const cat = model.catalogueFor(paper); const record = s.index.packFor(paper); const studied = useStudied();
  const baseline = s.ledger?.papers.find(p => p.paper_id === paper)?.baseline;
  const modules = cat?.modulesOf(paper) ?? [];
  return (
    <>
      <div className="section"><h1>Learn</h1><p className="support">Pick a unit to study its lesson or practise its questions.</p></div>
      {record?.kind !== 'fixture' && baseline?.status === 'provisional' && <Banner kind="warn">This outline comes from an earlier IIBF elective booklet and has not yet been confirmed for your session. It may change.</Banner>}
      {modules.length === 0 ? (
        <Empty title="The syllabus for this paper is not available yet" action={<Button variant="filled" href="#/coverage">See the coverage map</Button>}>{baseline?.note ?? 'No official syllabus has been loaded for this paper.'} Lessons cannot be published until the official syllabus is verified.</Empty>
      ) : modules.map(m => {
        const units = cat!.unitsOf(m.id);
        const mCards = units.flatMap(u => s.index.cards(paper, u.id)); const mDone = mCards.filter(c => studied.has(c.id)).length;
        return (
          <section className="section" key={m.id} aria-labelledby={`m-${m.id}`}>
            <h2 id={`m-${m.id}`}>{m.title ?? m.id}</h2>
            {mCards.length > 0 && <div className="mod-progress"><div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={mCards.length} aria-valuenow={mDone} aria-label={`${m.title ?? m.id}: ${mDone} of ${mCards.length} cards studied`}><span style={{ width: `${Math.round(100 * mDone / mCards.length)}%` }} /></div><span className="label tabular">{mDone} of {mCards.length} cards studied</span></div>}
            <ul className="list">{units.map(u => {
              const cards = s.index.cards(paper, u.id); const qs = s.index.questions(paper, u.id).length; const done = cards.filter(c => studied.has(c.id)).length;
              const has = cards.length + qs > 0; const open = has && model.unitOpen(paper, u.id);
              return (
                <li key={u.id}><a className="item" href={`#/learn/unit/${encodeURIComponent(u.id)}`}>
                  <span className="grow"><span className="title">{u.title ?? u.id}</span>
                    <span className="meta" style={{ display: 'block' }}>{has ? `${cards.length} card${cards.length === 1 ? '' : 's'} · ${qs} question${qs === 1 ? '' : 's'}${cards.length ? ` · ${done} studied` : ''}` : 'Not yet published'}</span></span>
                  {has && !open && <Tag kind="info"><Icon name="lock" size={14} /> In the pass</Tag>}
                  {has && open && done === cards.length && cards.length > 0 && <Tag kind="ok">✓ Studied</Tag>}
                  <Icon name="chevron" />
                </a></li>);
            })}</ul>
          </section>);
      })}
    </>
  );
}

export function UnitScreen({ unitId }: { unitId: string }) {
  const s = useApp(); const paper = s.prefs.active_paper; const cat = model.catalogueFor(paper); const unit = cat?.unit(unitId); const studied = useStudied();
  if (!unit || cat?.module(unit.module_id)?.paper_id !== paper) return <Empty title="This unit is not part of the selected paper" action={<Button variant="filled" href="#/learn">Back to Learn</Button>}>Choose a unit from the syllabus list.</Empty>;
  const cards = s.index.cards(paper, unitId); const questions = s.index.questions(paper, unitId).filter(q => !q.case_study_id);
  const topic = s.ledger?.papers.find(p => p.paper_id === paper)?.topics.find(t => t.topic_id === unitId);
  const objectives = cat.objectivesOf(unit.id); const has = cards.length + questions.length > 0; const open = has && model.unitOpen(paper, unitId);
  const active = model.activeSession(paper); const resumable = active && active.kind === 'lesson' && active.steps.some(st => cards.some(c => c.id === st.item_id));
  const minutes = Math.max(1, Math.round(cards.reduce((n, c) => n + cardSeconds(c), 0) / 60));
  const start = async () => { if (resumable) return go(`session/${active.session_id}`); const id = await model.startUnit(unitId); if (id) go(`session/${id}`); };
  const practise = async () => { const id = await model.startPractice('unit', unitId); if (id) go(`attempt/${id}`); };
  return (
    <>
      <div className="section"><span className="label">{cat.module(unit.module_id)?.title}</span><h1>{unit.title ?? unit.id}</h1></div>
      {topic?.official_scope_text && <More summary="Official syllabus scope"><p>{topic.official_scope_text}</p><p className="support">Wording from the IIBF syllabus ({topic.locator}). {topic.baseline_issue ?? ''}</p></More>}
      {!has && <Banner>{topic ? topicGap(topic) : 'No lessons or questions have been published for this unit yet.'} This unit is unavailable, not locked: there is nothing to buy here yet.</Banner>}
      {has && !open && (
        <section className="card" aria-labelledby="lock"><h2 id="lock"><Icon name="lock" size={18} /> This unit is part of the CAIIB pass</h2>
          <p>It has {cards.length} card{cards.length === 1 ? '' : 's'} and {questions.length} question{questions.length === 1 ? '' : 's'}. The free sample units stay open without a pass.</p>
          <Button variant="filled" onClick={() => { model.setReturnTo(window.location.hash); go('account'); }}>See what the pass includes</Button></section>)}
      {open && (<>
        <div className="actions">
          {cards.length > 0 && <Button variant="filled" onClick={() => void start()}>{resumable ? 'Resume lesson' : cards.every(c => studied.has(c.id)) ? 'Study again' : 'Start lesson'}{cards.length > 0 && !resumable ? ` · about ${minutes} min` : ''}</Button>}
          {questions.length > 0 && <Button variant="tonal" onClick={() => void practise()}>Practise {Math.min(10, questions.length)} question{questions.length === 1 ? '' : 's'}</Button>}
        </div>
        {objectives.length > 0 && <section className="section" aria-labelledby="obj"><h2 id="obj">Learning objectives</h2><ul style={{ margin: 0, paddingLeft: '1.25rem' }}>{objectives.map(o => <li key={o.id}>{o.title ?? o.id}</li>)}</ul></section>}
        <section className="section" aria-labelledby="cards"><h2 id="cards">Cards in this unit</h2>
          <ul className="list">{cards.map(c => (
            <li key={c.id}><div className="row" style={{ flexWrap: 'nowrap' }}><a className="item" href={`#/library/item/${encodeURIComponent(c.id)}`}><span className="grow"><span className="title">{c.title}</span><span className="meta" style={{ display: 'block' }}>{CARD_TYPE_LABEL[c.card_type]}{studied.has(c.id) ? ' · studied' : ''}</span></span>{studied.has(c.id) && <Tag kind="ok">✓</Tag>}</a>
              <IconButton icon={model.isBookmarked(c.id) ? 'bookmark' : 'bookmarkOff'} label={model.isBookmarked(c.id) ? `Remove bookmark: ${c.title}` : `Bookmark: ${c.title}`} pressed={model.isBookmarked(c.id)} onClick={() => void model.toggleBookmark(c.id, paper)} /></div></li>))}</ul>
        </section>
      </>)}
    </>
  );
}

/** Read-only view of a single library item (card or reference). Viewing here records no study evidence. */
export function ItemScreen({ itemId }: { itemId: string }) {
  const s = useApp(); const item = s.index.item(itemId);
  if (!item || item.item_type === 'question' || item.item_type === 'case_study') return <Empty title="This item is not available" action={<Button variant="filled" href="#/library">Back to Library</Button>}>It may belong to content that is not downloaded on this device.</Empty>;
  if (!model.unitOpen(item.paper_id, item.unit_id)) return <Empty title="This item is part of the CAIIB pass" action={<Button variant="filled" onClick={() => { model.setReturnTo(window.location.hash); go('account'); }}>See what the pass includes</Button>} />;
  const title = item.title; const marked = model.isBookmarked(item.id);
  return (
    <>
      <div className="row between"><div className="grow"><span className="label">{PAPER_NAMES[item.paper_id]} · {item.item_type === 'card' ? CARD_TYPE_LABEL[item.card_type] : item.item_type === 'reference' ? 'Reference' : 'Calculator'}</span><h1>{title}</h1></div>
        <IconButton icon={marked ? 'bookmark' : 'bookmarkOff'} label={marked ? 'Remove bookmark' : 'Bookmark'} pressed={marked} onClick={() => void model.toggleBookmark(item.id, item.paper_id)} /></div>
      {item.item_type === 'card' && <CardBody card={item} />}
      {item.item_type === 'reference' && <><Md text={item.body_md} className="lesson" /><p className="support">{item.effective_from ? `Effective from ${item.effective_from}` : ''}{item.effective_until ? ` until ${item.effective_until}` : ''}</p></>}
      {item.item_type === 'calculator' && <Button variant="filled" href={`#/library/calculators`}>Open calculators</Button>}
      <Sources item={item} />
      {item.item_type === 'card' && <p className="support">Reading here does not count as studied. Use the lesson in Learn to record a self-check and schedule reviews.</p>}
    </>
  );
}
