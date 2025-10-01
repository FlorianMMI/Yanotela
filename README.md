# Yanotela

**Yanotela** est une application de prise de notes full-stack, conçue pour la collaboration en temps réel, la sécurité et la performance.

---

## Architecture

- **Client** : Next.js 15 (App Router), TypeScript, TailwindCSS 4, éditeur Lexical
- **Serveur** : Node.js Express, Prisma ORM, PostgreSQL, authentification par session
- **Base de données** : PostgreSQL, migrations Prisma

---

## Démarrage rapide

### Avec Docker (recommandé, compatible WSL)

```bash
# Lancer toute la stack (client + serveur + base de données)
docker compose up --build
```
- Client : http://localhost:3000
- Serveur : http://localhost:3001

> **Astuce WSL** : Assurez-vous que Docker Desktop est lancé sous WSL2.  
> Les volumes et ports sont automatiquement mappés.

### Sans Docker

```bash
# Installation et lancement des services (client + serveur)
./setup.sh
```
- Client : http://localhost:3000
- Serveur : http://localhost:3001

---

## Fonctionnalités principales

- Authentification par session (Express-session + Redis)
- Vérification email obligatoire
- Réinitialisation du mot de passe par email
- Prise de notes riche (éditeur Lexical)
- Collaboration en temps réel (Socket.io, yjs)
- Gestion des erreurs et validation (express-validator)
- Interface moderne (TailwindCSS, Gantari/Geologica)

---

## Structure des dossiers

```
Client/   # Frontend Next.js
Server/   # Backend Express/Prisma
```

- Composants : `Client/src/components/[feature]/`
- Pages : `Client/src/app/[route]/page.tsx`
- Contrôleurs serveur : `Server/src/controllers/`
- Types : `Client/src/type/`

---

## Commandes utiles

```bash
# Lancer uniquement le serveur
cd Server && npm run dev

# Lancer uniquement le client
cd Client && npm run dev

# Générer le client Prisma
cd Server && npx prisma generate

# Appliquer les migrations Prisma
cd Server && npx prisma migrate dev

# Lancer les tests serveur
cd Server && npm run test
```

---

## Tests

- **Jest** côté serveur (`auth/`, `notes/`, `bdd/`)
- Isolation de l’environnement de test via `testUtils.js`

---

## Conventions

- Branches : `develop` (principale), `feature/US[X.Y]-description`
- Commits : `[USX.Y] - Description`
- Appels API : `credentials: 'include'`
- Authentification vérifiée côté client via `useAuthRedirect`

---

## Schéma de la base de données (Prisma)

```prisma
User: id, pseudo(unique), email(unique), password, token(unique), is_verified
Note: id, Titre, Content, authorId, ModifiedAt
```

---

## Personnalisation UI

- Couleurs : `--rouge-fonce: #882626`, `--background: #E9EBDB`
- Police : Gantari (primaire), Geologica (secondaire)
- Motif de fond : `/fond.jpg` (opacité)

---

## Licence

MIT

---