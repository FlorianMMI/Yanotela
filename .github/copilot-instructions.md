Yanotela — AI coding instructions (concise)

This repo is a full‑stack collaborative note app with a strict client/server separation. Keep guidance short, actionable and repository‑specific.

Key architecture
- Client: Client/ — Next.js 15 (App Router), TypeScript, TailwindCSS v4, Lexical editor. Client pages live under Client/src/app/.
- Server: Server/ — Node.js + Express (ES modules), Prisma ORM, PostgreSQL. Controllers live in Server/src/controllers and routes in Server/src/routes.
- DB: Prisma schema in Server/prisma/schema.prisma. Run npx prisma generate after schema changes.

API & auth patterns (explicit)
- Session-based auth via express-session (no JWT). All client fetches that require auth must include credentials: 'include'. See Client/src/loader/loader.tsx for examples.
- Client auth guard: Client/src/hooks/useAuthRedirect.ts calls ${process.env.NEXT_PUBLIC_API_URL}/auth/check and redirects to /login when unauthenticated. It listens to storage events and a custom "auth-refresh" event.
- API error shapes: validation errors -> { errors: [], message: "" }; other errors -> { error: "" }. Client code commonly checks response headers for JSON before parsing.

Conventions & examples
- Data helpers: keep network helpers in Client/src/loader/loader.tsx (they are .tsx files but not React components). Example pattern: fetch(`${apiUrl}/note/get`, { credentials: 'include' }).
- Note content: stored as a string in the DB. Client loader tries JSON.parse and extracts plain text from Lexical-like structures (see GetNotes in loader.tsx).
- Types: client types live in Client/src/type/ (PascalCase filenames). Server uses ES modules; imports require .js file extensions.

Dev workflows (quick)
- Docker (recommended): docker compose up --build — starts client:3000, server:3001, postgres.
- Manual dev: run client and server in separate shells: cd Client && npm run dev and cd Server && npm run dev.
- DB: after schema edits run cd Server && npx prisma generate then create a migration with npx prisma migrate dev.
- Tests (server): cd Server && npm run test (tests use a shared Prisma test utils helper; keep maxWorkers low to avoid DB collisions).

Project gotchas
- Server package.json uses "type": "module" — imports must use .js extensions.
- Many client modules expect NEXT_PUBLIC_API_URL to be set. Loader falls back but runtime/tests depend on it.
- yjs/socket.io deps exist but collaborative syncing is not fully implemented — don't assume CRDT code is production-ready.

Where to look
- Auth: Client/src/loader/loader.tsx, Client/src/hooks/useAuthRedirect.ts
- Notes: Client/src/loader/loader.tsx (GetNotes, GetNoteById, SaveNote)
- Server controllers & routes: Server/src/controllers/* and Server/src/routes/*

If you want this shortened further, or expanded with explicit code snippets (fetch examples, sample env), tell me which area to adjust.
Yanotela — AI coding instructions (concise)

This repo is a full‑stack collaborative note app with a strict client/server separation. Keep guidance short, actionable and repository‑specific.

Key architecture
- Client: Client/ — Next.js 15 (App Router), TypeScript, TailwindCSS v4, Lexical editor. Client pages live under Client/src/app/.
- Server: Server/ — Node.js + Express (ES modules), Prisma ORM, PostgreSQL. Controllers live in Server/src/controllers and routes in Server/src/routes.
- DB: Prisma schema in Server/prisma/schema.prisma. Run `npx prisma generate` after schema changes.

API & auth patterns (explicit)
- Session-based auth via express-session (no JWT). All client fetches that require auth must include `credentials: 'include'`. See Client/src/loader/loader.tsx for examples.
- Client auth guard: Client/src/hooks/useAuthRedirect.ts calls `${process.env.NEXT_PUBLIC_API_URL}/auth/check` and redirects to /login when unauthenticated. It listens to storage events and a custom "auth-refresh" event.
- API error shapes: validation errors -> `{ errors: [], message: "" }`; other errors -> `{ error: "" }`. Client code commonly checks response headers for JSON before parsing.

Conventions & examples
- Data helpers: keep network helpers in Client/src/loader/loader.tsx (they are .tsx files but not React components). Example pattern: `fetch(`${apiUrl}/note/get`, { credentials: 'include' })`.
- Note content: stored as a string in the DB. Client loader tries JSON.parse and extracts plain text from Lexical-like structures (see GetNotes in loader.tsx).
- Types: client types live in Client/src/type/ (PascalCase filenames). Server uses ES modules; imports require .js file extensions.

Dev workflows (quick)
- Docker (recommended): `docker compose up --build` — starts client:3000, server:3001, postgres.
- Manual dev: run client and server in separate shells: `cd Client && npm run dev` and `cd Server && npm run dev`.
- DB: after schema edits run `cd Server && npx prisma generate` then create a migration with `npx prisma migrate dev`.
- Tests (server): `cd Server && npm run test` (tests use a shared Prisma test utils helper; keep maxWorkers low to avoid DB collisions).

Project gotchas
- Server package.json uses "type": "module" — imports must use .js extensions.
- Many client modules expect NEXT_PUBLIC_API_URL to be set. Loader falls back but runtime/tests depend on it.
- yjs/socket.io deps exist but collaborative syncing is not fully implemented — don't assume CRDT code is production-ready.

Where to look
- Auth: Client/src/loader/loader.tsx, Client/src/hooks/useAuthRedirect.ts
- Notes: Client/src/loader/loader.tsx (GetNotes, GetNoteById, SaveNote)
- Server controllers & routes: Server/src/controllers/* and Server/src/routes/*

If you want this shortened further, or expanded with explicit code snippets (fetch examples, sample env), tell me which area to adjust.
# Yanotela — AI coding instructions (concise)

This project is a full‑stack collaborative note app with a strict client/server separation. Keep guidance short, actionable and repository‑specific.

Key architecture
- Client: Client/ — Next.js 15 (App Router), TypeScript, TailwindCSS v4, Lexical editor. Example: pages under Client/src/app/* (e.g. login/page.tsx).
- Server: Server/ — Node.js + Express (ES modules), Prisma ORM, PostgreSQL. Controllers live in Server/src/controllers.
- Database: Prisma schema in Server/prisma/schema.prisma. Run `npx prisma generate` after schema changes.

API & auth patterns (explicit)
- Session-based auth (no JWT). Server uses express-session; client must include cookies: always use fetch with credentials: 'include' (see Client/src/loader/loader.tsx).
- Client auth guard: Client/src/hooks/useAuthRedirect.ts calls ${NEXT_PUBLIC_API_URL}/auth/check and redirects to /login on failure. Use storage events or custom auth-refresh events to trigger re-checks.
- API responses: validation errors -> { errors: [], message: "" }; other errors -> { error: "" }. Client code expects JSON most of the time but sometimes checks content-type.

Conventions and examples
- Client data helpers live in Client/src/loader/loader.tsx (not React components). They use env var NEXT_PUBLIC_API_URL (example: fetch(`${apiUrl}/note/get`, { credentials: 'include' })).
- Note Content: stored as string in DB. Loader parses JSON content and extracts text from Lexical-like structures (see GetNotes logic in loader.tsx).
- File layout: client components → Client/src/components/*; client types → Client/src/type/* (PascalCase filenames such as Note.ts). Server controllers → Server/src/controllers/* and routes under Server/src/routes.

Developer workflows (how to run)
- Recommended (Docker): docker compose up --build — starts client:3000, server:3001, postgres.
- Manual dev: in separate shells:
  - cd Client && npm run dev (Next.js with turbopack)
  - cd Server && npm run dev
- Database: cd Server && npx prisma generate after schema edits; cd Server && npx prisma migrate dev to apply migrations.
- Tests (server): cd Server && npm run test. Tests use a shared Prisma test utils file and run with maxWorkers: 1 to avoid DB collisions.

Quality gates / gotchas
- Server is ESM ("type": "module") — imports use .js extensions.
- Environment: many client modules expect NEXT_PUBLIC_API_URL to be set; loader falls back but tests and runtime rely on it.
- Lexical & YJS: yjs and socket.io deps exist but real-time collaboration is not fully implemented; avoid making heavy assumptions about CRDT syncing.

When contributing
- Preserve session cookie behavior: never remove credentials: 'include' from fetch calls unless switching auth approach.
- For DB/schema changes: update Server/prisma/schema.prisma, run npx prisma generate, and add a migration.
- Tests: follow existing server test patterns in Server/tests/* and use Server/tests/testUtils.js for shared setup/teardown.

Where to look for examples
- Auth flows: Client/src/loader/loader.tsx, Client/src/hooks/useAuthRedirect.ts.
- Note fetching/sanitization: Client/src/loader/loader.tsx GetNotes & GetNoteById.
- Server structure: Server/src/controllers/*, Server/src/routes/*, Server/index.js or Server/server.js for entry points.

If anything is unclear or you need extra detail (scripts, env examples, or more file examples), tell me which area to expand and I will iterate.
```markdown
# Yanotela — AI coding instructions (concise)

This project is a full‑stack collaborative note app with a strict client/server separation. Keep guidance short, actionable and repository‑specific.

Key architecture
- Client: `Client/` — Next.js 15 (App Router), TypeScript, TailwindCSS v4, Lexical editor. Example: pages under `Client/src/app/*` (e.g. `login/page.tsx`).
- Server: `Server/` — Node.js + Express (ES modules), Prisma ORM, PostgreSQL. Controllers live in `Server/src/controllers`.
- Database: Prisma schema in `Server/prisma/schema.prisma`. Run `npx prisma generate` after schema changes.

API & auth patterns (explicit)
- Session-based auth (no JWT). Server uses `express-session`; client must include cookies: always use fetch with `credentials: 'include'` (see `Client/src/loader/loader.tsx`).
- Client auth guard: `Client/src/hooks/useAuthRedirect.ts` calls `${NEXT_PUBLIC_API_URL}/auth/check` and redirects to `/login` on failure. Use storage events or custom `auth-refresh` events to trigger re-checks.
- API responses: validation errors -> `{ errors: [], message: "" }`; other errors -> `{ error: "" }`. Client code expects JSON most of the time but sometimes checks content-type.

Conventions and examples
- Client data helpers live in `Client/src/loader/loader.tsx` (not React components). They use env var `NEXT_PUBLIC_API_URL` (example: `fetch(`${apiUrl}/note/get`, { credentials: 'include' })`).
- Note Content: stored as string in DB. Loader parses JSON content and extracts text from Lexical-like structures (see `GetNotes` logic in `loader.tsx`).
- File layout: client components → `Client/src/components/*`; client types → `Client/src/type/*` (PascalCase filenames such as `Note.ts`). Server controllers → `Server/src/controllers/*` and routes under `Server/src/routes`.

Developer workflows (how to run)
- Recommended (Docker): `docker compose up --build` — starts client:3000, server:3001, postgres.
- Manual dev: in separate shells:
  - `cd Client && npm run dev` (Next.js with turbopack)
  - `cd Server && npm run dev`
- Database: `cd Server && npx prisma generate` after schema edits; `cd Server && npx prisma migrate dev` to apply migrations.
- Tests (server): `cd Server && npm run test`. Tests use a shared Prisma test utils file and run with `maxWorkers: 1` to avoid DB collisions.

Quality gates / gotchas
- Server is ESM ("type": "module") — imports use `.js` extensions.
- Environment: many client modules expect `NEXT_PUBLIC_API_URL` to be set; loader falls back but tests and runtime rely on it.
- Lexical & YJS: `yjs` and `socket.io` deps exist but real-time collaboration is not fully implemented; avoid making heavy assumptions about CRDT syncing.

When contributing
- Preserve session cookie behavior: never remove `credentials: 'include'` from fetch calls unless switching auth approach.
- For DB/schema changes: update `Server/prisma/schema.prisma`, run `npx prisma generate`, and add a migration.
- Tests: follow existing server test patterns in `Server/tests/*` and use `Server/tests/testUtils.js` for shared setup/teardown.

Where to look for examples
- Auth flows: `Client/src/loader/loader.tsx`, `Client/src/hooks/useAuthRedirect.ts`.
- Note fetching/sanitization: `Client/src/loader/loader.tsx` GetNotes & GetNoteById.
- Server structure: `Server/src/controllers/*`, `Server/src/routes/*`, `Server/index.js` or `Server/server.js` for entry points.

If anything is unclear or you need extra detail (scripts, env examples, or more file examples), tell me which area to expand and I will iterate.
```
```markdown
# Yanotela — AI coding instructions (concise)

This project is a full‑stack collaborative note app with a strict client/server separation. Keep guidance short, actionable and repository‑specific.

Key architecture
- Client: `Client/` — Next.js 15 (App Router), TypeScript, TailwindCSS v4, Lexical editor. Example: pages under `Client/src/app/*` (e.g. `login/page.tsx`).
- Server: `Server/` — Node.js + Express (ES modules), Prisma ORM, PostgreSQL. Controllers live in `Server/src/controllers`.
- Database: Prisma schema in `Server/prisma/schema.prisma`. Run `npx prisma generate` after schema changes.

API & auth patterns (explicit)
- Session-based auth (no JWT). Server uses `express-session`; client must include cookies: always use fetch with `credentials: 'include'` (see `Client/src/loader/loader.tsx`).
- Client auth guard: `Client/src/hooks/useAuthRedirect.ts` calls `${NEXT_PUBLIC_API_URL}/auth/check` and redirects to `/login` on failure. Use storage events or custom `auth-refresh` events to trigger re-checks.
- API responses: validation errors -> `{ errors: [], message: "" }`; other errors -> `{ error: "" }`. Client code expects JSON most of the time but sometimes checks content-type.

Conventions and examples
- Client data helpers live in `Client/src/loader/loader.tsx` (not React components). They use env var `NEXT_PUBLIC_API_URL` (example: `fetch(`${apiUrl}/note/get`, { credentials: 'include' })`).
- Note Content: stored as string in DB. Loader parses JSON content and extracts text from Lexical-like structures (see `GetNotes` logic in `loader.tsx`).
- File layout: client components → `Client/src/components/*`; client types → `Client/src/type/*` (PascalCase filenames such as `Note.ts`). Server controllers → `Server/src/controllers/*` and routes under `Server/src/routes`.

Developer workflows (how to run)
- Recommended (Docker): `docker compose up --build` — starts client:3000, server:3001, postgres.
- Manual dev: in separate shells:
  - `cd Client && npm run dev` (Next.js with turbopack)
  - `cd Server && npm run dev`
- Database: `cd Server && npx prisma generate` after schema edits; `cd Server && npx prisma migrate dev` to apply migrations.
- Tests (server): `cd Server && npm run test`. Tests use a shared Prisma test utils file and run with `maxWorkers: 1` to avoid DB collisions.

Quality gates / gotchas
- Server is ESM (`"type": "module"`) — imports use `.js` extensions.
- Environment: many client modules expect `NEXT_PUBLIC_API_URL` to be set; loader falls back but tests and runtime rely on it.
- Lexical & YJS: `yjs` and `socket.io` deps exist but real-time collaboration is not fully implemented; avoid making heavy assumptions about CRDT syncing.

When contributing
- Preserve session cookie behavior: never remove `credentials: 'include'` from fetch calls unless switching auth approach.
- For DB/schema changes: update `Server/prisma/schema.prisma`, run `npx prisma generate`, and add a migration.
- Tests: follow existing server test patterns in `Server/tests/*` and use `Server/tests/testUtils.js` for shared setup/teardown.

Where to look for examples
- Auth flows: `Client/src/loader/loader.tsx`, `Client/src/hooks/useAuthRedirect.ts`.
- Note fetching/sanitization: `Client/src/loader/loader.tsx` GetNotes & GetNoteById.
- Server structure: `Server/src/controllers/*`, `Server/src/routes/*`, `Server/index.js` or `Server/server.js` for entry points.

If anything is unclear or you need extra detail (scripts, env examples, or more file examples), tell me which area to expand and I will iterate.
```
# Yanotela - AI Coding Instructions

## Project Architecture

**Yanotela** is a full-stack collaborative note-taking application with strict client-server separation:

- **Client** (`Client/`): Next.js 15 with App Router, TypeScript, TailwindCSS 4, Lexical rich text editor
- **Server** (`Server/`): Node.js Express API with Prisma ORM, PostgreSQL, session-based auth  
- **Database**: PostgreSQL with Prisma migrations in `Server/prisma/`

## Critical Development Workflows

### Startup & Environment  
- **Docker (recommended)**: `docker compose up --build` - runs client:3000, server:3001, postgres
- **Manual**: `cd Client && npm run dev` + `cd Server && npm run dev` (no setup script exists)
- Client uses `--turbopack` flag for faster dev builds

### Authentication Architecture
- **Session-based auth** with `express-session` (no JWT) - sessions stored server-side
- **Client auth check**: All protected pages use `useAuthRedirect` hook that calls `/auth/check`
- **API calls pattern**: Always include `credentials: 'include'` for session cookies
- **Email verification**: Required via `is_verified` field before login access
- **Server middleware**: `authMiddleware.js` protects routes, no client-side auth state

### API Communication Patterns
- **Base URL**: Client calls `https://yanotela.fr/api` (hardcoded in `loader.tsx`, fallback for env var)
- **Route structure**: `/` (auth routes), `/note` (CRUD operations)  
- **Error handling**: Express-validator on server → structured error responses → client displays
- **Content-Type**: Always `application/json` with `credentials: 'include'`

### Database Schema & Relationships
```prisma  
User: id(int), pseudo(unique), email(unique), password, token(unique), is_verified(boolean)
Note: id(string), Titre, Content, authorId(int→User), ModifiedAt(datetime)
```
- Note IDs are strings, User IDs are integers
- **Critical**: Run `npx prisma generate` after schema changes before server restart

### File Organization Conventions
- **Client pages**: `src/app/[route]/page.tsx` (App Router, all client components)
- **Client components**: `src/components/[feature]/ComponentName.tsx`  
- **Client data fetching**: `src/loader/loader.tsx` (not React components despite .tsx)
- **Server controllers**: `src/controllers/[feature]Controller.js` (ES modules)
- **Types**: Client-only in `src/type/`, PascalCase filenames (e.g., `Note.ts`)

### Testing Architecture  
- **Server only**: Jest with `maxWorkers: 1`, `forceExit: true` for DB cleanup
- **Test categories**: `tests/auth/`, `tests/notes/`, `tests/bdd/` with dedicated npm scripts
- **Test utils**: `testUtils.js` provides shared Prisma instance, cleanup helpers, unique token generation
- **Windows compatibility**: Scripts use `set NODE_ENV=test&&` (note double &)

### Styling System
- **TailwindCSS 4** with CSS variables in `globals.css` 
- **Custom properties**: `--rouge-600: #882626`, `--background: #E9EBDB`
- **Typography**: Gantari (primary), Geologica (secondary) via Google Fonts
- **Theme system**: CSS `@theme inline` block maps CSS vars to Tailwind tokens

## Technology Integration Points

### Lexical Rich Text Editor
- Imported from `@lexical/react` in note components
- Content stored as string in Note.Content field (not JSON objects)
- Handle as plain text in database operations

### Real-time Collaboration (Planned)
- `yjs` and `socket.io` dependencies present but not actively implemented
- `motion` library available for animations

## Development Commands Reference

```bash
# Docker full stack
docker compose up --build

# Manual development  
cd Client && npm run dev    # Next.js with turbopack
cd Server && npm run dev    # Node.js with auto-restart

# Database operations
cd Server && npx prisma generate      # After schema changes
cd Server && npx prisma migrate dev   # Apply migrations

# Testing (Server only)
cd Server && npm run test         # All tests
cd Server && npm run test:auth    # Auth tests  
cd Server && npm run test:notes   # Notes CRUD tests
cd Server && npm run test:bdd     # Database tests
```

## Critical Gotchas & Patterns
- **Server ES modules**: `"type": "module"` in package.json, use `.js` extensions in imports
- **No client-side setup script**: References to `./setup.sh` in docs are outdated
- **Auth flow**: `useAuthRedirect` redirects to `/login` on auth failure, no loading states needed
- **API error structure**: Server returns `{ errors: [], message: "" }` for validation, `{ error: "" }` for other errors
- **Prisma client**: Must regenerate after schema changes, shared test instance pattern in `testUtils.js`
