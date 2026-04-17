# PF Scoring V7++ — Gap analysis & plan d'exécution (refonte scoring)

> Date: 2026-04-17  
> Portée: état actuel du code + alignement avec le plan de refonte scoring demandé.

## 1) Réponse directe à la question

Non, **tous** les points de la refonte scoring (Lots 0→8) ne sont pas encore complètement implémentés dans le code actuel.  
En revanche, le socle existe déjà partiellement (modèles/versioning/nodes/services), et cette itération ajoute de la cohérence UI/API sur la gestion client (création + édition) pour la qualité fonctionnelle.

## 2) Constat actuel (synthèse)

### Déjà présent (partiel)
- Schéma Prisma incluant une famille `ScoringModel*` / `ScoringNode*` / `ScoringEvaluation*`.
- Services scoring dédiés (`scoring-model-service`, `scoring-node-service`, `scoring-engine`, etc.).
- APIs admin scoring déjà amorcées.

### Manques ou risques majeurs
- Source de vérité encore mixte (legacy + modèle flexible + logique codée).
- Moteur encore partiellement hardcodé selon certains domaines.
- Évaluation dynamique non totalement pilotée par version publiée.
- Traçabilité/snapshots de résolution de données à compléter (bindings client/projet).
- Cohérence et validation transverses à durcir (poids, cycles, terminal/enfants, ranges, formules, règles).

## 3) Plan d’implémentation recommandé (exécutable)

### Lot 0 — Stabilisation technique (priorité immédiate)
- [ ] Corriger erreurs build/lint bloquantes.
- [ ] Standardiser signatures routes dynamiques.
- [ ] Unifier client Prisma.
- [ ] Vérifier lockfile CI + build Vercel.

### Lot 1 — Modèle de données scoring
- [ ] Vérifier/compléter toutes les entités cibles demandées.
- [ ] Ajouter contraintes d’intégrité (unicité code nœud/version, FK, index).
- [ ] Préparer migrations propres (sans casser legacy).

### Lot 2 — Moteur générique
- [ ] Implémenter `runtime-model-loader`, `tree-builder`, `value-resolver`, `aggregation-engine`, `explainer`.
- [ ] Éliminer hardcoding métier domaine par domaine.

### Lot 3 — Évaluation dynamique
- [ ] Générer le formulaire à partir de la version publiée.
- [ ] Persister réponses et résultats par nœud.
- [ ] Ajouter endpoints `calculate`, `submit`, `results`.

### Lot 4 — Designer hiérarchique
- [ ] Éditeur arbre complet (add/move/duplicate/convert terminal↔parent).
- [ ] Édition barèmes/ranges/formules/règles/applicabilité/docs.

### Lot 5 — Bindings Client/Projet
- [ ] Introduire `ScoringNodeDataBinding`.
- [ ] Ajouter snapshots source/résolution et règle d’override.

### Lot 6 — Users/Habilitations
- [ ] Attributs de sécurité utilisateur (isActive, mustChangePassword, etc.).
- [ ] Audit de changement de droits/périmètres.

### Lot 7 — Maintenabilité
- [ ] Réduction `any`.
- [ ] DTO/typing de toutes les routes clés.
- [ ] Documentation technique par module.

### Lot 8 — Préfixe de tables paramétrable
- [ ] Industrialiser la génération `schema.prisma` à partir du template.
- [ ] Ajouter variable `TABLE_PREFIX` et scripts SQL générés.

## 4) Définition of Done (DoD) pour déclarer la refonte “terminée”

- Build local + CI + plateforme de déploiement OK.
- Évaluation lit exclusivement une version publiée.
- Formulaire 100% piloté modèle.
- Résolution binding + override + snapshot traçables.
- Moteur générique sans hardcoding métier.
- Résultats détaillés persistés par nœud.
- Contrôles de cohérence bloquants opérationnels.
- Documentation de reprise complète.
