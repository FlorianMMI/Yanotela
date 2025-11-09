# Yanotela — AI Coding Instructions

Yanotela is a full-stack collaborative note-taking application with real-time editing capabilities. This guide focuses on architectural patterns and workflows specific to this codebase.

## Core Architecture

**Stack Overview**
- **Client**: Next.js 15 (App Router), TypeScript, TailwindCSS v4, Lexical rich text editor
- **Server**: Node.js + Express (ES modules), Prisma ORM, PostgreSQL
- **Real-time**: Socket.IO for collaboration, YJS for CRDT state synchronization (in development)
- **Deployment**: Docker Compose for local/preprod, AWS EC2 for production

**Data Model** (`Server/prisma/schema.prisma`)
```prisma
User → notes[], folders[], permissions[]
Note → id(String), Titre, Content(String), yjsState(Bytes?), authorId, deletedAt?
Permission → noteId+userId (composite key), role(Int), isAccepted(Boolean)
Folder → id(UUID), notes via NoteFolder join table
```
- Note IDs are UUIDs (strings), User IDs are autoincrement integers
- `yjsState` stores CRDT binary state for real-time collaboration (partially implemented)
- Soft deletes via `deletedAt` timestamp — cleanup runs via `cleanup-notes` Docker service every 24h

## Authentication & Session Management

**Server-side Sessions** (no JWT)
- Uses `express-session` with optional Redis adapter (`Server/src/config/sessionConfig.js`)
- Session cookie: `httpOnly: true`, `sameSite: 'lax'`, 10-year max age
- All protected routes use middleware in `Server/src/middlewares/authMiddleware.js`:
  - `requireAuth` — checks `req.session.userId`
  - `requireNoteOwnership` — verifies note belongs to user
  - `requireWriteAccess` — checks write permissions (role ≠ 3)

**Client Auth Pattern** (CRITICAL)
```tsx
// All API calls MUST include credentials for session cookies
fetch(`${apiUrl}/note/get`, {
  credentials: 'include',  // ← NEVER OMIT THIS
  headers: { "Content-Type": "application/json" }
})
```

**Auth Guard Hook** (`Client/src/hooks/useAuthRedirect.ts`)
```tsx
useAuthRedirect() // Auto-redirects to /login if session invalid
// Listens to: storage events, custom 'auth-refresh' event
// Calls: ${NEXT_PUBLIC_API_URL}/auth/check
```

## Real-Time Collaboration (Feature Branch)

**Socket.IO Setup** (`Server/src/app.js` lines 100-250)
- Shared session middleware: `io.engine.use(sessionMiddleware)`
- Authentication: Socket connects only if `req.session.userId` exists
- Room pattern: `note-${noteId}` for each collaborative session

**Collaboration Flow**
1. Client emits `joinNote({ noteId })`
2. Server verifies permissions via Prisma query
3. Socket joins room, loads `yjsState` from DB (`Server/src/controllers/yjsController.js`)
4. Emits `noteJoined` + `yjs-initial-state` to client
5. User tracking via `Server/src/services/collaborationService.js` (socket ID → noteId mapping)

**YJS Integration Status**
- YJS dependencies installed, `Note.yjsState` field exists in schema
- Binary state persistence implemented but **NOT production-ready**
- Current workflow: Lexical JSON stored in `Note.Content` (string), YJS state optional
- On disconnect: auto-cleanup after 60s of room inactivity

## API Conventions

**Error Responses**
```javascript
// Validation errors (express-validator)
{ errors: [...], message: "..." }

// General errors
{ error: "..." }
```

**Client Data Layer** (`Client/src/loader/loader.tsx`)
- NOT React components despite `.tsx` extension
- All network calls centralized here (e.g., `GetNotes()`, `CreateNote()`, `SaveNote()`)
- Lexical content parsing: extracts plain text from nested JSON structure for display

**Note Content Storage**
- DB stores Lexical editor state as **JSON string** in `Note.Content`
- Client parses and renders: `JSON.parse(note.Content)` → extract text via recursive traversal
- Example in `GetNotes()` lines 55-98: handles `{root: {children: [...]}}`

## Development Workflows

**Docker Development** (Recommended)
```bash
# Start full stack (client:3000, server:3001, postgres:5432, redis:6379, cleanup service)
docker compose -f docker-compose.dev.yml up --build

# Volumes mounted for hot reload:
# - Client/src → /app/src
# - Server/src → /app/src  
# - Exclude node_modules via volume mounts
```

**Manual Development**
```bash
# Terminal 1: Server with nodemon auto-restart
cd Server && npm run dev

# Terminal 2: Client with Turbopack (fast refresh)
cd Client && npm run dev

# Set env vars:
# Server: DATABASE_URL, REDIS_URL, SESSION_SECRET, MAIL_USER/PASSWORD
# Client: NEXT_PUBLIC_API_URL (defaults to http://localhost:3001)
```

**Database Migrations**
```bash
cd Server

# After editing schema.prisma:
npx prisma generate      # Regenerate client
npx prisma migrate dev   # Create + apply migration

# Production:
npx prisma migrate deploy  # Apply without prompts
```

**Testing** (Server only)
```bash
cd Server

npm run test         # All tests (maxWorkers: 1)
npm run test:auth    # Auth tests only
npm run test:notes   # CRUD operations
npm run test:bdd     # Database integration

# testUtils.js provides:
# - getPrismaTestInstance() — shared singleton
# - cleanupTestData(prisma, emails, pseudos)
# - generateUniqueToken(testName)
```

## File Organization Patterns

**Client Structure**
```
src/app/[route]/page.tsx          # Next.js App Router pages (all "use client")
src/components/[feature]/         # Feature-based components
src/loader/loader.tsx             # Centralized API calls (NOT a component)
src/hooks/use*.ts                 # Custom hooks (useAuthRedirect, useTheme)
src/type/[Type].ts               # TypeScript types (PascalCase filenames)
```

**Server Structure**
```
src/controllers/[feature]Controller.js  # Business logic
src/routes/[feature]Routes.js           # Route definitions with middleware
src/middlewares/authMiddleware.js       # requireAuth, requireWriteAccess
src/services/collaborationService.js    # Socket.IO user tracking
src/config/sessionConfig.js             # express-session setup
```

**ES Module Gotchas** (Server)
- `package.json` has `"type": "module"` → ALL imports MUST use `.js` extensions
- Example: `import { prisma } from './config/database.js'` (not `.ts`)

## Critical Conventions

**Next.js App Router**
- All pages use `"use client"` directive (Client/src/app/*/page.tsx)
- Server components NOT used due to authentication patterns
- Route structure matches file paths: `/notes` → `Client/src/app/notes/page.tsx`

**TailwindCSS v4**
- Custom properties in `Client/src/app/globals.css`:
  ```css
  @theme inline {
    --color-rouge-600: #882626;
    --color-background: #E9EBDB;
  }
  ```
- Typography: Gantari (primary), Geologica (secondary) via Google Fonts

**Permission System**
- `Permission.role`: 1 (owner), 2 (collaborator), 3 (read-only)
- `Permission.isAccepted`: false until user accepts invitation
- Check in middleware: `requireWriteAccess` blocks role === 3

## Deployment Architecture

**Docker Compose Services**
1. `db` — PostgreSQL 15 Alpine (port 5433 locally)
2. `redis` — Session store (port 6380 locally)
3. `backend` — Express API with Prisma migrations on startup
4. `frontend` — Next.js with Turbopack
5. `cleanup-notes` — Cron job (runs every 24h): deletes notes where `deletedAt < now() - 30 days`

**Production Flow** (see `deploy/QUICKSTART.md`)
- GitHub Actions → Docker Hub → EC2 instance
- Secrets: `DOCKER_USERNAME`, `EC2_HOST`, `EC2_SSH_PRIVATE_KEY`, `ENV_PROD_FILE`
- Nginx reverse proxy handles SSL termination (config in `nginx/default.conf`)

## Common Pitfalls

1. **Missing `credentials: 'include'`** → Session cookies not sent, 401 errors
2. **Forgot `.js` in imports** → Server ES module errors
3. **Prisma client out of sync** → Run `npx prisma generate` after schema changes
4. **Test DB collisions** → Always use `maxWorkers: 1` in jest.config.json
5. **YJS state assumptions** → Feature incomplete, rely on `Note.Content` string for now
6. **Client env var** → `NEXT_PUBLIC_API_URL` must be set or loader falls back to localhost

## Quick Reference

**Key Files**
- Session config: `Server/src/config/sessionConfig.js`
- Socket.IO setup: `Server/src/app.js` lines 100-300
- Client API layer: `Client/src/loader/loader.tsx`
- Auth hook: `Client/src/hooks/useAuthRedirect.ts`
- Test utilities: `Server/tests/testUtils.js`
- Prisma schema: `Server/prisma/schema.prisma`

**Helpful Commands**
```bash
# View Docker logs
docker logs yanotela-backend-local -f

# Access Prisma Studio
cd Server && npx prisma studio

# Test cleanup script
cd Server && npm run cleanup:notes

# Create test user
cd Server && npm run create-test-user
```
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
