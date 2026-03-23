import type { Database } from "../db/pool.js";
import type {
  AuthenticatedUser,
  ExtensionAccessTokenRecord,
  ExtensionBootstrapGrant
} from "../domain/models.js";

function mapBootstrapGrant(row: {
  id: string;
  user_id: string;
  token_hash: string;
  extension_id: string;
  allowed_origin: string;
  expires_at: string;
  consumed_at: string | null;
  created_at: string;
}): ExtensionBootstrapGrant {
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    extensionId: row.extension_id,
    allowedOrigin: row.allowed_origin,
    expiresAt: row.expires_at,
    usedAt: row.consumed_at ?? undefined,
    createdAt: row.created_at
  };
}

function mapAccessToken(row: {
  id: string;
  user_id: string;
  token_hash: string;
  extension_id: string;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
}): ExtensionAccessTokenRecord {
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    extensionId: row.extension_id,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at ?? undefined
  };
}

export class ExtensionAuthRepository {
  constructor(private readonly db: Database) {}

  async createBootstrapGrant(input: {
    userId: string;
    tokenHash: string;
    extensionId: string;
    allowedOrigin: string;
    expiresAt: string;
  }): Promise<ExtensionBootstrapGrant> {
    const result = await this.db.query<{
      id: string;
      user_id: string;
      token_hash: string;
      extension_id: string;
      allowed_origin: string;
      expires_at: string;
      consumed_at: string | null;
      created_at: string;
    }>(
      `
        insert into scraper_bootstrap_grants (user_id, token_hash, extension_id, allowed_origin, expires_at)
        values ($1, $2, $3, $4, $5)
        returning *
      `,
      [input.userId, input.tokenHash, input.extensionId, input.allowedOrigin, input.expiresAt]
    );

    return mapBootstrapGrant(result.rows[0]);
  }

  async findActiveBootstrapGrantByTokenHash(tokenHash: string): Promise<ExtensionBootstrapGrant | null> {
    const result = await this.db.query<{
      id: string;
      user_id: string;
      token_hash: string;
      extension_id: string;
      allowed_origin: string;
      expires_at: string;
      consumed_at: string | null;
      created_at: string;
    }>(
      `
        select *
        from scraper_bootstrap_grants
        where token_hash = $1
          and consumed_at is null
          and expires_at > now()
        limit 1
      `,
      [tokenHash]
    );

    if (!result.rowCount) {
      return null;
    }

    return mapBootstrapGrant(result.rows[0]);
  }

  async consumeBootstrapGrant(id: string): Promise<void> {
    await this.db.query("update scraper_bootstrap_grants set consumed_at = now() where id = $1", [id]);
  }

  async createAccessToken(input: {
    userId: string;
    tokenHash: string;
    extensionId: string;
    expiresAt: string;
  }): Promise<ExtensionAccessTokenRecord> {
    const result = await this.db.query<{
      id: string;
      user_id: string;
      token_hash: string;
      extension_id: string;
      created_at: string;
      expires_at: string;
      revoked_at: string | null;
    }>(
      `
        insert into extension_access_tokens (user_id, token_hash, extension_id, expires_at)
        values ($1, $2, $3, $4)
        returning *
      `,
      [input.userId, input.tokenHash, input.extensionId, input.expiresAt]
    );

    return mapAccessToken(result.rows[0]);
  }

  async findAuthenticatedUserByAccessTokenHash(tokenHash: string): Promise<AuthenticatedUser | null> {
    const result = await this.db.query<{
      id: string;
      email: string;
      name: string | null;
    }>(
      `
        select u.id, u.email, u.name
        from extension_access_tokens t
        inner join users u on u.id = t.user_id
        where t.token_hash = $1
          and t.revoked_at is null
          and t.expires_at > now()
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

  async revokeAccessTokenByHash(tokenHash: string): Promise<void> {
    await this.db.query(
      "update extension_access_tokens set revoked_at = now() where token_hash = $1 and revoked_at is null",
      [tokenHash]
    );
  }
}
