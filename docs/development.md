# Development Notes

## Active Runtime

The active application path is:

- `web/` for user-facing auth and UI
- `backend/` for API, persistence, and AI
- `extension/` for scraping

The Python FastAPI code is legacy scaffolding and is not the primary runtime for the current product path.

## Authentication

### Web

- Auth.js handles Google OAuth in `web/auth.ts`
- the App Router auth route is `web/app/api/auth/[...nextauth]/route.ts`
- authenticated server code uses `web/lib/auth/session.ts`

### Backend

The backend no longer performs Google OAuth for the web app.

Instead, authenticated requests pass through the Next.js proxy:

- `web/app/api/v1/[...path]/route.ts`

That proxy signs user identity with `AUTH_SECRET`, and the backend verifies it in:

- `backend/src/auth/database-session-user-resolver.ts`

This keeps the browser auth system centralized in the web app while preserving strict backend ownership checks.

## Extension Bootstrap

The extension silent-auth flow depends on the web app and backend both being configured correctly.

Key files:

- `web/extension-auth-bootstrap.ts`
- `web/app/api/v1/[...path]/route.ts`
- `backend/src/routes/extension-auth-routes.ts`
- `extension/background.js`

The web app must forward the browser `Origin` header during bootstrap preparation so the backend can validate the calling web origin. That forwarding is part of the current proxy implementation.

## Database

### Important constraint

The TypeScript backend expects a UUID-based schema.

If you point it at an older database created by the legacy Python backend, migrations can fail because the old `users.id` type may be integer instead of UUID.

The migration runner now stops early with a clear error in that case.

Recommended local setup:

- use a fresh Postgres database dedicated to the TypeScript backend
- run migrations there
- do not reuse the old Python database unless you explicitly write a legacy migration plan

## Environment

Starting points:

- `web/.env.example`
- `backend/.env.example`

Minimum useful local values:

### Web

- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `PG_CONNECTION_STRING`
- `NEXT_PUBLIC_API_BASE_URL`

### Backend

- `PG_CONNECTION_STRING`
- `GOOGLE_CLIENT_ID`
- `AUTH_SECRET`
- `LLM_PROVIDER=openai`
- `OPENAI_API_KEY`

## Verification Checklist

### Web

```bash
cd web
npm install
npm run typecheck
npm run build
```

### Backend

```bash
cd backend
npm install
npm run typecheck
npm run build
node dist/db/migrate.js
```

If migration fails with a schema compatibility error, create a fresh Postgres database and point `PG_CONNECTION_STRING` at it.

## Current verification state

Verified in this repo:

- `web` typecheck passes
- `web` production build passes
- `backend` typecheck passes
- `backend` production build passes

Not fully completed in this environment:

- migration application against a clean Postgres database
- live Google OAuth callback verification
- live OpenAI request verification
- end-to-end extension bootstrap in a browser
