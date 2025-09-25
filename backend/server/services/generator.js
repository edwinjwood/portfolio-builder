const path = require('path');
const { spawnSync } = require('child_process');

// Optional LLM-backed text generation for bullets/summary.
// Provider is selected by env:
// - GENERATOR_PROVIDER=python | http | none
// - LLM_MODEL (e.g., google/flan-t5-small)
// - LLM_API_URL (for http provider)
// - LLM_TIMEOUT_MS (default 20000)

async function generateViaHttp(payload) {
  const url = process.env.LLM_API_URL;
  if (!url) throw new Error('LLM_API_URL not set');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`HTTP provider failed: ${res.status} ${t}`);
  }
  // Expect either { bullets:[], summary:"..." } or { text:"..." }
  const data = await res.json().catch(() => ({}));
  if (Array.isArray(data.bullets) || typeof data.summary === 'string') return data;
  if (typeof data.text === 'string') {
    const bullets = data.text.split('\n').map(s => s.replace(/^[-•\s]+/, '').trim()).filter(Boolean).slice(0, 6);
    const summary = bullets.shift() || '';
    return { bullets, summary };
  }
  return { bullets: [], summary: '' };
}

function generateViaPython(payload) {
  const script = path.resolve(__dirname, '..', 'tools', 'llm_generate_t5.py');
  const env = { ...process.env };
  const timeout = Number(process.env.LLM_TIMEOUT_MS || 20000);
  const p = spawnSync('python3', [script], { input: JSON.stringify(payload), encoding: 'utf-8', timeout });
  if (p.error && p.error.code === 'ETIMEDOUT') throw new Error('python generator timed out');
  if (p.status !== 0) throw new Error(p.stderr || p.stdout || 'python generator failed');
  try {
    const out = JSON.parse(p.stdout || '{}');
    if (!out || typeof out !== 'object') return { bullets: [], summary: '' };
    return {
      bullets: Array.isArray(out.bullets) ? out.bullets.filter(Boolean).slice(0, 8) : [],
      summary: typeof out.summary === 'string' ? out.summary : '',
    };
  } catch (e) {
    return { bullets: [], summary: '' };
  }
}

async function generateText({ rawText, domain, present = [], missing = [], topGood = [], profile = {} }) {
  const provider = (process.env.GENERATOR_PROVIDER || 'none').toLowerCase();
  if (provider === 'none') return { bullets: [], summary: '' };

  // Build a compact payload the providers can use to craft prompts
  const payload = {
    task: 'resume_optimize',
    domain: domain || 'generic',
    present: (present || []).map(String).slice(0, 50),
    missing: (missing || []).map(String).slice(0, 50),
    topGood: (topGood || []).map(String).slice(0, 50),
    text: String(rawText || '').slice(0, 8000),
    profile: {
      title: profile?.target_title || null,
      industry: profile?.target_industry || null,
      strengths: profile?.strengths || null,
      degree: profile?.degree || null,
    },
    model: process.env.LLM_MODEL || 'google/flan-t5-small',
    max_new_tokens: Number(process.env.LLM_MAX_NEW_TOKENS || 256)
  };

  try {
    if (provider === 'http') return await generateViaHttp(payload);
    if (provider === 'python') return generateViaPython(payload);
  } catch (e) {
    // Fall through to noop
  }
  return { bullets: [], summary: '' };
}

module.exports = { generateText };