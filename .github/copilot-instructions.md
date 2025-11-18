# Yanotela — AI Coding Instructions

Yanotela is a full-stack collaborative note-taking application with real-time editing capabilities. This guide focuses on architectural patterns and workflows specific to this codebase.

## Core Architecture

**Stack Overview**
- **Client**: Next.js 15.5.3 (App Router), React 19.1.1, TypeScript 5.6, TailwindCSS v4, Lexical 0.38.2
- **Server**: Node.js + Express 5.1.0 (ES modules), Prisma 6.18.0, PostgreSQL 15
- **Real-time**: YJS 13.6.27 + y-websocket 2.0.4 for CRDT collaboration, @lexical/yjs 0.38.2
- **Session**: express-session 1.18.0 with optional Redis 7 adapter
- **Deployment**: Docker Compose for dev/preprod, Docker Hub + AWS EC2 for production
- **Mail**: Nodemailer 7.0.10 (Gmail SMTP)

**Data Model** (`Server/prisma/schema.prisma`)
```prisma
User → notes[], folders[], permissions[], noteFolders[]
  - id: Int (auto-increment), pseudo, email (both unique)
  - theme: String (default "light") — supports light/dark/blue themes
  - is_verified: Boolean, token: String (email validation)
  - deleted_at: DateTime? (soft delete)

Note → id(String/UUID), Titre, Content(String), yjsState(Bytes?), tag(String?), authorId, modifierId?, deletedAt?
  - Content: Lexical JSON stringified state
  - yjsState: Binary CRDT state for collaboration (optional, in migration)
  - tag: Hex color for note tag (independent from folder color)
  - ModifiedAt: DateTime (auto-updated)

Permission → noteId+userId (composite PK), role(Int 0-3), isAccepted(Boolean)
  - role: 0=Propriétaire, 1=Admin, 2=Éditeur, 3=Lecteur (read-only)
  - isAccepted: false until user accepts invitation

Folder → id(UUID), Nom, Description?, CouleurTag, authorId, CreatedAt, ModifiedAt, deletedAt?
  - CouleurTag: Hex color (default "#D4AF37" — gold)
  - Cascade deletes propagate to NoteFolder

NoteFolder → noteId+folderId+userId (composite join), addedAt
  - Single note per user (@@id on noteId only)
  - Cascade deletes from Folder, Note, User
```

**Key Design Decisions**
- Note IDs are UUID strings, User IDs are integers, Folder IDs are UUIDs
- `yjsState` field exists but is in migration phase — `Content` string is source of truth currently
- Soft deletes via `deletedAt` — automated cleanup every 24h (deletes notes >30 days old)
- Folders use hex colors for visual organization (independent from note tags)

## Authentication & Session Management

**Server-side Sessions** (no JWT)
- Uses `express-session` 1.18.0 with optional Redis 7 adapter (`Server/src/config/sessionConfig.js`)
- Session storage: In-memory (dev) or Redis (production via `REDIS_URL` env var)
- Session cookie: `httpOnly: true`, `sameSite: 'lax'`, `secure: false` (dev), 10-year max age
- All protected routes use middleware in `Server/src/middlewares/authMiddleware.js`:
  - `requireAuth` — checks `req.session.userId`, adds `req.userId` to request
  - `requireNoteOwnership` — verifies note.authorId matches session userId (converts to Int)
  - `requireWriteAccess` — checks write permissions (role ≠ 3), prevents read-only users from editing

**OAuth Integration**
- Google OAuth2 via googleapis 160.0.0 (`Server/src/routes/googleAuthRoutes.js`)
- Middleware: `Server/src/middlewares/googleAuthMiddleware.js`
- Controller: `Server/src/controllers/googleAuthController.js`

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

**Email Verification**
- New users receive verification email via Nodemailer (Gmail SMTP)
- Token stored in `User.token`, validated via `/validate` route
- `is_verified` flag gates access to authenticated routes

## Real-Time Collaboration (In Development)

**Current Architecture**
- YJS 13.6.27 + y-websocket 2.0.4 integrated in `docker-compose.dev.yml`
- Standalone YJS WebSocket server on port 1234 (`yjs-server` service)
- `Note.yjsState` field (Bytes) exists for binary CRDT state storage
- **Content source of truth**: `Note.Content` (Lexical JSON string) — YJS state is supplementary

**Migration Status**
- `yjsState` field available but not fully implemented in production workflow
- Migration scripts exist: `Server/scripts/migrate-content-to-yjs.js`, `migrate-yjs-to-text.js`
- Some YJS integration in `Server/src/controllers/noteController.js` (lines 305-311, 939-948)

**Collaboration Service** (`Server/src/services/collaborationService.js`)
- Tracks active users per note via `Map<noteId, Set<socketId>>`
- Functions: `addUserToNote(noteId, socketId)`, `removeUserFromNote(noteId, socketId)`
- WebSocket references exist but Socket.IO NOT currently used in `app.js`

**Client Components**
- `Client/src/components/collaboration/` — ConnectedUsers, TitleSyncPlugin, TypingIndicator
- `TitleSyncPlugin.tsx` — Syncs note titles, respects read-only mode (`isReadOnly` prop)
- `AutoSavePlugin.tsx` — Handles auto-save with read-only detection

**Docker YJS Server**
- Service: `yjs-server` (Node 18 Alpine)
- Command: `npm install -g @y/websocket-server && y-websocket-server`
- Environment: `HOST=0.0.0.0`, `PORT=1234`
- Volume: `yjs-db/` directory persists WebSocket state

**Important Notes**
- NO active Socket.IO implementation in current `Server/src/app.js` (removed or not integrated)
- Collaboration features are WIP — rely on `Note.Content` for stable editing
- YJS integration planned but not production-ready

## API Conventions

**Error Responses**
```javascript
// Validation errors (express-validator 7.0.1)
{ errors: [...], message: "..." }

// General errors
{ error: "..." }
```

**Client Data Layer** (`Client/src/loader/loader.tsx`)
- NOT React components despite `.tsx` extension
- All network calls centralized here (e.g., `GetNotes()`, `CreateNote()`, `SaveNote()`)
- Lexical content parsing: extracts plain text from nested JSON structure for display
- **CRITICAL**: All fetch calls use `credentials: 'include'` for session cookies

**Note Content Storage**
- DB stores Lexical editor state as **JSON string** in `Note.Content`
- Client parses and renders: `JSON.parse(note.Content)` → extract text via recursive traversal
- Example in `GetNotes()` lines 55-98: handles `{root: {children: [...]}}`

**Health Check Endpoint** (`Server/src/app.js`)
```javascript
GET /health
// Returns: { status, timestamp, uptime, environment }
// Used by Docker healthchecks
```

**Base API Route**
```javascript
GET /
// Returns: { message, version, status, authenticated, user }
// Shows session state and user info
```

## Development Workflows

**Docker Development** (Recommended)
```bash
# Start full stack (client:3000, server:3001, postgres:5432, redis:6379, cleanup service, yjs-server:1234)
docker compose -f docker-compose.dev.yml up --build

# Volumes mounted for hot reload:
# - Client/src → /app/src
# - Server/src → /app/src  
# - Exclude node_modules via volume mounts

# Backend uses nodemon for auto-restart
# Frontend uses Next.js Turbopack for fast refresh
```

**Manual Development**
```bash
# Terminal 1: Server with nodemon auto-restart
cd Server && npm run dev

# Terminal 2: Client with Turbopack (fast refresh)
cd Client && npm run dev

# Set env vars:
# Server: DATABASE_URL, REDIS_URL, SESSION_SECRET, GMAIL_USER/GMAIL_APP_PASSWORD
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

# Database inspection:
npx prisma studio  # Launch GUI on http://localhost:5555
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

**View Database Roles** (Debugging)
```bash
docker exec yanotela-db-local psql -U yanotela_local -d yanotela_local -c \
  "SELECT n.\"Titre\", n.id as note_id, u.pseudo, p.role, 
   CASE WHEN p.role = 0 THEN '👑 Propriétaire' 
        WHEN p.role = 1 THEN '⚙️ Admin' 
        WHEN p.role = 2 THEN '✏️ Éditeur' 
        WHEN p.role = 3 THEN '👁️ Lecteur' 
   END as role_name 
   FROM \"Note\" n 
   LEFT JOIN \"Permission\" p ON n.id = p.id_note 
   LEFT JOIN \"User\" u ON p.id_user = u.id 
   ORDER BY n.\"ModifiedAt\" DESC LIMIT 20;"
```

## File Organization Patterns

**Client Structure**
```
src/app/[route]/page.tsx          # Next.js App Router pages (most use "use client")
src/components/[feature]/         # Feature-based components
src/loader/loader.tsx             # Centralized API calls (NOT a component)
src/hooks/use*.ts                 # Custom hooks (useAuthRedirect, useTheme)
src/type/[Type].ts               # TypeScript types (PascalCase filenames)
src/ui/                          # Reusable UI components
```

**Server Structure**
```
src/controllers/[feature]Controller.js  # Business logic
src/routes/[feature]Routes.js           # Route definitions with middleware
src/middlewares/authMiddleware.js       # requireAuth, requireWriteAccess
src/services/collaborationService.js    # User tracking per note
src/config/sessionConfig.js             # express-session setup
src/config/corsConfig.js                # CORS configuration
scripts/                                # Utility scripts (cleanup, migration, test data)
```

**ES Module Gotchas** (Server)
- `package.json` has `"type": "module"` → ALL imports MUST use `.js` extensions
- Example: `import { prisma } from './config/database.js'` (not `.ts`)

**Scripts Directory** (`Server/scripts/`)
- `cleanup-deleted-notes.js` — Deletes notes where `deletedAt < now() - 30 days`
- `create-test-user.js` — Generate test users for development
- `create-test-note.js` — Generate test notes for development
- `migrate-content-to-yjs.js` — Convert Lexical JSON to YJS state (experimental)
- `migrate-yjs-to-text.js` — Reverse migration from YJS to text (experimental)
- `test-folder-model.js` — Test folder model operations
- `test-yjs-field.js` — Test YJS field handling
- `remove-consoles-logs.js` — Remove console.log statements

## Critical Conventions

**Next.js App Router**
- Most pages use `"use client"` directive (Client/src/app/*/page.tsx)
- Server components used where appropriate (layout.tsx doesn't have "use client")
- Route structure matches file paths: `/notes` → `Client/src/app/notes/page.tsx`

**TailwindCSS v4**
- Custom properties in `Client/src/app/globals.css`:
  ```css
  @theme inline {
    --color-rouge-600: #882626;
    --color-background: #E9EBDB;
  }
  ```
- Three theme support: light (beige/red), dark (red crepuscule), blue
- Theme variables pattern: `--{theme}-{property}` (e.g., `--light-background`, `--dark-background`)
- Typography: Gantari (primary), Geologica (secondary), Nixie One (titles) via Google Fonts

**Permission System**
- `Permission.role`: 0 (owner), 1 (admin), 2 (editor), 3 (read-only)
- `Permission.isAccepted`: false until user accepts invitation
- Check in middleware: `requireWriteAccess` blocks role === 3
- Role hierarchy validation: lower role value = higher privilege (controllers verify `adminRole < targetRole`)
- Only role 0-1 can delete notes, add permissions, or manage collaborators
- **Client-side enforcement**: Read-only UI enforced when `userRole === 3`
- **Visual indicators**: Disabled toolbar + grayed out editor for read-only users

## Deployment Architecture

**Docker Compose Services** (`docker-compose.dev.yml`)
1. `db` — PostgreSQL 15 Alpine (port 5433 locally, 5432 internally)
2. `redis` — Session store (port 6380 locally, 6379 internally)
3. `backend` — Express API with Prisma migrations on startup (port 3001)
4. `frontend` — Next.js with Turbopack (port 3000)
5. `cleanup-notes` — Cron job (runs every 24h): deletes notes where `deletedAt < now() - 30 days`
6. `yjs-server` — YJS WebSocket server for collaboration (port 1234)

**Environment Variables**
- Server: `DATABASE_URL`, `REDIS_URL`, `SESSION_SECRET`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `CLIENT_URL`, `NODE_ENV`
- Client: `NEXT_PUBLIC_API_URL` (defaults to http://localhost:3001)

**Production Flow** (see `deploy/QUICKSTART.md`)
- GitHub Actions → Docker Hub → EC2 instance
- Secrets required: `DOCKER_USERNAME`, `DOCKER_PASSWORD`, `EC2_HOST`, `EC2_USER`, `EC2_SSH_PRIVATE_KEY`, `ENV_PROD_FILE`
- Nginx reverse proxy handles SSL termination (config in `nginx/default.conf`)
- Docker images: Frontend (standalone Next.js), Backend (Node.js + Prisma)

## Common Pitfalls

1. **Missing `credentials: 'include'`** → Session cookies not sent, 401 errors
2. **Forgot `.js` in imports** → Server ES module errors (package.json has `"type": "module"`)
3. **Prisma client out of sync** → Run `npx prisma generate` after schema changes
4. **Test DB collisions** → Always use `maxWorkers: 1` in jest.config.json
5. **YJS state assumptions** → Feature incomplete, rely on `Note.Content` string for now
6. **Client env var** → `NEXT_PUBLIC_API_URL` must be set or loader falls back to localhost
7. **Permission role values** → Use 0-3 scale (0=owner, 3=readonly), not 1-based indexing
8. **Lexical content parsing** → Content stored as stringified JSON, must parse recursively via `extractText()` in loader
9. **Read-only enforcement** → Check `note.userRole === 3` client-side and use `isReadOnly` prop in TitleSyncPlugin + AutoSavePlugin
10. **Content source of truth** → `Note.Content` is primary, `yjsState` is optional/experimental
11. **Docker compose file** → Use `docker-compose.dev.yml` for development (not default docker-compose.yml)
12. **Session middleware** → No Redis password in dev config, uses simple in-memory sessions by default

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
