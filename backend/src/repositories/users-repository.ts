import type { PoolClient, QueryResult, QueryResultRow } from "pg";
import type { Database } from "../db/pool.js";
import type { AuthenticatedUser, UserRecord } from "../domain/models.js";

type Queryable = {
  query<R extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<R>>;
};

function mapUser(row: {
  id: string;
  email: string;
  name: string | null;
  auth_provider: string;
  auth_provider_user_id: string;
  created_at: string;
  updated_at: string;
}): UserRecord {
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

export class UsersRepository {
  constructor(private readonly db: Database) {}

  async upsertByAuthProvider(
    input: {
      email: string;
      name?: string | null;
      authProvider: string;
      authProviderUserId: string;
    },
    queryable?: Queryable
  ): Promise<UserRecord> {
    const executor = queryable ?? this.db;
    const result = await executor.query<{
      id: string;
      email: string;
      name: string | null;
      auth_provider: string;
      auth_provider_user_id: string;
      created_at: string;
      updated_at: string;
    }>(
      `
        insert into users (email, name, auth_provider, auth_provider_user_id)
        values ($1, $2, $3, $4)
        on conflict (auth_provider, auth_provider_user_id)
        do update set
          email = excluded.email,
          name = excluded.name,
          updated_at = now()
        returning *
      `,
      [input.email, input.name ?? null, input.authProvider, input.authProviderUserId]
    );

    return mapUser(result.rows[0]);
  }

  async findById(userId: string): Promise<UserRecord | null> {
    const result = await this.db.query<{
      id: string;
      email: string;
      name: string | null;
      auth_provider: string;
      auth_provider_user_id: string;
      created_at: string;
      updated_at: string;
    }>("select * from users where id = $1", [userId]);

    if (!result.rowCount) {
      return null;
    }

    return mapUser(result.rows[0]);
  }

  toAuthenticatedUser(user: UserRecord): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name ?? undefined
    };
  }
}
