# Yanotela — AI Coding Instructions

Yanotela is a full-stack collaborative note-taking application with real-time editing via Lexical + YJS. This guide covers essential architecture patterns and workflows.

## Core Architecture

**Stack Overview**
- **Client**: Next.js 15 (App Router), TypeScript, TailwindCSS v4, Lexical 0.38.2 editor
- **Server**: Node.js + Express (ES modules), Prisma ORM, PostgreSQL
- **Real-time**: `@lexical/yjs` + `y-websocket` for CRDT collaboration (production-ready)
- **Deployment**: Docker Compose for local/preprod, AWS EC2 + GitHub Actions for production

**Data Model** (`Server/prisma/schema.prisma`)
```prisma
User → notes[], folders[], permissions[], noteFolders[]
Note → id(String/UUID), Titre, Content(String), yjsState(Bytes?), authorId, modifierId?, deletedAt?
Permission → noteId+userId (composite key), role(Int 0-3), isAccepted(Boolean)
Folder → id(UUID), Nom, Description?, CouleurTag, authorId, deletedAt?
NoteFolder → noteId+folderId+userId (composite key, join table)
```
- Note IDs are UUIDs (strings), User IDs are integers, Folder IDs are UUIDs
- `yjsState` stores CRDT binary state (source of truth), `Content` field auto-synced for display
- Soft deletes: `deletedAt` timestamp, cleanup service deletes after 30 days (runs every 24h)
- Folders support color tagging via `CouleurTag` hex values (default: `#D4AF37`)

## Authentication & Session Management

**Server-side Sessions** (no JWT)
- Uses `express-session` with optional Redis (`Server/src/config/sessionConfig.js`)
- Session cookie: `httpOnly: true`, `sameSite: 'lax'`, 10-year max age
- Auth middleware (`Server/src/middlewares/authMiddleware.js`):
  - `requireAuth` — checks `req.session.userId`, sets `req.userId`
  - `requireNoteOwnership` — verifies `note.authorId === req.session.userId`
  - `requireWriteAccess` — checks permission role ≠ 3 (read-only)

**Client Auth Pattern** (CRITICAL)
```tsx
// ALL API calls MUST include credentials for session cookies
fetch(`${apiUrl}/note/get`, {
  credentials: 'include',  // ← NEVER OMIT THIS
  headers: { "Content-Type": "application/json" }
})
```

**Auth Guard Hook** (`Client/src/hooks/useAuthRedirect.ts`)
- Auto-redirects to `/login` if session invalid
- Listens to: storage events, custom `'auth-refresh'` event
- Health check: `${NEXT_PUBLIC_API_URL}/auth/check`

## Real-Time Collaboration (Production)

**Architecture**: Lexical CollaborationPlugin + y-websocket
- **YJS server**: Standalone WebSocket server on port 1234 (dev) or `/yjs` path (prod)
- **Provider factory**: `Client/src/collaboration/providers.ts`
  - `createWebsocketProvider(noteId, yjsDocMap)` — returns configured `WebsocketProvider`
  - Auto-detects: `ws://localhost:1234` (dev) or `wss://domain/yjs` (prod)
  - Room naming: `yanotela-${noteId}`

**Collaboration Flow**
1. Client loads note via `GetNoteById(id)` API
2. `LexicalCollaboration` context creates shared `Y.Doc` for `noteId`
3. `CollaborationPlugin` connects to YJS WebSocket, syncs state
4. `TitleSyncPlugin` syncs note title across users (custom Y.Text field)
5. `OnChangeBehavior` plugin debounces saves to `/note/sync` endpoint (saves both `yjsState` + `Content`)

**Key Implementation Details**
- `Note.yjsState` is source of truth, `Note.Content` derived via `syncContentFromYjs()`
- Migration utility: `Server/src/services/yjsMigration.js` (converts legacy JSON → YJS)
- **No Socket.IO** — collaboration uses standard y-websocket protocol

## API Conventions

**Error Responses**
```javascript
// Validation errors (express-validator 7.0.1)
{ errors: [...], message: "..." }

// General errors
{ error: "..." }
```

**Client Data Layer** (`Client/src/loader/loader.tsx`)
- **NOT React components** despite `.tsx` extension — pure network functions
- Centralized API calls: `GetNotes()`, `CreateNote()`, `SaveNote()`, `GetNoteById()`, etc.
- Content parsing: extracts plain text from Lexical JSON structure via recursive `extractText()`
- Handles both string and object `Content` fields (migrations in progress)

**Note Content Storage**
- `Note.yjsState` (Bytes) — binary CRDT state, source of truth for collaboration
- `Note.Content` (String) — derived Lexical JSON string for display/search
- Auto-sync: `syncContentFromYjs()` updates `Content` every 2s after YJS changes
- Client parsing: `JSON.parse(note.Content)` → recursive traversal of `{root: {children: [...]}}`

## Development Workflows

**Docker Development** (Recommended)
```bash
# Start full stack: client:3000, server:3001, postgres:5433, redis:6380, yjs:1234, cleanup service
docker compose -f docker-compose.dev.yml up --build

# Volumes mounted for hot reload:
# - Client/src → /app/src
# - Server/src → /app/src  
# - node_modules excluded via volume overlays
```

**Manual Development**
```bash
# Terminal 1: Server (nodemon auto-restart)
cd Server && npm run dev

# Terminal 2: Client (Turbopack fast refresh)
cd Client && npm run dev

# Terminal 3: YJS WebSocket server (optional, for collaboration)
npx y-websocket-server --port 1234

# Required env vars:
# Server: DATABASE_URL, SESSION_SECRET, MAIL_USER, MAIL_PASSWORD, REDIS_URL (optional)
# Client: NEXT_PUBLIC_API_URL (default: http://localhost:3001)
```

**Database Migrations**
```bash
cd Server

# After editing schema.prisma:
npx prisma generate         # Regenerate client types
npx prisma migrate dev      # Create + apply migration (prompts for name)

# Production:
npx prisma migrate deploy   # Apply without prompts
npx prisma studio           # Open GUI database browser
```

**Testing** (Server only)
```bash
cd Server

npm run test              # All tests (jest --maxWorkers=1)
npm run test:auth         # Auth-specific tests
npm run test:notes        # CRUD operations
npm run test:bdd          # Database integration

# Key utilities (Server/tests/testUtils.js):
# - getPrismaTestInstance() — singleton for test DB
# - cleanupTestData(prisma, emails, pseudos) — remove test users
# - generateUniqueToken(testName) — unique tokens per test

# CRITICAL: jest.config.json has "maxWorkers": 1 to avoid DB collisions
```

## File Organization Patterns

**Client Structure**
```
src/app/[route]/page.tsx          # Next.js pages (all "use client")
src/components/[feature]/         # Feature-based components
src/loader/loader.tsx             # Centralized API calls (NOT a component)
src/hooks/use*.ts                 # Custom hooks (useAuthRedirect, useTheme)
src/type/[Type].ts                # TypeScript types (PascalCase filenames)
src/collaboration/providers.ts    # YJS WebSocket provider factory
```

**Server Structure**
```
src/controllers/[feature]Controller.js  # Business logic + Prisma queries
src/routes/[feature]Routes.js           # Route definitions + middleware
src/middlewares/authMiddleware.js       # Auth guards (requireAuth, requireWriteAccess)
src/services/yjsMigration.js            # Legacy JSON → YJS migration
src/config/sessionConfig.js             # express-session setup
src/config/corsConfig.js                # CORS configuration
scripts/                                # Utility scripts (cleanup, migration, test data)
```

**ES Module Gotchas** (Server)
- `package.json` has `"type": "module"` → ALL imports MUST include `.js` extension
- Example: `import { prisma } from './config/database.js'` (not `.ts`, not omitted)
- Named imports required: `import { Router } from 'express'` (not default export)

## Critical Conventions

**Next.js App Router**
- All pages use `"use client"` directive (no server components)
- Reason: session-based auth requires client-side hooks
- Route structure: `/notes` → `Client/src/app/notes/page.tsx`
- Dynamic routes: `/notes/[id]` → `Client/src/app/notes/[id]/page.tsx`

**TailwindCSS v4**
- Custom theme in `Client/src/app/globals.css`:
  ```css
  @theme inline {
    --color-rouge-600: #882626;
    --color-background: #E9EBDB;
  }
  ```
- Typography: Gantari (primary), Geologica (secondary) loaded via Google Fonts
- Usage: `bg-background`, `text-rouge-600` (kebab-case custom properties)

**Permission System**
- `Permission.role`: **0** (owner), **1** (admin), **2** (editor), **3** (read-only)
- `Permission.isAccepted`: false until user accepts invitation
- Role hierarchy: **lower number = higher privilege** (validate `adminRole < targetRole`)
- Only roles 0-1 can delete notes, manage permissions, or remove collaborators
- **Client-side enforcement**: 
  - `ReadOnlyPlugin` calls `editor.setEditable(false)` when `userRole === 3`
  - Yellow banner + disabled toolbar for read-only users
- **Server-side enforcement**: `requireWriteAccess` middleware blocks role 3 from POST/PUT/DELETE

## Deployment Architecture

**Docker Compose Services**
1. `db` — PostgreSQL 15 Alpine (port 5433 externally, 5432 internally)
2. `redis` — Session store (port 6380 externally, 6379 internally)
3. `backend` — Express API (runs `prisma migrate deploy` on startup)
4. `frontend` — Next.js with Turbopack
5. `yjs-server` — WebSocket server for collaboration (port 1234, using `@y/websocket-server`)
6. `cleanup-notes` — Cron job (24h interval): deletes notes where `deletedAt < now() - 30 days`

**Production Flow** (GitHub Actions → Docker Hub → EC2)
- Workflow: `.github/workflows/develop-ec2.yml` (or `production.yml` for main branch)
- Build → Push to Docker Hub → SSH to EC2 → Pull images → Restart services
- Required secrets: `DOCKER_USERNAME`, `EC2_HOST`, `EC2_SSH_PRIVATE_KEY`, `ENV_PROD_FILE`
- Nginx reverse proxy: SSL termination + routing (config: `nginx/default.conf`)
- Health checks: `http://localhost:3001/health` (backend), Next.js built-in (frontend)

**Environment Variables**
```bash
# Server (.env or ENV_PROD_FILE)
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SHADOW_DATABASE_URL=postgresql://...       # For migrations
SESSION_SECRET=<random-secret>
REDIS_URL=redis://redis:6379               # Optional
MAIL_SERVICE=gmail
MAIL_USER=<email>
MAIL_PASSWORD=<app-password>
CLIENT_URL=http://localhost:3000           # CORS origin

# Client (.env.local or build args)
NEXT_PUBLIC_API_URL=http://localhost:3001  # API base URL
```

## Common Pitfalls

1. **Missing `credentials: 'include'`** → Session cookies not sent, 401 errors on all protected routes
2. **Forgot `.js` in imports** → `ERR_MODULE_NOT_FOUND` (Server has `"type": "module"`)
3. **Prisma client out of sync** → Run `npx prisma generate` after schema changes
4. **Test DB collisions** → Always use `maxWorkers: 1` in jest.config.json
5. **Client env var not prefixed** → Next.js ignores env vars without `NEXT_PUBLIC_` prefix
6. **Permission role values** → Use 0-3 scale (0=owner, 3=readonly), not 1-4 or boolean
7. **Lexical content parsing** → Content may be string or object, use type guards before `JSON.parse()`
8. **YJS state assumptions** → `yjsState` is Bytes (Buffer), must convert: `Buffer.from(array)` / `yjsState.toString('base64')`
9. **Port conflicts in Docker** → Local services: 5433 (postgres), 6380 (redis), 1234 (yjs) — not standard ports
10. **Read-only enforcement** → Check `note.userRole === 3` client-side + use `ReadOnlyPlugin` to disable editor

## Quick Reference

**Key Files**
- Session config: `Server/src/config/sessionConfig.js`
- Auth middleware: `Server/src/middlewares/authMiddleware.js`
- Client API layer: `Client/src/loader/loader.tsx`
- Auth redirect hook: `Client/src/hooks/useAuthRedirect.ts`
- YJS provider factory: `Client/src/collaboration/providers.ts`
- Prisma schema: `Server/prisma/schema.prisma`
- Test utilities: `Server/tests/testUtils.js`

**Helpful Commands**
```bash
# Docker logs (follow mode)
docker logs yanotela-backend-local -f
docker compose -f docker-compose.dev.yml logs -f

# Database access
docker exec -it yanotela-db-local psql -U yanotela_local -d yanotela_local
npx prisma studio    # GUI browser (from Server/)

# Utility scripts
npm run cleanup:notes        # Manual cleanup (Server/)
npm run create-test-user     # Create test user (Server/)
node scripts/migrate-content-to-yjs.js   # Migrate legacy notes

# Health checks
curl http://localhost:3001/health
curl http://localhost:3000/api/health || curl http://localhost:3000

# See user roles for notes
docker exec yanotela-db-local psql -U yanotela_local -d yanotela_local -c \
  "SELECT n.\"Titre\", u.pseudo, p.role, 
   CASE WHEN p.role=0 THEN '👑 Propriétaire' 
        WHEN p.role=1 THEN '⚙️ Admin' 
        WHEN p.role=2 THEN '✏️ Éditeur' 
        WHEN p.role=3 THEN '👁️ Lecteur' END as role_name 
   FROM \"Note\" n 
   LEFT JOIN \"Permission\" p ON n.id=p.id_note 
   LEFT JOIN \"User\" u ON p.id_user=u.id 
   ORDER BY n.\"ModifiedAt\" DESC LIMIT 20;"
```

## Important Architecture Decisions

1. **Session-based auth (no JWT)** — Simplifies XSS protection, requires `credentials: 'include'` on all fetch calls
2. **All client pages use `"use client"`** — No server components due to session hooks pattern
3. **Centralized API layer** — `Client/src/loader/loader.tsx` handles all network requests (not a React component)
4. **Soft deletes everywhere** — Use `deletedAt` timestamps, automated cleanup service runs daily
5. **YJS WebSocket collaboration** — Standard `y-websocket` protocol, no custom Socket.IO implementation
6. **Lexical 0.38.2 with CollaborationPlugin** — Uses official `@lexical/yjs` + `@lexical/react/LexicalCollaborationPlugin`
7. **Dual content storage** — `yjsState` (binary CRDT) is source of truth, `Content` (string) derived for search/display
8. **Folder system** — Many-to-many via `NoteFolder` join table, supports color tags per folder

---

**Version Info**: Lexical 0.38.2, Next.js 15.5.3, Prisma 6.18.0, YJS 13.6.27, y-websocket 2.0.4
