const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');

// Load backend .env (try project root 'backend/.env' first, then server/.env) so this
// module works no matter who requires it first (scripts may require this file directly).
try {
	const envPaths = [path.resolve(__dirname, '..', '..', '.env'), path.resolve(__dirname, '..', '.env')];
	for (const p of envPaths) {
		try {
			const r = dotenv.config({ path: p });
			if (!r.error) {
				// loaded one .env file successfully
				break;
			}
		} catch (e) {
			// ignore and try next
		}
	}
} catch (e) {
	// ignore
}

// Ensure DATABASE_URL has no leading/trailing whitespace or stray newlines.
const conn = (process.env.DATABASE_URL || '').toString().trim();
const poolConfig = { connectionString: conn };

// If connecting to a remote host (not localhost), enable SSL with relaxed verification
// which is commonly required by hosted providers like Railway.
if (conn && !conn.includes('localhost') && !conn.includes('127.0.0.1')) {
	poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

module.exports = pool;
