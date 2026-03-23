import type { QueryResultRow } from "pg";
import { getDbPool } from "@/lib/db";

type UserRow = QueryResultRow & {
  id: string;
  email: string;
  name: string | null;
  auth_provider: string;
  auth_provider_user_id: string;
  created_at: string;
  updated_at: string;
};

export type AuthDbUser = {
  id: string;
  email: string;
  name: string | null;
  authProvider: string;
  authProviderUserId: string;
  createdAt: string;
  updatedAt: string;
};

function mapUser(row: UserRow): AuthDbUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    authProvider: row.auth_provider,
    authProviderUserId: row.auth_provider_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function upsertGoogleUser(input: {
  email: string;
  name: string | null;
  authProviderUserId: string;
}) {
  const pool = getDbPool();
  const result = await pool.query<UserRow>(
    `
      insert into users (email, name, auth_provider, auth_provider_user_id)
      values ($1, $2, 'google', $3)
      on conflict (auth_provider, auth_provider_user_id)
      do update set
        email = excluded.email,
        name = excluded.name,
        updated_at = now()
      returning *
    `,
    [input.email, input.name, input.authProviderUserId]
  );

  return mapUser(result.rows[0]);
}

export async function findUserById(userId: string) {
  const pool = getDbPool();
  const result = await pool.query<UserRow>("select * from users where id = $1 limit 1", [userId]);
  return result.rowCount ? mapUser(result.rows[0]) : null;
}

export async function findUserByEmail(email: string) {
  const pool = getDbPool();
  const result = await pool.query<UserRow>("select * from users where email = $1 limit 1", [email]);
  return result.rowCount ? mapUser(result.rows[0]) : null;
}
