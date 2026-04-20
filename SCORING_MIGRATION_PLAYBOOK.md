# Scoring migration playbook (legacy -> industrial model)

## Step 1 - Inventory existing assets
- Legacy tables: `ScoreDomain`, `ScoreCriterion`, `ScoreOption`, `ScoreRange`, `Evaluation*`.
- V7++ tables: `ScoringModel*`, `ScoringNode*`, `ScoringEvaluation*`.
- SQL hierarchy source: `sql/migrations/20260417_upsert_pf_v7pp_hierarchy.sql`.

## Step 2 - Deploy target schema
1. Apply `sql/migrations/20260418_create_scoring_industrial_model.sql`.
2. Apply seed baseline `sql/migrations/20260418_seed_scoring_industrial_model.sql`.

## Step 3 - Backfill hierarchy
- Use validated hierarchy from `20260417_upsert_pf_v7pp_hierarchy.sql` as source-of-truth.
- Map hierarchy levels into:
  - `scoring_domains`
  - `scoring_criteria`
  - `scoring_subcriteria`
  - `scoring_subsubcriteria`

## Step 4 - Backfill referentials and mappings
- Convert `ScoringNodeOption` -> `scoring_value_lists` + `scoring_value_list_items`.
- Convert `ScoringNodeRange`/formula behaviors -> `scoring_mappings` + `scoring_mapping_lines`.

## Step 5 - Backfill evaluations
- For each historical evaluation, create:
  - header in `scoring_evaluations`
  - answer rows in `scoring_evaluation_items`
  - computed rows in `scoring_evaluation_results`
- Keep immutable snapshots (`*_snapshot` columns and `calculation_snapshot_json`).

## Step 6 - Verify parity
- Run consistency checks before publish.
- Compare legacy score vs new engine score on regression sample.

## Step 7 - Cutover
- Front reads only runtime/grid APIs.
- Back computes scores only with centralized runtime service.
- Lock legacy writes after parity sign-off.
