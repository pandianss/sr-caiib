import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { auditItems, readAuditTarget } from '../scripts/audit-content-quality.mjs';

// Synthetic screening records; these are never imported into delivery content.
const question = (id, answer = 'A') => ({ id, item_type: 'question', question_type: 'single_choice',
  stem_md: 'SYNTHETIC reasoning prompt', correct_option_id: answer,
  options: ['A','B','C','D'].map(option_id => ({ option_id, text_md: `SYNTHETIC option ${option_id}`,
    explanation_md: 'A sufficiently descriptive synthetic explanation for this option.' })) });

test('screening rejects missing, empty, duplicate and malformed content rather than reporting zero findings', () => {
  for (const items of [undefined, [], {}, [null], [question('x'), question('x')], [{ id: 'x', item_type: 'unknown' }]]) {
    assert.throws(() => auditItems(items, 'synthetic'));
  }
  const bad = question('q'); bad.correct_option_id = 'E';
  assert.throws(() => auditItems([bad], 'synthetic'), /Malformed choice/);
  bad.correct_option_id = 'A'; bad.options[1].option_id = 'A';
  assert.throws(() => auditItems([bad], 'synthetic'), /Malformed choice/);
});

test('directory and file targets read canonical bundles and invalid CLI input fails closed', () => {
  const dir = mkdtempSync(join(tmpdir(), 'caiib-screen-'));
  try {
    const file = join(dir, 'draft-bundle.json');
    writeFileSync(file, JSON.stringify({ items: [question('q')] }));
    assert.equal(readAuditTarget(dir).totalMCQ, 1);
    assert.deepEqual(readAuditTarget(file), readAuditTarget(dir));
    writeFileSync(file, JSON.stringify({ drafts: [] }));
    const result = spawnSync(process.execPath, ['scripts/audit-content-quality.mjs', file], { encoding: 'utf8' });
    assert.equal(result.status, 1); assert.match(result.stderr, /Screening failed/); assert.equal(result.stdout, '');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('cyclic and skew findings report sufficiently long patterns without treating tiny batches as skewed', () => {
  const cycle = Array.from({ length: 16 }, (_, i) => question(`q${i}`, 'ABCD'[i % 4]));
  const report = auditItems(cycle, 'synthetic');
  assert.deepEqual(report.cyclicRuns, [{ start_mcq: 1, end_mcq: 16, period: 4, pattern: 'ABCD' }]);
  assert.equal(report.skewedAnswers, false);
  assert.equal(auditItems(cycle.map(q => ({ ...q, correct_option_id: 'A' })), 'synthetic').skewedAnswers, true);
  assert.equal(auditItems([question('q')], 'synthetic').skewedAnswers, false);
});

test('case screening requires both directions of canonical case/question links', () => {
  const q = { ...question('q'), case_study_id: 'case' };
  const c = { id: 'case', item_type: 'case_study', question_ids: ['q'] };
  assert.deepEqual(auditItems([q, c], 'synthetic').caseLinkIssues, []);
  assert.equal(auditItems([q], 'synthetic').caseLinkIssues.length, 1);
  assert.equal(auditItems([question('q'), c], 'synthetic').caseLinkIssues.length, 1);
});

test('stub and source-dependent stem checks remain descriptive and calculation status stays unchecked', () => {
  const q = question('q'); q.stem_md = 'According to the courseware, choose a rule'; q.options[0].explanation_md = 'Correct.';
  const report = auditItems([q, { id: 'n', item_type: 'question', question_type: 'numeric_input' },
    { id: 'w', item_type: 'card', card_type: 'worked_example' }], 'synthetic');
  assert.equal(report.stubOptions, 1); assert.equal(report.coursewareStem, 1);
  assert.deepEqual(report.quantitativeItemIds, ['n', 'w']);
  assert.equal(report.calculationVerification, 'not_checked');
});
