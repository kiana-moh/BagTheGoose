import { env } from "../config/env.js";
import { DatabaseSessionUserResolver } from "../auth/database-session-user-resolver.js";
import { GoogleAuthService } from "../auth/google-auth-service.js";
import { PersistentExtensionAuthService } from "../auth/persistent-extension-auth-service.js";
import { GeminiEmbeddingProvider } from "../ai/embeddings/gemini-embedding-provider.js";
import { MockEmbeddingProvider } from "../ai/embeddings/mock-embedding-provider.js";
import { GeminiLLMProvider } from "../ai/providers/gemini-llm-provider.js";
import { MockLLMProvider } from "../ai/providers/mock-llm-provider.js";
import { OpenAILLMProvider } from "../ai/providers/openai-llm-provider.js";
import { InMemoryVectorStore } from "../ai/vector/in-memory-vector-store.js";
import { PgVectorStore } from "../ai/vector/pgvector-store.js";
import { Database } from "../db/pool.js";
import { ExtensionAuthRepository } from "../repositories/extension-auth-repository.js";
import { JobsRepository } from "../repositories/jobs-repository.js";
import { OnboardingProfilesRepository } from "../repositories/onboarding-profiles-repository.js";
import { ResumesRepository } from "../repositories/resumes-repository.js";
import { UserSessionsRepository } from "../repositories/user-sessions-repository.js";
import { UsersRepository } from "../repositories/users-repository.js";
import { JobFitService } from "../services/job-fit-service.js";
import { LatexResumeParserService } from "../services/latex-resume-parser-service.js";
import { ResumeAnalysisService } from "../services/resume-analysis-service.js";
import { ResumeTailoringService } from "../services/resume-tailoring-service.js";
import { ScrapingProfileService } from "../services/scraping-profile-service.js";
import { TargetRoleService } from "../services/target-role-service.js";

export function buildServices() {
  const allowedWebOrigins = new Set(
    env.WEB_APP_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
  );
  const database = new Database();

  const llmProvider =
    env.LLM_PROVIDER === "openai"
      ? new OpenAILLMProvider({
          apiKey: env.OPENAI_API_KEY,
          model: env.OPENAI_MODEL
        })
      : env.LLM_PROVIDER === "gemini"
        ? new GeminiLLMProvider({
            apiKey: env.GEMINI_API_KEY,
            model: env.GEMINI_TEXT_MODEL
          })
      : new MockLLMProvider();

  const embeddingProvider =
    env.EMBEDDING_PROVIDER === "gemini"
      ? new GeminiEmbeddingProvider({
          apiKey: env.GEMINI_API_KEY,
          model: env.GEMINI_EMBEDDING_MODEL,
          outputDimensionality: 768
        })
      : new MockEmbeddingProvider();

  const vectorStore =
    env.VECTOR_STORE === "pgvector"
      ? new PgVectorStore({ connectionString: env.PG_CONNECTION_STRING })
      : new InMemoryVectorStore();

  const parser = new LatexResumeParserService();
  const usersRepository = new UsersRepository(database);
  const userSessionsRepository = new UserSessionsRepository(database);
  const resumesRepository = new ResumesRepository(database);
  const onboardingProfilesRepository = new OnboardingProfilesRepository(database);
  const extensionAuthRepository = new ExtensionAuthRepository(database);
  const jobsRepository = new JobsRepository(database);
  const googleAuthService = new GoogleAuthService(usersRepository, userSessionsRepository, {
    googleClientId: env.GOOGLE_CLIENT_ID,
    sessionTtlSeconds: env.SESSION_TTL_SECONDS
  });
  const sessionUserResolver = new DatabaseSessionUserResolver(googleAuthService, usersRepository, {
    cookieName: env.COOKIE_SESSION_NAME,
    authSecret: env.AUTH_SECRET
  });
  const extensionAuthService = new PersistentExtensionAuthService(
    extensionAuthRepository,
    usersRepository,
    {
      bootstrapTtlSeconds: env.EXTENSION_BOOTSTRAP_TTL_SECONDS,
      accessTokenTtlSeconds: env.EXTENSION_ACCESS_TOKEN_TTL_SECONDS
    }
  );

  return {
    allowedWebOrigins,
    database,
    llmProvider,
    embeddingProvider,
    vectorStore,
    parser,
    usersRepository,
    userSessionsRepository,
    resumesRepository,
    onboardingProfilesRepository,
    extensionAuthRepository,
    jobsRepository,
    googleAuthService,
    sessionUserResolver,
    extensionAuthService,
    resumeAnalysisService: new ResumeAnalysisService(
      parser,
      llmProvider,
      embeddingProvider,
      vectorStore
    ),
    targetRoleService: new TargetRoleService(llmProvider, embeddingProvider, vectorStore),
    scrapingProfileService: new ScrapingProfileService(),
    jobFitService: new JobFitService(llmProvider, embeddingProvider),
    resumeTailoringService: new ResumeTailoringService(llmProvider)
  };
}

export type AppServices = ReturnType<typeof buildServices>;
