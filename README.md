# Smart Campus — Tableau de bord de gestion universitaire

Prototype hackathon d'un système de gestion de campus intelligent, couvrant 15 modules fonctionnels avec une interface en français.

## Stack technique

| Couche | Technologie |
|--------|------------|
| Framework | Next.js 16 (App Router, Server Components) |
| Langage | TypeScript strict |
| Styles | Tailwind CSS v4 (mobile-first) |
| UI | shadcn/ui v4 + lucide-react + recharts |
| ORM | Prisma v7 (driver adapter libsql) |
| Base de données | SQLite (fichier local `dev.db`) |
| Auth | NextAuth.js v4 (JWT, CredentialsProvider) |
| Mots de passe | bcryptjs (coût 10) |

> **Note Prisma v7** : Prisma v7 requiert un driver adapter. On utilise `@prisma/adapter-libsql` + `@libsql/client` pour SQLite. Le client généré est dans `src/generated/prisma/`.

## Lancement du projet

```bash
# 1. Installer les dépendances
npm install

# 2. Copier les variables d'environnement
cp .env.example .env
# (ou créer .env avec le contenu ci-dessous)

# 3. Appliquer la migration et générer le client Prisma
npx prisma migrate dev --name init

# 4. Seeder la base de données (données réalistes)
npx prisma db seed
# ou : npm run db:seed

# 5. Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### Fichier `.env` requis

```env
DATABASE_URL="file:dev.db"
NEXTAUTH_SECRET="smart-campus-dev-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

### Réinitialiser la base de données

```bash
npm run db:reset
# équivalent : npx prisma migrate reset --force && npx prisma db seed
```

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Administrateur | `admin@campus.fr` | `Admin1234!` |
| Enseignant | `prof@campus.fr` | `Prof1234!` |
| Étudiant | `etudiant@campus.fr` | `Etudiant1!` |
| Agent maintenance | `maintenance@campus.fr` | `Maint1234!` |

## Structure du projet

```
smart-campus/
├── prisma/
│   ├── schema.prisma          # 19 modèles, 10+ enums
│   ├── seed.ts                # Script de seed (tsx)
│   └── migrations/            # Migrations SQL générées
├── prisma.config.ts           # Config Prisma v7 (datasource, seed)
├── src/
│   ├── app/
│   │   ├── login/             # Page de connexion
│   │   ├── api/auth/          # Route NextAuth
│   │   └── dashboard/         # Shell + 14 modules
│   │       ├── page.tsx       # Tableau de bord principal
│   │       ├── layout.tsx     # Layout protégé (session)
│   │       ├── parking/
│   │       ├── lighting/
│   │       ├── hvac/
│   │       ├── incidents/
│   │       ├── security/
│   │       ├── courses/
│   │       ├── notifications/
│   │       └── ...            # buildings, space, dorms, energy, etc.
│   ├── components/
│   │   ├── layout/            # Sidebar, Header, MobileNav
│   │   └── dashboard/         # StatCard, AlertCard, ModulePlaceholder
│   ├── generated/
│   │   └── prisma/            # Client Prisma généré (ne pas éditer)
│   ├── lib/
│   │   ├── prisma.ts          # Singleton Prisma avec adapter libsql
│   │   ├── auth.ts            # Configuration NextAuth
│   │   └── permissions.ts     # Matrice RBAC (can(role, module, action))
│   └── types/
│       ├── index.ts           # Re-exports types Prisma
│       └── next-auth.d.ts     # Extensions de types NextAuth
└── public/
```

## Modèles de base de données

| Modèle | Description |
|--------|-------------|
| `User` | Utilisateurs (4 rôles : ADMIN, TEACHER, STUDENT, MAINTENANCE) |
| `Student` | Profil étudiant lié à User |
| `Building` | Bâtiments du campus |
| `Zone` | Zones au sein d'un bâtiment |
| `Room` | Salles (cours, dortoir, bureau…) |
| `Equipment` | Équipements par salle (volets, lumières, capteurs) |
| `HvacUnit` | Unités HVAC avec consigne, température mesurée, mode |
| `ParkingLot` | Parkings avec tarification |
| `ParkingSpot` | Places individuelles (STANDARD / HANDICAP / EV / RESERVED) |
| `ParkingReservation` | Réservations de places |
| `StreetLight` | Éclairage extérieur (ON/OFF/AUTO/FAULT) |
| `Course` | Cours du catalogue |
| `CourseSession` | Sessions planifiées (date, heure, salle) |
| `Attendance` | Présences aux sessions |
| `CampusPresence` | Entrées/sorties de présence sur le campus |
| `DormAssignment` | Affectation étudiant ↔ chambre de dortoir |
| `OccupancyRecord` | Historique du taux d'occupation des salles |
| `SensorReading` | Relevés capteurs (temp, humidité, CO2, présence, lumière) |
| `Incident` | Incidents et demandes de maintenance |
| `AccessLog` | Journal d'accès append-only (badge, lieu, résultat) |
| `Notification` | Notifications et alertes utilisateur |
| `RoomReservation` | Réservations de salles |

## Données de seed

Le script `prisma/seed.ts` génère un campus fictif crédible :

- **4 bâtiments** : Ampère, Curie, Darwin, Résidence (+ 9 zones)
- **48 salles** équipées (volets, lumières, capteurs de présence)
- **58 utilisateurs** : 1 admin, 5 enseignants, 50 étudiants, 1 agent maintenance + 1 gardien de sécurité
- **9 unités HVAC** avec températures et modes variés
- **130 places de parking** réparties sur 3 parkings avec tarification différenciée
- **32 lampadaires** extérieurs (dont quelques-uns en panne ou en mode auto)
- **8 cours** du catalogue avec 40 sessions planifiées
- **3 360 relevés capteurs** simulés sur 7 jours
- Incidents, journaux d'accès, notifications et présences simulés

## Architecture de sécurité

### Authentification
- Sessions JWT (pas de sessions serveur à gérer)
- Mots de passe hashés avec bcryptjs (coût 10)
- Redirection automatique vers `/login` si non authentifié

### Autorisation (RBAC)
```typescript
can(role, module, action)
// Exemple : can("STUDENT", "parking", "reserve") → true
//           can("STUDENT", "security", "view")   → false
```

La matrice complète est dans `src/lib/permissions.ts`.

### Journal d'accès append-only
Le modèle `AccessLog` est en **mode append-only** au niveau applicatif : aucun `UPDATE` ni `DELETE` n'est exécuté sur cette table. Chaque accès est horodaté côté serveur. Les tentatives refusées sont systématiquement enregistrées. Ceci constitue l'axe **cybersécurité** du projet.

## Simulation IoT & IA

Le campus ne dispose pas de vrais capteurs — les données sont simulées :

- **Capteurs** : relevés générés avec bruit gaussien autour de valeurs de base par type de salle (heure, jour, occupation)
- **HVAC** : températures mesurées avec dérive aléatoire par rapport à la consigne
- **Parking** : places générées avec taux d'occupation réaliste selon l'heure
- **Optimisation des espaces** (module à venir) : heuristique de réaffectation basée sur le taux d'utilisation historique
- **Prédiction énergie** (module à venir) : régression simple sur les relevés capteurs simulés
- **Prédiction affluence cafétéria** (module à venir) : modèle basé sur l'emploi du temps des cours

## Modules implémentés

| Module | Status | Route |
|--------|--------|-------|
| Tableau de bord | ✅ Données réelles | `/dashboard` |
| Parking | ✅ Données réelles | `/dashboard/parking` |
| Éclairage extérieur | ✅ Données réelles | `/dashboard/lighting` |
| HVAC / Température | ✅ Données réelles | `/dashboard/hvac` |
| Incidents & Maintenance | ✅ Données réelles | `/dashboard/incidents` |
| Sécurité & Accès | ✅ Données réelles | `/dashboard/security` |
| Cours & Emploi du temps | ✅ Données réelles | `/dashboard/courses` |
| Notifications & Alertes | ✅ Données réelles | `/dashboard/notifications` |
| Bâtiments & Salles | 🚧 Placeholder | `/dashboard/buildings` |
| Gestion des espaces | 🚧 Placeholder | `/dashboard/space` |
| Résidences | 🚧 Placeholder | `/dashboard/dorms` |
| Étudiants & Présence | 🚧 Placeholder | `/dashboard/students` |
| Réservations de salles | 🚧 Placeholder | `/dashboard/reservations` |
| Énergie | 🚧 Placeholder | `/dashboard/energy` |
| Affluence cafétéria | 🚧 Placeholder | `/dashboard/affluence` |

## Migration vers Supabase (PostgreSQL)

Le projet est SQLite en local. Pour passer à Supabase :

### 1. Vérifier la compatibilité du schéma

Le schéma Prisma est entièrement compatible PostgreSQL. Points d'attention :
- Remplacer le driver adapter : supprimer `@prisma/adapter-libsql` et `@libsql/client`, installer `@prisma/adapter-neon` ou utiliser le connecteur natif Prisma.
- SQLite n'a pas d'`ENUM` natif (Prisma les émule) — PostgreSQL les supportera nativement, pas de changement à faire.
- Les `Float` SQLite → `DoublePrecision` PostgreSQL (transparent avec Prisma).

### 2. Modifier le provider

Dans `prisma/schema.prisma` :
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  # directUrl = env("DIRECT_URL")  # décommentez si vous utilisez PgBouncer
}
```

Dans `prisma.config.ts`, le datasource URL sera lu depuis l'env.

### 3. Configurer les variables d'environnement

```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

### 4. Migrer et seeder

```bash
npx prisma migrate deploy  # en production (applique les migrations existantes)
# ou
npx prisma migrate dev     # en dev (crée une nouvelle migration)
npx prisma db seed
```

### 5. Adapter le client Prisma

Dans `src/lib/prisma.ts` et `prisma/seed.ts`, remplacer l'adapter libsql par l'adapter Neon ou supprimer complètement l'adapter (les providers PostgreSQL modernes n'en ont pas besoin avec Prisma v7+).

## Matrice de permissions

| Module | ADMIN | TEACHER | STUDENT | MAINTENANCE |
|--------|-------|---------|---------|-------------|
| Tableau de bord | Tout | Ses cours | Son emploi du temps | Incidents en attente |
| Parking | Gérer | — | Voir + Réserver | — |
| Éclairage ext. | Contrôle | — | — | Voir + Panne |
| Bâtiments/Équip. | Gérer | Sa salle | — | Voir + Panne |
| HVAC | Contrôle | Sa salle | — | Voir + Panne |
| Espaces | Gérer | Voir | — | — |
| Résidences | Gérer | — | Sa chambre | — |
| Étudiants | Gérer | Ses étudiants | Son profil | — |
| Cours | Gérer | Ses cours + appel | Ses cours | — |
| Réservations | Gérer | Créer | — | — |
| Énergie | Voir | — | — | — |
| Affluence | Voir | Voir | Voir | — |
| Sécurité/Logs | Voir | — | — | — |
| Incidents | Gérer | Signaler | Signaler | Gérer |
| Admin/Utilisateurs | Gérer | — | — | — |
| Préférences | Oui | Oui | Oui | Oui |

## Prochaines étapes

- Contrôle IoT en temps réel (lumières, HVAC) — API PATCH + revalidation
- Appel des étudiants dans la page Cours (enseignant)
- Graphiques recharts (consommation énergie, affluence, température historique)
- Simulation WebSocket pour les données capteurs en temps réel
- Tests d'intégration (Playwright) pour les flux auth et RBAC
