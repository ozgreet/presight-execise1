#!/bin/sh
set -e

echo "→ Running database migrations..."
npx node-pg-migrate up --migrations-dir migrations

echo "→ Seeding database (skips if users already exist)..."
node dist/db/seed.js

echo "→ Starting API on port ${PORT:-3001}..."
exec node dist/index.js
