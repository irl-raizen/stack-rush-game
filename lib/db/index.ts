import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

export const pool = new Pool({ connectionString: process.env.DATABASE_URL })
export const db = drizzle(pool, { schema })
export { schema }

export type Database = typeof db

const globalForDb = globalThis as unknown as { __stackRushPool?: Pool }
globalForDb.__stackRushPool ??= pool
