# Scoring Project Finance V7++ — Architecture cible industrialisable

_Date: 2026-04-18_

## 1) Diagnostic existant (étape 1)

### Points solides à conserver
- Modèle de versionning déjà présent (`ScoringModel`, `ScoringModelVersion`, `ScoringNode`, `ScoringNodeRule`).
- Services backend séparés (node/model/version/engine/validation).
- APIs admin scoring existantes pour manipuler les modèles et versions.
- Pré-existence des objets d’évaluation et de persistance des réponses/résultats.

### Écarts majeurs observés
- Contrôles de cohérence insuffisants avant publication (pondérations, orphelins, duplicats, contradictions).
- Validation peu centralisée dans le workflow de publication.
- Absence d’endpoint explicite de cohérence versionnable pour l’administration.
- Risque de divergence métier si une version est publiée sans vérification stricte.

### Dette technique/régression
- Mélange legacy / v7++ encore présent dans le repo : risque de confusion conceptuelle.
- Règles de validation jusque-là non branchées directement dans `publish`.
- Certaines validations étaient descriptives mais pas bloquantes.

## 2) Architecture cible détaillée (étape 2)

### Base de données
- Source unique: tables `ScoringModel*` et `ScoringNode*`.
- Hiérarchie pilotée par `ScoringNode.parentNodeId`.
- Référentiels: `ScoringNodeOption`, `ScoringNodeRange`.
- Règles et décisions: `ScoringNodeRule`.
- Versioning fort: `ScoringModelVersion` avec états (`DRAFT -> IN_REVIEW -> APPROVED -> PUBLISHED`).

### Backend
- Loader de version active/publiée.
- Validation de cohérence pré-publication (nouvelle étape bloquante).
- Publication impossible si incohérences structurelles/métier.
- Endpoint admin dédié à la vérification de cohérence d’une version.

### Frontend
- Le back-office doit appeler l’endpoint de validation avant transition en publication.
- Afficher erreurs (bloquantes) + warnings (non bloquants) avec navigation vers nœuds impactés.
- Prévoir badge “cohérence validée” par version.

### Moteur de scoring
- Reste piloté par configuration versionnée.
- Les garanties de qualité de modèle sont renforcées en amont (donc moteur plus fiable en exécution).
- Règles contradictoires détectées avant activation.

### Administration
- Workflow attendu:
  1. Édition du modèle;
  2. Validation cohérence (endpoint dédié);
  3. Correction;
  4. Publication bloquée tant que `valid=false`.

## 3) Schéma de données cible (étape 3)

Le schéma actuel v7++ couvre déjà les tables demandées avec équivalents opérationnels:
- `scoring_grid_versions` ⟶ `ScoringModelVersion`
- `scoring_domains/criteria/subcriteria/subsubcriteria` ⟶ `ScoringNode` (type hiérarchique)
- `scoring_value_lists` / `scoring_value_list_items` ⟶ `ScoringNodeOption`
- `scoring_rules` / `scoring_no_go_rules` / `decision_rules` ⟶ `ScoringNodeRule` (+ `ruleType`, `actionType`, `severity`)
- `scoring_evaluations` + détails ⟶ `ScoringEvaluation`, `ScoringEvaluationAnswer`, `ScoringEvaluationNodeResult`
- audit/changelog ⟶ `ScoringChangeLog`, `ScoringAuditLog`

Les contraintes renforcées côté service (implémentées dans ce lot):
- détection des codes nœuds dupliqués,
- détection nœuds orphelins,
- détection de cycles hiérarchiques,
- contrôle somme des pondérations (groupes frères + racine),
- détection de règles contradictoires,
- contrôle de référentiels incomplets (option/range).

## 4) Implémentation réalisée (étape 4)

### Backend / moteur de validation
- Extension de `ScoringValidationService.validateVersionForPublication`.
- Ajout d’un résumé de validation (`checkedNodes`, `checkedRules`, `checkedWeightGroups`).
- Ajout d’une tolérance numérique pour la vérification des pondérations.
- Ajout des validations structurelles et métiers avancées.

### Workflow de publication
- `ScoringVersionService.publishVersion` appelle désormais la validation de cohérence.
- Publication bloquée automatiquement en cas d’erreurs de cohérence.

### API administration
- Nouvel endpoint `GET /api/admin/scoring/models/:id/versions/:versionId/validate`.
- Retourne le résultat complet de validation pour l’UI d’administration.

## 5) Livrables et vigilance (étape 5)

### Livrables de ce lot
- Service de validation renforcé.
- Garde-fou de publication intégré.
- Endpoint d’audit de cohérence exploitable en back-office.
- Documentation d’architecture cible et trajectoire.

### Points de vigilance
- Harmoniser ensuite les écrans admin pour afficher/résoudre les erreurs de validation.
- Ajouter tests unitaires dédiés aux nouveaux contrôles de cohérence.
- Prévoir migration progressive des flux legacy vers v7++ unique.
- Étendre la validation aux cas de règles conditionnelles complexes (expressions croisées).
