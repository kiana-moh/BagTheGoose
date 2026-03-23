import { createHash, randomBytes } from "node:crypto";
import type { AuthenticatedUser } from "../domain/models.js";
import type { ExtensionAuthRepository } from "../repositories/extension-auth-repository.js";
import type { UsersRepository } from "../repositories/users-repository.js";

interface PersistentExtensionAuthServiceOptions {
  bootstrapTtlSeconds: number;
  accessTokenTtlSeconds: number;
}

export class PersistentExtensionAuthService {
  private readonly bootstrapTtlSeconds: number;
  private readonly accessTokenTtlSeconds: number;

  constructor(
    private readonly extensionAuthRepository: ExtensionAuthRepository,
    private readonly usersRepository: UsersRepository,
    options: PersistentExtensionAuthServiceOptions
  ) {
    this.bootstrapTtlSeconds = options.bootstrapTtlSeconds;
    this.accessTokenTtlSeconds = options.accessTokenTtlSeconds;
  }

  async issueBootstrapGrant(input: {
    user: AuthenticatedUser;
    extensionId: string;
    allowedOrigin: string;
  }) {
    const bootstrapToken = `btg_boot_${randomBytes(24).toString("base64url")}`;
    const tokenHash = hashToken(bootstrapToken);
    const expiresAt = new Date(Date.now() + this.bootstrapTtlSeconds * 1000).toISOString();

    await this.extensionAuthRepository.createBootstrapGrant({
      userId: input.user.id,
      tokenHash,
      extensionId: input.extensionId,
      allowedOrigin: input.allowedOrigin,
      expiresAt
    });

    return {
      bootstrapToken,
      expiresAt
    };
  }

  async exchangeBootstrapGrant(input: {
    bootstrapToken: string;
    extensionId: string;
    sourceOrigin: string;
  }) {
    const grant = await this.extensionAuthRepository.findActiveBootstrapGrantByTokenHash(
      hashToken(input.bootstrapToken)
    );

    if (!grant) {
      throw new Error("Bootstrap token is invalid.");
    }

    if (grant.extensionId !== input.extensionId) {
      throw new Error("Bootstrap token was not issued for this extension.");
    }

    if (grant.allowedOrigin !== input.sourceOrigin) {
      throw new Error("Bootstrap token origin mismatch.");
    }

    await this.extensionAuthRepository.consumeBootstrapGrant(grant.id);

    const accessToken = `btg_ext_${randomBytes(32).toString("base64url")}`;
    const expiresAt = new Date(Date.now() + this.accessTokenTtlSeconds * 1000).toISOString();
    await this.extensionAuthRepository.createAccessToken({
      userId: grant.userId,
      tokenHash: hashToken(accessToken),
      extensionId: input.extensionId,
      expiresAt
    });

    const user = await this.usersRepository.findById(grant.userId);
    if (!user) {
      throw new Error("User for bootstrap grant no longer exists.");
    }

    return {
      accessToken,
      expiresAt,
      user: this.usersRepository.toAuthenticatedUser(user)
    };
  }

  async authenticateAccessToken(token: string): Promise<AuthenticatedUser | null> {
    return this.extensionAuthRepository.findAuthenticatedUserByAccessTokenHash(hashToken(token));
  }

  async revokeAccessToken(token: string): Promise<void> {
    await this.extensionAuthRepository.revokeAccessTokenByHash(hashToken(token));
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
