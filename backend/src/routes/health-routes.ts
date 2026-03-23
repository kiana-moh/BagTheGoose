import type { FastifyInstance } from "fastify";

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({
    status: "ok",
    service: "bagthegoose-backend",
    timestamp: new Date().toISOString()
  }));
}
