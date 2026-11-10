import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { importStaging, parseJsonDocument } from '../src/import/staging.mjs';

const args = process.argv.slice(2);
const [stagingPath, cataloguePath, mappingPath, outputPath] = args;
if (args.length < 3 || args.length > 4) {
  console.error('Usage: npm run import:staging -- staging.json catalogue.json import-config.json [new-output.json]');
  process.exitCode = 2;
} else {
  try {
    if (outputPath && [stagingPath, cataloguePath, mappingPath].some(p => resolve(p) === resolve(outputPath))) throw new Error('Output must not replace an input file');
    const documents = await Promise.all([stagingPath, cataloguePath, mappingPath].map(async path => parseJsonDocument(await readFile(path, 'utf8'))));
    const bundle = importStaging(...documents);
    const json = JSON.stringify(bundle, null, 2) + '\n';
    if (outputPath) {
      // Validation is complete before any output write. Never overwrite a prior import.
      await writeFile(outputPath, json, { encoding: 'utf8', flag: 'wx' });
      console.log(`Imported ${bundle.items.length} structurally valid draft item(s) to ${outputPath}. Editorial review is still required.`);
    } else process.stdout.write(json);
  } catch (error) {
    console.error(`Import failed: ${error.message}`);
    process.exitCode = 1;
  }
}
