// Test helpers. Everything loaded here is SYNTHETIC fixture data (content/fixtures), never release content.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ContentPack, CurriculumCatalogue, LearnerEvent, ObjectiveId, PaperId } from '../src/types/contracts.ts';
import type { AppPackEntry, ExamContextRecord, PackRecord } from '../src/core/model.ts';
import { packKey } from '../src/core/model.ts';
import { sha256Hex } from '../src/core/packs.ts';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p: string) => readFileSync(join(ROOT, p));
export const fixtureCatalogue = (): CurriculumCatalogue => JSON.parse(read('content/fixtures/catalogue.json').toString('utf8')) as CurriculumCatalogue;
export const fixtureContext = (): ExamContextRecord => JSON.parse(read('content/fixtures/exam-context.json').toString('utf8')) as ExamContextRecord;
export const fixtureBytes = (paper: PaperId): Uint8Array => new Uint8Array(read(`content/fixtures/packs/FIXTURE-${paper}.json`));
export const fixturePack = (paper: PaperId): ContentPack => JSON.parse(new TextDecoder().decode(fixtureBytes(paper))) as ContentPack;
export const CTX = 'SYNTHETIC-CTX';
export const T0 = Date.parse('2026-11-10T04:30:00.000Z'); // 10:00 IST

export async function fixtureEntry(paper: PaperId, overrides: Partial<AppPackEntry> = {}): Promise<AppPackEntry> {
  const bytes = fixtureBytes(paper); const pack = fixturePack(paper);
  return {
    pack_id: pack.pack_id, pack_version: pack.pack_version, paper_id: paper, exam_context_id: pack.exam_context_id,
    syllabus_version: pack.syllabus_version, schema_version: '2.0.0', file_size_bytes: bytes.byteLength, sha256: await sha256Hex(bytes),
    path: `fixtures/packs/${pack.pack_id}.json`, minimum_client_version: '0.1.0', change_summary: 'Synthetic fixture', kind: 'fixture',
    access: 'free', free_unit_ids: [], unit_ids: [...new Set(pack.items.map(i => i.unit_id as string))],
    item_counts: { cards: 0, questions: 0, case_studies: 0, references: 0, calculators: 0 }, ...overrides,
  };
}
export function fixtureRecord(paper: PaperId, overrides: Partial<PackRecord> = {}): PackRecord {
  const pack = fixturePack(paper);
  return { key: packKey(pack.pack_id, pack.pack_version), pack, kind: 'fixture', access: 'free', free_unit_ids: [], sha256: 'x'.repeat(64), installed_at: new Date(T0).toISOString(), change_summary: 'Synthetic fixture', ...overrides };
}

let counter = 0;
export function answerEvent(o: { item: string; paper?: PaperId; correct: boolean; atMs: number; elapsedMs?: number; revealed?: boolean; revision?: number; learner?: string; objective?: string; device?: string; id?: string }): LearnerEvent {
  const paper = o.paper ?? 'BFM'; counter += 1;
  return {
    event_id: o.id ?? `e${counter}`, learner_id: o.learner ?? 'L1', device_id: o.device ?? 'D1', device_sequence: counter, exam_context_id: CTX,
    pack_id: `FIXTURE-${paper}`, pack_version: '1', item_id: o.item, item_revision: o.revision ?? 1, paper_id: paper,
    objective_ids: [(o.objective ?? `${paper}::MOD_FIX::U01::LO_01`) as ObjectiveId], occurred_at: new Date(o.atMs).toISOString(),
    event_type: 'answer_submitted', attempt_id: 'A1', mode: 'practice', submitted_response: 'A', is_correct: o.correct, elapsed_ms: o.elapsedMs ?? 30_000,
    answer_was_revealed_prior: o.revealed ?? false, assessment: 'objective',
  };
}
export function reviewEvent(o: { item: string; rating: 'Again' | 'Hard' | 'Good' | 'Easy'; atMs: number; basedOn?: string | null; id?: string; paper?: PaperId }): LearnerEvent {
  const paper = o.paper ?? 'BFM'; counter += 1;
  return {
    event_id: o.id ?? `r${counter}`, learner_id: 'L1', device_id: 'D1', device_sequence: counter, exam_context_id: CTX, pack_id: `FIXTURE-${paper}`, pack_version: '1',
    item_id: o.item, item_revision: 1, paper_id: paper, objective_ids: [`${paper}::MOD_FIX::U01::LO_01` as ObjectiveId], occurred_at: new Date(o.atMs).toISOString(),
    event_type: 'sm2_review', sm2_rating: o.rating, based_on_answer_event_id: o.basedOn ?? null, algorithm_version: 'SM2_V1',
  };
}
export const DAY = 86_400_000;
