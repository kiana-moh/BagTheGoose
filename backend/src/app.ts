import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { buildServices } from "./bootstrap/build-services.js";
import { env } from "./config/env.js";
import { registerAiRoutes } from "./routes/ai-routes.js";
import { registerDashboardRoutes } from "./routes/dashboard-routes.js";
import { registerExtensionAuthRoutes } from "./routes/extension-auth-routes.js";
import { registerHealthRoutes } from "./routes/health-routes.js";
import { registerJobRoutes } from "./routes/job-routes.js";
import { registerOnboardingRoutes } from "./routes/onboarding-routes.js";
import { registerProfileRoutes } from "./routes/profile-routes.js";
import { registerResumeRoutes } from "./routes/resume-routes.js";
import { registerTrackerRoutes } from "./routes/tracker-routes.js";

export async function buildApp() {
  const app = Fastify({
    logger: true
  });

  const allowedWebOrigins = new Set(
    env.WEB_APP_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
  );

  await app.register(cookie);
  await app.register(cors, {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      callback(null, allowedWebOrigins.has(origin));
    },
    credentials: true
  });

  const services = buildServices();

  await registerHealthRoutes(app);
  await registerAiRoutes(app, services);
  await registerProfileRoutes(app, services);
  await registerResumeRoutes(app, services);
  await registerOnboardingRoutes(app, services);
  await registerDashboardRoutes(app, services);
  await registerTrackerRoutes(app, services);
  await registerExtensionAuthRoutes(app, services);
  await registerJobRoutes(app, services);

  return app;
}
