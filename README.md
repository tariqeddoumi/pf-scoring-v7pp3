# PF Scoring V7++.3

Version V7++.3 du socle web de scoring Project Finance.

## Nouveautés majeures
- UI premium complète écran par écran
- designer graphique des grilles
- moteur de règles / no-go paramétrable
- dashboard portefeuille avancé
- exports comité premium PDF / DOCX / CSV avec mise en page banque

## Stack
- Next.js App Router
- TypeScript
- TailwindCSS
- Prisma
- PostgreSQL
- pdf-lib
- docx
- xlsx

## Comptes seed
- admin@bank.local
- analyst@bank.local
- reviewer@bank.local
- risk@bank.local
- committee@bank.local

Mot de passe initial:
`ChangeMe123!`

## Démarrage
```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

## SQL direct
Le script SQL est dans:
`sql/init_pf_scoring_v7pp3.sql`

## Remarque
Le livrable est un socle enrichi prêt à être poussé sur Git puis adapté et testé sur votre base PostgreSQL réelle.
