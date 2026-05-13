import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const appRoot = path.join(projectRoot, 'src', 'app');
const featuresRoot = path.join(appRoot, 'features');

const violations = [];

const IMPORT_RE = /from\s+['"]([^'"]+)['"]/g;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.isFile() && (full.endsWith('.ts') || full.endsWith('.tsx'))) {
      files.push(full);
    }
  }

  return files;
}

function addViolation(file, message) {
  const rel = path.relative(projectRoot, file).replaceAll('\\', '/');
  violations.push(`${rel}: ${message}`);
}

function featureDomainFromPath(filePath) {
  const normalized = filePath.replaceAll('\\', '/');
  const m = normalized.match(/\/src\/app\/features\/([^/]+)\//);
  return m ? m[1] : null;
}

function featureDomainFromSpecifier(specifier) {
  const m = specifier.match(/^@app\/features\/([^/]+)/);
  return m ? m[1] : null;
}

function checkImportRules(file, specifier) {
  const normalized = file.replaceAll('\\', '/');
  const isFeatureFile = normalized.includes('/src/app/features/');
  const isSharedFile = normalized.includes('/src/app/shared/');
  const isCoreDataAccessFile = normalized.includes('/src/app/core/data-access/');
  const isRepositoryFile = normalized.includes('/src/app/core/data-access/') && normalized.endsWith('.repository.ts');

  // Rule 1: features must not import the root data-access barrel.
  if (isFeatureFile && specifier === '@app/core/data-access') {
    addViolation(file, "features must import domain entrypoints, not '@app/core/data-access'");
  }

  // Rule 2: no direct use of legacy ui barrels.
  if (specifier === '@app/shared/ui' || specifier === '@app/shared/ui-layout') {
    addViolation(file, "use '@app/shared/components' instead of legacy ui barrels");
  }

  // Rule 3: shared layer must never depend on features.
  if (isSharedFile && (specifier === '@app/features' || specifier.startsWith('@app/features/'))) {
    addViolation(file, "shared layer cannot import from features");
  }

  // Rule 4: repository layer should not depend on facades.
  if (isRepositoryFile && /\/facades\//.test(specifier)) {
    addViolation(file, 'repositories must not import facades');
  }

  // Rule 5: features should avoid deep imports to data-access internals.
  if (isFeatureFile && specifier.startsWith('@app/core/data-access/') && /\/(repositories|facades|models|services)\//.test(specifier)) {
    addViolation(file, 'features must import data-access via domain entrypoints only');
  }

  // Rule 6: @app/core/data-access/api is internal to data-access layer.
  if (!isCoreDataAccessFile && specifier === '@app/core/data-access/api') {
    addViolation(file, "only core/data-access layer can import '@app/core/data-access/api'");
  }

  // Rule 7: api wire contracts should not be imported directly outside data-access.
  if (!isCoreDataAccessFile && specifier === '@app/core/models/api-types') {
    addViolation(file, "import API contracts through data-access APIs, not '@app/core/models/api-types' directly");
  }

  // Rule 8: feature folders must not import sibling feature domains (only shared/core/cross-cutting).
  if (isFeatureFile && specifier.startsWith('@app/features/')) {
    const fromDomain = featureDomainFromPath(normalized);
    const toDomain = featureDomainFromSpecifier(specifier);
    if (fromDomain && toDomain && fromDomain !== toDomain) {
      addViolation(
        file,
        `features/${fromDomain} cannot import from @app/features/${toDomain} (use core or shared instead)`,
      );
    }
  }
}

async function main() {
  const appExists = await stat(appRoot).then(() => true).catch(() => false);
  if (!appExists) {
    console.error('Cannot find src/app directory.');
    process.exit(1);
  }

  const files = await walk(appRoot);

  for (const file of files) {
    const content = await readFile(file, 'utf8');
    IMPORT_RE.lastIndex = 0;
    let match;
    while ((match = IMPORT_RE.exec(content)) !== null) {
      checkImportRules(file, match[1]);
    }
  }

  if (violations.length > 0) {
    console.error('Boundary check failed:\n');
    for (const v of violations) {
      console.error(`- ${v}`);
    }
    process.exit(1);
  }

  const featureFiles = await walk(featuresRoot).catch(() => []);
  console.log(`Boundary check passed. Scanned ${files.length} files (${featureFiles.length} feature files).`);
}

await main();
