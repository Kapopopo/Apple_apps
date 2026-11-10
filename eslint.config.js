// Lint du code Atlas (pas du code importé : registry/, démos vendorisées, aperçus générés).
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default defineConfig(
  {
    ignores: [
      'registry/**',
      '.cache/**',
      'dist/**',
      '**/node_modules/**',
      'specs/**',
      'web/registry-previews/**',
      'web/demos/**',
      'web/thumbs/**',
      'demos/src/vendor/**',
      'previews/src/generated/**',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node } },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      // Style du dépôt : `cond ? a() : b()` et `ok && action()` comme instructions.
      '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
    },
  },
  {
    files: ['web/**/*.js', 'previews/src/**', 'previews/shims/**', 'demos/src/**'],
    languageOptions: { globals: { ...globals.browser } },
  },
);
