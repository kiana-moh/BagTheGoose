import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { env } from "../config/env.js";
import type { AppServices } from "../bootstrap/build-services.js";

const googleSessionSchema = z.object({
  idToken: z.string().min(1)
});

export async function registerAuthRoutes(app: FastifyInstance, services: AppServices) {
  app.post("/api/v1/auth/google/session", async (request, reply) => {
    const body = googleSessionSchema.parse(request.body);
    const session = await services.googleAuthService.createSessionFromGoogleIdToken(body.idToken);

    reply.setCookie(env.COOKIE_SESSION_NAME, session.sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.COOKIE_SECURE,
      path: "/",
      domain: env.COOKIE_DOMAIN,
      expires: new Date(session.expiresAt)
    });

    return {
      user: session.user,
      expiresAt: session.expiresAt
    };
  });

  app.get("/api/v1/auth/session", async (request, reply) => {
    const user = await services.sessionUserResolver.resolve(request);

    if (!user) {
      reply.code(401);
      return { error: "No active session." };
    }

    return { user };
  });

  app.post("/api/v1/auth/logout", async (request, reply) => {
    const sessionToken = request.cookies[env.COOKIE_SESSION_NAME];
    if (sessionToken) {
      await services.googleAuthService.revokeSessionToken(sessionToken);
    }

    reply.clearCookie(env.COOKIE_SESSION_NAME, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.COOKIE_SECURE,
      path: "/",
      domain: env.COOKIE_DOMAIN
    });

    return { loggedOut: true };
  });
}
