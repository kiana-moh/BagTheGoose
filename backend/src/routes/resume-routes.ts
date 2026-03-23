import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AppServices } from "../bootstrap/build-services.js";

const saveResumeSchema = z.object({
  latexContent: z.string().min(1),
  sourceType: z.enum(["pasted", "uploaded"]).default("pasted"),
  fileName: z.string().optional()
});

export async function registerResumeRoutes(app: FastifyInstance, services: AppServices) {
  app.get("/api/v1/resume", async (request, reply) => {
    const user = await services.sessionUserResolver.resolve(request);
    if (!user) {
      reply.code(401);
      return { error: "Not authenticated." };
    }

    const resume = await services.resumesRepository.findByUserId(user.id);
    return { resume };
  });

  app.post("/api/v1/resume", async (request, reply) => {
    const user = await services.sessionUserResolver.resolve(request);
    if (!user) {
      reply.code(401);
      return { error: "Not authenticated." };
    }

    const body = saveResumeSchema.parse(request.body);
    const analyzed = await services.resumeAnalysisService.analyze(body.latexContent);
    const resume = await services.resumesRepository.upsert({
      userId: user.id,
      latexContent: body.latexContent,
      sourceType: body.sourceType,
      fileName: body.fileName,
      parseStatus: "ready",
      extractedJson: analyzed as unknown as Record<string, unknown>
    });

    return { resume, extractedProfile: analyzed };
  });
}
