module.exports = {
  env: { node: true, commonjs: true, jest: true },
  parserOptions: { ecmaVersion: 2020 },
  plugins: ['unused-imports'],
  rules: {
    'no-unused-vars': ['error', { vars: 'all', args: 'after-used', caughtErrors: 'none' }],
    'unused-imports/no-unused-imports': 'error',
    'no-undef': 'off',
    'no-console': 'off',
    'no-empty': 'off'
  }
};
