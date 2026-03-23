import { createHmac, timingSafeEqual } from "node:crypto";
import type { FastifyRequest } from "fastify";
import type { AuthenticatedUser } from "../domain/models.js";
import type { SessionUserResolver } from "./session-user-resolver.js";
import type { GoogleAuthService } from "./google-auth-service.js";
import type { UsersRepository } from "../repositories/users-repository.js";

interface DatabaseSessionUserResolverOptions {
  cookieName: string;
  authSecret?: string;
  maxSignatureAgeSeconds?: number;
}

export class DatabaseSessionUserResolver implements SessionUserResolver {
  private readonly cookieName: string;
  private readonly authSecret?: string;
  private readonly maxSignatureAgeSeconds: number;

  constructor(
    private readonly googleAuthService: GoogleAuthService,
    private readonly usersRepository: UsersRepository,
    options: DatabaseSessionUserResolverOptions
  ) {
    this.cookieName = options.cookieName;
    this.authSecret = options.authSecret;
    this.maxSignatureAgeSeconds = options.maxSignatureAgeSeconds ?? 300;
  }

  async resolve(request: FastifyRequest): Promise<AuthenticatedUser | null> {
    const proxiedUser = await this.resolveTrustedProxyUser(request);
    if (proxiedUser) {
      return proxiedUser;
    }

    const sessionToken = request.cookies[this.cookieName];
    if (!sessionToken) {
      return null;
    }

    return this.googleAuthService.resolveAuthenticatedUserFromSessionToken(sessionToken);
  }

  private async resolveTrustedProxyUser(request: FastifyRequest): Promise<AuthenticatedUser | null> {
    if (!this.authSecret) {
      return null;
    }

    const userId = headerValue(request.headers["x-btg-auth-user-id"]);
    const email = headerValue(request.headers["x-btg-auth-user-email"]) ?? "";
    const timestamp = headerValue(request.headers["x-btg-auth-timestamp"]);
    const signature = headerValue(request.headers["x-btg-auth-signature"]);

    if (!userId || !timestamp || !signature) {
      return null;
    }

    const timestampNumber = Number(timestamp);
    if (!Number.isFinite(timestampNumber)) {
      return null;
    }

    const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - timestampNumber);
    if (ageSeconds > this.maxSignatureAgeSeconds) {
      return null;
    }

    const payload = `${userId}:${email}:${timestamp}`;
    const expectedSignature = createHmac("sha256", this.authSecret).update(payload).digest("hex");
    if (
      signature.length !== expectedSignature.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    ) {
      return null;
    }

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      return null;
    }

    if (email && user.email !== email) {
      return null;
    }

    return this.usersRepository.toAuthenticatedUser(user);
  }
}

function headerValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return typeof value === "string" ? value : null;
}
