-- Migration: create components table to store per-portfolio component JSON
-- This table allows components to be stored as separate rows and referenced by the portfolios.components JSON mapping

CREATE TABLE IF NOT EXISTS components (
  id SERIAL PRIMARY KEY,
  portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Optionally index by portfolio for faster lookups
CREATE INDEX IF NOT EXISTS idx_components_portfolio_id ON components(portfolio_id);
