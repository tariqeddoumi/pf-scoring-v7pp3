-- Quick consistency checks for scoring configuration vs runtime evaluation model
-- Usage: psql "$DATABASE_URL" -f sql/quick_check_scoring_consistency.sql

-- 1) Runtime model/version used by evaluation UI/API
SELECT m.code AS model_code,
       v.id AS version_id,
       v."versionNumber" AS version_number,
       v."isPublished" AS is_published,
       v.status
FROM "BCP_SCORE_GP_v7pp_scoring_models" m
JOIN "BCP_SCORE_GP_v7pp_scoring_versions" v ON v."modelId" = m.id
WHERE m.code = 'PF_V7PP'
ORDER BY v."isPublished" DESC, v."versionNumber" DESC;

-- 2) Runtime hierarchy depth counts (must include SUB_SUB_CRITERION for finest level)
SELECT n."nodeType", count(*) AS node_count
FROM "BCP_SCORE_GP_v7pp_scoring_nodes" n
JOIN "BCP_SCORE_GP_v7pp_scoring_versions" v ON v.id = n."versionId"
JOIN "BCP_SCORE_GP_v7pp_scoring_models" m ON m.id = v."modelId"
WHERE m.code = 'PF_V7PP'
  AND (v."isPublished" = true OR v.status = 'PUBLISHED')
GROUP BY n."nodeType"
ORDER BY n."nodeType";

-- 3) Check that scored nodes exist at SUB_SUB_CRITERION level
SELECT count(*) AS scored_sub_sub_criteria
FROM "BCP_SCORE_GP_v7pp_scoring_nodes" n
JOIN "BCP_SCORE_GP_v7pp_scoring_versions" v ON v.id = n."versionId"
JOIN "BCP_SCORE_GP_v7pp_scoring_models" m ON m.id = v."modelId"
WHERE m.code = 'PF_V7PP'
  AND (v."isPublished" = true OR v.status = 'PUBLISHED')
  AND n."nodeType" = 'SUB_SUB_CRITERION'
  AND COALESCE(n."isScored", true) = true;

-- 4) Legacy table footprint (only for legacy admin screen compatibility)
SELECT
  (SELECT count(*) FROM "BCP_SCORE_GP_scoring_criteria") AS legacy_criteria,
  (SELECT count(*) FROM "BCP_SCORE_GP_scoring_thresholds") AS legacy_thresholds,
  (SELECT count(*) FROM "BCP_SCORE_GP_scoring_options") AS legacy_options;

-- 5) Industrial hierarchy footprint seeded from runtime hierarchy
SELECT
  (SELECT count(*) FROM scoring_domains) AS industrial_domains,
  (SELECT count(*) FROM scoring_criteria) AS industrial_criteria,
  (SELECT count(*) FROM scoring_subcriteria) AS industrial_subcriteria,
  (SELECT count(*) FROM scoring_subsubcriteria) AS industrial_subsubcriteria;
