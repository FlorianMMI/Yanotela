# Yanotela - AI Coding Instructions

## Project Architecture

**Yanotela** is a full-stack note-taking application with strict client-server separation:

- **Client** (`Client/`): Next.js 15 app with App Router, TailwindCSS 4, TypeScript, and Lexical editor
- **Server** (`Server/`): Node.js Express API with Prisma ORM, PostgreSQL, session-based auth
- **Database**: PostgreSQL with Prisma migrations and schema in `Server/prisma/`

## Development Workflow

### Setup & Startup
- Use `./setup.sh` (bash) to start both services - installs deps, generates Prisma client, runs servers
- Client runs on `:3000`, Server on `:3001`
- Alternative: `npm run dev` in each directory separately

### GitFlow Convention
- Main branch: `develop` 
- Feature branches: `feature/US[X.Y]-description` (e.g., `feature/US1.1-creation-de-compte`)
- Commit format: `[US] - [Description]` (e.g., `[US1.1] - Création de la page d'inscription`)

## Key Patterns & Conventions

### Authentication Flow
- Session-based auth with `express-session` and Redis
- Client checks auth via `useAuthRedirect` hook: `fetch('http://localhost:3001/auth/check')`
- Email verification required (`is_verified` field in User model)
- Password reset via email tokens
- Always use `credentials: 'include'` for API calls

### API Communication
- Client → Server: `http://localhost:3001` with `credentials: 'include'`
- Routes: `/` (auth), `/note` (notes CRUD)
- Error handling: Express-validator on server, client displays validation errors

### File Organization
- **Client components**: `src/components/[featureName]/ComponentName.tsx`
- **Client pages**: `src/app/[route]/page.tsx` (App Router pattern)
- **Server controllers**: `src/controllers/[feature]Controller.js`
- **Types**: Client-side in `src/type/`, use PascalCase (e.g., `Note.ts`)

### Database Schema
```prisma
User: id, pseudo(unique), email(unique), password, token(unique), is_verified
Note: id, Titre, Content, authorId, ModifiedAt
```

### Styling System
- TailwindCSS 4 with CSS variables in `globals.css`
- Custom colors: `--rouge-fonce: #882626`, `--background: #E9EBDB`
- Fonts: Gantari (primary), Geologica (secondary)
- Background pattern: `--motif-image: url('/fond.jpg')` with opacity

### Testing
- **Server**: Jest with custom config, test categories: `auth/`, `notes/`, `bdd/`
- Run specific tests: `npm run test:auth`, `npm run test:notes`, `npm run test:bdd`
- Test environment isolation with `testUtils.js` cleanup

## Critical Integration Points

### Lexical Editor
- Rich text editor in notes, imported from `@lexical/react`
- Handle content as JSON/text in Note model's `Content` field

### Real-time Features
- Socket.io setup for collaborative editing (yjs dependency present)
- Motion library for animations (`motion` package)

## Development Commands

```bash
# Full setup
./setup.sh

# Server only
cd Server && npm run dev

# Client only  
cd Client && npm run dev

# Testing
cd Server && npm run test        # All tests
cd Server && npm run test:auth   # Auth tests only
cd Server && npm run test:notes  # Notes tests only

# Database
cd Server && npx prisma generate
cd Server && npx prisma migrate dev
```

## Common Gotchas
- Server uses ES modules (`"type": "module"` in package.json)
- Windows-specific test scripts use `set NODE_ENV=test&&` 
- Prisma client must be regenerated after schema changes
- Client uses `--turbopack` flag for faster builds
- Auth redirects happen client-side via `useAuthRedirect` hook