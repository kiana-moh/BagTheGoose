import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Database } from "./pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDirectory = path.resolve(__dirname, "../../migrations");

async function migrate() {
  const db = new Database();
  await assertCompatibleSchema(db);
  await db.query(`
    create table if not exists schema_migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const files = (await fs.readdir(migrationsDirectory))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  for (const fileName of files) {
    const alreadyApplied = await db.query<{ id: string }>(
      "select id from schema_migrations where id = $1",
      [fileName]
    );

    if (alreadyApplied.rowCount && alreadyApplied.rowCount > 0) {
      continue;
    }

    const sql = await fs.readFile(path.join(migrationsDirectory, fileName), "utf8");

    await db.transaction(async (client) => {
      await client.query(sql);
      await client.query("insert into schema_migrations (id) values ($1)", [fileName]);
    });

    console.log(`Applied migration ${fileName}`);
  }

  await db.pool.end();
}

async function assertCompatibleSchema(db: Database) {
  const result = await db.query<{
    data_type: string;
    udt_name: string;
  }>(
    `
      select data_type, udt_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'users'
        and column_name = 'id'
      limit 1
    `
  );

  if (!result.rowCount) {
    return;
  }

  const row = result.rows[0];
  const isUuid = row.data_type === "uuid" || row.udt_name === "uuid";
  if (!isUuid) {
    throw new Error(
      [
        "Migration aborted: the existing public.users table is not compatible with the TypeScript backend schema.",
        "The current migration expects users.id to be uuid, but the existing database uses a different type.",
        "Use a fresh Postgres database for the TypeScript backend or perform an explicit legacy-data migration before re-running."
      ].join(" ")
    );
  }
}

void migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
