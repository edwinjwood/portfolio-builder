const http = require('http');
const { app } = require('./server/index');

const server = app.listen(0, async () => {
  const port = server.address().port;
  console.log('Test server running on', port);

  const body = JSON.stringify({ name: 'Tmp User', email: `tmp+${Date.now()}@example.com`, password: 'Password123!', plan: 'individual' });

  try {
    const res = await new Promise((resolve, reject) => {
      const req = http.request({ hostname: '127.0.0.1', port, path: '/api/users', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk.toString());
        res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
    console.log('Response:', res.statusCode, res.body);
  } catch (err) {
    console.error('Request error:', err && (err.stack || err.message || err));
  } finally {
    server.close();
  }
});
