import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

// Flat config for monorepo: frontend (browser, React) + backend (Node/Express)
export default defineConfig([
  // Ignore generated/legacy output that shouldn't be linted
  globalIgnores([
    '**/node_modules/**',
    'frontend/dist/**',
    '**/coverage/**',
    'backend/migrations/**',
    'backend/scripts/**',
  ]),

  // Frontend (Vite + React)
  {
    files: ['frontend/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      parserOptions: { ecmaFeatures: { jsx: true } },
      sourceType: 'module',
      globals: {
        ...globals.browser,
        // Allow bundler-style globals commonly used in legacy code
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
      },
    },
    rules: {
      // Allow underscore-prefixed unused args and uppercase consts (e.g., env flags)
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^[A-Z_]' }],
      // Legacy codebase has many empty catch blocks - allow them for now
      'no-empty': 'off',
      // Allow undefined globals (legacy compatibility)
      'no-undef': 'warn',
      // Be lenient on legacy try/catch patterns in UI code
      'no-useless-catch': 'warn',
      // Temporarily demote strict hooks errors to warnings while we refactor
      'react-hooks/rules-of-hooks': 'warn',
      // React refresh warnings are not actionable in this codebase
      'react-refresh/only-export-components': 'warn',
    },
  },

  // Backend (Node.js/Express, CommonJS allowed)
  {
    files: ['backend/**/*.js', 'backend/**/*.cjs'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      // Most backend files use CommonJS; treat as scripts by default
      sourceType: 'script',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^[A-Z_]' }],
      // Legacy backend has many empty catch blocks and constant conditions
      'no-empty': 'off',
      'no-constant-condition': 'warn',
      'no-useless-escape': 'warn',
      'no-redeclare': 'warn',
      'no-useless-catch': 'warn',
      // Allow temporarily while we reduce no-undef across legacy code
      'no-undef': 'warn',
    },
  },

  // Node-only config files inside frontend (e.g., Vite)
  {
    files: ['frontend/vite.config.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },

  // Tests (Jest)
  {
    files: ['**/*.test.js', '**/__tests__/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
])
