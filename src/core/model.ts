/** App-level records layered on the shared contracts. Contract shapes are never widened; extras live alongside. */
import type {
  AttemptSession, ContentPack, CurriculumCatalogue, ElectivePaperId, ExamConfig, LearnerEvent, PaperId,
  SignedOfflineEntitlement,
} from '../types/contracts.ts';

export const CLIENT_VERSION = '0.1.0';
export const DEFAULT_TIME_ZONE = 'Asia/Kolkata';

export interface Prefs {
  learner_id: string;            // anonymous local ID until an account is linked; stable across account merge
  device_id: string;
  device_sequence: number;
  onboarded: boolean;
  exam_context_id: string | null;
  selected_elective: ElectivePaperId | null;
  active_paper: PaperId;
  session_minutes: 5 | 10;
  theme: 'system' | 'light' | 'dark';
  time_zone: string;
  account: { account_id: string; email: string } | null;
}

export type PackKind = 'published' | 'fixture';
export interface PackRecord {
  key: string;                   // `${pack_id}@${pack_version}`
  pack: ContentPack;
  kind: PackKind;
  access: 'free' | 'full';
  free_unit_ids: string[];       // units usable without paid access
  sha256: string;
  installed_at: string;
  change_summary: string;
}
export const packKey = (id: string, version: string): string => `${id}@${version}`;

export interface ActivePointer { paper_id: PaperId; exam_context_id: string; current: string; previous: string | null }

/** Manifest entry served with the app or by the API. `path` is same-origin; the API also offers HTTPS URLs. */
export interface AppPackEntry {
  pack_id: string; pack_version: string; paper_id: PaperId; exam_context_id: string; syllabus_version: string;
  schema_version: '2.0.0'; file_size_bytes: number; sha256: string; path: string;
  minimum_client_version: string; change_summary: string;
  kind: PackKind; access: 'free' | 'full'; free_unit_ids: string[];
  unit_ids: string[]; item_counts: { cards: number; questions: number; case_studies: number; references: number; calculators: number };
}
export interface AppManifest { generated_at: string; packs: AppPackEntry[] }

/** Exam configuration plus verification status. Unverified configurations are never presented as official. */
export interface ExamContextRecord {
  exam_context_id: string; label: string;
  status: 'verified' | 'unverified';
  config: ExamConfig | null;
  /** Numeric pass mark, only when verified from the official rules; otherwise null and no pass/fail is shown. */
  pass_marks: number | null;
  kind: PackKind;
  note: string;
}

export interface AttemptResult {
  graded_at: string; reason: 'submitted' | 'expired';
  per_question: { item_id: string; answered: boolean; is_correct: boolean; marks: number; response: string | null }[];
  marks_obtained: number; total_marks: number; correct: number; wrong: number; unanswered: number;
}
export interface AttemptRecord {
  attempt: AttemptSession;
  title: string;
  fixture: boolean;
  current_index: number;
  timings_ms: Record<string, number>;
  /** Practice mode: item IDs already explicitly submitted (feedback shown). */
  submitted_item_ids: string[];
  /** Practice mode: correctness of submitted items, for the completion summary. */
  outcomes: Record<string, boolean>;
  result: AttemptResult | null;
  origin: { kind: 'unit' | 'remediation' | 'numeric' | 'case_study' | 'mock' | 'preset'; ref: string | null };
}

/** Event fields assigned at save time by the store: identity, device ordering and learner. */
export type NewEvent = LearnerEvent extends infer E ? E extends LearnerEvent ? Omit<E, 'event_id' | 'learner_id' | 'device_id' | 'device_sequence'> : never : never;

/** `relearn` marks an in-session retry after Again; it never produces review or accuracy evidence. */
export interface StudyStep { type: 'card' | 'review'; item_id: string; item_revision: number; relearn: boolean }
export interface StepProgress {
  revealed: boolean; completed: boolean;
  /** Set when a question-backed self-check was answered in this step. */
  answer_event_id: string | null; answered_correct: boolean | null; response: string | null;
  rated: boolean;
}
export interface StudySession {
  session_id: string; learner_id: string; paper_id: PaperId; exam_context_id: string;
  pack_id: string; pack_version: string;
  kind: 'lesson' | 'review' | 'preset' | 'remediation';
  title: string; reason: string;
  steps: StudyStep[]; cursor: number;
  /** Per step index: what the learner has done, so a resumed session never double-records events. */
  progress: Record<string, StepProgress>;
  started_at: string; completed_at: string | null; estimate_seconds: number;
  status: 'active' | 'completed' | 'abandoned';
}

export interface StoredEvent { event: LearnerEvent; synced: boolean }
export interface Bookmark { item_id: string; paper_id: PaperId; created_at: string }
export interface ReadingPosition { key: string; unit_id: string; item_id: string; updated_at: string }

export interface EntitlementRecord {
  signed: SignedOfflineEntitlement;
  /** Latest server time observed when the token was issued/refreshed; used to detect clock rollback. */
  last_trusted_server_time: string;
  /** Highest device clock reading observed while the token was held. */
  last_seen_device_time: string;
}

export type { CurriculumCatalogue };
