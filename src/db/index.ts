import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type DB = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { pool?: Pool; db?: DB };

function createDb(): DB {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. On Vercel, connect a Neon database from the project's Storage tab.");
  }
  const pool = globalForDb.pool ?? new Pool({ connectionString: url, max: 5 });
  globalForDb.pool = pool;
  return drizzle(pool, { schema });
}

/** Created on first use, so importing this module never needs the database (e.g. during build). */
export const db: DB = new Proxy({} as DB, {
  get(_target, prop) {
    globalForDb.db ??= createDb();
    const value = Reflect.get(globalForDb.db, prop);
    return typeof value === "function" ? value.bind(globalForDb.db) : value;
  },
});

export { schema };
