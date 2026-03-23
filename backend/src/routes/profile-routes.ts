import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AppServices } from "../bootstrap/build-services.js";

const profilePatchSchema = z.object({
  user: z
    .object({
      name: z.string().min(1).optional()
    })
    .optional(),
  academicInfoJson: z.record(z.any()).optional(),
  preferencesJson: z.record(z.any()).optional(),
  skillsReviewJson: z.record(z.any()).optional(),
  tailoringPreferences: z.array(z.string()).optional()
});

export async function registerProfileRoutes(app: FastifyInstance, services: AppServices) {
  app.get("/api/v1/me", async (request, reply) => {
    const user = await services.sessionUserResolver.resolve(request);
    if (!user) {
      reply.code(401);
      return { error: "Not authenticated." };
    }

    return { user };
  });

  app.get("/api/v1/profile", async (request, reply) => {
    const user = await services.sessionUserResolver.resolve(request);
    if (!user) {
      reply.code(401);
      return { error: "Not authenticated." };
    }

    const [userRecord, resume, onboardingProfile] = await Promise.all([
      services.usersRepository.findById(user.id),
      services.resumesRepository.findByUserId(user.id),
      services.onboardingProfilesRepository.findByUserId(user.id)
    ]);

    return {
      user: userRecord ? services.usersRepository.toAuthenticatedUser(userRecord) : user,
      resume,
      onboardingProfile
    };
  });

  app.patch("/api/v1/profile", async (request, reply) => {
    const user = await services.sessionUserResolver.resolve(request);
    if (!user) {
      reply.code(401);
      return { error: "Not authenticated." };
    }

    const body = profilePatchSchema.parse(request.body);
    const existingUser = await services.usersRepository.findById(user.id);
    if (!existingUser) {
      reply.code(404);
      return { error: "User not found." };
    }

    if (body.user?.name) {
      await services.usersRepository.upsertByAuthProvider({
        email: existingUser.email,
        name: body.user.name,
        authProvider: existingUser.authProvider,
        authProviderUserId: existingUser.authProviderUserId
      });
    }

    if (body.academicInfoJson || body.preferencesJson || body.skillsReviewJson) {
      const existingOnboarding =
        (await services.onboardingProfilesRepository.findByUserId(user.id)) ?? null;
      await services.onboardingProfilesRepository.upsert({
        userId: user.id,
        academicInfoJson: body.academicInfoJson ?? existingOnboarding?.academicInfoJson ?? {},
        preferencesJson: body.preferencesJson ?? existingOnboarding?.preferencesJson ?? {},
        skillsReviewJson: body.skillsReviewJson ?? existingOnboarding?.skillsReviewJson ?? {},
        completedAt: existingOnboarding?.completedAt ?? null
      });
    }

    const [updatedUser, resume, onboardingProfile] = await Promise.all([
      services.usersRepository.findById(user.id),
      services.resumesRepository.findByUserId(user.id),
      services.onboardingProfilesRepository.findByUserId(user.id)
    ]);

    return {
      user: updatedUser ? services.usersRepository.toAuthenticatedUser(updatedUser) : user,
      resume,
      onboardingProfile
    };
  });
}
