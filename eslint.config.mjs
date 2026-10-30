import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'tests/fixtures/**'] },
  js.configs.recommended,
  { files: ['**/*.mjs'], languageOptions: { globals: globals.node } },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      'no-restricted-globals': [
        'error',
        'fetch',
        'XMLHttpRequest',
        'WebSocket',
        'EventSource',
        'localStorage',
        'sessionStorage',
        'indexedDB',
        'caches',
        'sendBeacon',
      ],
      'no-restricted-properties': [
        'error',
        {
          property: 'fetch',
          message: 'Network and storage effects belong to host adapters.',
        },
        {
          property: 'XMLHttpRequest',
          message: 'Network and storage effects belong to host adapters.',
        },
        {
          property: 'WebSocket',
          message: 'Network and storage effects belong to host adapters.',
        },
        {
          property: 'EventSource',
          message: 'Network and storage effects belong to host adapters.',
        },
        {
          property: 'localStorage',
          message: 'Network and storage effects belong to host adapters.',
        },
        {
          property: 'sessionStorage',
          message: 'Network and storage effects belong to host adapters.',
        },
        {
          property: 'indexedDB',
          message: 'Network and storage effects belong to host adapters.',
        },
        {
          property: 'caches',
          message: 'Network and storage effects belong to host adapters.',
        },
        {
          property: 'sendBeacon',
          message: 'Network and storage effects belong to host adapters.',
        },
      ],
      'no-restricted-imports': ['error', { patterns: ['electron', 'node:*'] }],
    },
  },
  {
    files: [
      'src/model/**/*.{ts,tsx}',
      'src/application/**/*.{ts,tsx}',
      'src/presentation/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-globals': [
        'error',
        'fetch',
        'XMLHttpRequest',
        'WebSocket',
        'EventSource',
        'localStorage',
        'sessionStorage',
        'indexedDB',
        'caches',
        'sendBeacon',
        'window',
        'document',
        'globalThis',
        'self',
        'navigator',
      ],
    },
  },
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: ['src/**/*.ts', 'src/**/*.tsx', 'tests/**/*.ts'],
  })),
  {
    files: ['src/**/*.ts', 'src/**/*.tsx', 'tests/**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { 'react-hooks': hooks },
    rules: {
      ...hooks.configs.recommended.rules,
      'max-lines': [
        'error',
        { max: 400, skipBlankLines: true, skipComments: true },
      ],
      'max-lines-per-function': [
        'error',
        { max: 80, skipBlankLines: true, skipComments: true },
      ],
      complexity: ['warn', 10],
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
  {
    files: ['tests/**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: './tsconfig.tests.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'max-lines-per-function': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/only-throw-error': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true },
      ],
      '@typescript-eslint/no-confusing-void-expression': [
        'error',
        { ignoreArrowShorthand: true },
      ],
    },
  },
);
