import type { FastifyRequest } from "fastify";
import type { AuthenticatedUser } from "../domain/models.js";

export interface SessionUserResolver {
  resolve(request: FastifyRequest): Promise<AuthenticatedUser | null>;
}
