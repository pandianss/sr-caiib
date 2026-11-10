/**
 * Minimal durable key-value backend with atomic multi-table batches.
 * IndexedDB implements it in the browser; MemoryBackend is used by tests and as a storage-error fallback probe.
 */
export const TABLES = ['kv', 'packs', 'events', 'attempts', 'bookmarks', 'positions', 'sessions'] as const;
export type TableName = typeof TABLES[number];
export type Op = { table: TableName; key: string } & ({ type: 'put'; value: unknown } | { type: 'delete' });

export interface Backend {
  get<T>(table: TableName, key: string): Promise<T | undefined>;
  getAll<T>(table: TableName): Promise<T[]>;
  /** Applies every operation or none. */
  batch(ops: Op[]): Promise<void>;
}

export class StorageError extends Error {
  readonly kind: 'quota' | 'unavailable' | 'failed';
  constructor(kind: 'quota' | 'unavailable' | 'failed', message: string) { super(message); this.name = 'StorageError'; this.kind = kind; }
}

/** In-memory backend. Values are stored as JSON so mutation after a put cannot leak into storage. */
export class MemoryBackend implements Backend {
  readonly data: Map<TableName, Map<string, string>>;
  failNextBatch: StorageError | null = null;
  constructor(shared?: Map<TableName, Map<string, string>>) {
    this.data = shared ?? new Map(TABLES.map(t => [t, new Map<string, string>()]));
  }
  private table(name: TableName): Map<string, string> {
    let t = this.data.get(name);
    if (!t) { t = new Map(); this.data.set(name, t); }
    return t;
  }
  async get<T>(table: TableName, key: string): Promise<T | undefined> {
    const raw = this.table(table).get(key);
    return raw === undefined ? undefined : JSON.parse(raw) as T;
  }
  async getAll<T>(table: TableName): Promise<T[]> { return [...this.table(table).values()].map(v => JSON.parse(v) as T); }
  async batch(ops: Op[]): Promise<void> {
    if (this.failNextBatch) { const e = this.failNextBatch; this.failNextBatch = null; throw e; }
    const staged = ops.map(op => (op.type === 'put' ? { ...op, json: JSON.stringify(op.value) } : { ...op, json: '' }));
    for (const op of staged) { if (op.type === 'put') this.table(op.table).set(op.key, op.json); else this.table(op.table).delete(op.key); }
  }
}

const DB_NAME = 'caiib-learning';
const DB_VERSION = 1;

function wrap(e: unknown): StorageError {
  const name = (e as { name?: string } | null)?.name ?? '';
  if (name === 'QuotaExceededError') return new StorageError('quota', 'Device storage is full.');
  return new StorageError('failed', (e as Error | null)?.message ?? 'Storage request failed.');
}

export class IdbBackend implements Backend {
  private db: Promise<IDBDatabase> | null = null;
  private readonly factory: IDBFactory;
  private readonly name: string;
  constructor(factory?: IDBFactory, name = DB_NAME) {
    const f = factory ?? (typeof indexedDB !== 'undefined' ? indexedDB : undefined);
    if (!f) throw new StorageError('unavailable', 'IndexedDB is not available in this browser.');
    this.factory = f; this.name = name;
  }
  private open(): Promise<IDBDatabase> {
    this.db ??= new Promise<IDBDatabase>((resolve, reject) => {
      const req = this.factory.open(this.name, DB_VERSION);
      req.onupgradeneeded = () => {
        // Version 1: one out-of-line-key object store per table. Later versions must migrate explicitly.
        for (const t of TABLES) if (!req.result.objectStoreNames.contains(t)) req.result.createObjectStore(t);
      };
      req.onsuccess = () => { req.result.onversionchange = () => req.result.close(); resolve(req.result); };
      req.onerror = () => reject(new StorageError('unavailable', req.error?.message ?? 'Could not open local storage.'));
      req.onblocked = () => reject(new StorageError('unavailable', 'Local storage is blocked by another open tab.'));
    });
    return this.db;
  }
  async get<T>(table: TableName, key: string): Promise<T | undefined> {
    const db = await this.open();
    return new Promise<T | undefined>((resolve, reject) => {
      const req = db.transaction(table, 'readonly').objectStore(table).get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(wrap(req.error));
    });
  }
  async getAll<T>(table: TableName): Promise<T[]> {
    const db = await this.open();
    return new Promise<T[]>((resolve, reject) => {
      const req = db.transaction(table, 'readonly').objectStore(table).getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(wrap(req.error));
    });
  }
  async batch(ops: Op[]): Promise<void> {
    if (!ops.length) return;
    const db = await this.open();
    const tables = [...new Set(ops.map(o => o.table))];
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(tables, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(wrap(tx.error));
      tx.onabort = () => reject(wrap(tx.error));
      try {
        for (const op of ops) {
          const store = tx.objectStore(op.table);
          if (op.type === 'put') store.put(op.value, op.key); else store.delete(op.key);
        }
      } catch (e) { try { tx.abort(); } catch { /* already aborted */ } reject(wrap(e)); }
    });
  }
}
