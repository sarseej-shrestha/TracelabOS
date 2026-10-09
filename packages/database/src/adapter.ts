import { AsyncLocalStorage } from 'node:async_hooks';
import type { DB } from './local.ts';
export type Value = string | number | null | Uint8Array;
export type Row = Record<string, unknown>;
export interface Executor {
  query(sql: string, values: Value[]): Promise<Row[]>;
}
export interface Driver extends Executor {
  kind: string;
  transaction<T>(
    fn: (executor: Executor) => Promise<T>,
    write: boolean,
  ): Promise<T>;
  close(): Promise<void>;
}
/** One context per request/transaction; concurrent requests never borrow each other's client. */
export class Database {
  private context = new AsyncLocalStorage<Executor>();
  constructor(private driver: Driver) {}
  get kind() {
    return this.driver.kind;
  }
  prepare(sql: string) {
    const all = (...values: Value[]) =>
      (this.context.getStore() ?? this.driver).query(sql, values);
    return {
      all,
      get: async (...values: Value[]) => (await all(...values))[0],
      run: async (...values: Value[]) => {
        await all(...values);
      },
    };
  }
  transaction<T>(fn: () => Promise<T>, write = true): Promise<T> {
    if (this.context.getStore()) return fn();
    return this.driver.transaction(
      (executor) => this.context.run(executor, fn),
      write,
    );
  }
  close() {
    return this.driver.close();
  }
}
/** FIFO exclusion for SQLite's single connection, including transactions that await I/O. */
export class Mutex {
  private tail: Promise<void> = Promise.resolve();
  async run<T>(fn: () => Promise<T>): Promise<T> {
    const previous = this.tail;
    let release!: () => void;
    this.tail = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await fn();
    } finally {
      release();
    }
  }
}
const adapters = new WeakMap<DB, Database>();
export function asDatabase(input: DB | Database): Database {
  if (input instanceof Database) return input;
  const existing = adapters.get(input);
  if (existing) return existing;
  const mutex = new Mutex();
  const executor: Executor = {
    query: async (sql, values) => input.prepare(sql).all(...values),
  };
  const result = new Database({
    kind: 'local-sqlite',
    query: (sql, values) => mutex.run(() => executor.query(sql, values)),
    transaction: (fn) =>
      mutex.run(async () => {
        input.exec('BEGIN IMMEDIATE');
        try {
          const value = await fn(executor);
          input.exec('COMMIT');
          return value;
        } catch (error) {
          input.exec('ROLLBACK');
          throw error;
        }
      }),
    close: async () => {
      input.close();
    },
  });
  adapters.set(input, result);
  return result;
}
export const transaction = <T>(db: Database, fn: () => Promise<T>) =>
  db.transaction(fn);
/** Application SQL uses positional ? values; quoted literals/identifiers are preserved. */
export function postgresParameters(sql: string): string {
  let index = 0;
  return sql.replace(/'(?:''|[^'])*'|"(?:""|[^"])*"|\?/g, (token) =>
    token === '?' ? `$${++index}` : token,
  );
}
