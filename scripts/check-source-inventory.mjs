import { readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const layers = [
  'model',
  'application',
  'presentation',
  'components',
  'features',
];
const pure = ['model', 'application', 'presentation'];
export function validateSourceInventory(root) {
  const source = join(root, 'src');
  function walk(directory, layer) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isSymbolicLink())
        throw new Error(`Source symlink forbidden: ${path}`);
      if (entry.isDirectory()) {
        if (!layer && !layers.includes(entry.name))
          throw new Error(`Unknown source layer: ${path}`);
        walk(path, layer ?? entry.name);
      } else {
        if (!layer)
          throw new Error(`Source must belong to a known layer: ${path}`);
        if (entry.name.endsWith('.tsbuildinfo')) continue;
        if (entry.name === 'tsconfig.json') continue;
        if (layer === 'renderer' && entry.name.endsWith('.html')) continue;
        if (!/\.tsx?$/.test(entry.name))
          throw new Error(`Unsupported production source: ${path}`);
        if (pure.includes(layer) && entry.name.endsWith('.tsx'))
          throw new Error(`JSX is forbidden in pure layers: ${path}`);
      }
    }
  }
  walk(source, undefined);
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  validateSourceInventory(
    resolve(process.argv[2] ?? fileURLToPath(new URL('../', import.meta.url))),
  );
}
