import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AppServices } from "../bootstrap/build-services.js";

const trackerPatchSchema = z.object({
  status: z.enum(["saved", "applied", "interview", "offer", "rejected"]).optional(),
  matchScore: z.number().nullable().optional(),
  deadline: z.string().datetime().nullable().optional(),
  notes: z.string().nullable().optional()
});

export async function registerTrackerRoutes(app: FastifyInstance, services: AppServices) {
  app.get("/api/v1/tracker", async (request, reply) => {
    const user = await services.sessionUserResolver.resolve(request);
    if (!user) {
      reply.code(401);
      return { error: "Not authenticated." };
    }

    const items = await services.jobsRepository.listTrackerItemsForUser(user.id);
    return { items };
  });

  app.patch("/api/v1/tracker/:trackerItemId", async (request, reply) => {
    const user = await services.sessionUserResolver.resolve(request);
    if (!user) {
      reply.code(401);
      return { error: "Not authenticated." };
    }

    const params = z.object({ trackerItemId: z.string().uuid() }).parse(request.params);
    const body = trackerPatchSchema.parse(request.body);
    const item = await services.jobsRepository.updateTrackerItem({
      userId: user.id,
      trackerItemId: params.trackerItemId,
      status: body.status,
      matchScore: body.matchScore,
      deadline: body.deadline,
      notes: body.notes
    });

    if (!item) {
      reply.code(404);
      return { error: "Tracker item not found." };
    }

    return { item };
  });
}
