// Simple helper to create a timestamped migration file skeleton
const fs = require('fs');
const path = require('path');

const migrationsDir = path.resolve(__dirname, '..', 'migrations');
if (!fs.existsSync(migrationsDir)) fs.mkdirSync(migrationsDir, { recursive: true });

const name = process.argv[2] || 'new_migration';
const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14); // YYYYMMDDHHMMSS
const fileName = `${ts}_${name}.sql`;
const filePath = path.join(migrationsDir, fileName);

const template = `-- ${fileName}
-- Describe: 
BEGIN;

-- Write your ALTER / CREATE statements here

COMMIT;
`;

fs.writeFileSync(filePath, template);
console.log('Created migration', filePath);
