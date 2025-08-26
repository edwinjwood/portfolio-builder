#!/usr/bin/env node
/*
  Script: sync_price_map.js
  Purpose: Query Stripe prices and upsert canonical plan -> price_id mappings
  Usage: node backend/scripts/sync_price_map.js
*/

const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');

// Attempt to load backend .env from a few likely locations
const tried = [];
const tryLoad = (p) => {
  tried.push(p);
  try {
    const r = dotenv.config({ path: p });
    if (r.error) return false;
    return true;
  } catch (e) {
    return false;
  }
};

// Common candidates (relative to this script and project root)
const candidates = [
  path.resolve(__dirname, '..', '..', '.env'), // backend/.env
  path.resolve(__dirname, '..', '.env'), // backend/.env alternative
  path.resolve(process.cwd(), 'backend', '.env'),
  path.resolve(process.cwd(), '.env'),
];

for (const c of candidates) tryLoad(c);

const Stripe = require('stripe');
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error('STRIPE_SECRET_KEY not set in backend/.env or process.env. Tried these paths:');
  tried.forEach(p => console.error('  -', p));
  console.error('\nOptions:');
  console.error('  1) Add STRIPE_SECRET_KEY to backend/.env and re-run the script.');
  console.error("  2) Or run the script with the env inline:\n     STRIPE_SECRET_KEY=sk_test_... node backend/scripts/sync_price_map.js");
  console.error('  3) Or export STRIPE_SECRET_KEY in your shell before running.');
  process.exit(1);
}
const stripe = Stripe(stripeKey);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const requiredKeys = ['individual', 'team', 'enterprise'];

function normalize(s) {
  return (s || '').toString().toLowerCase().trim();
}

async function main() {
  try {
    console.log('Fetching Stripe prices...');
    const prices = await stripe.prices.list({ limit: 200, active: true, expand: ['data.product'] });
    const data = prices.data || [];

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

      ['individual', 'team', 'enterprise'].forEach((key) => {
        if (tests.some(t => t.includes(key))) candidates[key].push({ id, recurring, raw: p });
      });
    });

    const choose = (list) => {
      if (!list || list.length === 0) return null;
      const monthly = list.find(l => l.recurring && l.recurring.interval === 'month');
      if (monthly) return monthly.id;
      const anyRec = list.find(l => l.recurring);
      if (anyRec) return anyRec.id;
      return list[0].id;
    };

    const stripeMap = {
      individual: choose(candidates.individual),
      team: choose(candidates.team),
      enterprise: choose(candidates.enterprise),
    };

    console.log('Discovered from Stripe:', stripeMap);

    // Upsert into plan_price_map
    for (const key of requiredKeys) {
      const priceId = stripeMap[key];
      if (!priceId) {
        console.log(`No price discovered for ${key}, skipping.`);
        continue;
      }
      try {
        await pool.query(`
          INSERT INTO plan_price_map (plan_key, price_id, active, updated_at)
          VALUES ($1,$2,true,now())
          ON CONFLICT (plan_key) DO UPDATE SET price_id = EXCLUDED.price_id, active = EXCLUDED.active, updated_at = now()
        `, [key, priceId]);
        console.log(`Upserted ${key} -> ${priceId}`);
      } catch (e) {
        console.warn(`Failed to upsert ${key}:`, e.message);
      }
    }

    console.log('Sync complete.');
  } catch (err) {
    console.error('Sync failed:', err);
  } finally {
    await pool.end();
    process.exit();
  }
}

main();
