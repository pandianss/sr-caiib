/**
 * Coverage ledger model and summaries for the visual coverage map.
 * Stages are independent views of the same fixed topic denominator and are never added together.
 * A paper without a verified official baseline has denominator null: no percentage is ever derived for it.
 */
import type { PaperId } from '../types/contracts.ts';

export type Stage = 'source_supported' | 'drafted' | 'assessed' | 'reviewed' | 'published';
export const STAGES: readonly Stage[] = ['source_supported', 'drafted', 'assessed', 'reviewed', 'published'];
export const STAGE_LABELS: Record<Stage, string> = {
  source_supported: 'Full source support', drafted: 'Lesson drafted', assessed: 'Assessment drafted', reviewed: 'Reviewed', published: 'Published',
};

export interface LedgerObjective {
  objective_id: string; statement: string; origin: 'official' | 'editorial';
  source_support: 'supported' | 'partial' | 'missing' | 'conflicting' | 'unreadable';
  lesson_item_ids: string[]; worked_example_item_ids: string[]; assessment_item_ids: string[];
  teaching_adequate: boolean; assessment_adequate: boolean;
  review: { source: ReviewState; originality: ReviewState; calculations: ReviewState | 'not_applicable'; record_refs: string[] };
  published_item_ids: string[]; gaps: string[];
  /** Limits of the evidence behind published content (unretrieved or paid primary texts, differences from the courseware). They do not block publication but are shown to reviewers. */
  source_caveats?: string[];
}
export type ReviewState = 'not_started' | 'pending' | 'changes_required' | 'passed';

export interface LedgerTopic {
  topic_id: string;                 // equals the catalogue unit ID
  paper_id: PaperId; module_id: string; module_title: string; module_kind: 'module' | 'appendix';
  title: string; official_scope_text: string;
  syllabus_source_id: string; locator: string;
  baseline_issue: string | null;
  kind: 'named_section' | 'editorial_container';
  objectives: LedgerObjective[];
  blocked_reason: string | null;
}

export interface LedgerPaper {
  paper_id: PaperId; title: string; kind: 'compulsory' | 'elective';
  baseline: { status: 'verified' | 'provisional' | 'missing'; note: string; syllabus_source_id: string | null };
  topics: LedgerTopic[];
}

export interface CoverageLedger {
  ledger_version: string; generated_at: string; baseline_version: string;
  exam_session: string; verdict: string;
  sources: { source_id: string; title: string; authority: string; fingerprint_sha256: string | null; session_applicability: string; note: string }[];
  papers: LedgerPaper[];
}

export interface StageCounts { source_supported: number; drafted: number; assessed: number; reviewed: number; published: number }
export interface PaperSummary {
  paper_id: PaperId; title: string; kind: 'compulsory' | 'elective'; baseline_status: LedgerPaper['baseline']['status']; baseline_note: string;
  /** Verified official topic denominator, or null when the baseline is missing/provisional. */
  topic_denominator: number | null;
  /** Topics currently listed (may be provisional); shown as a count, never as a completion denominator when unverified. */
  topics_listed: number;
  objective_count: number;
  topic_counts: StageCounts; objective_counts: StageCounts;
  blocked_topics: number;
}

const zero = (): StageCounts => ({ source_supported: 0, drafted: 0, assessed: 0, reviewed: 0, published: 0 });

export function objectiveStages(o: LedgerObjective): Record<Stage, boolean> {
  const reviewed = o.review.source === 'passed' && o.review.originality === 'passed' && (o.review.calculations === 'passed' || o.review.calculations === 'not_applicable');
  return {
    source_supported: o.source_support === 'supported',
    drafted: o.teaching_adequate && o.lesson_item_ids.length > 0,
    assessed: o.assessment_adequate && o.assessment_item_ids.length > 0,
    reviewed: reviewed && o.teaching_adequate && o.assessment_adequate,
    published: reviewed && o.teaching_adequate && o.assessment_adequate && o.published_item_ids.length > 0 && o.gaps.length === 0,
  };
}

/** A topic reaches a stage only when it has objectives and every one of them reaches that stage. */
export function topicStages(t: LedgerTopic): Record<Stage, boolean> {
  const out = { source_supported: false, drafted: false, assessed: false, reviewed: false, published: false };
  if (!t.objectives.length) return out;
  const each = t.objectives.map(objectiveStages);
  for (const s of STAGES) out[s] = each.every(e => e[s]);
  return out;
}

export function summarisePaper(p: LedgerPaper): PaperSummary {
  const topic_counts = zero(), objective_counts = zero();
  let objective_count = 0, blocked = 0;
  for (const t of p.topics) {
    const ts = topicStages(t);
    for (const s of STAGES) if (ts[s]) topic_counts[s] += 1;
    if (t.blocked_reason) blocked += 1;
    for (const o of t.objectives) { objective_count += 1; const os = objectiveStages(o); for (const s of STAGES) if (os[s]) objective_counts[s] += 1; }
  }
  return {
    paper_id: p.paper_id, title: p.title, kind: p.kind, baseline_status: p.baseline.status, baseline_note: p.baseline.note,
    topic_denominator: p.baseline.status === 'verified' ? p.topics.length : null,
    topics_listed: p.topics.length, objective_count, topic_counts, objective_counts, blocked_topics: blocked,
  };
}

export interface OverallSummary { denominator: number | null; topics_listed: number; topic_counts: StageCounts; papers_missing_baseline: PaperId[]; papers_provisional: PaperId[] }

/** Overall denominator exists only when EVERY paper has a verified baseline. */
export function summariseOverall(ledger: CoverageLedger): { papers: PaperSummary[]; overall: OverallSummary } {
  const papers = ledger.papers.map(summarisePaper);
  const counts = zero();
  for (const p of papers) for (const s of STAGES) counts[s] += p.topic_counts[s];
  const allVerified = papers.length > 0 && papers.every(p => p.topic_denominator !== null);
  return {
    papers,
    overall: {
      denominator: allVerified ? papers.reduce((n, p) => n + (p.topic_denominator ?? 0), 0) : null,
      topics_listed: papers.reduce((n, p) => n + p.topics_listed, 0), topic_counts: counts,
      papers_missing_baseline: papers.filter(p => p.baseline_status === 'missing').map(p => p.paper_id),
      papers_provisional: papers.filter(p => p.baseline_status === 'provisional').map(p => p.paper_id),
    },
  };
}

/** Plain-language gap for a topic's drill-down. */
export function topicGap(t: LedgerTopic): string {
  if (t.blocked_reason) return t.blocked_reason;
  if (!t.objectives.length) return 'Assessable objectives have not been derived for this topic yet, so no lesson or assessment exists.';
  const s = topicStages(t);
  if (!s.source_supported) {
    if (t.objectives.some(o => o.source_support === 'missing' || o.source_support === 'unreadable')) return 'Source evidence is missing or unreadable for one or more objectives in this topic.';
    if (t.objectives.some(o => o.source_support === 'conflicting')) return 'Conflicting source evidence needs to be resolved for one or more objectives in this topic.';
    return 'Source support or session applicability is not yet fully verified for every objective in this topic.';
  }
  if (!s.drafted) return 'Original lessons have not been drafted for every objective.';
  if (!s.assessed) return 'Assessments have not been drafted for every objective.';
  if (!s.reviewed) return 'Source, originality or calculation review is not complete.';
  if (!s.published) return 'Reviewed content has not been published yet.';
  return '';
}

/** Reconciliation checks between the ledger and the catalogue/packs. Returns human-readable problems. */
export function reconcileLedger(ledger: CoverageLedger, catalogueUnitIds: readonly string[], catalogueObjectiveIds: readonly string[], publishedItemIds: ReadonlySet<string>): string[] {
  const problems: string[] = [];
  const topicIds = new Set<string>();
  for (const p of ledger.papers) for (const t of p.topics) {
    if (topicIds.has(t.topic_id)) problems.push(`Duplicate topic ${t.topic_id}`);
    topicIds.add(t.topic_id);
    if (t.paper_id !== p.paper_id) problems.push(`Topic ${t.topic_id} is filed under ${p.paper_id} but belongs to ${t.paper_id}`);
    for (const o of t.objectives) {
      if (!catalogueObjectiveIds.includes(o.objective_id)) problems.push(`Objective ${o.objective_id} is in the ledger but not in the catalogue`);
      for (const id of o.published_item_ids) if (!publishedItemIds.has(id)) problems.push(`Objective ${o.objective_id} claims published item ${id}, which is not in any published pack`);
    }
  }
  for (const id of catalogueUnitIds) if (!topicIds.has(id)) problems.push(`Catalogue unit ${id} is missing from the ledger`);
  for (const id of topicIds) if (!catalogueUnitIds.includes(id)) problems.push(`Ledger topic ${id} is missing from the catalogue`);
  const ledgerObjectives = new Set(ledger.papers.flatMap(p => p.topics.flatMap(t => t.objectives.map(o => o.objective_id))));
  for (const id of catalogueObjectiveIds) if (!ledgerObjectives.has(id)) problems.push(`Catalogue objective ${id} is missing from the ledger`);
  return problems;
}
