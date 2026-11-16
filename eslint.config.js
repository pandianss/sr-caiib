import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    // Generated output, dependencies, and the files delivered with the original kit (kept byte-identical).
    ignores: ['dist/**', 'android/**', 'tmp/**', 'store-assets/**', 'capacitor.config.ts', 'dist-fixtures/**', 'node_modules/**', '.scratch/**', 'caiib-agent-kit/**', 'public/**', 'server/data/**',
      'src/types/**', 'src/validation/**', 'src/import/**', 'scripts/import-staging.mjs', 'scripts/validate-pack.mjs', 'scripts/validate-staging.mjs',
      'tests/contracts.test.mjs', 'tests/import-staging.test.mjs', 'tests/types.test.ts', 'visual-map/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/app/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: { 'react-hooks/rules-of-hooks': 'error', 'react-hooks/exhaustive-deps': 'warn' },
    languageOptions: { globals: { window: 'readonly', document: 'readonly', navigator: 'readonly', fetch: 'readonly', crypto: 'readonly', indexedDB: 'readonly', sessionStorage: 'readonly', performance: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly', setInterval: 'readonly', clearInterval: 'readonly', KeyboardEvent: 'readonly', HTMLElement: 'readonly', HTMLButtonElement: 'readonly', HTMLDivElement: 'readonly', Intl: 'readonly', React: 'readonly' } },
  },
  {
    files: ['scripts/**/*.{js,mjs}', 'server/**/*.ts', 'tests/**/*.ts', 'eslint.config.js', 'vite.config.ts'],
    languageOptions: { globals: { process: 'readonly', console: 'readonly', Buffer: 'readonly', fetch: 'readonly', AbortSignal: 'readonly', URL: 'readonly', setTimeout: 'readonly', TextDecoder: 'readonly', TextEncoder: 'readonly', Response: 'readonly', structuredClone: 'readonly', window: 'readonly', document: 'readonly', location: 'readonly', getComputedStyle: 'readonly', NodeFilter: 'readonly' } },
  },
  { rules: { 'no-undef': 'off', '@typescript-eslint/no-non-null-assertion': 'off', '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }] } },
);
