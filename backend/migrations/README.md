Migration workflow
==================

Place plain SQL migration files in this directory. Files are applied in lexical order and recorded in the `schema_migrations` table.

Naming convention
-----------------
- YYYYMMDDHHMMSS_description.sql (example: 20250826_001_create_users.sql)

Guidelines
----------
- Keep migrations forward-only.
- Wrap operations in a transaction (BEGIN/COMMIT). If using non-transactional statements (eg CREATE INDEX CONCURRENTLY), document it and ensure the SQL handles ordering.
- Test migrations against staging before merging.

Scripts
-------
- `node ../scripts/new_migration.js <short_description>` — creates a timestamped migration skeleton.
- `node ../scripts/apply_migrations.js` — applies unapplied migrations against the DB configured by `backend/.env`.

CI / Deploy
-----------
Run `node backend/scripts/apply_migrations.js` before starting the application on deploy. This ensures production gets the same schema changes that were applied in staging.
