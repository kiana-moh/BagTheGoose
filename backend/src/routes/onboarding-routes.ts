import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AppServices } from "../bootstrap/build-services.js";

const onboardingSchema = z.object({
  academicInfoJson: z.record(z.any()).default({}),
  preferencesJson: z.record(z.any()).default({}),
  skillsReviewJson: z.record(z.any()).default({}),
  completedAt: z.string().datetime().nullable().optional()
});

export async function registerOnboardingRoutes(app: FastifyInstance, services: AppServices) {
  app.get("/api/v1/onboarding-profile", async (request, reply) => {
    const user = await services.sessionUserResolver.resolve(request);
    if (!user) {
      reply.code(401);
      return { error: "Not authenticated." };
    }

    const profile = await services.onboardingProfilesRepository.findByUserId(user.id);
    return { onboardingProfile: profile };
  });

  app.put("/api/v1/onboarding-profile", async (request, reply) => {
    const user = await services.sessionUserResolver.resolve(request);
    if (!user) {
      reply.code(401);
      return { error: "Not authenticated." };
    }

    const body = onboardingSchema.parse(request.body);
    const onboardingProfile = await services.onboardingProfilesRepository.upsert({
      userId: user.id,
      academicInfoJson: body.academicInfoJson,
      preferencesJson: body.preferencesJson,
      skillsReviewJson: body.skillsReviewJson,
      completedAt: body.completedAt ?? null
    });

    return { onboardingProfile };
  });
}
