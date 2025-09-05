module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js','**/tests/**/*.spec.js'],
  collectCoverage: true,
  collectCoverageFrom: ['server/**/*.js'],
  coverageDirectory: 'coverage'
};
