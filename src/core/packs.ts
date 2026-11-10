/**
 * Pack verification before activation: checksum of the downloaded bytes, JSON parse, schema/reference
 * validation against the catalogue, identity and client-compatibility checks. Activation itself is an atomic
 * storage batch (Store.activatePack); a failure at any stage leaves the current pack and learner data intact.
 */
import type { ContentItem, ContentPack, CurriculumCatalogue } from '../types/contracts.ts';
import { validateCatalogue, validateContentItem, validatePack } from '../validation/contracts.ts';
import type { AppPackEntry, PackRecord } from './model.ts';
import { packKey } from './model.ts';

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes as unknown as BufferSource);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(n => Number.parseInt(n, 10) || 0), pb = b.split('.').map(n => Number.parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) { const d = (pa[i] ?? 0) - (pb[i] ?? 0); if (d) return d; }
  return 0;
}

export type VerifyStage = 'size' | 'checksum' | 'parse' | 'identity' | 'compatibility' | 'schema';
export type VerifyResult =
  | { ok: true; record: PackRecord }
  | { ok: false; stage: VerifyStage; message: string; issues?: { path: string; message: string }[] };

/** Fixture packs hold synthetic, unpublished items; they are validated item by item and stay labelled. */
function validateFixturePack(pack: ContentPack, catalogue: CurriculumCatalogue): { path: string; message: string }[] {
  const issues: { path: string; message: string }[] = [];
  const cat = validateCatalogue(catalogue);
  if (!cat.ok) return cat.issues;
  if (pack.schema_version !== '2.0.0') issues.push({ path: '$', message: 'Unsupported schema version' });
  if (pack.syllabus_version !== catalogue.syllabus_version) issues.push({ path: '$', message: 'Syllabus mismatch' });
  const byId = new Map<string, ContentItem>();
  pack.items.forEach((item, i) => {
    const r = validateContentItem(item, catalogue);
    if (!r.ok) r.issues.forEach(x => issues.push({ path: `$.items[${i}]${x.path.slice(1)}`, message: x.message }));
    if (byId.has(item.id)) issues.push({ path: `$.items[${i}]`, message: 'Duplicate item ID' });
    if (item.paper_id !== pack.paper_id) issues.push({ path: `$.items[${i}]`, message: 'Mixed-paper pack' });
    if (item.origin !== 'synthetic_fixture') issues.push({ path: `$.items[${i}]`, message: 'Fixture packs may only contain synthetic fixtures' });
    byId.set(item.id, item);
  });
  pack.items.forEach((item, i) => {
    if (item.item_type === 'case_study') for (const id of item.question_ids) { const q = byId.get(id); if (!(q?.item_type === 'question' && q.case_study_id === item.id)) issues.push({ path: `$.items[${i}]`, message: 'Case question missing or backlink mismatch' }); }
    if (item.item_type === 'card' && item.self_check.mode === 'question' && byId.get(item.self_check.question_id)?.item_type !== 'question') issues.push({ path: `$.items[${i}]`, message: 'Self-check question absent from pack' });
  });
  return issues;
}

export async function verifyPackBytes(bytes: Uint8Array, entry: AppPackEntry, catalogue: CurriculumCatalogue, clientVersion: string, nowIso: string): Promise<VerifyResult> {
  if (bytes.byteLength !== entry.file_size_bytes) return { ok: false, stage: 'size', message: `Download incomplete: received ${bytes.byteLength} of ${entry.file_size_bytes} bytes.` };
  const digest = await sha256Hex(bytes);
  if (digest !== entry.sha256) return { ok: false, stage: 'checksum', message: 'The downloaded file is corrupted (checksum mismatch).' };
  let parsed: unknown;
  try { parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { return { ok: false, stage: 'parse', message: 'The downloaded file is not valid content.' }; }
  const pack = parsed as ContentPack;
  if (pack?.pack_id !== entry.pack_id || pack?.pack_version !== entry.pack_version || pack?.paper_id !== entry.paper_id || pack?.exam_context_id !== entry.exam_context_id) {
    return { ok: false, stage: 'identity', message: 'The downloaded content does not match the requested pack.' };
  }
  if (compareVersions(clientVersion, entry.minimum_client_version) < 0) return { ok: false, stage: 'compatibility', message: `This content needs app version ${entry.minimum_client_version} or later.` };
  if (entry.kind === 'fixture') {
    const issues = validateFixturePack(pack, catalogue);
    if (issues.length) return { ok: false, stage: 'schema', message: 'The fixture content failed validation.', issues };
  } else {
    const result = validatePack(pack, catalogue);
    if (!result.ok) return { ok: false, stage: 'schema', message: 'The content failed validation and was not installed.', issues: result.issues };
  }
  return {
    ok: true,
    record: {
      key: packKey(pack.pack_id, pack.pack_version), pack, kind: entry.kind, access: entry.access,
      free_unit_ids: entry.free_unit_ids, sha256: digest, installed_at: nowIso, change_summary: entry.change_summary,
    },
  };
}
