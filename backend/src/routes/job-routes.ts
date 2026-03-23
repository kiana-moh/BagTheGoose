import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AppServices } from "../bootstrap/build-services.js";

const jobImportSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional(),
  description: z.string().optional(),
  url: z.string().optional(),
  prefilter: z.any().optional()
});

function getBearerToken(authorizationHeader: unknown): string | null {
  if (typeof authorizationHeader !== "string") {
    return null;
  }

  if (!authorizationHeader.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.slice("Bearer ".length);
}

export async function registerJobRoutes(app: FastifyInstance, services: AppServices) {
  app.post("/api/v1/jobs/import", async (request, reply) => {
    const token = getBearerToken(request.headers.authorization);
    if (!token) {
      reply.code(401);
      return { error: "Missing bearer token." };
    }

    const user = await services.extensionAuthService.authenticateAccessToken(token);
    if (!user) {
      reply.code(401);
      return { error: "Invalid or expired extension token." };
    }

    const body = jobImportSchema.parse(request.body);
    const externalSource = deriveExternalSource(body.url);
    const externalJobId = deriveExternalJobId(body.url);
    const persisted = await services.jobsRepository.importJobForUser({
      userId: user.id,
      externalSource,
      externalJobId,
      company: body.company,
      title: body.title,
      location: body.location,
      description: body.description,
      url: body.url
    });

    return {
      imported: true,
      user,
      job: persisted.job,
      trackerItem: persisted.trackerItem
    };
  });
}

function deriveExternalSource(url?: string) {
  if (!url) {
    return "manual";
  }

  if (url.includes("linkedin.com")) {
    return "linkedin";
  }

  return "unknown";
}

function deriveExternalJobId(url?: string) {
  if (!url) {
    return null;
  }

  const match = url.match(/\/jobs\/view\/(\d+)/);
  return match?.[1] ?? null;
}
