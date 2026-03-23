# BagTheGoose Backend Architecture

## Current Implementation Status

This document originally described the target backend architecture. The current repo now implements the following production path:

- `web/` is the real web auth entrypoint using Auth.js + Google OAuth
- `backend/` is the real typed API and persistence layer
- `extension/` bootstraps auth from the web app and then uses extension bearer tokens

Important current decisions:

- web auth is Auth.js, not backend-issued Google sessions
- backend trusts authenticated web requests through a signed internal proxy header bridge
- OpenAI is now the real LLM integration path for resume analysis
- LaTeX is the only supported resume source format in V1

## Overview

The backend should own all semantic reasoning, profile building, fit analysis, and tailoring. The extension stays deterministic and lightweight. The backend architecture should separate:

1. API orchestration
2. deterministic business logic
3. LLM reasoning
4. embeddings and vector retrieval
5. persistence

The first production-oriented stack recommendation is:

- Runtime: TypeScript + Node.js
- API framework: Fastify
- Validation: Zod
- Primary database: PostgreSQL
- Vector search: `pgvector` in PostgreSQL
- ORM/query layer: Drizzle or raw SQL for vector operations
- LLM provider abstraction: provider interface with Gemini implementation first
- Embeddings abstraction: provider interface with Gemini embedding implementation first

`pgvector` is the practical first choice because it keeps structured data and vector search in one database, reduces operational complexity, and is enough for early semantic matching. If retrieval scale later outgrows Postgres, the vector layer can switch to Pinecone or Qdrant behind the same abstraction.

## Layering

### 1. API layer

Receives requests, validates input, calls application services, and returns typed results.

### 2. Application services

Own orchestration across deterministic analysis, LLM calls, embeddings, and storage.

### 3. Deterministic domain logic

Owns clear rules:

- LaTeX section extraction
- resume text normalization
- degree and year regex extraction
- hard disqualifier detection
- role-family seed generation
- scraping profile generation

### 4. AI adapters

Owns provider-specific concerns:

- structured generation
- text generation
- embedding generation

### 5. Vector layer

Owns:

- storing embeddings for resumes, role targets, and jobs
- similarity search for semantic matching

## Recommended Folder Structure

```text
backend/
  package.json
  tsconfig.json
  src/
    app.ts
    server.ts
    config/
      env.ts
    domain/
      models.ts
    routes/
      ai-routes.ts
      health-routes.ts
    ai/
      providers/
        llm-provider.ts
        gemini-llm-provider.ts
        mock-llm-provider.ts
      embeddings/
        embedding-provider.ts
        gemini-embedding-provider.ts
        mock-embedding-provider.ts
      prompts/
        resume-analysis.ts
        target-role-inference.ts
        job-fit.ts
        resume-tailoring.ts
      vector/
        vector-store.ts
        in-memory-vector-store.ts
        pgvector-store.ts
    services/
      heuristics.ts
      latex-resume-parser-service.ts
      resume-analysis-service.ts
      target-role-service.ts
      scraping-profile-service.ts
      job-fit-service.ts
      resume-tailoring-service.ts
    bootstrap/
      build-services.ts
```

## Core Services

### `LatexResumeParserService`

Deterministic preprocessing:

- strip LaTeX commands where possible
- extract sections like education, skills, projects, experience
- produce normalized plain text
- surface candidate skills and education lines

### `ResumeAnalysisService`

Builds the canonical structured user profile.

Flow:

1. parse LaTeX deterministically
2. derive deterministic hints
3. call LLM for structured extraction and normalization
4. merge and validate
5. embed profile summary for later retrieval

### `TargetRoleService`

Produces direct and adjacent target roles.

Flow:

1. generate deterministic role seeds from skills and experience
2. search vector index against known role families if available
3. call LLM to infer direct and adjacent opportunities
4. return ranked target roles

### `ScrapingProfileService`

Transforms the resume profile and target roles into a deterministic extension profile:

- desired role keywords
- blocked seniority keywords
- location preferences
- known hard exclusions
- skill hints for coarse filtering

### `JobFitService`

Analyzes one job against one user profile.

Flow:

1. deterministic hard disqualifier scan
2. semantic similarity using embeddings
3. LLM structured fit analysis
4. merge with deterministic evidence
5. return final score, gaps, strengths, and tailoring hooks

### `ResumeTailoringService`

Generates truthful tailoring suggestions only. It should never invent experience.

Outputs:

- bullet-level wording changes
- project ordering suggestions
- skills reordering
- relevance emphasis opportunities
- claims to avoid

## Main Data Models

The first clean model set should include:

- `ParsedResumeDocument`
- `StructuredResumeProfile`
- `TargetRole`
- `ScrapingProfile`
- `JobPosting`
- `HardDisqualifier`
- `JobFitAnalysis`
- `ResumeTailoringPlan`

## LLM Abstraction

Use a provider interface for structured generation:

```ts
interface LLMProvider {
  generateObject<T>(params: GenerateStructuredParams<T>): Promise<T>;
  generateText(params: GenerateTextParams): Promise<string>;
}
```

Important design choices:

- prompts stay outside the provider implementation
- providers receive a schema and return structured JSON
- providers do not own business policy
- provider failure should allow deterministic fallback in non-critical flows

Gemini implementation should use structured JSON output via `responseMimeType: "application/json"` and `responseJsonSchema`. Official Gemini docs support structured JSON responses and embeddings via the REST API:

- https://ai.google.dev/gemini-api/docs/structured-output
- https://ai.google.dev/api/embeddings

## Embeddings and Vector Flow

Recommended initial flow:

1. Build an embedding for the structured resume profile summary
2. Build embeddings for inferred role targets
3. Build an embedding for each job description or normalized job summary
4. Store vectors in Postgres with `pgvector`
5. Run similarity search for:
   - resume to role families
   - resume to jobs
   - job to target roles

Use cases:

- semantic matching beyond keywords
- adjacent opportunity retrieval
- ranking jobs before expensive LLM analysis

## Deterministic vs LLM-Driven Logic

Deterministic:

- LaTeX preprocessing
- section extraction
- regex-based education and grad-year hints
- hard disqualifier detection
- obvious seniority and visa constraints
- extension scraping profile generation

LLM-driven:

- normalizing resume information into a reliable structured profile
- inferring adjacent role families
- nuanced fit reasoning
- evidence-backed strengths and weaknesses
- tailoring suggestions and wording alignment

Embeddings-driven:

- semantic similarity
- retrieval and ranking
- adjacent role discovery support

## Prompt Design Strategy

Each prompt should:

- use a narrow system instruction
- define non-negotiable rules
- require JSON output
- force evidence-based reasoning
- distinguish hard disqualifiers from soft weaknesses
- explicitly forbid inventing experience

### Resume analysis prompt

Goal:

- convert raw resume text into normalized structured profile

Rules:

- only extract supported claims from the resume
- if uncertain, mark confidence lower instead of guessing
- separate observed evidence from inferred patterns

### Target role inference prompt

Goal:

- infer direct and adjacent role targets

Rules:

- ground role suggestions in resume evidence
- separate direct fit from adjacent fit
- include why the role is plausible

### Job fit scoring prompt

Goal:

- evaluate fit for a single job

Rules:

- identify hard disqualifiers explicitly
- do not overstate fit if required skills are missing
- distinguish semantic alignment from strict requirements

### Resume tailoring prompt

Goal:

- produce truthful tailoring edits

Rules:

- never invent projects, skills, degrees, internships, or ownership
- only rephrase, reorder, emphasize, or de-emphasize
- return both recommended edits and prohibited claims

## Implementation Order

1. Establish TypeScript backend scaffold and domain types
2. Add LLM abstraction and Gemini provider
3. Add embedding abstraction and vector store interface
4. Build deterministic LaTeX parser and heuristics
5. Implement resume analysis service
6. Implement target role inference and scraping profile service
7. Implement job fit service with hard disqualifier logic
8. Implement resume tailoring service
9. Add persistence and `pgvector`
10. Connect authenticated user flows and extension profile delivery

## First Version Scope

The first clean version should provide:

- Fastify server scaffold
- provider abstractions
- deterministic resume parsing
- strong prompt modules
- mock and Gemini providers
- in-memory vector store for local development
- AI endpoints for analysis, role inference, fit scoring, tailoring, and scraping profile generation

This keeps the architecture clean while making it possible to iterate before full persistence and auth integration are added.

## Silent Extension Authentication

The extension should not run Google OAuth and should not depend on a visible connect step. The correct production flow is:

1. User signs into the web app
2. The web page checks whether the extension is installed via `runtime.sendMessage`
3. If present, the web page calls a backend prepare endpoint using the authenticated session cookie
4. Backend validates the web session and issues a short-lived one-time bootstrap grant
5. The web page sends that bootstrap grant to the extension via `runtime.sendMessage`
6. The extension exchanges the bootstrap grant for a long-lived extension bearer token
7. The extension stores the bearer token in `chrome.storage.local`
8. Future extension API requests use `Authorization: Bearer <token>`

Why use a short-lived bootstrap grant instead of relying on the extension to send the cookie directly:

- extension-origin requests are cross-site relative to the web app
- browser cookie behavior can block or vary for extension-origin fetches
- the web app is the reliable place to prove the first-party session
- the extension should only receive a scoped post-login grant, not raw session state

Security rules:

- `externally_connectable` must restrict allowed website origins
- `runtime.onMessageExternal` must still validate `sender.url`
- bootstrap grants must be one-time and short-lived
- extension access tokens must be revocable
- future extension API calls should not rely on cookies
