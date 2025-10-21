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
- **Custom properties**: `--rouge-fonce: #882626`, `--background: #E9EBDB`
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
