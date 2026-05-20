# Digital Persona MVP

Text-first MVP for building a user's self-owned digital persona from chat history. The current scope focuses on distilling a user's tone, boundaries, and lightweight memory into a safe text response layer, while keeping clean extension points for later voice and avatar work.

## Workspace Layout

- `apps/web`: Next.js onboarding, persona review, and chat preview flow
- `services/api`: Fastify routes for personas, chat, policy, and import deletion
- `services/distiller`: Python distillation worker and tests
- `packages/shared`: shared persona and message contracts
- `infra/db`: persistence schema

## Local Development

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env` if you want to run the API against Postgres.
3. Start both web and API together with `npm run dev`.
4. Or start them separately with `pnpm dev:web` and `pnpm dev:api`.
5. Run the full test suite with `pnpm test`.
6. Apply the Postgres schema with `pnpm db:init` after setting `DATABASE_URL`.

## Deployment Notes

### Free-tier shape

- `apps/web`: deploy to Vercel Hobby
- `services/api`: deploy to Render Free as a Docker web service
- `infra/db`: use a hosted Postgres connection string and run `pnpm db:init`

### Required environment variables

For the API service:

- `DATABASE_URL`
- `HOST=0.0.0.0`
- `PORT=3001`
- `PYTHON_BIN=python3`
- `DISTILLER_WORKDIR=services/distiller`
- `WEB_ORIGIN=https://your-web-app-domain`
- `CORS_ORIGIN=https://your-web-app-domain`

For the web app:

- `API_BASE_URL=https://your-api-domain`
- `NEXT_PUBLIC_API_BASE_URL=https://your-api-domain`

### Render

- `render.yaml` includes a starter Docker web service definition for the API.
- The API Docker image lives at `services/api/Dockerfile`.

### Database compatibility

- The schema intentionally avoids mandatory `pgvector` so it can run on a plain hosted Postgres free tier.
- Current MVP flows do not require embedding search.

## Current MVP Scope

- import your own chat data
- distill a persona profile, memory cards, and policy boundaries
- review the distilled persona in the web flow
- chat with a text-only persona response layer
- delete imported source data through a minimal control endpoint

## Notes

- The project is not yet wired to live model inference.
- Voice and avatar execution are intentionally deferred, but the shared response contract already includes `emotion`, `pacing`, and `styleTags` for later adapters.
