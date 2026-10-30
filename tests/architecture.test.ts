import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, rmdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { validateSourceInventory } from '../scripts/check-source-inventory.mjs';

const root = process.cwd();
const require = createRequire(import.meta.url);
const depcruise = join(
  dirname(fileURLToPath(import.meta.resolve('dependency-cruiser'))),
  '../../bin/dependency-cruise.mjs',
);
const eslint = join(dirname(require.resolve('eslint')), '../bin/eslint.js');
const config = join(root, '.dependency-cruiser.cjs');

function execute(script: string, args: string[]) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    encoding: 'utf8',
  });
  if (result.error) throw result.error;
  assert.equal(typeof result.status, 'number', result.stdout + result.stderr);
  return result;
}

async function graph(files: Record<string, string>) {
  const paths = Object.keys(files).map((path) => join(root, path));
  const createdDirectories = new Set<string>();
  for (const file of paths) {
    let directory = join(file, '..');
    while (directory.startsWith(root) && !existsSync(directory)) {
      createdDirectories.add(directory);
      directory = join(directory, '..');
    }
  }
  try {
    for (const [path, content] of Object.entries(files)) {
      const file = join(root, path);
      await mkdir(join(file, '..'), { recursive: true });
      await writeFile(file, content);
    }
    return execute(depcruise, ['src', '--config', config]);
  } finally {
    await Promise.all(paths.map((path) => rm(path, { force: true })));
    for (const directory of [...createdDirectories].sort(
      (left, right) => right.length - left.length,
    )) {
      await rmdir(directory);
    }
  }
}

void test('dependency-cruiser accepts allowed edges and rejects forbidden layer imports', async () => {
  const valid = await graph({
    'src/model/__architecture_allowed.ts': 'export type Value = string;\n',
    'src/application/__architecture_allowed.ts':
      "import type { Value } from '../model/index.js';\nexport type Item = Value;\n",
  });
  assert.equal(valid.status, 0, valid.stdout + valid.stderr);

  const invalid = await graph({
    'src/model/__architecture_violation.ts':
      "import type { HostState } from '../presentation/__architecture_internal.js';\nexport type Value = HostState;\n",
    'src/presentation/__architecture_internal.ts':
      'export type HostState = string;\n',
  });
  assert.notEqual(invalid.status, 0);
  assert.match(
    invalid.stdout + invalid.stderr,
    /model-direction|model-public-entry/,
  );
});

void test('dependency-cruiser rejects dependency cycles and private cross-layer imports', async () => {
  const cycle = await graph({
    'src/application/__architecture_cycle.ts':
      "import '../presentation/__architecture_cycle.js';\n",
    'src/presentation/__architecture_cycle.ts':
      "import '../application/__architecture_cycle.js';\n",
  });
  assert.notEqual(cycle.status, 0);
  assert.match(cycle.stdout + cycle.stderr, /no-cycles/);

  const privateImport = await graph({
    'src/application/__architecture_private.ts':
      "import '../model/__architecture_private.js';\n",
    'src/model/__architecture_private.ts': 'export const value = 1;\n',
  });
  assert.notEqual(privateImport.status, 0);
  assert.match(
    privateImport.stdout + privateImport.stderr,
    /model-public-entry/,
  );
});

void test('dependency-cruiser rejects unknown source relays and dependencies outside src', async () => {
  const unknownRelay = await graph({
    'src/model/__architecture_unknown_relay.ts':
      "import '../unknown/__architecture_unknown.js';\n",
    'src/unknown/__architecture_unknown.ts': 'export const value = 1;\n',
  });
  assert.notEqual(
    unknownRelay.status,
    0,
    unknownRelay.stdout + unknownRelay.stderr,
  );

  const outside = await graph({
    'src/model/__architecture_outside.ts':
      "import '../../__architecture_outside.js';\n",
    '__architecture_outside.ts': 'export const value = 1;\n',
  });
  assert.notEqual(outside.status, 0, outside.stdout + outside.stderr);
});

void test('source inventory rejects unknown, orphaned, and JSX source files in pure layers', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'harflow-ui-inventory-'));
  try {
    const source = join(directory, 'src');
    await mkdir(join(source, 'model'), { recursive: true });
    await writeFile(
      join(source, 'model/index.ts'),
      'export type Value = string;\n',
    );
    assert.doesNotThrow(() => validateSourceInventory(directory));

    await mkdir(join(source, 'unknown'), { recursive: true });
    assert.throws(
      () => validateSourceInventory(directory),
      /Unknown source layer/,
    );
    await rm(join(source, 'unknown'), { recursive: true, force: true });

    await mkdir(join(source, 'helpers'), { recursive: true });
    await writeFile(
      join(source, 'helpers/orphan.ts'),
      'export const value = 1;\n',
    );
    assert.throws(
      () => validateSourceInventory(directory),
      /Unknown source layer/,
    );
    await rm(join(source, 'helpers'), { recursive: true, force: true });

    await writeFile(
      join(source, 'model/orphan.js'),
      'export const value = 1;\n',
    );
    assert.throws(
      () => validateSourceInventory(directory),
      /Unsupported production source/,
    );
    await rm(join(source, 'model/orphan.js'));

    await writeFile(
      join(source, 'model/view.tsx'),
      'export const View = () => null;\n',
    );
    assert.throws(
      () => validateSourceInventory(directory),
      /JSX is forbidden in pure layers/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

void test('ESLint production size policy rejects an oversized source file', async () => {
  const file = join(root, 'src/__architecture_size_fixture.ts');
  await writeFile(
    file,
    Array.from(
      { length: 401 },
      (_, index) => `const value${String(index)} = ${String(index)};`,
    ).join('\n'),
  );
  try {
    const result = execute(eslint, [file]);
    assert.notEqual(result.status, 0);
    assert.match(result.stdout + result.stderr, /max-lines/);
  } finally {
    await rm(file, { force: true });
  }
});

void test('ESLint rejects network and storage access through browser globals and global objects', async () => {
  const samples = [
    'export function access() { return fetch("/"); }',
    'export function access() { return window.fetch("/"); }',
    'export function access() { return globalThis.fetch("/"); }',
    'export function access() { return localStorage.getItem("key"); }',
    'export function access() { return window.localStorage.getItem("key"); }',
    'export function access() { return globalThis.localStorage.getItem("key"); }',
  ];
  for (const [index, source] of samples.entries()) {
    const file = join(
      root,
      `src/features/__architecture_effect_${String(index)}.ts`,
    );
    await writeFile(file, source);
    try {
      const result = execute(eslint, [file]);
      assert.notEqual(
        result.status,
        0,
        `${source}\n${result.stdout}${result.stderr}`,
      );
    } finally {
      await rm(file, { force: true });
    }
  }
});
