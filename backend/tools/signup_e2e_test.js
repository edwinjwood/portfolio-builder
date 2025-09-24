// Simple signup e2e test - posts to backend /api/users and prints response
const fetchImpl = global.fetch || require('node-fetch');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
(async () => {
  const api = process.env.API_URL || 'http://localhost:5001';
  const email = `test+stripe+${Date.now()}@example.com`;
  const body = { name: 'E2E Test', email, password: 'Password123!', plan: 'individual' };
  try {
const res = await fetchImpl(`${api}/api/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const data = await res.json();
    console.log('status', res.status);
    console.dir(data, { depth: 4 });
  } catch (err) {
    console.error('failed', err);
  }
})();
