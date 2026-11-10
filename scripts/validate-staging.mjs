import { readFile } from 'node:fs/promises';
import { validateExtraction } from '../src/validation/contracts.ts';
import { parseJsonDocument } from '../src/import/staging.mjs';

const [stagingPath] = process.argv.slice(2);
if (!stagingPath) {
  console.error('Usage: npm run validate:staging -- path/to/staging-batch.json');
  process.exit(2);
}

try {
  const content = await readFile(stagingPath, 'utf8');
  const parsed = parseJsonDocument(content);
  const result = validateExtraction(parsed);

  if (!result.ok) {
    console.error(`Validation failed with ${result.issues.length} issue(s):`);
    for (const issue of result.issues) {
      console.error(`  - [${issue.path}]: ${issue.message}`);
    }
    process.exit(1);
  }

  const batch = result.data;
  console.log(`Validated staging batch "${batch.batch_id}" for paper ${batch.paper_id} (${batch.unit_label}).`);
  console.log(`  - Sources: ${batch.source_ids.length}`);
  console.log(`  - Facts: ${batch.facts.length}`);
  console.log(`  - Draft items: ${batch.drafts.length}`);
  console.log('Staging envelope is valid. Payload completeness, explicit mapping, evidence, originality and review remain to be checked.');
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
