import { Pool, type PoolConfig } from "pg";

let pool: Pool | null = null;

export function getDbPool() {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.PG_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error("PG_CONNECTION_STRING is required.");
  }

  const config: PoolConfig = {
    connectionString
  };

  if (process.env.NODE_ENV === "production") {
    config.ssl = { rejectUnauthorized: false };
  }

  pool = new Pool(config);
  return pool;
}
