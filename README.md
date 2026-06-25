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
| Administrateur | `admin@campus.fr` | `admin123` |
| Enseignant | `prof.martin@campus.fr` | `prof123` |
| Étudiant | `alice.dupont@etud.campus.fr` | `etud123` |
| Agent maintenance | `maintenance@campus.fr` | `maint123` |

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

## Prochaines étapes

- Implémenter les modules placeholder (bâtiments, espaces, étudiants, énergie…)
- Ajouter les actions (contrôle HVAC, réservation de parking, signalement d'incident)
- Intégrer les graphiques recharts (consommation énergie, affluence, température historique)
- Ajouter la simulation de websockets pour les données temps réel
- Écrire les tests d'intégration (Playwright pour le flux d'authentification et RBAC)
