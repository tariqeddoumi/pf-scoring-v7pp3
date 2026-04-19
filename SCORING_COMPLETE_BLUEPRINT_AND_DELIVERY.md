# Scoring module industrial blueprint & delivery

## 1. Diagnostic de l'existant
- Coexistence de moteurs legacy hardcodés et du runtime config-driven.
- Couverture partielle des API métiers demandées (`grids`, `consistency-check`, `runtime calculate`).
- Validation de cohérence présente mais encore à étendre aux futurs objets (`input_definitions`, `mappings`, `decision_rules`).

## 2. Architecture cible
- Base: schéma industriel `scoring_grid_versions` + hiérarchie + inputs + référentiels + mappings + rules + evaluations + audit.
- Back: moteur unique serveur (`ScoringRuntimeService`), services d'administration (`ScoringGridService`), endpoints métier.
- Front: entièrement dynamique via `/api/scoring/grids/:id/tree` et runtime contract.

## 3. Schéma SQL/Prisma final (cible)
- Voir migration: `sql/migrations/20260418_create_scoring_industrial_model.sql`.
- Le script introduit toutes les tables demandées (versions, hiérarchie, inputs, lists, mappings, rules, decisions, evaluations, results, comments, attachments, audit).

## 4. Services backend livrés
- `ScoringRuntimeService`: chargement version et calcul paramétrable.
- `ScoringGridService`: list/create/detail/consistency-check des versions de grille.

## 5. Endpoints livrés
- `GET /api/scoring/grids`
- `POST /api/scoring/grids`
- `GET /api/scoring/grids/:gridVersionId`
- `GET /api/scoring/grids/:gridVersionId/consistency-check`
- `GET /api/scoring/questionnaire?format=runtime`
- `POST /api/scoring/runtime/calculate`

## 6. Front dynamique (attendu)
- Liste des grilles + filtre statut.
- Éditeur grille piloté par métadonnées DB.
- Saisie opérationnelle dynamique avec navigation par domaines.
- Restitution résultats (score global, détails, règles déclenchées, décision).

## 7. Règles de calcul prises en charge
- Mappings: option direct, range numérique, valeur directe, manuel.
- Agrégation: weighted average / sum / min / max / first non null / simple average.
- Application des règles globales `condition_expression = 'always'` en première phase (prépare no-go/malus/bonus/décision complète).

## 8. Contrôles de cohérence
- Duplicats code, orphelins, cycles, poids, ranges chevauchants, règles contradictoires.
- Endpoint dédié de vérification avant publication.

## 9. Tests d'acceptation implémentés
- Cas de score pondéré correct.
- Cas règle bloquante no-go -> décision reject.
- Cas incohérence de poids -> alerte.

## 10. Stratégie de migration
- Voir `SCORING_MIGRATION_PLAYBOOK.md`.
- Déploiement SQL cible, seed baseline, backfill hiérarchie/référentiels/évaluations, vérification parité, cutover.

## 11. Points de vigilance
- Finaliser l'exécuteur d'expressions sécurisé pour règles avancées.
- Basculer totalement les flux legacy sur runtime.
- Résoudre les conflits de merge dans `app/evaluations/new/page.tsx` pour rétablir le type-check global.
