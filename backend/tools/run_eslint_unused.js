const fs = require('fs');
const path = require('path');
const { ESLint } = require('eslint');

(async function main() {
  try {
    const backendRoot = path.resolve(__dirname, '..');
    const eslint = new ESLint({
      cwd: backendRoot,
      useEslintrc: false,
      overrideConfig: {
        env: { node: true, commonjs: true, jest: true },
        parserOptions: { ecmaVersion: 2020 },
        rules: {
          'no-unused-vars': 'error'
        }
      }
    });

    const patterns = ['server/**/*.js', 'scripts/**/*.js', 'tools/**/*.js'];
    console.log('Running ESLint on patterns:', patterns.join(', '));
    const results = await eslint.lintFiles(patterns);
    const formatter = await eslint.loadFormatter('json');
    const resultText = formatter.format(results);
    const outPath = path.join(__dirname, 'eslint_unused_programmatic.json');
    fs.writeFileSync(outPath, resultText);
    console.log('Wrote', outPath);
  } catch (err) {
    console.error('ESLint programmatic run failed:', err && (err.stack || err.message || err));
    process.exit(1);
  }
})();
