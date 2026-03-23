import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { env } from "../config/env.js";
import type { AppServices } from "../bootstrap/build-services.js";

const prepareSchema = z.object({
  extensionId: z.string().min(1)
});

const bootstrapSchema = z.object({
  bootstrapToken: z.string().min(1),
  extensionId: z.string().min(1),
  extensionVersion: z.string().min(1).optional(),
  sourceOrigin: z.string().url()
});

const revokeSchema = z.object({
  accessToken: z.string().min(1).optional()
});

export async function registerExtensionAuthRoutes(
  app: FastifyInstance,
  services: AppServices
) {
  app.post("/api/v1/extension/bootstrap/prepare", async (request, reply) => {
    const body = prepareSchema.parse(request.body);
    const user = await services.sessionUserResolver.resolve(request);

    if (!user) {
      reply.code(401);
      return { error: "Not authenticated." };
    }

    const originHeader = request.headers.origin;
    if (typeof originHeader !== "string" || !services.allowedWebOrigins.has(originHeader)) {
      reply.code(403);
      return { error: "Unapproved web origin." };
    }

    const grant = await services.extensionAuthService.issueBootstrapGrant({
      user,
      extensionId: body.extensionId,
      allowedOrigin: originHeader
    });

    return {
      bootstrapToken: grant.bootstrapToken,
      expiresAt: grant.expiresAt,
      apiBaseUrl: env.APP_BASE_URL
    };
  });

  app.post("/api/v1/extension/bootstrap", async (request, reply) => {
    const body = bootstrapSchema.parse(request.body);

    if (!services.allowedWebOrigins.has(body.sourceOrigin)) {
      reply.code(403);
      return { error: "Unapproved source origin." };
    }

    const exchange = await services.extensionAuthService.exchangeBootstrapGrant({
      bootstrapToken: body.bootstrapToken,
      extensionId: body.extensionId,
      sourceOrigin: body.sourceOrigin
    });

    return exchange;
  });

  app.post("/api/v1/extension/tokens/revoke", async (request, reply) => {
    const bearer = request.headers.authorization;
    const body = revokeSchema.parse(request.body ?? {});
    const token =
      body.accessToken ||
      (typeof bearer === "string" && bearer.startsWith("Bearer ")
        ? bearer.slice("Bearer ".length)
        : null);

    if (!token) {
      reply.code(400);
      return { error: "Missing extension access token." };
    }

    await services.extensionAuthService.revokeAccessToken(token);
    return { revoked: true };
  });
}
