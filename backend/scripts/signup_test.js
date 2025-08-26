const fetch = require('node-fetch');
const data = { name: 'Test NoCharge', email: 'test+nocharge@example.com', password: 'password', plan: 'individual' };
(async () => {
  const r = await fetch('http://localhost:5001/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const j = await r.json().catch(()=>null);
  console.log('status', r.status);
  console.log('body', j);
})();
