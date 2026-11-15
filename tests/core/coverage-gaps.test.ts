import test from 'node:test';
import assert from 'node:assert/strict';
import { topicGap, topicStages, type LedgerTopic, type LedgerObjective } from '../../src/core/coverage.ts';

// Synthetic editorial records, isolated from the release curriculum.
const objective: LedgerObjective = { objective_id: 'BFM::MOD_TEST::U01::LO_01', statement: 'SYNTHETIC objective', origin: 'editorial', source_support: 'partial', lesson_item_ids: ['SYNTHETIC_CARD'], worked_example_item_ids: [], assessment_item_ids: ['SYNTHETIC_Q1', 'SYNTHETIC_Q2'], teaching_adequate: true, assessment_adequate: true, review: { source: 'pending', originality: 'pending', calculations: 'not_applicable', record_refs: ['SYNTHETIC_REVIEW.md'] }, published_item_ids: [], gaps: ['SYNTHETIC pending review'] };
const topic = (support: LedgerObjective['source_support']): LedgerTopic => ({ topic_id: 'BFM::MOD_TEST::U01', paper_id: 'BFM', module_id: 'BFM::MOD_TEST', module_title: 'SYNTHETIC module', module_kind: 'module', title: 'SYNTHETIC topic', official_scope_text: '', syllabus_source_id: 'SYNTHETIC_SOURCE', locator: 'SYNTHETIC locator', baseline_issue: null, kind: 'named_section', blocked_reason: null, objectives: [{ ...objective, source_support: support }] });

test('coverage explains incomplete verification separately from missing and conflicting sources', () => {
  assert.match(topicGap(topic('partial')), /not yet fully verified/);
  assert.doesNotMatch(topicGap(topic('partial')), /missing|unreadable|not yet available/);
  assert.match(topicGap(topic('missing')), /missing or unreadable/);
  assert.match(topicGap(topic('unreadable')), /missing or unreadable/);
  assert.match(topicGap(topic('conflicting')), /Conflicting source evidence/);
});

test('a taught and assessed draft does not become reviewed or published when source support is partial', () => {
  const stages = topicStages(topic('partial'));
  assert.equal(stages.drafted, true); assert.equal(stages.assessed, true);
  assert.equal(stages.source_supported, false); assert.equal(stages.reviewed, false); assert.equal(stages.published, false);
  assert.match(topicGap(topic('supported')), /review is not complete/);
});
