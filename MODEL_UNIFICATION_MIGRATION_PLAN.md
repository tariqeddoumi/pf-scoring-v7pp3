# Model Unification Plan — Legacy `Evaluation/ScoreDomain*` to `ScoringEvaluation + Runtime`

## Goal
Disable legacy evaluation flows without breaking client integrations, then migrate endpoint-by-endpoint to runtime-backed scoring.

## Endpoint migration map

| Legacy endpoint | New runtime target | Status |
|---|---|---|
| `POST /api/evaluations` | `ScoringEvaluationService.createEvaluation` | migrated |
| `GET /api/evaluations` | `scoringEvaluation` list from Prisma | migrated |
| `GET /api/evaluations/:id` | `ScoringEvaluationService.getEvaluationWithResults` | migrated |
| `POST /api/evaluations/calculate-score` | `ScoringEvaluationService.recordAnswer + calculateScores` | migrated |
| `POST /api/evaluations/submit` | `ScoringEvaluationService.submitEvaluation` | migrated |
| `POST /api/evaluations/validate` | `ScoringEvaluationService.approveEvaluation` | migrated |
| `POST /api/evaluations/reject` | `ScoringEvaluationService.rejectEvaluation` | migrated |
| `PUT/DELETE /api/evaluations/:id` | disabled (HTTP 410) | migrated |

## Non-regression rollout
1. Keep route paths stable (`/api/evaluations/*`) to avoid front breakage.
2. Switch internal implementation to `ScoringEvaluationService` only.
3. Keep response structure (`{ data: ... }`) where possible.
4. Return explicit `410 Gone` for legacy update/delete operations.
5. Remove unused legacy service (`lib/services/evaluation-service.ts`).

## Data model stance
- Runtime source of truth: `ScoringModelVersion`, `ScoringNode`, `ScoringEvaluation`, `ScoringEvaluationAnswer`, `ScoringEvaluationNodeResult`.
- Legacy service `EvaluationService` removed from runtime path.

## Next hardening steps
- Drop legacy Prisma models in a dedicated DB migration after production data reconciliation.
- Add integration tests for endpoint parity and payload snapshots.
