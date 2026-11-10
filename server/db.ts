/** SQLite persistence (node:sqlite). Schema changes are applied through numbered, repeatable migrations. */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const MIGRATIONS: string[] = [
  `CREATE TABLE accounts (account_id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL);
   CREATE TABLE login_codes (email TEXT PRIMARY KEY, code_hash TEXT NOT NULL, expires_at TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
   CREATE TABLE login_requests (email TEXT NOT NULL, requested_at TEXT NOT NULL);
   CREATE INDEX login_requests_email ON login_requests(email, requested_at);
   CREATE TABLE sessions (token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(account_id), created_at TEXT NOT NULL, expires_at TEXT NOT NULL);
   CREATE TABLE orders (
     order_id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(account_id), product_id TEXT NOT NULL, price_version TEXT NOT NULL,
     amount_minor INTEGER NOT NULL, currency TEXT NOT NULL, provider TEXT NOT NULL, environment TEXT NOT NULL,
     provider_order_id TEXT NOT NULL UNIQUE, idempotency_key TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
     UNIQUE (account_id, idempotency_key));
   CREATE TABLE purchases (
     purchase_id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(account_id), product_id TEXT NOT NULL, provider TEXT NOT NULL, environment TEXT NOT NULL,
     order_id TEXT NOT NULL UNIQUE REFERENCES orders(order_id), provider_transaction_id TEXT NOT NULL UNIQUE,
     amount_minor INTEGER NOT NULL, currency TEXT NOT NULL, status TEXT NOT NULL,
     verified_at TEXT, access_starts_at TEXT, access_expires_at TEXT, refunded_at TEXT,
     entitlement_version INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL);
   CREATE INDEX purchases_account ON purchases(account_id);
   CREATE TABLE provider_events (provider TEXT NOT NULL, event_id TEXT NOT NULL, event_type TEXT NOT NULL, outcome TEXT NOT NULL, received_at TEXT NOT NULL, PRIMARY KEY (provider, event_id));
   CREATE TABLE progress_events (seq INTEGER PRIMARY KEY AUTOINCREMENT, account_id TEXT NOT NULL, event_id TEXT NOT NULL UNIQUE, payload TEXT NOT NULL, received_at TEXT NOT NULL);
   CREATE INDEX progress_account ON progress_events(account_id, seq);
   CREATE TABLE sim_orders (provider_order_id TEXT PRIMARY KEY, amount_minor INTEGER NOT NULL, currency TEXT NOT NULL, status TEXT NOT NULL);
   CREATE TABLE sim_payments (provider_payment_id TEXT PRIMARY KEY, provider_order_id TEXT NOT NULL, amount_minor INTEGER NOT NULL, currency TEXT NOT NULL, status TEXT NOT NULL, amount_refunded_minor INTEGER NOT NULL DEFAULT 0);`,
];

export type Db = DatabaseSync;

export function openDb(file: string): Db {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)');
  const applied = new Set((db.prepare('SELECT version FROM schema_migrations').all() as { version: number }[]).map(r => r.version));
  MIGRATIONS.forEach((sql, i) => {
    const version = i + 1;
    if (applied.has(version)) return;
    tx(db, () => { db.exec(sql); db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(version, new Date().toISOString()); });
  });
  return db;
}

/** Runs fn inside one immediate transaction; any throw rolls everything back. */
export function tx<T>(db: Db, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try { const out = fn(); db.exec('COMMIT'); return out; }
  catch (e) { try { db.exec('ROLLBACK'); } catch { /* connection already rolled back */ } throw e; }
}

export const one = <T>(db: Db, sql: string, ...params: (string | number | null)[]): T | undefined => db.prepare(sql).get(...params) as T | undefined;
export const all = <T>(db: Db, sql: string, ...params: (string | number | null)[]): T[] => db.prepare(sql).all(...params) as T[];
export const run = (db: Db, sql: string, ...params: (string | number | null)[]) => db.prepare(sql).run(...params);
