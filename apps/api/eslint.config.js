import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

const onionForbidden = (patterns) => ({
  'no-restricted-imports': ['error', { patterns }],
});

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'scripts/*.js'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['scripts/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  // Onion boundary: domain layer cannot import from outer rings or any I/O.
  {
    files: ['src/domain/**/*.ts'],
    rules: onionForbidden([
      '**/application/**',
      '**/infrastructure/**',
      '**/interfaces/**',
      '**/composition/**',
      'typeorm',
      'typeorm/*',
      'express',
      'pg',
      'bcrypt',
      'jsonwebtoken',
      'pino',
    ]),
  },
  // Onion boundary: application layer can only import domain.
  {
    files: ['src/application/**/*.ts'],
    rules: onionForbidden([
      '**/infrastructure/**',
      '**/interfaces/**',
      '**/composition/**',
      'typeorm',
      'typeorm/*',
      'express',
      'pg',
      'bcrypt',
      'jsonwebtoken',
      'pino',
    ]),
  },
  // Infrastructure cannot import the HTTP delivery layer.
  {
    files: ['src/infrastructure/**/*.ts'],
    rules: onionForbidden(['**/interfaces/**']),
  },
  // Interfaces cannot import infrastructure directly — must go through composition / ports.
  {
    files: ['src/interfaces/**/*.ts'],
    rules: onionForbidden(['**/infrastructure/**']),
  },
  prettier,
);
