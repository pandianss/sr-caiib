/** Read-only index over the active content packs. Screens depend on this interface, not on storage or files. */
import type { CalculatorItem, CaseStudyItem, ContentItem, PaperId, QuestionItem, ReferenceItem, StudyCard } from '../types/contracts.ts';
import type { PackRecord } from './model.ts';

export interface SearchHit { item: ContentItem; paper_id: PaperId; title: string; snippet: string; score: number }

const text = (item: ContentItem): { title: string; body: string } => {
  switch (item.item_type) {
    case 'card': return { title: item.title, body: [item.core_explanation_md, item.expanded_explanation_md ?? '', item.card_type === 'formula' ? item.formula_spec.latex_expression + ' ' + item.formula_spec.variables.map(v => v.name).join(' ') : '', item.card_type === 'statute' ? `${item.statute_spec.act_or_direction_name} ${item.statute_spec.section_or_clause ?? ''} ${item.statute_spec.rule_summary}` : ''].join(' ') };
    case 'question': return { title: item.stem_md.slice(0, 80), body: item.stem_md };
    case 'case_study': return { title: item.title, body: item.scenario_narrative_md };
    case 'reference': return { title: item.title, body: item.body_md };
    case 'calculator': return { title: item.title, body: item.assumptions.join(' ') };
  }
};
const normalise = (s: string): string => s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}₹%.]+/gu, ' ').trim();

export class ContentIndex {
  private readonly byId = new Map<string, { item: ContentItem; record: PackRecord }>();
  private readonly byPaper = new Map<PaperId, PackRecord>();
  constructor(activeRecords: readonly PackRecord[]) {
    for (const record of activeRecords) {
      this.byPaper.set(record.pack.paper_id, record);
      for (const item of record.pack.items) this.byId.set(item.id, { item, record });
    }
  }
  papersWithContent(): PaperId[] { return [...this.byPaper.keys()]; }
  packFor(paper: PaperId): PackRecord | undefined { return this.byPaper.get(paper); }
  item(id: string): ContentItem | undefined { return this.byId.get(id)?.item; }
  recordOf(id: string): PackRecord | undefined { return this.byId.get(id)?.record; }
  /** Exact paper match: BFM never returns ABFM items. */
  items(paper: PaperId): ContentItem[] { return this.byPaper.get(paper)?.pack.items.filter(i => i.paper_id === paper) ?? []; }
  cards(paper: PaperId, unitId?: string): StudyCard[] { return this.items(paper).filter((i): i is StudyCard => i.item_type === 'card' && (!unitId || i.unit_id === unitId)); }
  questions(paper: PaperId, unitId?: string): QuestionItem[] { return this.items(paper).filter((i): i is QuestionItem => i.item_type === 'question' && (!unitId || i.unit_id === unitId)); }
  caseStudies(paper: PaperId): CaseStudyItem[] { return this.items(paper).filter((i): i is CaseStudyItem => i.item_type === 'case_study'); }
  references(paper: PaperId): ReferenceItem[] { return this.items(paper).filter((i): i is ReferenceItem => i.item_type === 'reference'); }
  calculators(paper: PaperId): CalculatorItem[] { return this.items(paper).filter((i): i is CalculatorItem => i.item_type === 'calculator'); }
  question(id: string): QuestionItem | undefined { const i = this.item(id); return i?.item_type === 'question' ? i : undefined; }
  card(id: string): StudyCard | undefined { const i = this.item(id); return i?.item_type === 'card' ? i : undefined; }
  caseStudy(id: string): CaseStudyItem | undefined { const i = this.item(id); return i?.item_type === 'case_study' ? i : undefined; }
  /** Question IDs used as a card self-check; they are excluded from "unseen" practice pools once revealed. */
  activeRevisions(): Map<string, number> { return new Map([...this.byId.values()].map(v => [v.item.id, v.item.revision])); }
  unitIds(paper: PaperId): string[] { return [...new Set(this.items(paper).map(i => i.unit_id as string))]; }

  search(query: string, scope: PaperId | 'all'): SearchHit[] {
    const terms = normalise(query).split(' ').filter(Boolean);
    if (!terms.length) return [];
    const papers = scope === 'all' ? this.papersWithContent() : [scope];
    const hits: SearchHit[] = [];
    for (const paper of papers) for (const item of this.items(paper)) {
      if (item.item_type === 'question') continue; // questions are not discoverable through search (no answer leakage)
      const { title, body } = text(item);
      const nt = normalise(title), nb = normalise(body);
      let score = 0;
      for (const t of terms) { if (nt.includes(t)) score += 3; else if (nb.includes(t)) score += 1; else { score = 0; break; } }
      if (!score) continue;
      const pos = Math.max(0, body.toLowerCase().indexOf(terms[0] ?? ''));
      const start = Math.max(0, pos - 40);
      hits.push({ item, paper_id: paper, title, snippet: `${start > 0 ? '…' : ''}${body.slice(start, start + 140).replace(/\s+/g, ' ')}${body.length > start + 140 ? '…' : ''}`, score });
    }
    return hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  }
}
