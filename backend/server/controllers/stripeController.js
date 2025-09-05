const pool = require('../db');
const stripeClient = require('../services/stripeClient');
module.exports.getPrices = async (req, res) => {
  const stripe = stripeClient.getStripe();
  if (!stripe) {
    console.warn('Stripe not configured for prices.');
    return res.status(503).json({ error: 'Payments not configured.' });
  }
  try {
    const prices = await stripe.prices.list({ limit: 100, active: true, expand: ['data.product'] });
    const mapped = prices.data.map(p => ({
      id: p.id,
      unit_amount: p.unit_amount,
      currency: p.currency,
      recurring: p.recurring || null,
      nickname: p.nickname || null,
      product: p.product ? { id: p.product.id, name: p.product.name, description: p.product.description } : null
    }));
    const fallbackEnvPrices = [];
    if (process.env.PRICE_ID_INDIVIDUAL) fallbackEnvPrices.push({ id: process.env.PRICE_ID_INDIVIDUAL, unit_amount: null, currency: 'usd', recurring: null, nickname: null, product: { id: null, name: 'Individual' } });
    if (process.env.PRICE_ID_TEAM) fallbackEnvPrices.push({ id: process.env.PRICE_ID_TEAM, unit_amount: null, currency: 'usd', recurring: null, nickname: null, product: { id: null, name: 'Team' } });
    if (process.env.PRICE_ID_ENTERPRISE) fallbackEnvPrices.push({ id: process.env.PRICE_ID_ENTERPRISE, unit_amount: null, currency: 'usd', recurring: null, nickname: null, product: { id: null, name: 'Enterprise' } });
    const merged = mapped.slice();
    for (const fp of fallbackEnvPrices) if (!merged.find(m => m.id === fp.id)) merged.push(fp);
    res.json(merged);
  } catch (err) {
    console.error('Failed to fetch Stripe prices', err);
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
};

module.exports.getPriceMap = async (req, res) => {
  const stripe = stripeClient.getStripe();
  if (!stripe) return res.status(503).json({ error: 'Payments not configured.' });
  try {
    const dbMap = {};
    try {
      const r = await pool.query('SELECT plan_key, price_id FROM plan_price_map WHERE active = true');
      r.rows.forEach(row => { if (row.plan_key && row.price_id) dbMap[row.plan_key.toLowerCase()] = row.price_id; });
    } catch (dbErr) { console.warn('plan_price_map read failed or not present:', dbErr.message); }
    const requiredKeys = ['individual','team','enterprise'];
    const hasAll = requiredKeys.every(k => !!dbMap[k]);
    if (hasAll) return res.json(dbMap);
    const prices = await stripe.prices.list({ limit: 200, active: true, expand: ['data.product'] });
    const data = prices.data || [];
    const normalize = (s) => (s || '').toString().toLowerCase().trim();
    const candidates = { individual: [], team: [], enterprise: [] };
    data.forEach((p) => {
      const prod = p.product || {};
      const prodName = prod.name ? normalize(prod.name) : '';
      const nick = p.nickname ? normalize(p.nickname) : '';
      const planTag = prod.metadata && prod.metadata.plan ? normalize(prod.metadata.plan) : null;
      const id = p.id;
      const recurring = p.recurring || null;
      const tests = [];
      if (planTag) tests.push(planTag);
      if (prodName) tests.push(prodName);
      if (nick) tests.push(nick);
      ['individual','team','enterprise'].forEach((key) => { if (tests.some(t => t.includes(key))) candidates[key].push({ id, recurring, raw: p }); });
    });
    const choose = (list) => { if (!list || list.length === 0) return null; const monthly = list.find(l => l.recurring && l.recurring.interval === 'month'); if (monthly) return monthly.id; const anyRec = list.find(l => l.recurring); if (anyRec) return anyRec.id; return list[0].id; };
    const stripeMap = { individual: choose(candidates.individual) || null, team: choose(candidates.team) || null, enterprise: choose(candidates.enterprise) || null };
    const finalMap = {};
    for (const key of requiredKeys) finalMap[key] = dbMap[key] || stripeMap[key] || process.env[`PRICE_ID_${key.toUpperCase()}`] || null;
    try {
      for (const key of requiredKeys) {
        const priceId = finalMap[key]; if (!priceId) continue; if (dbMap[key] && dbMap[key] === priceId) continue;
        await pool.query(`INSERT INTO plan_price_map (plan_key, price_id, active, updated_at) VALUES ($1,$2,true,now()) ON CONFLICT (plan_key) DO UPDATE SET price_id = EXCLUDED.price_id, active = EXCLUDED.active, updated_at = now()`, [key, priceId]);
      }
    } catch (upErr) { console.warn('Failed to upsert plan_price_map entries:', upErr.message); }
    res.json(finalMap);
  } catch (err) {
    console.error('Failed to build price map', err);
    res.status(500).json({ error: 'Failed to build price map' });
  }
};
