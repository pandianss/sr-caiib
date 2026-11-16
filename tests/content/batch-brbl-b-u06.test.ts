import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { DraftImportBundle } from '../../src/types/contracts.ts';

const bundle = (n: number): DraftImportBundle => JSON.parse(readFileSync(new URL(`../../content/batches/BRBL-B-U06-B${String(n).padStart(3, '0')}/draft-bundle.json`, import.meta.url), 'utf8'));

test('BRBL U06: proportional equal-standing allocation reconciles exactly in INR', () => {
  const items = bundle(1).items;
  const worked = items.find(i => i.item_type === 'card' && i.card_type === 'worked_example');
  assert.ok(worked?.item_type === 'card' && worked.card_type === 'worked_example');
  assert.match(worked.core_explanation_md, /84,000/); assert.match(worked.core_explanation_md, /126,000/);
  assert.match(worked.core_explanation_md, /70,000/);
  const debts = [84000n, 126000n], payment = 70000n;
  const total = debts.reduce((a,b) => a+b);
  const shares = debts.map(d => payment*d/total);
  assert.equal(shares.reduce((a,b) => a+b), payment);
  const firstStep = worked.worked_steps[0]; assert.ok(firstStep);
  assert.equal(firstStep.intermediate_result, `${total} INR`);
  assert.equal(worked.final_answer_with_unit, `First debt: ${shares[0]} INR; second debt: ${shares[1]} INR`);
  const q = items.find(i => i.item_type === 'question' && i.question_type === 'numeric_input');
  assert.ok(q?.item_type === 'question' && q.question_type === 'numeric_input');
  assert.match(q.stem_md, /120,000/); assert.match(q.stem_md, /180,000/); assert.match(q.stem_md, /90,000/);
  const pool = 120000n+180000n, allocated = 90000n*180000n;
  assert.equal(allocated % pool, 0n);
  assert.equal(q.numeric_rule.expected_answer, String(allocated/pool));
  assert.equal(q.numeric_rule.precision_decimals, 0); assert.equal(q.numeric_rule.unit_label, 'INR');
});

test('BRBL U06: pledge-sale case links resolve and proceeds reconcile with debt, costs and surplus', () => {
  const items = bundle(5).items;
  const c = items.find(i => i.item_type === 'case_study');
  assert.ok(c?.item_type === 'case_study');
  for (const amount of ['620,000', '545,000', '12,000']) assert.ok(c.scenario_narrative_md.includes(amount));
  const linked = c.question_ids.map(id => items.find(i => i.id === id));
  assert.equal(linked.length, 2);
  for (const q of linked) { assert.ok(q?.item_type === 'question'); assert.equal(q.case_study_id, c.id); }
  const q = linked.find(i => i?.item_type === 'question' && i.question_type === 'numeric_input');
  assert.ok(q?.item_type === 'question' && q.question_type === 'numeric_input');
  const proceeds = 620000n, debt = 545000n, costs = 12000n;
  const surplus = proceeds-debt-costs;
  assert.equal(q.numeric_rule.expected_answer, String(surplus));
  assert.equal(surplus+debt+costs, proceeds);
  assert.equal(q.numeric_rule.unit_label, 'INR'); assert.equal(q.numeric_rule.precision_decimals, 0);
});

test('BRBL U06: retained teaching and assessment stay unreviewed with explicit legal evidence gaps', () => {
  const bundles = Array.from({length:8}, (_,i) => bundle(i+1));
  assert.equal(bundles.reduce((sum,b) => sum+b.items.length,0),41);
  for (const b of bundles) {
    for (const item of b.items) {
      assert.equal(item.publication_state,'draft'); assert.equal(item.review,null);
      assert.equal(item.unit_id,'BRBL::MOD_B::U06');
    }
    assert.ok(b.source_batch.facts.every(f => f.evidence_status === 'needs_review'));
    assert.ok(b.source_batch.unresolved.length >= 4);
  }
  assert.ok(bundle(7).source_batch.unresolved.some(x => /Post-cutoff/.test(x)));
  assert.ok(bundle(6).source_batch.unresolved.some(x => /Full SARFAESI PDF bytes/.test(x)));
});
