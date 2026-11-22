import { config } from 'dotenv';
import { Pool } from 'pg';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const apiDirectory = resolve(scriptDirectory, '..');
const migrationsDirectory = resolve(apiDirectory, 'migrations');

config({ path: resolve(apiDirectory, '.env') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not configured.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
  connectionTimeoutMillis: 10000,
});

async function migrate() {
  const client = await pool.connect();
  let lockAcquired = false;

  try {
    await client.query('SELECT pg_advisory_lock(74120, 261122)');
    lockAcquired = true;

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const files = (await readdir(migrationsDirectory))
      .filter((file) => /^\d{3}_[a-z0-9_-]+\.sql$/i.test(file))
      .sort();

    if (files.length === 0) {
      console.log('No migration files found.');
      return;
    }

    for (const file of files) {
      const existing = await client.query(
        'SELECT id FROM schema_migrations WHERE id = $1',
        [file],
      );

      if (existing.rowCount > 0) {
        console.log(`Already applied: ${file}`);
        continue;
      }

      const sql = await readFile(resolve(migrationsDirectory, file), 'utf8');

      console.log(`Applying: ${file}`);

      await client.query('BEGIN');

      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (id) VALUES ($1)',
          [file],
        );
        await client.query('COMMIT');

        console.log(`Successfully applied: ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    console.log('Database migrations completed.');
  } finally {
    try {
      if (lockAcquired) {
        await client.query('SELECT pg_advisory_unlock(74120, 261122)');
      }
    } finally {
      client.release();
      await pool.end();
    }
  }
}

migrate().catch((error) => {
  console.error('Database migration failed:', error.message);
  process.exitCode = 1;
});

