import { createHash, randomBytes } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import type { AuthenticatedUser } from "../domain/models.js";
import type { UserSessionsRepository } from "../repositories/user-sessions-repository.js";
import type { UsersRepository } from "../repositories/users-repository.js";

interface GoogleAuthServiceOptions {
  googleClientId?: string;
  sessionTtlSeconds: number;
}

export class GoogleAuthService {
  private readonly client: OAuth2Client;
  private readonly googleClientId?: string;
  private readonly sessionTtlSeconds: number;

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly sessionsRepository: UserSessionsRepository,
    options: GoogleAuthServiceOptions
  ) {
    this.googleClientId = options.googleClientId;
    this.sessionTtlSeconds = options.sessionTtlSeconds;
    this.client = new OAuth2Client(options.googleClientId);
  }

  async createSessionFromGoogleIdToken(idToken: string): Promise<{
    user: AuthenticatedUser;
    sessionToken: string;
    expiresAt: string;
  }> {
    if (!this.googleClientId) {
      throw new Error("GOOGLE_CLIENT_ID is not configured.");
    }

    const ticket = await this.client.verifyIdToken({
      idToken,
      audience: this.googleClientId
    });

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      throw new Error("Google token payload is missing required user fields.");
    }

    const user = await this.usersRepository.upsertByAuthProvider({
      email: payload.email,
      name: payload.name ?? null,
      authProvider: "google",
      authProviderUserId: payload.sub
    });

    const sessionToken = `btg_sess_${randomBytes(32).toString("base64url")}`;
    const expiresAt = new Date(Date.now() + this.sessionTtlSeconds * 1000).toISOString();

    await this.sessionsRepository.create({
      userId: user.id,
      tokenHash: hashToken(sessionToken),
      expiresAt
    });

    return {
      user: this.usersRepository.toAuthenticatedUser(user),
      sessionToken,
      expiresAt
    };
  }

  async resolveAuthenticatedUserFromSessionToken(token: string): Promise<AuthenticatedUser | null> {
    const tokenHash = hashToken(token);
    const user = await this.sessionsRepository.findAuthenticatedUserByTokenHash(tokenHash);
    if (user) {
      await this.sessionsRepository.touch(tokenHash);
    }
    return user;
  }

  async revokeSessionToken(token: string): Promise<void> {
    await this.sessionsRepository.revokeByTokenHash(hashToken(token));
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
