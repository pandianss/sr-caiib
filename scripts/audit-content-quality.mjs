// Automated text/structure screening, not independent editorial or legal review.
// Checks:
// 1. Stub option explanations (<20 characters or generic phrases)
// 2. Cyclic or skewed correct option distributions
// 3. Question stems referencing "according to the courseware" or passive rote memorisation
// 4. Case study presence and reciprocal links
// 5. Quantitative item inventory (calculation correctness/coverage is NOT verified)
// Usage: node scripts/audit-content-quality.mjs [batch-dir-or-pack-file]

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = process.argv[2];

const STUB_PATTERNS = [
  /^(correct|incorrect|true|false)\.?$/i,
  /^(not so|not stated|stated|rule|not the rule|opposite|definition)\.?$/i,
  /^(it is listed|not listed|not the claim|not required|not allowed)\.?$/i,
  /^this is (the rule|the definition|the conversion)\.?$/i,
];

export function auditItems(items, sourceName) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('Expected a nonempty canonical items array');
  const byId = new Map();
  for (const item of items) {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !item.id || byId.has(item.id)) {
      throw new Error('Each screened item needs a unique canonical id');
    }
    if (!['card', 'question', 'case_study', 'reference', 'calculator'].includes(item.item_type)) {
      throw new Error(`Unknown canonical item type: ${item.id}`);
    }
    byId.set(item.id, item);
  }
  let totalMCQ = 0;
  let totalOptions = 0;
  let stubOptions = 0;
  let coursewareStem = 0;
  let caseCount = 0;
  let caseLinkedQuestions = 0;
  const answerDist = { A: 0, B: 0, C: 0, D: 0 };
  const stubExamples = [];
  const stemIssues = [];
  const answers = [];
  const caseLinkIssues = [];
  const quantitativeItemIds = [];

  for (const item of items) {
    if (item.item_type === 'case_study') {
      caseCount++;
      if (!Array.isArray(item.question_ids) || item.question_ids.length === 0) throw new Error(`Missing case question_ids: ${item.id}`);
      for (const id of item.question_ids) {
        const q = byId.get(id);
        if (q?.item_type !== 'question' || q.case_study_id !== item.id) caseLinkIssues.push({ case_id: item.id, question_id: id, issue: 'Missing question or reciprocal case link' });
      }
    }
    if (item.item_type === 'question' && item.case_study_id) {
      caseLinkedQuestions++;
      const c = byId.get(item.case_study_id);
      if (c?.item_type !== 'case_study' || !c.question_ids?.includes(item.id)) caseLinkIssues.push({ case_id: item.case_study_id, question_id: item.id, issue: 'Missing case or reciprocal question link' });
    }
    if (item.item_type === 'question' && !['single_choice', 'numeric_input'].includes(item.question_type)) throw new Error(`Unknown question type: ${item.id}`);
    if ((item.item_type === 'question' && item.question_type === 'numeric_input') || (item.item_type === 'card' && item.card_type === 'worked_example')) quantitativeItemIds.push(item.id);
    if (item.item_type === 'question' && item.question_type === 'single_choice') {
      if (typeof item.stem_md !== 'string' || !item.stem_md.trim() || !Array.isArray(item.options) || item.options.length !== 4 ||
          new Set(item.options.map(o => o?.option_id)).size !== 4 ||
          item.options.some(o => !o || !['A','B','C','D'].includes(o.option_id) || typeof o.text_md !== 'string' || !o.text_md.trim() || typeof o.explanation_md !== 'string') ||
          !item.options.some(o => o.option_id === item.correct_option_id)) throw new Error(`Malformed choice question: ${item.id}`);
      totalMCQ++;
      answers.push(item.correct_option_id);
      answerDist[item.correct_option_id] = (answerDist[item.correct_option_id] || 0) + 1;

      if (/according to the courseware/i.test(item.stem_md || '')) {
        coursewareStem++;
        if (stemIssues.length < 5) stemIssues.push(item.stem_md);
      }

      for (const opt of item.options || []) {
        totalOptions++;
        const exp = (opt.explanation_md || '').trim();
        const isStub = exp.length < 20 || STUB_PATTERNS.some(p => p.test(exp));
        if (isStub) {
          stubOptions++;
          if (stubExamples.length < 5) {
            stubExamples.push(`[${opt.option_id}] "${opt.text_md}" -> "${exp}" (Q: ${(item.stem_md||'').slice(0, 60)}...)`);
          }
        }
      }
    }
  }

  const stubPct = totalOptions > 0 ? ((stubOptions / totalOptions) * 100).toFixed(1) : '0.0';
  // Descriptive heuristics only: order-dependent patterns merit review, not answer-key changes.
  const cyclicRuns = [];
  for (let start = 0; start < answers.length; start++) {
    for (let period = 1; period <= 4; period++) {
      let end = start + period;
      while (end < answers.length && answers[end] === answers[start + (end - start) % period]) end++;
      if (end - start >= Math.max(12, period * 3) &&
          !cyclicRuns.some(r => r.start_mcq <= start + 1 && r.end_mcq >= end)) {
        cyclicRuns.push({ start_mcq: start + 1, end_mcq: end, period, pattern: answers.slice(start, start + period).join('') });
      }
    }
  }
  return {
    sourceName,
    totalItems: items.length,
    caseCount,
    caseLinkedQuestions,
    totalMCQ,
    totalOptions,
    stubOptions,
    stubPct,
    answerDist,
    coursewareStem,
    stubExamples,
    stemIssues,
    cyclicRuns,
    skewedAnswers: totalMCQ >= 12 && Object.values(answerDist).some(n => n / totalMCQ > 0.5),
    caseLinkIssues,
    quantitativeItemIds,
    calculationVerification: 'not_checked',
    limitations: 'Heuristic screening only; no source, originality, legal, calculation or independent review approval.',
  };
}

export function readAuditTarget(targetPath) {
  const filePath = statSync(targetPath).isDirectory() ? join(targetPath, 'draft-bundle.json') : targetPath;
  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  const items = data?.items ?? data?.pack?.items;
  // Never turn missing, malformed or empty content into a successful zero-findings audit.
  return auditItems(items, filePath);
}

function run() {
  if (target) {
    const report = readAuditTarget(resolve(root, target));
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log('=== AUDITING ALL PUBLISHED PACKS ===');
  const packDir = join(root, 'public', 'content', 'packs');
  for (const file of readdirSync(packDir)) {
    if (!file.endsWith('.json')) continue;
    const report = readAuditTarget(join(packDir, file));
    console.log(`\nPack: ${file}`);
    console.log(`  Items: ${report.totalItems} (MCQs: ${report.totalMCQ}, Cases: ${report.caseCount}, Case-linked Qs: ${report.caseLinkedQuestions})`);
    console.log(`  Stub options: ${report.stubOptions} / ${report.totalOptions} (${report.stubPct}%)`);
    console.log(`  Answer distribution: ${JSON.stringify(report.answerDist)}`);
    console.log(`  Stems citing courseware directly: ${report.coursewareStem}`);
    console.log(`  Cyclic runs: ${report.cyclicRuns.length}; skewed: ${report.skewedAnswers}; broken case links: ${report.caseLinkIssues.length}`);
    console.log(`  Quantitative items: ${report.quantitativeItemIds.length}; calculation verification: ${report.calculationVerification}`);
    if (report.stubExamples.length > 0) {
      console.log('  Sample stubs:');
      report.stubExamples.slice(0, 3).forEach(s => console.log('    - ' + s));
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { run(); } catch (error) { console.error(`Screening failed: ${error.message}`); process.exitCode = 1; }
}
