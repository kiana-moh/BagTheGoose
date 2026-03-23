import type { FastifyInstance } from "fastify";
import type { AppServices } from "../bootstrap/build-services.js";

export async function registerDashboardRoutes(app: FastifyInstance, services: AppServices) {
  app.get("/api/v1/dashboard/summary", async (request, reply) => {
    const user = await services.sessionUserResolver.resolve(request);
    if (!user) {
      reply.code(401);
      return { error: "Not authenticated." };
    }

    const [resume, onboardingProfile, trackerItems] = await Promise.all([
      services.resumesRepository.findByUserId(user.id),
      services.onboardingProfilesRepository.findByUserId(user.id),
      services.jobsRepository.listTrackerItemsForUser(user.id)
    ]);

    const activeItems = trackerItems.filter((item) => item.status !== "rejected").length;
    const appliedItems = trackerItems.filter((item) => item.status === "applied").length;

    return {
      summaryCards: [
        {
          label: "Resume status",
          value: resume?.parseStatus ?? "missing",
          detail: resume ? "Canonical LaTeX resume is stored." : "No canonical LaTeX resume yet."
        },
        {
          label: "Onboarding",
          value: onboardingProfile?.completedAt ? "Complete" : "Incomplete",
          detail: onboardingProfile?.completedAt
            ? "Targeting preferences are on file."
            : "Preferences still need completion."
        },
        {
          label: "Tracker items",
          value: String(trackerItems.length),
          detail: `${activeItems} active, ${appliedItems} applied`
        }
      ],
      recentActivity: trackerItems.slice(0, 5).map((item) => ({
        id: item.id,
        title: `${item.company} - ${item.title}`,
        detail: `Tracker status: ${item.status}`,
        timestamp: item.updatedAt
      })),
      recommendedActions: [
        !resume
          ? {
              id: "resume-missing",
              title: "Add your LaTeX resume",
              description: "Upload the canonical source before AI analysis can run."
            }
          : null,
        !onboardingProfile?.completedAt
          ? {
              id: "onboarding-incomplete",
              title: "Finish onboarding",
              description: "Complete preferences so the scraper and matcher can tighten targeting."
            }
          : null
      ].filter(Boolean)
    };
  });
}
