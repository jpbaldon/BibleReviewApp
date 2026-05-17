#!/usr/bin/env node
/**
 * Creates a new blank Supabase migration file with a timestamp prefix.
 *
 * Usage:
 *   node scripts/new-migration.js <migration_name>
 *
 * Example:
 *   node scripts/new-migration.js add_verse_reviews_table
 *
 * This produces a file like:
 *   supabase/migrations/20260505123045_add_verse_reviews_table.sql
 */

const fs = require('fs');
const path = require('path');

const name = process.argv[2];

if (!name) {
  console.error('Error: migration name is required.');
  console.error('Usage: node scripts/new-migration.js <migration_name>');
  process.exit(1);
}

// Sanitize: lowercase, replace spaces/hyphens with underscores, strip unsafe chars
const safeName = name
  .toLowerCase()
  .replace(/[\s-]+/g, '_')
  .replace(/[^a-z0-9_]/g, '');

if (!safeName) {
  console.error('Error: migration name is invalid after sanitization.');
  process.exit(1);
}

// Build a UTC timestamp in the format YYYYMMDDHHMMSS
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const timestamp =
  now.getUTCFullYear().toString() +
  pad(now.getUTCMonth() + 1) +
  pad(now.getUTCDate()) +
  pad(now.getUTCHours()) +
  pad(now.getUTCMinutes()) +
  pad(now.getUTCSeconds());

const filename = `${timestamp}_${safeName}.sql`;
const migrationsDir = path.resolve(__dirname, '..', 'supabase', 'migrations');
const filepath = path.join(migrationsDir, filename);

if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

const template = `-- =============================================================================
-- Migration: ${safeName.replace(/_/g, ' ')}
-- Created: ${now.toISOString()}
-- Description: TODO
-- =============================================================================

`;

fs.writeFileSync(filepath, template, 'utf8');
console.log(`Created migration: supabase/migrations/${filename}`);
