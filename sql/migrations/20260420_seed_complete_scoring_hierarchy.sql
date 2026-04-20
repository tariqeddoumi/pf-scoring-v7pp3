-- Complete seed of scoring hierarchy (domain -> criterion -> subcriterion -> subsubcriterion)
-- for industrialized tables from the runtime V7++ node model.
--
-- Source tables (auto-detected prefix):
--   <prefix>_v7pp_scoring_models
--   <prefix>_v7pp_scoring_versions
--   <prefix>_v7pp_scoring_nodes
--
-- Target tables:
--   scoring_grid_versions
--   scoring_domains
--   scoring_criteria
--   scoring_subcriteria
--   scoring_subsubcriteria
--
-- Usage:
--   psql "$DATABASE_URL" -f sql/migrations/20260420_seed_complete_scoring_hierarchy.sql

BEGIN;

DO $$
DECLARE
  pfx text;
  src_model_tbl text;
  src_version_tbl text;
  src_node_tbl text;

  src_model_id text;
  src_version_id text;
  src_version_num int;

  tgt_grid_version_id uuid;
  inserted_domains int := 0;
  inserted_criteria int := 0;
  inserted_subcriteria int := 0;
  inserted_subsubcriteria int := 0;
BEGIN
  -- Detect runtime table prefix.
  IF to_regclass('public."BCP_SCORE_GP_v7pp_scoring_models"') IS NOT NULL THEN
    pfx := 'BCP_SCORE_GP';
  ELSIF to_regclass('public."BP_PF_v7pp_scoring_models"') IS NOT NULL THEN
    pfx := 'BP_PF';
  ELSE
    RAISE EXCEPTION 'Could not find runtime scoring model tables with prefix BCP_SCORE_GP or BP_PF';
  END IF;

  src_model_tbl := format('%I_v7pp_scoring_models', pfx);
  src_version_tbl := format('%I_v7pp_scoring_versions', pfx);
  src_node_tbl := format('%I_v7pp_scoring_nodes', pfx);

  -- Resolve model PF_V7PP.
  EXECUTE format('SELECT id FROM %s WHERE code = $1 LIMIT 1', src_model_tbl)
    INTO src_model_id
    USING 'PF_V7PP';

  IF src_model_id IS NULL THEN
    RAISE EXCEPTION 'Model PF_V7PP not found in %', src_model_tbl;
  END IF;

  -- Pick published version first, fallback to highest version number.
  EXECUTE format(
    'SELECT id, "versionNumber"
       FROM %s
      WHERE "modelId" = $1
      ORDER BY CASE WHEN "isPublished" THEN 0 ELSE 1 END, "versionNumber" DESC
      LIMIT 1',
    src_version_tbl
  )
  INTO src_version_id, src_version_num
  USING src_model_id;

  IF src_version_id IS NULL THEN
    RAISE EXCEPTION 'No version found for model PF_V7PP in %', src_version_tbl;
  END IF;

  -- Upsert industrial grid version envelope.
  INSERT INTO scoring_grid_versions (
    grid_code,
    grid_name,
    version_code,
    version_label,
    model_type,
    status,
    is_active,
    notes
  )
  VALUES (
    'PF_V7PP',
    'Project Finance Scoring V7++',
    format('runtime-v%s', src_version_num),
    format('Imported from runtime model version %s', src_version_num),
    'PROJECT_FINANCE',
    'draft',
    false,
    format('Auto-seeded from %s / versionId=%s', pfx, src_version_id)
  )
  ON CONFLICT (grid_code, version_code)
  DO UPDATE SET
    grid_name = EXCLUDED.grid_name,
    version_label = EXCLUDED.version_label,
    model_type = EXCLUDED.model_type,
    notes = EXCLUDED.notes,
    updated_at = now()
  RETURNING id INTO tgt_grid_version_id;

  -- Re-seed hierarchy deterministically for this grid version.
  DELETE FROM scoring_domains WHERE grid_version_id = tgt_grid_version_id;

  -- Domains
  EXECUTE format(
    'INSERT INTO scoring_domains (
      grid_version_id, domain_code, domain_name, description, sort_order,
      is_active, is_included_in_scoring, weight, scoring_level, allow_manual_override,
      help_text, created_at, updated_at
    )
    SELECT
      $1,
      n.code,
      n.label,
      n.description,
      n."orderIndex",
      COALESCE(n."isActive", true),
      COALESCE(n."isScored", true),
      COALESCE(n.weight::numeric, 0),
      ''SUBSUBCRITERION'',
      false,
      n."helpText",
      now(),
      now()
    FROM %s n
    WHERE n."versionId" = $2
      AND n."nodeType" = ''DOMAIN''
    ORDER BY n."orderIndex"',
    src_node_tbl
  )
  USING tgt_grid_version_id, src_version_id;

  GET DIAGNOSTICS inserted_domains = ROW_COUNT;

  -- Criteria
  EXECUTE format(
    'INSERT INTO scoring_criteria (
      domain_id, criterion_code, criterion_name, description, sort_order,
      is_active, is_included_in_scoring, weight, scoring_level, allow_manual_override,
      help_text, created_at, updated_at
    )
    SELECT
      d.id,
      c.code,
      c.label,
      c.description,
      c."orderIndex",
      COALESCE(c."isActive", true),
      COALESCE(c."isScored", true),
      COALESCE(c.weight::numeric, 0),
      ''SUBSUBCRITERION'',
      false,
      c."helpText",
      now(),
      now()
    FROM %s c
    JOIN %s dom ON dom.id = c."parentNodeId"
    JOIN scoring_domains d
      ON d.grid_version_id = $1
     AND d.domain_code = dom.code
    WHERE c."versionId" = $2
      AND c."nodeType" = ''CRITERION''
    ORDER BY c."orderIndex"',
    src_node_tbl,
    src_node_tbl
  )
  USING tgt_grid_version_id, src_version_id;

  GET DIAGNOSTICS inserted_criteria = ROW_COUNT;

  -- Subcriteria
  EXECUTE format(
    'INSERT INTO scoring_subcriteria (
      criterion_id, subcriterion_code, subcriterion_name, description, sort_order,
      is_active, is_included_in_scoring, weight, scoring_level, allow_manual_override,
      help_text, created_at, updated_at
    )
    SELECT
      cr.id,
      sc.code,
      sc.label,
      sc.description,
      sc."orderIndex",
      COALESCE(sc."isActive", true),
      COALESCE(sc."isScored", true),
      COALESCE(sc.weight::numeric, 0),
      ''SUBSUBCRITERION'',
      false,
      sc."helpText",
      now(),
      now()
    FROM %s sc
    JOIN %s c ON c.id = sc."parentNodeId"
    JOIN %s dom ON dom.id = c."parentNodeId"
    JOIN scoring_domains d
      ON d.grid_version_id = $1
     AND d.domain_code = dom.code
    JOIN scoring_criteria cr
      ON cr.domain_id = d.id
     AND cr.criterion_code = c.code
    WHERE sc."versionId" = $2
      AND sc."nodeType" = ''SUB_CRITERION''
    ORDER BY sc."orderIndex"',
    src_node_tbl,
    src_node_tbl,
    src_node_tbl
  )
  USING tgt_grid_version_id, src_version_id;

  GET DIAGNOSTICS inserted_subcriteria = ROW_COUNT;

  -- Sub-subcriteria
  EXECUTE format(
    'INSERT INTO scoring_subsubcriteria (
      subcriterion_id, subsubcriterion_code, subsubcriterion_name, description, sort_order,
      is_active, is_included_in_scoring, weight, allow_manual_override,
      help_text, created_at, updated_at
    )
    SELECT
      s.id,
      ssc.code,
      ssc.label,
      ssc.description,
      ssc."orderIndex",
      COALESCE(ssc."isActive", true),
      COALESCE(ssc."isScored", true),
      COALESCE(ssc.weight::numeric, 0),
      false,
      ssc."helpText",
      now(),
      now()
    FROM %s ssc
    JOIN %s sc ON sc.id = ssc."parentNodeId"
    JOIN %s c ON c.id = sc."parentNodeId"
    JOIN %s dom ON dom.id = c."parentNodeId"
    JOIN scoring_domains d
      ON d.grid_version_id = $1
     AND d.domain_code = dom.code
    JOIN scoring_criteria cr
      ON cr.domain_id = d.id
     AND cr.criterion_code = c.code
    JOIN scoring_subcriteria s
      ON s.criterion_id = cr.id
     AND s.subcriterion_code = sc.code
    WHERE ssc."versionId" = $2
      AND ssc."nodeType" = ''SUB_SUB_CRITERION''
    ORDER BY ssc."orderIndex"',
    src_node_tbl,
    src_node_tbl,
    src_node_tbl,
    src_node_tbl
  )
  USING tgt_grid_version_id, src_version_id;

  GET DIAGNOSTICS inserted_subsubcriteria = ROW_COUNT;

  RAISE NOTICE 'Complete hierarchy seeded. grid_version_id=%, domains=%, criteria=%, subcriteria=%, subsubcriteria=%',
    tgt_grid_version_id, inserted_domains, inserted_criteria, inserted_subcriteria, inserted_subsubcriteria;
END $$;

COMMIT;
