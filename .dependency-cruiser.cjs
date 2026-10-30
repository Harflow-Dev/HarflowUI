const layers = [
  'model',
  'application',
  'presentation',
  'components',
  'features',
];
const permitted = {
  model: [],
  application: ['model'],
  presentation: ['application', 'model'],
  components: ['presentation', 'model'],
  features: layers,
};
module.exports = {
  forbidden: [
    {
      name: 'known-source-layers',
      severity: 'error',
      from: { path: '^src/' },
      to: {
        path: '^src/',
        pathNot: '^src/(model|application|presentation|components|features)/',
      },
    },
    {
      name: 'repository-source-only',
      severity: 'error',
      from: { path: '^src/' },
      to: {
        dependencyTypes: ['local'],
        pathNot: '^src/(model|application|presentation|components|features)/',
      },
    },

    { name: 'no-cycles', severity: 'error', from: {}, to: { circular: true } },
    {
      name: 'no-unresolved',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'browser-safe',
      severity: 'error',
      from: { path: '^src' },
      to: { dependencyTypes: ['core'], path: '.' },
    },
    {
      name: 'react-only-at-edge',
      severity: 'error',
      from: { path: '^src/(model|application|presentation)/' },
      to: { path: 'node_modules' },
    },
    ...layers.map((layer) => ({
      name: `${layer}-direction`,
      severity: 'error',
      from: { path: `^src/${layer}/` },
      to: {
        path: `^src/(${layers.filter((other) => other !== layer && !permitted[layer].includes(other)).join('|') || '$a'})/`,
      },
    })),
    ...layers.map((layer) => ({
      name: `${layer}-public-entry`,
      severity: 'error',
      from: { path: '^src/', pathNot: `^src/${layer}/` },
      to: { path: `^src/${layer}/`, pathNot: `^src/${layer}/index\\.tsx?$` },
    })),
  ],
  options: {
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    doNotFollow: { path: 'node_modules' },
    enhancedResolveOptions: { extensions: ['.ts', '.tsx', '.js', '.jsx'] },
  },
};
