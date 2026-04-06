# PF Scoring V7++.3.1 industrialisée

Socle industrialisé pour une application bancaire de scoring Project Finance.

## Contenu
- Next.js App Router
- Prisma + PostgreSQL
- Authentification JWT par cookie HttpOnly
- RBAC : ADMIN, ANALYST, REVIEWER, RISK, COMMITTEE
- CRUD Projets / Évaluations / Décisions
- Workflow multi-niveaux paramétrable
- Audit trail champ par champ
- Paramétrage complet des grilles et règles No-Go
- Import Excel `.xlsx`
- Exports comité `CSV`, `PDF`, `DOCX`
- Dashboard portefeuille

## Démarrage
1. Copier `.env.example` en `.env`
2. Ajuster `DATABASE_URL` et `JWT_SECRET`
3. `npm install`
4. `npm run db:generate`
5. `npm run db:push`
6. `npm run db:seed`
7. `npm run dev`

## Comptes seedés
- `admin@bank.local`
- `analyst@bank.local`
- `reviewer@bank.local`
- `risk@bank.local`
- `committee@bank.local`

Mot de passe initial : `ChangeMe123!`

## Déploiement Vercel
- Ajouter les variables d'environnement
- Prévoir une base PostgreSQL accessible à Vercel
- Lancer `prisma generate` au build si nécessaire

## Structure
- `app/` : UI + API routes
- `lib/` : auth, scoring, audit, règles, exports
- `prisma/` : schéma et seed
- `sql/` : script d'initialisation SQL
