-- Migration: create payments table
-- Run this with psql or your migration tool against the project's DATABASE_URL

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  stripe_id VARCHAR(255) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'usd',
  status VARCHAR(50) NOT NULL,
  payment_method VARCHAR(255),
  receipt_email VARCHAR(255),
  description TEXT,
  metadata JSONB,
  raw_event JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_id ON payments(stripe_id);
