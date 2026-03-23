import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AppServices } from "../bootstrap/build-services.js";

const degreeLevelSchema = z.enum([
  "high_school",
  "bachelors",
  "masters",
  "phd",
  "bootcamp",
  "unknown"
]);

const resumeAnalysisSchema = z.object({
  latexResume: z.string().min(1)
});

const jobPostingSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional(),
  description: z.string().min(1),
  url: z.string().optional()
});

const profileSchema = z.object({
  candidateSummary: z.string(),
  degreeLevel: degreeLevelSchema,
  majors: z.array(z.string()),
  graduationYear: z.number().nullable().optional(),
  education: z.array(z.any()),
  skills: z.array(z.string()),
  technologies: z.array(z.string()),
  domainsOfStrength: z.array(z.string()),
  rolePatterns: z.array(z.string()),
  experience: z.array(z.any()),
  projects: z.array(z.any()),
  evidenceHighlights: z.array(z.string()),
  confidence: z.number()
});

const targetRoleSchema = z.object({
  role: z.string(),
  category: z.enum(["direct", "adjacent", "stretch"]),
  rationale: z.string(),
  confidence: z.number(),
  evidence: z.array(z.string())
});

export async function registerAiRoutes(app: FastifyInstance, services: AppServices) {
  app.post("/api/v1/ai/resume/analyze", async (request, reply) => {
    const user = await services.sessionUserResolver.resolve(request);
    if (!user) {
      reply.code(401);
      return { error: "Not authenticated." };
    }

    const body = resumeAnalysisSchema.parse(request.body);
    return services.resumeAnalysisService.analyze(body.latexResume);
  });

  app.post("/api/v1/ai/roles/infer", async (request, reply) => {
    const user = await services.sessionUserResolver.resolve(request);
    if (!user) {
      reply.code(401);
      return { error: "Not authenticated." };
    }

    const body = z.object({ profile: profileSchema }).parse(request.body);
    const targetRoles = await services.targetRoleService.infer(normalizeProfile(body.profile));
    return { targetRoles };
  });

  app.post("/api/v1/ai/scraping/profile", async (request, reply) => {
    const user = await services.sessionUserResolver.resolve(request);
    if (!user) {
      reply.code(401);
      return { error: "Not authenticated." };
    }

    const body = z
      .object({
        profile: profileSchema,
        targetRoles: z.array(targetRoleSchema)
      })
      .parse(request.body);

    return services.scrapingProfileService.build(normalizeProfile(body.profile), body.targetRoles);
  });

  app.post("/api/v1/ai/jobs/analyze", async (request, reply) => {
    const user = await services.sessionUserResolver.resolve(request);
    if (!user) {
      reply.code(401);
      return { error: "Not authenticated." };
    }

    const body = z
      .object({
        profile: profileSchema,
        job: jobPostingSchema
      })
      .parse(request.body);
    return services.jobFitService.analyze(normalizeProfile(body.profile), body.job);
  });

  app.post("/api/v1/ai/resumes/tailor", async (request, reply) => {
    const user = await services.sessionUserResolver.resolve(request);
    if (!user) {
      reply.code(401);
      return { error: "Not authenticated." };
    }

    const body = z
      .object({
        profile: profileSchema,
        job: jobPostingSchema,
        originalLatexResume: z.string().min(1),
        fitAnalysis: z.any().optional()
      })
      .parse(request.body);
    return services.resumeTailoringService.tailor({
      ...body,
      profile: normalizeProfile(body.profile)
    });
  });
}

function normalizeProfile(profile: z.infer<typeof profileSchema>) {
  return {
    ...profile,
    graduationYear: profile.graduationYear ?? undefined
  };
}
