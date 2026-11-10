/** CAIIB domain contracts. Validate untrusted JSON with ../validation/contracts.ts. */
export const PAPER_IDS = ['ABM', 'BFM', 'ABFM', 'BRBL', 'CB', 'RM', 'ITDB', 'HRM', 'RB'] as const;
export type PaperId = typeof PAPER_IDS[number];
export type ElectivePaperId = 'CB' | 'RM' | 'ITDB' | 'HRM' | 'RB';
export type ModuleId<P extends PaperId = PaperId> = `${P}::MOD_${string}`;
export type UnitId<P extends PaperId = PaperId> = `${ModuleId<P>}::U${string}`;
export type ObjectiveId<P extends PaperId = PaperId> = `${UnitId<P>}::LO_${string}`;
/** Correlates paper prefixes statically; runtime catalogue checks exact ancestry. */
export type CurriculumRef = { [P in PaperId]: {
  paper_id: P; module_id: ModuleId<P>; unit_id: UnitId<P>; objective_ids: ObjectiveId<P>[];
}}[PaperId];
export interface CurriculumCatalogue {
  syllabus_version: string;
  modules: { id: ModuleId; paper_id: PaperId; title?: string }[];
  units: { id: UnitId; module_id: ModuleId; title?: string }[];
  objectives: { id: ObjectiveId; unit_id: UnitId; title?: string; description?: string }[];
}
export interface SourceCitation {
  source_id: string; authority: string; title: string;
  locator: string; url?: string; publication_date: string | null; effective_date: string | null;
}
export type ContentContext =
  | { kind: 'exam'; exam_context_id: string; regulatory_cutoff_date: string }
  | { kind: 'current_reference'; as_of_date: string };
export interface ReviewRecord {
  verified_at: string; reviewer_id: string; method: 'human' | 'automated' | 'mixed';
  source_verified: true; answer_checked: true;
  calculations: 'verified' | 'not_applicable';
}
export type Publication =
  | { publication_state: 'draft'; review: ReviewRecord | null }
  | { publication_state: 'validated' | 'published' | 'retired'; review: ReviewRecord };
export type ContentBase = CurriculumRef & Publication & {
  id: string; schema_version: '2.0.0'; revision: number; syllabus_version: string;
  context: ContentContext; citations: SourceCitation[];
  origin: 'original_authoring' | 'source_assisted' | 'synthetic_fixture';
  replaces_item_id?: string;
};
export interface FormulaSpec {
  latex_expression: string; variables: { symbol: string; name: string; unit: string }[];
  assumptions: string[]; common_errors: string[];
}
export interface StatuteSpec {
  act_or_direction_name: string; section_or_clause: string | null; rule_summary: string;
  applicability: string; exceptions: string[]; thresholds_or_penalties: string[];
}
export interface WorkedStep {
  step_number: number; description: string; formula_or_substitution: string; intermediate_result: string;
}
export type SelfCheck =
  | { mode: 'self_assessed'; prompt_text: string; expected_takeaway: string }
  | { mode: 'question'; question_id: string };
type CardCommon = ContentBase & {
  item_type: 'card'; title: string; prerequisite_objective_ids: ObjectiveId[];
  core_explanation_md: string; expanded_explanation_md?: string; self_check: SelfCheck;
};
export type StudyCard = CardCommon & (
  | { card_type: 'concept'; formula_spec?: never; statute_spec?: never; worked_steps?: never; final_answer_with_unit?: never }
  | { card_type: 'formula'; formula_spec: FormulaSpec; statute_spec?: never; worked_steps?: never; final_answer_with_unit?: never }
  | { card_type: 'statute'; statute_spec: StatuteSpec; formula_spec?: never; worked_steps?: never; final_answer_with_unit?: never }
  | { card_type: 'worked_example'; worked_steps: WorkedStep[]; final_answer_with_unit: string; formula_spec?: never; statute_spec?: never }
);
export type OptionId = 'A' | 'B' | 'C' | 'D';
export interface ChoiceOption { option_id: OptionId; text_md: string; explanation_md: string }
export type RoundingMode = 'HALF_UP' | 'HALF_EVEN' | 'TOWARD_ZERO' | 'AWAY_FROM_ZERO' | 'FLOOR' | 'CEILING';
export interface NumericRule {
  /** Canonical expected answer AFTER the stated rounding, as a decimal string. */
  expected_answer: string; unit_label: string; precision_decimals: number;
  rounding_mode: RoundingMode; rounding_instruction: string; allow_negative: boolean;
}
type QuestionCommon = ContentBase & {
  item_type: 'question'; difficulty: 'easy' | 'medium' | 'hard'; stem_md: string;
  correct_explanation_md: string; worked_solution_steps?: WorkedStep[]; case_study_id?: string;
  /** Optional author-supplied marks; resolve scoring against the verified exam configuration. */
  marks?: number;
};
export type QuestionItem = QuestionCommon & (
  | { question_type: 'single_choice'; options: [ChoiceOption, ChoiceOption, ChoiceOption, ChoiceOption]; correct_option_id: OptionId; numeric_rule?: never }
  | { question_type: 'numeric_input'; numeric_rule: NumericRule; options?: never; correct_option_id?: never }
);
export type CaseStudyItem = ContentBase & {
  item_type: 'case_study'; title: string; scenario_narrative_md: string;
  question_ids: string[]; reference_tables_md: string[];
};
export type ReferenceItem = ContentBase & {
  item_type: 'reference'; title: string; body_md: string; effective_from: string | null; effective_until: string | null;
};
/** A deterministic registered calculator, never an eval() string or LLM solver. */
export type CalculatorItem = ContentBase & {
  item_type: 'calculator'; title: string; calculator_key: string;
  inputs: { key: string; label: string; unit: string }[]; output_unit: string; assumptions: string[];
};
export type ContentItem = StudyCard | QuestionItem | CaseStudyItem | ReferenceItem | CalculatorItem;

export interface ExamConfig {
  exam_context_id: string; config_version: string; syllabus_version: string;
  regulatory_cutoff_date: string; duration_seconds: number; question_count: number;
  total_marks: number; wrong_answer_penalty: string; official_source: SourceCitation;
  verified_at: string; passing_rule_description: string; calculator_policy: string;
}
export interface ContentPack {
  schema_version: '2.0.0'; pack_id: string; pack_version: string; syllabus_version: string;
  exam_context_id: string; paper_id: PaperId; items: ContentItem[];
}
export interface PackManifestEntry {
  pack_id: string; pack_version: string; paper_id: PaperId; exam_context_id: string;
  schema_version: '2.0.0'; file_size_bytes: number; sha256: string; download_url: string;
  minimum_client_version: string; change_summary: string;
}
export interface ItemRevisionRef { item_id: string; item_revision: number }
export interface AttemptSession {
  attempt_id: string; learner_id: string; paper_id: PaperId; exam_context_id: string;
  exam_config_version: string; pack_id: string; pack_version: string;
  mode: 'practice' | 'mock'; status: 'active' | 'submitted' | 'expired';
  started_at: string; expires_at_iso: string | null;
  submitted_at?: string | null;
  score_summary?: { marks_obtained: number; total_marks: number; passed: boolean } | null;
  question_order: ItemRevisionRef[]; saved_responses: Record<string, string>; flagged_item_ids: string[];
}
export type Sm2Rating = 'Again' | 'Hard' | 'Good' | 'Easy';
export interface Sm2ReviewState {
  learner_id: string; item_id: string; item_revision: number; paper_id: PaperId;
  exam_context_id: string; algorithm_version: string; repetition_count: number;
  ease_factor: number; interval_days: number; due_date_iso: string; learner_time_zone: string;
  last_reviewed_at: string | null;
}
interface EventBase {
  event_id: string; learner_id: string; device_id: string; device_sequence: number;
  exam_context_id: string; pack_id: string; pack_version: string; item_id: string; item_revision: number;
  paper_id: PaperId; objective_ids: ObjectiveId[]; occurred_at: string;
}
export type LearnerEvent = EventBase & (
  | { event_type: 'answer_submitted'; attempt_id: string; mode: 'practice' | 'mock';
      submitted_response: string; is_correct: boolean; elapsed_ms: number;
      answer_was_revealed_prior: boolean; assessment: 'objective'; sm2_rating?: never }
  | { event_type: 'self_check'; assessment: 'self_assessed'; recall: 'forgot' | 'partial' | 'recalled';
      is_correct?: never; submitted_response?: never; sm2_rating?: never }
  | { event_type: 'sm2_review'; sm2_rating: Sm2Rating; based_on_answer_event_id: string | null;
      is_correct?: never; submitted_response?: never; algorithm_version: string }
  | { event_type: 'lesson_completed'; assessment: 'ungraded';
      is_correct?: never; submitted_response?: never; sm2_rating?: never }
);
/** First exposure is derived from reconciled history; never trusted as a client boolean. */
export interface ProgressUpload { events: LearnerEvent[]; after_cursor: string | null }
export interface ProgressAck {
  accepted_event_ids: string[]; duplicate_event_ids: string[];
  rejected: { event_id: string; reason: string }[]; next_cursor: string;
}
export interface ProgressChanges { events: LearnerEvent[]; next_cursor: string; has_more: boolean }
export interface ReadinessIndexSnapshot {
  paper_id: PaperId; exam_context_id: string; calculated_at: string;
  window_start: string; window_end: string; formula_version: 'CRI_V1';
  evidence_status: 'sufficient_evidence' | 'insufficient_evidence';
  study_coverage_pct: number | null; assessed_accuracy_pct: number | null;
  speed_score_pct: number | null; cri_score: number | null;
  mapped_objectives_total: number | null; completed_objectives: number;
  eligible_accuracy_questions: number; eligible_timed_questions: number;
}

export type PaymentProvider = 'razorpay' | 'google_play';
export interface ProductOffer {
  product_id: string; title: string; provider: PaymentProvider; provider_product_id: string;
  currency: 'INR'; amount_minor: number; term_description: string; auto_renews: false;
  included_papers: PaperId[]; content_availability_description: string;
}
export interface PurchaseRecord {
  purchase_id: string; learner_id: string; product_id: string; provider: PaymentProvider;
  provider_transaction_id: string; amount_minor: number; currency: 'INR';
  status: 'pending' | 'verified' | 'failed' | 'refunded' | 'revoked';
  verified_at?: string | null; access_starts_at?: string | null; access_expires_at?: string | null;
  refunded_at?: string | null;
}
/** Signed by the backend. Shape validation alone does NOT verify authenticity. */
export interface OfflineEntitlementClaims {
  entitlement_id: string; learner_id: string; product_id: string; purchase_id: string;
  issued_at: string; access_expires_at: string; offline_until: string;
  allowed_papers: PaperId[]; entitlement_version: number;
}
/** Compact token (e.g. Ed25519 JWT / compact JWS) verifiable offline with client public key. */
export interface SignedOfflineEntitlement { key_id: string; signed_token: string }

/** Notebook output is an editorial staging record, never a publishable ContentPack. */
export interface NotebookExtractionBatch {
  schema_version: 'notebook-staging-1'; batch_id: string; paper_id: PaperId;
  unit_label: string; publication_state: 'draft'; verified_at: null;
  source_ids: string[];
  facts: { fact_id: string; statement: string; source_id: string; locator: string;
    regulatory_sensitive: boolean; evidence_status: 'explicit' | 'needs_review' }[];
  drafts: { draft_id: string; item_type: 'card' | 'question' | 'case_study'; variant: string;
    fact_ids: string[]; payload: Record<string, unknown> }[];
  unresolved: string[]; next_batch_hint: string | null;
}

/** Supplied by the editor from the verified catalogue and source registry, never guessed by import. */
export interface StagingImportConfig {
  schema_version: 'staging-import-1'; content_namespace: string;
  batch_id: string; paper_id: PaperId; syllabus_version: string;
  origin: 'source_assisted' | 'synthetic_fixture'; context: ContentContext;
  context_source: { source_id: string; locator: string };
  syllabus_source: { source_id: string; locator: string };
  sources: Omit<SourceCitation, 'locator'>[];
  mappings: { draft_id: string; unit_id: UnitId; objective_ids: ObjectiveId[] }[];
}
/** Editorial output. It is not a published ContentPack. */
export interface DraftImportBundle {
  schema_version: 'draft-import-1'; publication_state: 'draft';
  source_batch: NotebookExtractionBatch; import_config: StagingImportConfig;
  draft_item_map: { batch_id: string; draft_id: string; item_id: string }[];
  items: ContentItem[];
}
