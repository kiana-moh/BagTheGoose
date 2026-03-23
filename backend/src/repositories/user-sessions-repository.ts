import type { PoolClient, QueryResult, QueryResultRow } from "pg";
import type { Database } from "../db/pool.js";
import type { AuthenticatedUser, UserSessionRecord } from "../domain/models.js";

type Queryable = {
  query<R extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<R>>;
};

function mapSession(row: {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
  last_seen_at: string | null;
}): UserSessionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at
  };
}

export class UserSessionsRepository {
  constructor(private readonly db: Database) {}

  async create(
    input: {
      userId: string;
      tokenHash: string;
      expiresAt: string;
    },
    queryable?: Queryable
  ): Promise<UserSessionRecord> {
    const executor = queryable ?? this.db;
    const result = await executor.query<{
      id: string;
      user_id: string;
      token_hash: string;
      expires_at: string;
      revoked_at: string | null;
      created_at: string;
      last_seen_at: string | null;
    }>(
      `
        insert into user_sessions (user_id, token_hash, expires_at)
        values ($1, $2, $3)
        returning *
      `,
      [input.userId, input.tokenHash, input.expiresAt]
    );

    return mapSession(result.rows[0]);
  }

  async findAuthenticatedUserByTokenHash(tokenHash: string): Promise<AuthenticatedUser | null> {
    const result = await this.db.query<{
      id: string;
      email: string;
      name: string | null;
    }>(
      `
        select u.id, u.email, u.name
        from user_sessions s
        inner join users u on u.id = s.user_id
        where s.token_hash = $1
          and s.revoked_at is null
          and s.expires_at > now()
        limit 1
      `,
      [tokenHash]
    );

    if (!result.rowCount) {
      return null;
    }

    return {
      id: result.rows[0].id,
      email: result.rows[0].email,
      name: result.rows[0].name ?? undefined
    };
  }

  async touch(tokenHash: string): Promise<void> {
    await this.db.query(
      "update user_sessions set last_seen_at = now() where token_hash = $1 and revoked_at is null",
      [tokenHash]
    );
  }

  async revokeByTokenHash(tokenHash: string): Promise<void> {
    await this.db.query("update user_sessions set revoked_at = now() where token_hash = $1", [tokenHash]);
  }
}
