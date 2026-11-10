import { readFile } from 'node:fs/promises';
import { validateCatalogue, validatePack } from '../src/validation/contracts.ts';

const [cataloguePath, packPath] = process.argv.slice(2);
if (!cataloguePath || !packPath) {
  console.error('Usage: npm run validate:pack -- catalogue.json pack.json');
  process.exit(2);
}

try {
  const catalogueJson = JSON.parse(await readFile(cataloguePath, 'utf8'));
  const catalogue = validateCatalogue(catalogueJson);
  if (!catalogue.ok) {
    console.error(`Catalogue validation failed with ${catalogue.issues.length} issue(s):`);
    catalogue.issues.forEach(i => console.error(`  - [${i.path}]: ${i.message}`));
    process.exit(1);
  }

  const packJson = JSON.parse(await readFile(packPath, 'utf8'));
  const pack = validatePack(packJson, catalogue.data);
  if (!pack.ok) {
    console.error(`Pack validation failed with ${pack.issues.length} issue(s):`);
    pack.issues.forEach(i => console.error(`  - [${i.path}]: ${i.message}`));
    process.exit(1);
  }

  console.log(`Validated ${pack.data.items.length} items for pack "${pack.data.pack_id}" v${pack.data.pack_version} (${pack.data.paper_id}).`);
  console.log('Structure, ancestry and cross-item links are valid.');
  console.log('Note: Editorial accuracy, rights, checksums and activation need separate verification.');
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
