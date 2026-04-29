-- ============================================================================
-- PF_V7PP JSON -> Supabase V7++ tables (prefix-aware)
-- Date: 2026-04-17
--
-- This script is designed for Supabase databases using either prefix:
--   - BCP_SCORE_GP_*
--   - BP_PF_*
--
-- It upserts JSON hierarchy into:
--   <prefix>_v7pp_scoring_models
--   <prefix>_v7pp_scoring_versions
--   <prefix>_v7pp_scoring_nodes
--
-- Hierarchy mapping:
--   domain -> criterion -> subcriterion -> subsubcriterion
--   represented as ScoringNode depth 0..3.
-- ============================================================================

DO $plpgsql$
DECLARE
  payload jsonb := $json$
  {
    "model_code": "PF_V7PP",
    "model_name": "Project Finance Scoring V7++",
    "domains": [
      {
        "code": "D1",
        "name": "Sponsor & Governance",
        "weight": 0.15,
        "criteria": [
          {
            "code": "D1_C1",
            "name": "Sponsor Experience",
            "weight": 0.4,
            "subcriteria": [
              {
                "code": "D1_C1_SC1",
                "name": "Track Record",
                "weight": 0.5,
                "subsubcriteria": [
                  {"code": "D1_C1_SC1_SSC1", "name": "Similar Projects", "weight": 0.5},
                  {"code": "D1_C1_SC1_SSC2", "name": "Performance", "weight": 0.5}
                ]
              }
            ]
          },
          {
            "code": "D1_C2",
            "name": "Financial Strength",
            "weight": 0.3,
            "subcriteria": [
              {
                "code": "D1_C2_SC1",
                "name": "Leverage",
                "weight": 1,
                "subsubcriteria": [
                  {"code": "D1_C2_SC1_SSC1", "name": "Debt Capacity", "weight": 1}
                ]
              }
            ]
          }
        ]
      },
      {
        "code": "D2",
        "name": "Project Fundamentals",
        "weight": 0.15,
        "criteria": [
          {
            "code": "D2_C1",
            "name": "Market Risk",
            "weight": 0.4,
            "subcriteria": [
              {
                "code": "D2_C1_SC1",
                "name": "Demand",
                "weight": 1,
                "subsubcriteria": [
                  {"code": "D2_C1_SC1_SSC1", "name": "Market Growth", "weight": 1}
                ]
              }
            ]
          }
        ]
      },
      {
        "code": "D3",
        "name": "Construction Phase",
        "weight": 0.15,
        "criteria": [
          {
            "code": "D3_C1",
            "name": "EPC Risk",
            "weight": 0.4,
            "subcriteria": [
              {
                "code": "D3_C1_SC1",
                "name": "Contract Type",
                "weight": 0.4,
                "subsubcriteria": [
                  {"code": "D3_C1_SC1_SSC1", "name": "Lump Sum", "weight": 1}
                ]
              },
              {
                "code": "D3_C1_SC2",
                "name": "Contractor",
                "weight": 0.6,
                "subsubcriteria": [
                  {"code": "D3_C1_SC2_SSC1", "name": "Experience", "weight": 0.5},
                  {"code": "D3_C1_SC2_SSC2", "name": "Financial Strength", "weight": 0.5}
                ]
              }
            ]
          }
        ]
      },
      {
        "code": "D4",
        "name": "Operation Phase",
        "weight": 0.10,
        "criteria": [
          {
            "code": "D4_C1",
            "name": "O&M Risk",
            "weight": 1,
            "subcriteria": [
              {
                "code": "D4_C1_SC1",
                "name": "Operator",
                "weight": 1,
                "subsubcriteria": [
                  {"code": "D4_C1_SC1_SSC1", "name": "Experience", "weight": 1}
                ]
              }
            ]
          }
        ]
      },
      {
        "code": "D5",
        "name": "Financial Structure",
        "weight": 0.15,
        "criteria": [
          {
            "code": "D5_C1",
            "name": "DSCR",
            "weight": 0.4,
            "subcriteria": [
              {
                "code": "D5_C1_SC1",
                "name": "Coverage",
                "weight": 1,
                "subsubcriteria": [
                  {"code": "D5_C1_SC1_SSC1", "name": "DSCR Level", "weight": 1}
                ]
              }
            ]
          }
        ]
      },
      {
        "code": "D6",
        "name": "Revenue & Contracts",
        "weight": 0.10,
        "criteria": [
          {
            "code": "D6_C1",
            "name": "Offtake",
            "weight": 1,
            "subcriteria": [
              {
                "code": "D6_C1_SC1",
                "name": "Contract",
                "weight": 1,
                "subsubcriteria": [
                  {"code": "D6_C1_SC1_SSC1", "name": "Duration", "weight": 1}
                ]
              }
            ]
          }
        ]
      },
      {
        "code": "D7",
        "name": "Risk Allocation",
        "weight": 0.10,
        "criteria": [
          {
            "code": "D7_C1",
            "name": "Allocation",
            "weight": 1,
            "subcriteria": [
              {
                "code": "D7_C1_SC1",
                "name": "Contracts",
                "weight": 1,
                "subsubcriteria": [
                  {"code": "D7_C1_SC1_SSC1", "name": "Clarity", "weight": 1}
                ]
              }
            ]
          }
        ]
      },
      {
        "code": "D8",
        "name": "Legal",
        "weight": 0.05,
        "criteria": [
          {
            "code": "D8_C1",
            "name": "Documentation",
            "weight": 1,
            "subcriteria": [
              {
                "code": "D8_C1_SC1",
                "name": "Completeness",
                "weight": 1,
                "subsubcriteria": [
                  {"code": "D8_C1_SC1_SSC1", "name": "Quality", "weight": 1}
                ]
              }
            ]
          }
        ]
      },
      {
        "code": "D9",
        "name": "ESG",
        "weight": 0.05,
        "criteria": [
          {
            "code": "D9_C1",
            "name": "ESG Risk",
            "weight": 1,
            "subcriteria": [
              {
                "code": "D9_C1_SC1",
                "name": "Environmental",
                "weight": 1,
                "subsubcriteria": [
                  {"code": "D9_C1_SC1_SSC1", "name": "Impact", "weight": 1}
                ]
              }
            ]
          }
        ]
      }
    ]
  }
  $json$::jsonb;

  pfx text;
  model_tbl text;
  version_tbl text;
  node_tbl text;
  user_tbl text;

  has_model_label boolean;
  has_model_name boolean;
  has_model_status boolean;
  has_model_id_uuid boolean;
  has_model_status_enum boolean;
  model_status_udt_name text;

  has_version_label boolean;
  has_version_status boolean;
  has_version_created_by boolean;
  has_version_is_published boolean;
  has_version_id_uuid boolean;
  has_version_model_id_uuid boolean;
  has_version_status_enum boolean;
  version_status_udt_name text;

  has_node_depth boolean;
  has_node_is_terminal boolean;
  has_node_is_scored boolean;
  has_node_allows_children boolean;
  has_node_id_uuid boolean;
  has_node_version_id_uuid boolean;
  has_node_parent_id_uuid boolean;
  has_node_type_enum boolean;
  node_type_udt_name text;

  actor_id text;
  model_id text;
  version_id text;
  version_number int := 7;
  version_label text := 'v7++ JSON import';

  d jsonb;
  c jsonb;
  sc jsonb;
  ssc jsonb;
  d_idx int;
  c_idx int;
  sc_idx int;
  ssc_idx int;

  parent_domain_id text;
  parent_criteria_id text;
  parent_subcriteria_id text;

  sql_model_insert text;
  sql_version_insert text;
  sql_node_insert text;
BEGIN
  -- Prefix detection
  IF to_regclass('public."BCP_SCORE_GP_v7pp_scoring_models"') IS NOT NULL THEN
    pfx := 'BCP_SCORE_GP';
  ELSIF to_regclass('public."BP_PF_v7pp_scoring_models"') IS NOT NULL THEN
    pfx := 'BP_PF';
  ELSE
    RAISE EXCEPTION 'No v7pp scoring model table found (BCP_SCORE_GP_* or BP_PF_*).';
  END IF;

  model_tbl := format('%s_v7pp_scoring_models', pfx);
  version_tbl := format('%s_v7pp_scoring_versions', pfx);
  node_tbl := format('%s_v7pp_scoring_nodes', pfx);
  user_tbl := format('%s_users', pfx);

  -- Schema feature detection
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name=model_tbl AND column_name='label'
  ) INTO has_model_label;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name=model_tbl AND column_name='name'
  ) INTO has_model_name;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name=model_tbl AND column_name='status'
  ) INTO has_model_status;

  SELECT c.udt_name
  FROM information_schema.columns c
  WHERE c.table_schema='public' AND c.table_name=model_tbl AND c.column_name='status'
  LIMIT 1
  INTO model_status_udt_name;

  has_model_status_enum := has_model_status AND model_status_udt_name IS NOT NULL AND model_status_udt_name <> 'text';

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name=model_tbl AND column_name='id' AND data_type='uuid'
  ) INTO has_model_id_uuid;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name=version_tbl AND column_name='label'
  ) INTO has_version_label;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name=version_tbl AND column_name='status'
  ) INTO has_version_status;

  SELECT c.udt_name
  FROM information_schema.columns c
  WHERE c.table_schema='public' AND c.table_name=version_tbl AND c.column_name='status'
  LIMIT 1
  INTO version_status_udt_name;

  has_version_status_enum := has_version_status AND version_status_udt_name IS NOT NULL AND version_status_udt_name <> 'text';

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name=version_tbl AND column_name='createdBy'
  ) INTO has_version_created_by;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name=version_tbl AND column_name='isPublished'
  ) INTO has_version_is_published;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name=version_tbl AND column_name='id' AND data_type='uuid'
  ) INTO has_version_id_uuid;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name=version_tbl AND column_name='modelId' AND data_type='uuid'
  ) INTO has_version_model_id_uuid;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name=node_tbl AND column_name='depth'
  ) INTO has_node_depth;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name=node_tbl AND column_name='isTerminal'
  ) INTO has_node_is_terminal;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name=node_tbl AND column_name='isScored'
  ) INTO has_node_is_scored;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name=node_tbl AND column_name='allowsChildren'
  ) INTO has_node_allows_children;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name=node_tbl AND column_name='id' AND data_type='uuid'
  ) INTO has_node_id_uuid;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name=node_tbl AND column_name='versionId' AND data_type='uuid'
  ) INTO has_node_version_id_uuid;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name=node_tbl AND column_name='parentNodeId' AND data_type='uuid'
  ) INTO has_node_parent_id_uuid;

  SELECT c.udt_name
  FROM information_schema.columns c
  WHERE c.table_schema='public' AND c.table_name=node_tbl AND c.column_name='nodeType'
  LIMIT 1
  INTO node_type_udt_name;

  has_node_type_enum := node_type_udt_name IS NOT NULL AND node_type_udt_name <> 'text';

  -- Ensure upsert key on nodes (some legacy schemas may miss unique(versionId, code))
  EXECUTE format(
    'CREATE UNIQUE INDEX IF NOT EXISTS %I ON public.%I ("versionId", "code")',
    node_tbl || '_versionId_code_uidx',
    node_tbl
  );

  -- Best-effort actor lookup (required in richer schemas where createdBy is NOT NULL)
  EXECUTE format('SELECT id FROM public.%I ORDER BY "createdAt" ASC LIMIT 1', user_tbl) INTO actor_id;

  IF has_version_created_by AND actor_id IS NULL THEN
    RAISE EXCEPTION 'No user found in %. Cannot set createdBy for scoring version import.', user_tbl;
  END IF;

  -- Upsert model (adapt to label/name + optional status)
  sql_model_insert := format(
    'INSERT INTO public.%I (id, code, %s%s, "isActive", "updatedAt") VALUES (%s, $2, $3%s, true, now()) '
    || 'ON CONFLICT (code) DO UPDATE SET %s = EXCLUDED.%s, "updatedAt" = now() '
    || 'RETURNING id',
    model_tbl,
    CASE WHEN has_model_label THEN 'label' ELSE 'name' END,
    CASE WHEN has_model_status THEN ', status' ELSE '' END,
    CASE WHEN has_model_id_uuid THEN 'gen_random_uuid()' ELSE '$1' END,
    CASE
      WHEN has_model_status_enum THEN format(', $4::%I', model_status_udt_name)
      WHEN has_model_status THEN ', $4'
      ELSE ''
    END,
    CASE WHEN has_model_label THEN 'label' ELSE 'name' END,
    CASE WHEN has_model_label THEN 'label' ELSE 'name' END
  );

  IF has_model_status THEN
    EXECUTE sql_model_insert
      USING
        payload->>'model_code',
        payload->>'model_code',
        payload->>'model_name',
        'PUBLISHED'
      INTO model_id;
  ELSE
    EXECUTE sql_model_insert
      USING
        payload->>'model_code',
        payload->>'model_code',
        payload->>'model_name'
      INTO model_id;
  END IF;

  -- Resolve model_id by code in case ON CONFLICT updated an existing row with different id
  EXECUTE format('SELECT id FROM public.%I WHERE code = $1 LIMIT 1', model_tbl)
    USING payload->>'model_code' INTO model_id;

  -- Upsert version (adapt columns by schema)
  sql_version_insert := format(
    'INSERT INTO public.%I (id, "modelId", "versionNumber"%s%s%s%s, "updatedAt") '
    || 'VALUES (%s, %s, $3%s%s%s%s, now()) '
    || 'ON CONFLICT ("modelId", "versionNumber") DO UPDATE SET "updatedAt" = now() '
    || 'RETURNING id',
    version_tbl,
    CASE WHEN has_version_label THEN ', label' ELSE '' END,
    CASE WHEN has_version_status THEN ', status' ELSE '' END,
    CASE WHEN has_version_is_published THEN ', "isPublished"' ELSE '' END,
    CASE WHEN has_version_created_by THEN ', "createdBy"' ELSE '' END,
    CASE WHEN has_version_id_uuid THEN 'gen_random_uuid()' ELSE '$1' END,
    CASE WHEN has_version_model_id_uuid THEN '$2::uuid' ELSE '$2' END,
    CASE WHEN has_version_label THEN ', $4' ELSE '' END,
    CASE
      WHEN has_version_status_enum THEN format(', $%s::%I', CASE WHEN has_version_label THEN 5 ELSE 4 END, version_status_udt_name)
      WHEN has_version_status THEN format(', $%s', CASE WHEN has_version_label THEN 5 ELSE 4 END)
      ELSE ''
    END,
    CASE WHEN has_version_is_published THEN format(', $%s', CASE WHEN has_version_label AND has_version_status THEN 6 WHEN has_version_label OR has_version_status THEN 5 ELSE 4 END) ELSE '' END,
    CASE
      WHEN has_version_created_by THEN format(', $%s',
        CASE
          WHEN has_version_label AND has_version_status AND has_version_is_published THEN 7
          WHEN (has_version_label AND has_version_status) OR (has_version_label AND has_version_is_published) OR (has_version_status AND has_version_is_published) THEN 6
          WHEN has_version_label OR has_version_status OR has_version_is_published THEN 5
          ELSE 4
        END
      )
      ELSE ''
    END
  );

  IF has_version_created_by THEN
    IF has_version_label AND has_version_status AND has_version_is_published THEN
      EXECUTE sql_version_insert USING
        payload->>'model_code' || '::v' || version_number,
        model_id,
        version_number,
        version_label,
        'PUBLISHED',
        true,
        actor_id
        INTO version_id;
    ELSIF has_version_label AND has_version_status THEN
      EXECUTE sql_version_insert USING
        payload->>'model_code' || '::v' || version_number,
        model_id,
        version_number,
        version_label,
        'PUBLISHED',
        actor_id
        INTO version_id;
    ELSIF has_version_label AND has_version_is_published THEN
      EXECUTE sql_version_insert USING
        payload->>'model_code' || '::v' || version_number,
        model_id,
        version_number,
        version_label,
        true,
        actor_id
        INTO version_id;
    ELSIF has_version_status AND has_version_is_published THEN
      EXECUTE sql_version_insert USING
        payload->>'model_code' || '::v' || version_number,
        model_id,
        version_number,
        'PUBLISHED',
        true,
        actor_id
        INTO version_id;
    ELSIF has_version_label THEN
      EXECUTE sql_version_insert USING
        payload->>'model_code' || '::v' || version_number,
        model_id,
        version_number,
        version_label,
        actor_id
        INTO version_id;
    ELSIF has_version_status THEN
      EXECUTE sql_version_insert USING
        payload->>'model_code' || '::v' || version_number,
        model_id,
        version_number,
        'PUBLISHED',
        actor_id
        INTO version_id;
    ELSIF has_version_is_published THEN
      EXECUTE sql_version_insert USING
        payload->>'model_code' || '::v' || version_number,
        model_id,
        version_number,
        true,
        actor_id
        INTO version_id;
    ELSE
      EXECUTE sql_version_insert USING
        payload->>'model_code' || '::v' || version_number,
        model_id,
        version_number,
        actor_id
        INTO version_id;
    END IF;
  ELSE
    IF has_version_label AND has_version_status AND has_version_is_published THEN
      EXECUTE sql_version_insert USING
        payload->>'model_code' || '::v' || version_number,
        model_id,
        version_number,
        version_label,
        'PUBLISHED',
        true
        INTO version_id;
    ELSIF has_version_label AND has_version_status THEN
      EXECUTE sql_version_insert USING
        payload->>'model_code' || '::v' || version_number,
        model_id,
        version_number,
        version_label,
        'PUBLISHED'
        INTO version_id;
    ELSIF has_version_label AND has_version_is_published THEN
      EXECUTE sql_version_insert USING
        payload->>'model_code' || '::v' || version_number,
        model_id,
        version_number,
        version_label,
        true
        INTO version_id;
    ELSIF has_version_status AND has_version_is_published THEN
      EXECUTE sql_version_insert USING
        payload->>'model_code' || '::v' || version_number,
        model_id,
        version_number,
        'PUBLISHED',
        true
        INTO version_id;
    ELSIF has_version_label THEN
      EXECUTE sql_version_insert USING
        payload->>'model_code' || '::v' || version_number,
        model_id,
        version_number,
        version_label
        INTO version_id;
    ELSIF has_version_status THEN
      EXECUTE sql_version_insert USING
        payload->>'model_code' || '::v' || version_number,
        model_id,
        version_number,
        'PUBLISHED'
        INTO version_id;
    ELSIF has_version_is_published THEN
      EXECUTE sql_version_insert USING
        payload->>'model_code' || '::v' || version_number,
        model_id,
        version_number,
        true
        INTO version_id;
    ELSE
      EXECUTE sql_version_insert USING
        payload->>'model_code' || '::v' || version_number,
        model_id,
        version_number
        INTO version_id;
    END IF;
  END IF;

  EXECUTE format(
    'SELECT id FROM public.%I WHERE "modelId" = %s AND "versionNumber" = $2 LIMIT 1',
    version_tbl,
    CASE WHEN has_version_model_id_uuid THEN '$1::uuid' ELSE '$1' END
  ) USING model_id, version_number INTO version_id;

  -- Template for node upsert (adapts to depth/isTerminal/isScored/allowsChildren availability)
  sql_node_insert := format(
    'INSERT INTO public.%I (id, "versionId", "parentNodeId", "nodeType", code, label, weight, "orderIndex", "updatedAt"%s%s%s%s) '
    || 'VALUES (%s, %s, %s, %s, $5, $6, $7, $8, now()%s%s%s%s) '
    || 'ON CONFLICT ("versionId", code) DO UPDATE SET '
    || '"parentNodeId" = EXCLUDED."parentNodeId", '
    || '"nodeType" = EXCLUDED."nodeType", '
    || 'label = EXCLUDED.label, '
    || 'weight = EXCLUDED.weight, '
    || '"orderIndex" = EXCLUDED."orderIndex", '
    || '"updatedAt" = now() '
    || 'RETURNING id',
    node_tbl,
    CASE WHEN has_node_depth THEN ', depth' ELSE '' END,
    CASE WHEN has_node_is_terminal THEN ', "isTerminal"' ELSE '' END,
    CASE WHEN has_node_is_scored THEN ', "isScored"' ELSE '' END,
    CASE WHEN has_node_allows_children THEN ', "allowsChildren"' ELSE '' END,
    CASE WHEN has_node_id_uuid THEN 'gen_random_uuid()' ELSE '$1' END,
    CASE WHEN has_node_version_id_uuid THEN '$2::uuid' ELSE '$2' END,
    CASE WHEN has_node_parent_id_uuid THEN '$3::uuid' ELSE '$3' END,
    CASE WHEN has_node_type_enum THEN format('$4::%I', node_type_udt_name) ELSE '$4' END,
    CASE WHEN has_node_depth THEN ', $9' ELSE '' END,
    CASE WHEN has_node_is_terminal THEN format(', $%s', CASE WHEN has_node_depth THEN 10 ELSE 9 END) ELSE '' END,
    CASE WHEN has_node_is_scored THEN format(', $%s', CASE WHEN has_node_depth AND has_node_is_terminal THEN 11 WHEN has_node_depth OR has_node_is_terminal THEN 10 ELSE 9 END) ELSE '' END,
    CASE WHEN has_node_allows_children THEN format(', $%s',
      CASE
        WHEN has_node_depth AND has_node_is_terminal AND has_node_is_scored THEN 12
        WHEN (has_node_depth AND has_node_is_terminal) OR (has_node_depth AND has_node_is_scored) OR (has_node_is_terminal AND has_node_is_scored) THEN 11
        WHEN has_node_depth OR has_node_is_terminal OR has_node_is_scored THEN 10
        ELSE 9
      END
    ) ELSE '' END
  );

  -- Domains
  d_idx := 0;
  FOR d IN SELECT * FROM jsonb_array_elements(payload->'domains') LOOP
    d_idx := d_idx + 1;

    IF has_node_depth AND has_node_is_terminal AND has_node_is_scored AND has_node_allows_children THEN
      EXECUTE sql_node_insert USING
        version_id || '::' || (d->>'code'), version_id, NULL, 'DOMAIN', d->>'code', d->>'name', (d->>'weight')::numeric, d_idx, 0, false, false, true
        INTO parent_domain_id;
    ELSIF has_node_depth AND has_node_is_terminal AND has_node_is_scored THEN
      EXECUTE sql_node_insert USING
        version_id || '::' || (d->>'code'), version_id, NULL, 'DOMAIN', d->>'code', d->>'name', (d->>'weight')::numeric, d_idx, 0, false, false
        INTO parent_domain_id;
    ELSIF has_node_depth THEN
      EXECUTE sql_node_insert USING
        version_id || '::' || (d->>'code'), version_id, NULL, 'DOMAIN', d->>'code', d->>'name', (d->>'weight')::numeric, d_idx, 0
        INTO parent_domain_id;
    ELSE
      EXECUTE sql_node_insert USING
        version_id || '::' || (d->>'code'), version_id, NULL, 'DOMAIN', d->>'code', d->>'name', (d->>'weight')::numeric, d_idx
        INTO parent_domain_id;
    END IF;

    -- Criteria
    c_idx := 0;
    FOR c IN SELECT * FROM jsonb_array_elements(d->'criteria') LOOP
      c_idx := c_idx + 1;

      IF has_node_depth AND has_node_is_terminal AND has_node_is_scored AND has_node_allows_children THEN
        EXECUTE sql_node_insert USING
          version_id || '::' || (c->>'code'), version_id, parent_domain_id, 'CRITERION', c->>'code', c->>'name', (c->>'weight')::numeric, c_idx, 1, false, false, true
          INTO parent_criteria_id;
      ELSIF has_node_depth AND has_node_is_terminal AND has_node_is_scored THEN
        EXECUTE sql_node_insert USING
          version_id || '::' || (c->>'code'), version_id, parent_domain_id, 'CRITERION', c->>'code', c->>'name', (c->>'weight')::numeric, c_idx, 1, false, false
          INTO parent_criteria_id;
      ELSIF has_node_depth THEN
        EXECUTE sql_node_insert USING
          version_id || '::' || (c->>'code'), version_id, parent_domain_id, 'CRITERION', c->>'code', c->>'name', (c->>'weight')::numeric, c_idx, 1
          INTO parent_criteria_id;
      ELSE
        EXECUTE sql_node_insert USING
          version_id || '::' || (c->>'code'), version_id, parent_domain_id, 'CRITERION', c->>'code', c->>'name', (c->>'weight')::numeric, c_idx
          INTO parent_criteria_id;
      END IF;

      -- Subcriteria
      sc_idx := 0;
      FOR sc IN SELECT * FROM jsonb_array_elements(c->'subcriteria') LOOP
        sc_idx := sc_idx + 1;

        IF has_node_depth AND has_node_is_terminal AND has_node_is_scored AND has_node_allows_children THEN
          EXECUTE sql_node_insert USING
            version_id || '::' || (sc->>'code'), version_id, parent_criteria_id, 'SUB_CRITERION', sc->>'code', sc->>'name', (sc->>'weight')::numeric, sc_idx, 2, false, false, true
            INTO parent_subcriteria_id;
        ELSIF has_node_depth AND has_node_is_terminal AND has_node_is_scored THEN
          EXECUTE sql_node_insert USING
            version_id || '::' || (sc->>'code'), version_id, parent_criteria_id, 'SUB_CRITERION', sc->>'code', sc->>'name', (sc->>'weight')::numeric, sc_idx, 2, false, false
            INTO parent_subcriteria_id;
        ELSIF has_node_depth THEN
          EXECUTE sql_node_insert USING
            version_id || '::' || (sc->>'code'), version_id, parent_criteria_id, 'SUB_CRITERION', sc->>'code', sc->>'name', (sc->>'weight')::numeric, sc_idx, 2
            INTO parent_subcriteria_id;
        ELSE
          EXECUTE sql_node_insert USING
            version_id || '::' || (sc->>'code'), version_id, parent_criteria_id, 'SUB_CRITERION', sc->>'code', sc->>'name', (sc->>'weight')::numeric, sc_idx
            INTO parent_subcriteria_id;
        END IF;

        -- Sub-subcriteria (leaf)
        ssc_idx := 0;
        FOR ssc IN SELECT * FROM jsonb_array_elements(sc->'subsubcriteria') LOOP
          ssc_idx := ssc_idx + 1;

          IF has_node_depth AND has_node_is_terminal AND has_node_is_scored AND has_node_allows_children THEN
            EXECUTE sql_node_insert USING
              version_id || '::' || (ssc->>'code'), version_id, parent_subcriteria_id, 'SUB_SUB_CRITERION', ssc->>'code', ssc->>'name', (ssc->>'weight')::numeric, ssc_idx, 3, true, true, false;
          ELSIF has_node_depth AND has_node_is_terminal AND has_node_is_scored THEN
            EXECUTE sql_node_insert USING
              version_id || '::' || (ssc->>'code'), version_id, parent_subcriteria_id, 'SUB_SUB_CRITERION', ssc->>'code', ssc->>'name', (ssc->>'weight')::numeric, ssc_idx, 3, true, true;
          ELSIF has_node_depth THEN
            EXECUTE sql_node_insert USING
              version_id || '::' || (ssc->>'code'), version_id, parent_subcriteria_id, 'SUB_SUB_CRITERION', ssc->>'code', ssc->>'name', (ssc->>'weight')::numeric, ssc_idx, 3;
          ELSE
            EXECUTE sql_node_insert USING
              version_id || '::' || (ssc->>'code'), version_id, parent_subcriteria_id, 'SUB_SUB_CRITERION', ssc->>'code', ssc->>'name', (ssc->>'weight')::numeric, ssc_idx;
          END IF;
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'PF_V7PP import complete for prefix=% model_id=% version_id=%', pfx, model_id, version_id;
END $plpgsql$;
