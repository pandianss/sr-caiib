import type { ContentBase, CurriculumRef, QuestionItem, StudyCard, LearnerEvent, NotebookExtractionBatch } from '../src/types/contracts.ts';
declare const base: ContentBase;
declare const question: QuestionItem;
declare const card: StudyCard;

// @ts-expect-error A numeric question needs its numeric rule.
const missingNumeric: QuestionItem = { ...base, item_type:'question', question_type:'numeric_input', difficulty:'easy', stem_md:'Test', correct_explanation_md:'Test' };

// @ts-expect-error Paper and module prefixes must agree statically.
const mixedPaper: CurriculumRef = { paper_id:'BFM', module_id:'ABFM::MOD_A', unit_id:'BFM::MOD_A::U01', objective_ids:['BFM::MOD_A::U01::LO_01'] };

// Staging batch supports case_study draft item
declare const stagingBatch: NotebookExtractionBatch;
const draftItemType: 'card' | 'question' | 'case_study' = stagingBatch.drafts[0]!.item_type;
void draftItemType;

if (question.question_type === 'numeric_input') {
  const expected: string = question.numeric_rule.expected_answer;
  // @ts-expect-error Broad tolerance is excluded until a grading contract is specified.
  const tol = question.numeric_rule.tolerance;
  void expected; void tol;
}
if (card.card_type === 'formula') {
  const expression: string = card.formula_spec.latex_expression;
  void expression;
}
declare const event: Extract<LearnerEvent, {event_type:'self_check'}>;
// @ts-expect-error Self-assessment cannot assert objective correctness.
const manufacturedAccuracy: LearnerEvent = { ...event, is_correct: true };
void missingNumeric; void mixedPaper; void manufacturedAccuracy;
