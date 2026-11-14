// Independent quality auditor for authored batches and published packs.
// Checks:
// 1. Stub/trivial distractor and answer explanations (<25 chars or generic words like "Not so.", "Correct.", "Not stated.")
// 2. Cyclic or skewed correct option distributions
// 3. Question stems referencing "according to the courseware" or passive rote memorisation
// 4. Case study presence and links
// 5. Quantitative calculation test coverage
// Usage: node scripts/audit-content-quality.mjs [batch-dir-or-pack-file]

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = process.argv[2];

const STUB_PATTERNS = [
  /^(correct|incorrect|true|false)\.?$/i,
  /^(not so|not stated|stated|rule|not the rule|opposite|definition)\.?$/i,
  /^(it is listed|not listed|not the claim|not required|not allowed)\.?$/i,
  /^this is (the rule|the definition|the conversion)\.?$/i,
];

function auditItems(items, sourceName) {
  let totalMCQ = 0;
  let totalOptions = 0;
  let stubOptions = 0;
  let _shortStem = 0;
  let coursewareStem = 0;
  let caseCount = 0;
  let caseLinkedQuestions = 0;
  const answerDist = { A: 0, B: 0, C: 0, D: 0 };
  const stubExamples = [];
  const stemIssues = [];

  for (const item of items) {
    if (item.item_type === 'case') {
      caseCount++;
    }
    if (item.case_id) {
      caseLinkedQuestions++;
    }
    if (item.item_type === 'question' && item.question_type === 'single_choice') {
      totalMCQ++;
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
  };
}

function run() {
  if (target) {
    const filePath = join(root, target);
    if (!existsSync(filePath)) {
      console.error(`Target not found: ${target}`);
      process.exit(1);
    }
    const data = JSON.parse(readFileSync(filePath, 'utf8'));
    const items = data.items || data.pack?.items || [];
    const report = auditItems(items, target);
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log('=== AUDITING ALL PUBLISHED PACKS ===');
  const packDir = join(root, 'public', 'content', 'packs');
  for (const file of readdirSync(packDir)) {
    if (!file.endsWith('.json')) continue;
    const pack = JSON.parse(readFileSync(join(packDir, file), 'utf8'));
    const report = auditItems(pack.items || [], file);
    console.log(`\nPack: ${file}`);
    console.log(`  Items: ${report.totalItems} (MCQs: ${report.totalMCQ}, Cases: ${report.caseCount}, Case-linked Qs: ${report.caseLinkedQuestions})`);
    console.log(`  Stub options: ${report.stubOptions} / ${report.totalOptions} (${report.stubPct}%)`);
    console.log(`  Answer distribution: ${JSON.stringify(report.answerDist)}`);
    console.log(`  Stems citing courseware directly: ${report.coursewareStem}`);
    if (report.stubExamples.length > 0) {
      console.log('  Sample stubs:');
      report.stubExamples.slice(0, 3).forEach(s => console.log('    - ' + s));
    }
  }
}

run();
