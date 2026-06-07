const fs = require('fs');
const path = require('path');

const repos = [
  'src/app/core/data-access/infrastructure/repositories/greenhouses.repository.ts',
  'src/app/core/data-access/infrastructure/repositories/zones.repository.ts',
  'src/app/core/data-access/infrastructure/repositories/systems.repository.ts',
  'src/app/core/data-access/infrastructure/repositories/layers.repository.ts',
  'src/app/core/data-access/infrastructure/repositories/pipes.repository.ts',
  'src/app/core/data-access/operations/repositories/crops.repository.ts',
  'src/app/core/data-access/operations/repositories/batches.repository.ts',
  'src/app/core/data-access/operations/repositories/losses.repository.ts',
];

for (const rel of repos) {
  const file = path.join(process.cwd(), rel);
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes('normalizePaginatedResult')) continue;

  s = s.replace(
    /from '\.\.\/list-query';/,
    "from '../list-query';\n// normalizePaginatedResult"
  );
  s = s.replace(
    /from '\.\.\/\.\.\/infrastructure\/list-query';/,
    "from '../../infrastructure/list-query';\n// normalizePaginatedResult"
  );

  if (s.includes("from '../list-query'")) {
    s = s.replace(
      /import \{([^}]+)\} from '\.\.\/list-query';/,
      (m, inner) => {
        if (inner.includes('normalizePaginatedResult')) return m;
        return `import {${inner.trim()}, normalizePaginatedResult } from '../list-query';`;
      }
    );
  }
  if (s.includes("from '../../infrastructure/list-query'")) {
    s = s.replace(
      /import \{([^}]+)\} from '\.\.\/\.\.\/infrastructure\/list-query';/,
      (m, inner) => {
        if (inner.includes('normalizePaginatedResult')) return m;
        return `import {${inner.trim()}, normalizePaginatedResult } from '../../infrastructure/list-query';`;
      }
    );
  }

  // Pattern: map response => ({ items: ..., totalCount: ...
  s = s.replace(
    /map\(response => \(\{\s*items: ([^,]+),\s*totalCount:[^}]+\}\)\)/s,
    'map(response => {\n        const items = $1;\n        return normalizePaginatedResult(response.result, items);\n      })'
  );

  // batches/losses inner map
  s = s.replace(
    /const items = ([^;]+);\s*return \{\s*items,\s*totalCount:[^}]+\};/s,
    'const items = $1;\n        return normalizePaginatedResult(response.result, items);'
  );

  fs.writeFileSync(file, s);
  console.log('updated', rel);
}
