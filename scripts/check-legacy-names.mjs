import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const allowed = JSON.parse(
  readFileSync(join(root, 'scripts/legacy-name-allowlist.json'), 'utf8'),
);
const pattern = new RegExp('poly' + 'bridge', 'i');
function scan(directory) {
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'dist', 'target'].includes(item.name))
      continue;
    const path = join(directory, item.name);
    if (item.isDirectory()) scan(path);
    else if (
      pattern.test(readFileSync(path, 'utf8')) &&
      !allowed.includes(relative(root, path).replaceAll('\\', '/'))
    )
      throw new Error(`Legacy name: ${path}`);
  }
}
scan(root);
