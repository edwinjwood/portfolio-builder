Run the sync script to populate the `plan_price_map` table from Stripe prices.

Usage:

1. Ensure `backend/.env` contains `STRIPE_SECRET_KEY` and `DATABASE_URL`.
2. From project root run:

   node backend/scripts/sync_price_map.js

The script will discover prices by product metadata (metadata.plan) or by product/nickname matching and upsert them into the `plan_price_map` table.
