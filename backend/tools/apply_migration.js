#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const pool = require('../server/db');

async function main() {
  const arg = process.argv[2] || '';
  if (!arg) {
    console.error('Usage: node apply_migration.js <path-to-sql-file>');
    process.exit(2);
  }
  const filePath = path.resolve(process.cwd(), arg);
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(2);
  }
  const sql = fs.readFileSync(filePath, 'utf8');
  try {
    console.log('Applying migration file:', filePath);
    // Execute the full SQL. The file includes BEGIN/COMMIT so execute as-is.
    await pool.query(sql);
    console.log('Migration applied successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err && (err.stack || err.message || err));
    process.exit(1);
  } finally {
    try { await pool.end(); } catch (e) {}
  }
}

main();
