import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return value;
}, z.boolean());

const envSchema = z.object({
  PORT: z.coerce.number().default(8000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_BASE_URL: z.string().default("http://127.0.0.1:8000"),
  WEB_APP_ORIGINS: z
    .string()
    .default(
      "https://bagthegoose.com,https://www.bagthegoose.com,http://localhost:3000,http://127.0.0.1:3000"
    ),
  LLM_PROVIDER: z.enum(["mock", "gemini", "openai"]).default("mock"),
  EMBEDDING_PROVIDER: z.enum(["mock", "gemini"]).default("mock"),
  VECTOR_STORE: z.enum(["memory", "pgvector"]).default("memory"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_TEXT_MODEL: z.string().default("gemini-2.5-flash"),
  GEMINI_EMBEDDING_MODEL: z.string().default("gemini-embedding-001"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  PG_CONNECTION_STRING: z.string().min(1, "PG_CONNECTION_STRING is required."),
  COOKIE_SESSION_NAME: z.string().default("btg_session_token"),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: booleanFromEnv.default(false),
  GOOGLE_CLIENT_ID: z.string().optional(),
  AUTH_SECRET: z.string().optional(),
  SESSION_TTL_SECONDS: z.coerce.number().default(60 * 60 * 24 * 14),
  EXTENSION_BOOTSTRAP_TTL_SECONDS: z.coerce.number().default(120),
  EXTENSION_ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().default(2592000)
});

const parsedEnv = envSchema.parse({
  ...process.env,
  PG_CONNECTION_STRING: process.env.PG_CONNECTION_STRING ?? process.env.DATABASE_URL
});

export const env = parsedEnv;
