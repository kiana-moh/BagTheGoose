# Setup And Run

## Default Ports

These are the intended default local ports:

- web app: `3000`
- backend API: `8000`
- Postgres: `5432`

These are the original/default ports in the current setup.

## Temporary Port Change That Happened

During verification, the web app started on `3001` once because `3000` was already in use by another local process.

What changed temporarily:

- the Next.js dev server auto-selected `3001`
- I temporarily added `http://localhost:3001` and `http://127.0.0.1:3001` to `WEB_APP_ORIGINS` in `backend/.env`

Why:

- extension bootstrap preparation validates the calling web origin
- if the web app runs on `3001`, the backend must explicitly allow that origin

What has been reverted:

- `backend/.env` is back to the original/default local web origins for `3000`

So the intended local setup is again:

- web app on `3000`
- backend on `8000`

If your port `3000` is busy again in the future, either:

1. stop the process using `3000`, which is preferred
2. or temporarily add `3001` back into `WEB_APP_ORIGINS`

## Required Local Files

You should have:

- `web/.env.local`
- `backend/.env`

## Required Environment Variables

### `web/.env.local`

```env
AUTH_SECRET=your_shared_auth_secret
GOOGLE_CLIENT_ID=379749067588-oadu6ahd9r09cffcft6qhng0a6djl7vf.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
PG_CONNECTION_STRING=postgresql://localhost/bagthegoose_ts

NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_BAGTHEGOOSE_EXTENSION_ID=
```

Notes:

- `AUTH_SECRET` must match the backend `AUTH_SECRET`
- `NEXT_PUBLIC_BAGTHEGOOSE_EXTENSION_ID` is only needed when you want silent web-to-extension bootstrap to work locally

### `backend/.env`

```env
PORT=8000
NODE_ENV=development
APP_BASE_URL=http://127.0.0.1:8000
WEB_APP_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://bagthegoose.com,https://www.bagthegoose.com

PG_CONNECTION_STRING=postgresql://localhost/bagthegoose_ts

LLM_PROVIDER=openai
EMBEDDING_PROVIDER=mock
VECTOR_STORE=memory

OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4.1-mini

GOOGLE_CLIENT_ID=379749067588-oadu6ahd9r09cffcft6qhng0a6djl7vf.apps.googleusercontent.com
AUTH_SECRET=your_shared_auth_secret

COOKIE_SESSION_NAME=btg_session_token
COOKIE_DOMAIN=
COOKIE_SECURE=false

SESSION_TTL_SECONDS=1209600
EXTENSION_BOOTSTRAP_TTL_SECONDS=120
EXTENSION_ACCESS_TOKEN_TTL_SECONDS=2592000
```

Notes:

- `AUTH_SECRET` must exactly match the web app value
- `PG_CONNECTION_STRING` should point at the fresh TypeScript backend database, not the old legacy Python DB

## Database Setup

The TypeScript backend expects a fresh UUID-based schema.

Recommended database name:

- `bagthegoose_ts`

Create it:

```bash
createdb bagthegoose_ts
```

Run migrations:

```bash
cd backend
npm run build
node dist/db/migrate.js
```

If you try to run this against the old legacy database, migration will stop with a schema compatibility error. That is intentional.

## Install Dependencies

### Web

```bash
cd web
npm install
```

### Backend

```bash
cd backend
npm install
```

## Build Verification

### Web

```bash
cd web
npm run typecheck
npm run build
```

### Backend

```bash
cd backend
npm run typecheck
npm run build
```

## Run Locally

### 1. Start backend

```bash
cd backend
npm run dev
```

Expected:

- backend listens on `http://127.0.0.1:8000`

### 2. Start web app

```bash
cd web
npm run dev
```

Expected:

- web app listens on `http://localhost:3000`

If it starts on `3001`, it means `3000` is occupied. In that case either free `3000` or temporarily add `3001` to `WEB_APP_ORIGINS`.

### 3. Load the extension

In Chrome:

1. open `chrome://extensions`
2. enable Developer mode
3. click `Load unpacked`
4. select the `extension/` folder

## Manual Verification Flow

### Web auth and app flow

1. open `http://localhost:3000`
2. sign in with Google
3. confirm unauthenticated users go to `/login`
4. confirm authenticated redirect flow:
   - no resume -> `/resume`
   - resume but onboarding incomplete -> `/onboarding`
   - ready user -> `/dashboard`

### Resume flow

1. go to `/resume`
2. paste LaTeX
3. submit
4. confirm resume is stored and analyzed

### Extension flow

1. install the extension in the same browser profile
2. set `NEXT_PUBLIC_BAGTHEGOOSE_EXTENSION_ID` in `web/.env.local`
3. restart web app
4. visit the web app while logged in
5. confirm the extension silently bootstraps auth

## Local URLs Summary

- web app: `http://localhost:3000`
- backend: `http://127.0.0.1:8000`
- backend health: `http://127.0.0.1:8000/health`
- Auth.js providers: `http://localhost:3000/api/auth/providers`

## Important Notes

- The active app path is the TypeScript backend, not the old Python backend
- The web app owns user auth through Auth.js
- The backend trusts authenticated web requests through the signed proxy bridge
- OpenAI calls stay server-side only
