# Refonte complète du module scoring Project Finance (V7++)

_Date: 2026-04-18_

## 1) Diagnostic (existant)

### 1.1 Hardcoding métier encore présent
- `lib/scoring-model.ts` et `lib/scoring-engine.ts` portent encore une logique métier codée en dur (domaines, critères, options, pondérations, mappings) alors que l’objectif cible impose un pilotage 100% DB/config.
- Les routes legacy de calcul (`/api/evaluations/[id]/score/calculate`) s’appuient encore sur `scoring-engine-v7plus` + règles/validateurs hardcodés.

### 1.2 Multiplicité des moteurs
- Plusieurs moteurs coexistent (`scoring-engine.ts`, `scoring-engine-v7plus.ts`, `lib/services/scoring-engine.ts`) avec des paradigmes différents.
- Risque élevé de divergence front/back et de non-auditabilité du calcul.

### 1.3 Contrats front/back hétérogènes
- APIs questionnaire renvoient des structures variables selon les routes/services.
- Nommage et granularité de concepts non uniformes (`Domain/Criteria/SubCriteria` vs `ScoringNode`).

### 1.4 Administration et publication
- Le versioning existe mais la chaîne complète “design -> validation -> publication -> exécution” n’était pas totalement verrouillée.
- Le contrôle de cohérence a été renforcé dans le lot précédent, mais il restait à centraliser le contrat runtime.

## 2) Architecture cible

### 2.1 Canon métier unique
- **Unité métier universelle** : `ScoringNode` (domain/criterion/subcriterion/subsubcriterion/leaf).
- **Contrat runtime unique** : `RuntimeScoringModel` + `RuntimeScoringNode` + `RuntimeScoreResult`.
- **Granularité paramétrable** : `CRITERION | SUB_CRITERION | SUB_SUB_CRITERION` via metadata de nœud.

### 2.2 Backend (services)
- `ScoringRuntimeService.getRuntimeModel(versionId?)`
  - Charge version publiée (ou version explicitement demandée).
  - Construit l’arbre runtime pour le front et le moteur.
- `ScoringRuntimeService.evaluateAnswers(model, answers)`
  - Exécution centralisée, pilotée par configuration.
  - Agrégation pondérée hiérarchique.
  - Alerting de cohérence de pondérations.

### 2.3 API
- `GET /api/scoring/questionnaire?format=runtime[&modelVersionId=...]`
  - Retourne le contrat runtime (arbre + métadonnées version).
- `POST /api/scoring/runtime/calculate`
  - Calcule un score uniquement à partir de la configuration versionnée + réponses.

### 2.4 Front
- Le front doit consommer le contrat runtime et rendre dynamiquement :
  - sections/domaines,
  - widgets selon `answerType`,
  - options/ranges depuis DB,
  - règles d’affichage depuis metadata/UI schema.

### 2.5 Administration / auditabilité
- Publication bloquée si validations échouent (lot précédent).
- Runtime model versionné et explicite dans toutes les réponses API.
- Même modèle utilisé pour affichage + calcul = réduction du risque de divergence.

## 3) Schéma de données (cible)

Le schéma actuel supporte la cible via les entités suivantes :
- `ScoringModel` / `ScoringModelVersion`
- `ScoringNode` (hiérarchie multi-niveaux)
- `ScoringNodeOption` (value lists)
- `ScoringNodeRange` (barèmes/intervals)
- `ScoringNodeRule` (no-go, malus, warnings)
- `ScoringEvaluation` + `ScoringEvaluationAnswer` + `ScoringEvaluationNodeResult`
- `ScoringChangeLog` / `ScoringAuditLog`

Compléments de gouvernance recommandés (prochain lot):
- Convention metadata JSON normalisée (`scoringLevel`, `inputType`, `displayConditions`, `requiredCommentRules`).
- Index additionnels par `versionId + isActive + depth`.
- Table dédiée “value lists transverses” si mutualisation inter-nœuds requise.

## 4) Plan de migration

### Phase 0 — Stabilisation
- Geler les évolutions sur les moteurs legacy.
- Corriger les conflits de merge préexistants bloquant le type-check.

### Phase 1 — Coexistence contrôlée
- Conserver legacy pour compatibilité.
- Introduire routes runtime (fait dans ce lot) et basculer progressivement le front vers `format=runtime`.

### Phase 2 — Bascule
- Migrer les écrans de saisie/consultation scoring vers le contrat runtime unique.
- Brancher les workflows de calcul/validation sur `ScoringRuntimeService`.

### Phase 3 — Décommission legacy
- Retirer dépendances `scoring-model.ts` / `scoring-engine-v7plus.ts` des flux critiques.
- Conserver uniquement le moteur central runtime + versioning.

## 5) Implémentation réalisée dans ce lot

1. Nouveau contrat runtime unifié (`lib/scoring-runtime-contract.ts`).
2. Nouveau service central de chargement modèle + calcul (`lib/services/scoring-runtime-service.ts`).
3. Extension de l’API questionnaire pour exposition runtime par défaut (`format=runtime`).
4. Nouveau endpoint de calcul config-driven (`POST /api/scoring/runtime/calculate`).
5. Le calcul runtime est désormais adossé à la hiérarchie configurée (`isScored`, `aggregationMethod`, `weight`) au lieu d’une logique métier arbitraire codée en dur.
6. Pré-équipement pour l’évolution vers no-go/malus/décision auto via exposition runtime des règles versionnées (`ScoringNodeRule`) et journalisation des règles déclenchées.

## 6) Tests

- Lint ciblé des nouveaux fichiers runtime et route questionnaire.
- Test unitaire existant exécuté pour non-régression locale.
- Limitation connue: type-check global échoue actuellement sur des conflits legacy hors périmètre.

## 7) Risques et points de vigilance

- Tant que des routes legacy calculent encore via moteur hardcodé, il subsiste un risque de divergence.
- Les metadata JSON doivent être gouvernées strictement (catalogue de clés, validation).
- Les poids historiques non normalisés peuvent produire des alertes runtime.
- Il faut prévoir une campagne de tests de non-régression métier avec jeux de cas bancaires réels.
