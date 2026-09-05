/**
 * ESLint Configuration (shared across monorepo)
 *
 * Enforces code quality rules for both server (CommonJS) and client (ESM/React).
 */

module.exports = {
  root: true,
  env: {
    node: true,
    es2024: true,
    browser: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-console': ['warn', { allow: ['error'] }],
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-var': 'error',
    'prefer-const': 'error',
    eqeqeq: ['error', 'always'],
    curly: ['error', 'all'],
  },
  overrides: [
    {
      // Server uses CommonJS (require/module.exports)
      files: ['server/**/*.js'],
      parserOptions: {
        sourceType: 'script',
      },
      env: {
        node: true,
        browser: false,
      },
    },
    {
      // Client uses ESM + React/JSX
      files: ['client/**/*.{js,jsx}'],
      plugins: ['react', 'react-hooks'],
      extends: ['plugin:react/recommended', 'plugin:react-hooks/recommended'],
      settings: {
        react: {
          version: 'detect',
        },
      },
      rules: {
        'react/react-in-jsx-scope': 'off', // Not needed with React 18
        'react/prop-types': 'off', // Using Zod for validation instead
      },
    },
    {
      // Test files
      files: ['**/*.test.{js,jsx}', '**/*.spec.{js,jsx}'],
      env: {
        jest: true,
      },
    },
  ],
};
