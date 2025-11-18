# Tests Unitaires - Yanotela

Ce document décrit l'organisation et l'utilisation des tests unitaires dans le projet Yanotela.

## 📁 Organisation des Tests

### Server (Backend)
```
Server/tests/
├── unit/                          # Tests unitaires
│   └── services/
│       └── yjsMigration.test.js   # Tests pour le service de migration YJS
├── auth/                          # Tests d'intégration - authentification
├── notes/                         # Tests d'intégration - gestion des notes
└── bdd/                           # Tests d'intégration - base de données
```

### Client (Frontend)
```
Client/tests/
├── unit/                          # Tests unitaires
│   ├── hooks/
│   │   └── useAuthRedirect.test.ts # Tests pour le hook d'authentification
│   ├── utils/
│   │   └── notificationUtils.test.ts # Tests pour les utilitaires de notification
│   └── loader/
│       └── loader.test.ts         # Tests pour la couche API client
├── auth/                          # Tests d'intégration
├── login/                         # Tests de login
└── ui/                           # Tests UI
```

## 🚀 Exécution des Tests

### Tests Unitaires Server

```bash
cd Server

# Tous les tests unitaires
npm run test:unit

# Tests d'intégration (auth, notes, bdd)
npm run test:integration

# Tous les tests (unitaires + intégration)
npm run test

# Tests spécifiques
npm run test:auth      # Tests d'authentification
npm run test:notes     # Tests de gestion des notes
npm run test:bdd       # Tests base de données

# Mode watch
npm run test:watch
```

### Tests Unitaires Client

```bash
cd Client

# Tous les tests unitaires
npm run test:unit

# Tous les tests
npm run test

# Mode watch
npm run test:watch

# Avec couverture de code
npm run test:coverage
```

## 📊 Couverture des Tests

### Services Server (tests/unit/services/)

#### yjsMigration.test.js
- ✅ Migration JSON Lexical → YJS
- ✅ Gestion du contenu vide
- ✅ Gestion JSON invalide
- ✅ Extraction de texte de nœuds imbriqués
- ✅ Synchronisation YJS → texte brut
- ✅ Cycle complet migration → sync

#### emailService.test.js
- ✅ Envoi d'email de validation
- ✅ Envoi d'email de réinitialisation de mot de passe
- ✅ Configuration du transporteur
- ✅ Gestion des erreurs SMTP
- ✅ Mode test (simulation)
- ✅ URLs personnalisées

### Middlewares Server (tests/unit/middlewares/)

#### authMiddleware.test.js
- ✅ `requireAuth` - Vérification de session
- ✅ `requireNoteOwnership` - Vérification de propriété de note
- ✅ `requireWriteAccess` - Vérification des droits d'écriture
- ✅ Gestion des rôles (0=owner, 1=admin, 2=editor, 3=readonly)
- ✅ Conversion userId (string → int)
- ✅ Gestion des erreurs Prisma

### Hooks Client (tests/unit/hooks/)

#### useAuthRedirect.test.ts
- ✅ Vérification d'authentification
- ✅ Redirection vers /login si non authentifié
- ✅ Pages publiques (pas de redirection)
- ✅ Option `skipRedirect`
- ✅ Gestion des erreurs réseau
- ✅ Événements storage et auth-refresh
- ✅ Configuration API_URL

### Utilitaires Client (tests/unit/utils/)

#### notificationUtils.test.ts
- ✅ `refreshNotifications` - Dispatch d'événements
- ✅ `refreshNotificationsDebounced` - Debouncing
- ✅ Annulation de timeouts
- ✅ Délais personnalisés

### Loader Client (tests/unit/loader/)

#### loader.test.ts
- ✅ `CreateNote` - Création de note
- ✅ `GetNotes` - Récupération de la liste
- ✅ Extraction de texte Lexical
- ✅ Gestion du contenu vide/null
- ✅ Gestion JSON invalide
- ✅ Credentials `include` pour sessions

## 🔧 Configuration

### Server (Jest)
- **Config**: `Server/jest.config.json`
- **Environment**: Node.js
- **ES Modules**: `--experimental-vm-modules`
- **MaxWorkers**: 1 (évite les collisions DB)
- **Timeout**: 30s
- **Setup**: `tests/setup.js`

### Client (Jest)
- **Config**: `Client/jest.config.ts`
- **Environment**: jsdom (simule le navigateur)
- **Transform**: Babel (TypeScript + JSX)
- **Setup**: `@testing-library/jest-dom`
- **Module Mapper**: `@/` → `src/`

## 🎯 Bonnes Pratiques

### 1. Tests Unitaires vs Tests d'Intégration

**Tests Unitaires** (isolés, rapides):
- Services individuels
- Fonctions utilitaires
- Middlewares
- Hooks React
- Mocks pour dépendances externes

**Tests d'Intégration** (end-to-end):
- Routes API complètes
- Interactions avec la base de données
- Authentification complète
- Flux utilisateur

### 2. Mocking

#### Server
```javascript
// Mock Prisma
jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}));

// Mock nodemailer
jest.unstable_mockModule('nodemailer', () => ({
  default: { createTransport: mockCreateTransport }
}));
```

#### Client
```typescript
// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();
```

### 3. Nommage des Tests

```javascript
describe('Nom du module', () => {
  describe('Nom de la fonction/méthode', () => {
    test('devrait [comportement attendu]', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### 4. Nettoyage

```javascript
beforeEach(() => {
  jest.clearAllMocks();
  // Setup spécifique
});

afterEach(() => {
  // Cleanup
});
```

## 🐛 Debug des Tests

### Server
```bash
# Verbose mode
NODE_ENV=test node --experimental-vm-modules node_modules/jest/bin/jest.js tests/unit/ --verbose

# Un seul fichier
NODE_ENV=test node --experimental-vm-modules node_modules/jest/bin/jest.js tests/unit/services/yjsMigration.test.js

# Avec logs
NODE_ENV=test node --experimental-vm-modules node_modules/jest/bin/jest.js tests/unit/ --silent=false
```

### Client
```bash
# Verbose mode
npm run test:unit -- --verbose

# Un seul fichier
npm run test:unit -- useAuthRedirect.test.ts

# Avec logs
npm run test:unit -- --silent=false
```

## 📈 Métriques de Qualité

### Objectifs de Couverture
- **Services critiques**: ≥ 80%
- **Middlewares**: ≥ 80%
- **Hooks**: ≥ 70%
- **Utilitaires**: ≥ 90%

### Commandes de Couverture

```bash
# Server
cd Server
NODE_ENV=test node --experimental-vm-modules node_modules/jest/bin/jest.js tests/unit/ --coverage

# Client
cd Client
npm run test:coverage
```

## 🔄 CI/CD

Les tests unitaires s'exécutent automatiquement dans la pipeline GitHub Actions avant le déploiement.

### Workflow
1. Checkout du code
2. Installation des dépendances
3. **Tests unitaires** (rapides)
4. Tests d'intégration
5. Build
6. Déploiement

## 📚 Ressources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright](https://playwright.dev/)

## 🆘 Problèmes Courants

### Server - ES Modules
**Problème**: `ERR_MODULE_NOT_FOUND`
**Solution**: Utiliser `jest.unstable_mockModule()` et `--experimental-vm-modules`

### Client - Next.js Mocks
**Problème**: `useRouter is not a function`
**Solution**: Mock `next/navigation` avant l'import

### Prisma Mocks
**Problème**: Prisma non mocké correctement
**Solution**: Créer un mock Prisma complet avec toutes les méthodes utilisées

### Timeouts
**Problème**: Tests trop longs
**Solution**: Augmenter `testTimeout` dans jest.config ou utiliser `jest.setTimeout()`

---

**Version**: 1.0
**Dernière mise à jour**: Novembre 2025
