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
User → notes[], folders[], permissions[], noteFolders[]
Note → id(String), Titre, Content(String), yjsState(Bytes?), authorId, modifierId?, deletedAt?
Permission → noteId+userId (composite key), role(Int 0-3), isAccepted(Boolean)
Folder → id(UUID), Nom, Description?, CouleurTag, authorId, deletedAt?
NoteFolder → noteId+folderId+userId (join table for folder organization)
```
- Note IDs are UUIDs (strings), User/Folder IDs are integers/UUIDs respectively
- `yjsState` stores CRDT binary state for real-time collaboration (partially implemented)
- Soft deletes via `deletedAt` timestamp — cleanup runs via `cleanup-notes` Docker service every 24h
- Folders support color tagging via `CouleurTag` hex values (default: `#D4AF37`)

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
- `Permission.role`: 0 (owner), 1 (admin), 2 (editor), 3 (read-only)
- `Permission.isAccepted`: false until user accepts invitation
- Check in middleware: `requireWriteAccess` blocks role === 3
- Role hierarchy validation: lower role value = higher privilege (controllers verify `adminRole < targetRole`)
- Only role 0-1 can delete notes, add permissions, or manage collaborators
- **Client-side enforcement**: `ReadOnlyPlugin` sets `editor.setEditable(false)` when `userRole === 3`
- **Visual indicators**: Yellow banner + disabled toolbar + grayed out editor for read-only users

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
2. **Forgot `.js` in imports** → Server ES module errors (package.json has `"type": "module"`)
3. **Prisma client out of sync** → Run `npx prisma generate` after schema changes
4. **Test DB collisions** → Always use `maxWorkers: 1` in jest.config.json
5. **YJS state assumptions** → Feature incomplete, rely on `Note.Content` string for now
6. **Client env var** → `NEXT_PUBLIC_API_URL` must be set or loader falls back to localhost
7. **Permission role values** → Use 0-3 scale (0=owner, 3=readonly), not 1-based indexing
8. **Lexical content parsing** → Content stored as stringified JSON, must parse recursively via `extractText()` in loader
9. **Socket.IO session sharing** → Uses `io.engine.use(sessionMiddleware)` for auth context
10. **Read-only enforcement** → Check `note.userRole === 3` client-side + use `ReadOnlyPlugin` to block Lexical editor
11. **Content sync** → `yjsState` is source of truth, `Content` field auto-synced via `syncContentFromYjs()` every 2s after YJS update + on note load

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

# Check health endpoints
curl http://localhost:3001/health
```

## Collaboration Refactor (In Progress)

See `Client/COLLABORATION_REFACTOR_PLAN.md` for detailed migration plan. Current state:
- Custom Socket.IO implementation exists in `Server/src/app.js` (lines 100-300)
- YJS integration partial: `Note.yjsState` field exists, binary persistence implemented
- **Target architecture**: Migrate to standard Lexical collab pattern using `@lexical/yjs@0.38.2` + `y-websocket@2.0.4`
- Current workflow: Lexical JSON in `Note.Content`, YJS state optional/experimental
- Files marked for removal: `Client/src/hooks/useYjsDocument.ts`, `Client/src/services/yjsCollaborationService.ts`
- Files to keep/adapt: `Client/src/components/collaboration/ConnectedUsers.tsx`, `TypingIndicator.tsx`

**When working on collaboration features**: Always check refactor plan first to avoid building on deprecated patterns.

---

**Key Architecture Decisions**:
1. **All client pages use `"use client"`** — No server components due to session-based auth patterns
2. **Centralized API calls** — `Client/src/loader/loader.tsx` handles all network requests (not a React component)
3. **Soft deletes everywhere** — Use `deletedAt` timestamps, automated cleanup service
4. **Session-first auth** — No JWT tokens, all auth via `express-session` + Redis (optional)
5. **Folder system** — Many-to-many via `NoteFolder` join table, supports color tags per folder
