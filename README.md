# BagTheGoose

BagTheGoose is an AI-powered internship search system with two product surfaces:

- a Chrome extension that deterministically scrapes and filters jobs
- a web app that owns authentication, resume ingestion, onboarding, tracking, and AI analysis

The current codebase is now centered on:

- `web/`: Next.js App Router frontend with Auth.js
- `backend/`: Fastify + TypeScript API with Postgres persistence
- `extension/`: Manifest V3 Chrome extension

## Current Architecture

### Web

- Next.js App Router
- Auth.js with Google OAuth
- TanStack Query
- typed internal API proxy routes under `web/app/api`

### Backend

- Fastify
- raw SQL + Postgres
- DB-backed ownership for users, resumes, onboarding, jobs, tracker items, extension bootstrap grants, and extension access tokens
- provider-swappable LLM layer
- OpenAI support for structured resume analysis

### Extension

- deterministic LinkedIn scraping and filtering
- silent account bootstrap from the authenticated web app
- bearer-token API auth after bootstrap

## Auth Model

### Web auth

The web app is the source of truth for user auth.

1. User signs in through Auth.js Google OAuth.
2. On successful sign-in, the Google identity is upserted into `users`.
3. Auth.js session callbacks attach the DB user id to `session.user.id`.
4. Server components and route handlers use `auth()` through `web/lib/auth/session.ts`.

### Backend auth

The backend does not perform Google OAuth for the web app anymore.

Instead:

1. Next.js route handlers proxy authenticated requests to the backend.
2. The proxy signs the current user identity with `AUTH_SECRET`.
3. The backend verifies that signature before resolving the authenticated user.

This keeps auth centralized in the web app while the backend still enforces real user ownership.

### Extension auth

The extension still uses its own revocable bearer token after bootstrap:

1. authenticated web app calls `/api/v1/extension/bootstrap/prepare`
2. backend creates a short-lived bootstrap grant
3. web page sends the grant to the extension
4. extension exchanges the grant for a long-lived extension access token

## Resume Model

V1 resume ingestion is LaTeX-only.

- canonical field: `latexContent`
- no PDF support
- no Word support
- no preview renderer
- no rich text editor

The canonical flow is:

1. user pastes LaTeX into the web app
2. web app submits to backend
3. backend performs deterministic parsing + structured LLM analysis
4. canonical resume and extracted JSON are stored in Postgres

## LLM Model

The backend owns all LLM usage.

- default provider path for real integration: OpenAI
- default model: `gpt-4.1-mini`
- configuration:
  - `LLM_PROVIDER=openai`
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL` optional

Current implemented capability:

- structured resume analysis

## Environment Setup

Use the example env files as the starting point:

- `web/.env.example`
- `backend/.env.example`
- full local setup guide: `docs/setup-and-run.md`

Required values:

- `PG_CONNECTION_STRING`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `AUTH_SECRET`
- `OPENAI_API_KEY`

Recommended backend values:

- `LLM_PROVIDER=openai`
- `OPENAI_MODEL=gpt-4.1-mini`

## Local Startup

### 1. Install dependencies

```bash
cd web && npm install
cd ../backend && npm install
```

### 2. Run migrations

```bash
cd backend
npm run migrate
```

### 3. Start backend

```bash
cd backend
npm run dev
```

### 4. Start web app

```bash
cd web
npm run dev
```

### 5. Load extension

1. Open `chrome://extensions`
2. Enable Developer mode
3. Load unpacked `extension/`

## Important Paths

- Auth.js config: `web/auth.ts`
- Auth route: `web/app/api/auth/[...nextauth]/route.ts`
- Auth helpers: `web/lib/auth/session.ts`
- Web->backend proxy: `web/app/api/v1/[...path]/route.ts`
- Backend user resolution: `backend/src/auth/database-session-user-resolver.ts`
- OpenAI provider: `backend/src/ai/providers/openai-llm-provider.ts`
- Resume analysis route: `web/app/api/resume/analyze/route.ts`

## What Is Already Real

- DB schema and migrations
- DB-backed user ownership
- Auth.js Google OAuth
- session-aware protected routing
- real frontend API integration
- extension bootstrap token persistence
- OpenAI-backed resume analysis path

## What Still Needs Verification In A Live Environment

- Google OAuth callback flow with your real Google project config
- Postgres connectivity and migrations on your machine
- end-to-end resume analysis against a real OpenAI key
- extension bootstrap in the same browser profile as the web app

## Notes

- The old backend-issued Google session routes are no longer part of the main web auth flow.
- The Python backend files are legacy scaffolding and are not the active architecture for the current app path.
