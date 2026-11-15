/**
 * Visual coverage map: paper → module → topic → objective, driven by the coverage ledger.
 * Content stages (source, drafted, assessed, reviewed, published), the learner's own study state and access
 * locks are shown as separate things, each with a text label as well as colour.
 */
import { useState } from 'react';
import type { PaperId } from '../../types/contracts.ts';
import { PAPER_NAMES } from '../../core/catalogue.ts';
import { STAGES, STAGE_LABELS, objectiveStages, summariseOverall, topicGap, topicStages, type LedgerTopic, type PaperSummary, type Stage } from '../../core/coverage.ts';
import { go, useApp } from '../hooks.ts';
import { model, PAPER_ORDER } from '../model.ts';
import { Banner, Button, Empty, More, Tag } from '../ui.tsx';

const SHORT: Record<Stage, string> = { source_supported: 'Source', drafted: 'Lesson', assessed: 'Questions', reviewed: 'Reviewed', published: 'Published' };

function StageRow({ stages }: { stages: Record<Stage, boolean> }) {
  return <span className="row" style={{ gap: '0.25rem' }}>{STAGES.map(st => <Tag key={st} kind={stages[st] ? 'ok' : undefined}>{stages[st] ? '✓' : '○'} {SHORT[st]}</Tag>)}</span>;
}
function Counts({ p }: { p: PaperSummary }) {
  const denom = p.topic_denominator;
  return (
    <div className="stack">{STAGES.map(st => (
      <div className="meter-row" key={st}><span>{STAGE_LABELS[st]}</span>
        {denom ? <div className="progress" role="img" aria-label={`${STAGE_LABELS[st]}: ${p.topic_counts[st]} of ${denom} topics`}><span style={{ width: `${(p.topic_counts[st] / denom) * 100}%` }} /></div> : <span className="support">no verified total</span>}
        <strong>{p.topic_counts[st]}{denom ? ` / ${denom}` : ''}</strong></div>))}</div>
  );
}

export function Coverage({ paper: routePaper }: { paper?: PaperId }) {
  const s = useApp(); const ledger = s.ledger;
  const [openTopic, setOpenTopic] = useState<string | null>(null);
  if (!ledger) return <Empty title="The coverage map could not be loaded" action={<Button variant="filled" onClick={() => window.location.reload()}>Retry</Button>}>Connect to the internet and reload.</Empty>;
  const paper = PAPER_ORDER.includes(routePaper as PaperId) ? routePaper! : s.prefs.active_paper;
  const { papers, overall } = summariseOverall(ledger); const lp = ledger.papers.find(p => p.paper_id === paper); const ps = papers.find(p => p.paper_id === paper);
  const studied = new Set(s.events.filter(e => e.event_type === 'lesson_completed' && e.learner_id === s.prefs.learner_id).map(e => e.item_id));
  const modules = lp ? [...new Map(lp.topics.map(t => [t.module_id, t.module_title])).entries()] : [];

  const topicRow = (t: LedgerTopic) => {
    const stages = topicStages(t); const open = openTopic === t.topic_id;
    const installed = s.index.cards(t.paper_id, t.topic_id); const mine = installed.filter(c => studied.has(c.id)).length;
    const published = t.objectives.flatMap(o => o.published_item_ids);
    return (
      <li key={t.topic_id}>
        <button type="button" className="item" aria-expanded={open} onClick={() => setOpenTopic(open ? null : t.topic_id)}>
          <span className="grow"><span className="title">{t.title}</span><span className="meta" style={{ display: 'block' }}>{t.objectives.length ? `${t.objectives.length} objective${t.objectives.length === 1 ? '' : 's'}` : 'Objectives not derived yet'} · {t.locator}</span></span>
          {stages.published ? <Tag kind="ok">✓ Published</Tag> : t.blocked_reason ? <Tag kind="warn">▲ Blocked</Tag> : <Tag>○ In progress</Tag>}
        </button>
        {open && (
          <div className="tree-topic section" style={{ marginBottom: '1rem' }}>
            <div><h3>Content status</h3><StageRow stages={stages} /></div>
            {!stages.published && <Banner kind={t.blocked_reason ? 'warn' : 'info'}>{topicGap(t)}</Banner>}
            <div><h3>Official syllabus scope</h3><p>{t.official_scope_text || 'No scope text is listed under this heading.'}</p>{t.baseline_issue && <p className="support">{t.baseline_issue}</p>}</div>
            {t.objectives.length > 0 && <div><h3>Objectives</h3><ul className="list">{t.objectives.map(o => <li key={o.objective_id} style={{ padding: '0.5rem 0' }}><div>{o.statement} <span className="support">({o.origin === 'official' ? 'official wording' : 'editorial objective'})</span></div><StageRow stages={objectiveStages(o)} />{o.gaps.length > 0 && <p className="support">Remaining: {o.gaps.join(' ')}</p>}{(o.source_caveats?.length ?? 0) > 0 && <p className="support">Evidence limits: {o.source_caveats?.join(' ')}</p>}</li>)}</ul></div>}
            <div><h3>Your study</h3>
              {installed.length > 0 ? <p>{mine} of {installed.length} lesson card{installed.length === 1 ? '' : 's'} studied on this device. {model.unitOpen(t.paper_id, t.topic_id) ? '' : 'This topic is part of the CAIIB pass.'}</p>
                : <p className="support">{published.length ? 'Published, but not downloaded on this device.' : 'Nothing to study yet: no lesson has been published for this topic.'}</p>}
              {installed.length > 0 && <Button variant="tonal" onClick={() => { void model.setPaper(t.paper_id).then(() => go(`learn/unit/${encodeURIComponent(t.topic_id)}`)); }}>Open lessons and questions</Button>}
            </div>
          </div>)}
      </li>);
  };

  return (
    <>
      <div className="section"><h1>Syllabus coverage map</h1><p className="support">{ledger.exam_session} · what exists for every paper, module and topic, and what is still missing.</p></div>
      <section className="card" aria-labelledby="ov"><h2 id="ov">Whole syllabus</h2>
        {overall.denominator === null ? <Banner kind="warn"><strong>Baseline incomplete: total number of syllabus topics unknown.</strong> No overall completion percentage is shown. {overall.papers_missing_baseline.length > 0 && `Official syllabus not yet obtained for: ${overall.papers_missing_baseline.map(p => PAPER_NAMES[p]).join(', ')}. `}{overall.papers_provisional.length > 0 && `Outline not yet confirmed for the session: ${overall.papers_provisional.map(p => PAPER_NAMES[p]).join(', ')}.`}</Banner>
          : <p><strong>{overall.topic_counts.published} of {overall.denominator}</strong> official topics are reviewed and published.</p>}
        <dl className="kv"><dt>Topics listed so far</dt><dd>{overall.topics_listed}</dd><dt>Published</dt><dd>{overall.topic_counts.published}</dd><dt>Reviewed</dt><dd>{overall.topic_counts.reviewed}</dd><dt>Lesson drafted</dt><dd>{overall.topic_counts.drafted}</dd></dl>
      </section>
      {lp && ps && (
        <section className="section" aria-labelledby="pt">
          <div className="row between"><h1 id="pt">{PAPER_NAMES[paper]}</h1><Tag kind={lp.baseline.status === 'verified' ? 'ok' : 'warn'}>{lp.baseline.status === 'verified' ? '✓ Syllabus verified' : lp.baseline.status === 'provisional' ? '▲ Outline not confirmed' : '▲ Syllabus missing'}</Tag></div>
          <p className="support">{lp.kind === 'compulsory' ? 'Compulsory paper' : 'Elective paper'} · {lp.baseline.note}</p>
          {lp.baseline.status === 'missing' ? <Empty title="Modules and topics unknown">The official syllabus for this paper has to be obtained before its topics can be listed, taught or counted. It stays on this map so the gap is visible.</Empty> : (<>
            <div className="card"><h2>{ps.topic_denominator ? `${ps.topic_denominator} official topics` : `${ps.topics_listed} topics listed (not yet a verified total)`}</h2><Counts p={ps} />
              <p className="support">Each row counts whole topics that have reached that stage. Stages are separate views and are not added together. {ps.blocked_topics} topic{ps.blocked_topics === 1 ? ' is' : 's are'} currently blocked.</p></div>
            {modules.map(([id, title]) => { const topics = lp.topics.filter(t => t.module_id === id); const pub = topics.filter(t => topicStages(t).published).length; return (
              <More key={id} summary={`${title} · ${pub} of ${topics.length} topics published`} open={topics.some(t => t.topic_id === openTopic)}><ul className="list">{topics.map(topicRow)}</ul></More>); })}
          </>)}
        </section>)}
      <More summary="Sources and how to read this map"><ul className="list">{ledger.sources.map(src => <li key={src.source_id} style={{ padding: '0.5rem 0' }}><strong>{src.title}</strong><div className="support">{src.authority} · session applicability: {src.session_applicability}</div></li>)}</ul>
        <p className="support">✓ means the stage is complete with recorded evidence; ○ means not yet; ▲ means blocked. “Your study” shows what you have done on this device and is never mixed into content completion. Status: {ledger.verdict}</p></More>
    </>
  );
}
