-- ============================================================================
-- PF Scoring V7++ / Supabase
-- Schema sync for scoring bindings + source traceability columns
-- Date: 2026-04-17
--
-- This script is idempotent and auto-detects table prefix between:
--   - BCP_SCORE_GP_*
--   - BP_PF_*
-- ============================================================================

DO $$
DECLARE
  pfx text;
  eval_tbl text;
  ans_tbl text;
  node_tbl text;
  version_tbl text;
  clients_tbl text;
  bindings_tbl text;
  registry_tbl text;
  calc_tbl text;
BEGIN
  -- 1) Prefix detection
  IF to_regclass('public."BCP_SCORE_GP_v7pp_scoring_evaluations"') IS NOT NULL THEN
    pfx := 'BCP_SCORE_GP';
  ELSIF to_regclass('public."BP_PF_v7pp_scoring_evaluations"') IS NOT NULL THEN
    pfx := 'BP_PF';
  ELSE
    RAISE EXCEPTION 'No v7pp scoring evaluations table found in public schema.';
  END IF;

  eval_tbl    := format('%s_v7pp_scoring_evaluations', pfx);
  ans_tbl     := format('%s_v7pp_evaluation_answers', pfx);
  node_tbl    := format('%s_v7pp_scoring_nodes', pfx);
  version_tbl := format('%s_v7pp_scoring_versions', pfx);
  clients_tbl := format('%s_clients', pfx);
  bindings_tbl := format('%s_v7pp_scoring_node_bindings', pfx);
  registry_tbl := format('%s_v7pp_scoring_field_registry', pfx);
  calc_tbl := format('%s_v7pp_scoring_calculated_fields', pfx);

  -- 2) Evaluation: clientId support
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS "clientId" text;', eval_tbl);
  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I("clientId");', eval_tbl || '_clientId_idx', eval_tbl);

  BEGIN
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY ("clientId") REFERENCES public.%I("id") ON DELETE SET NULL ON UPDATE CASCADE;',
      eval_tbl,
      eval_tbl || '_clientId_fkey',
      clients_tbl
    );
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  -- 3) Evaluation answers: source traceability + override
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS "sourceType" text;', ans_tbl);
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS "sourceEntity" text;', ans_tbl);
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS "sourceField" text;', ans_tbl);
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS "sourcePath" text;', ans_tbl);
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS "sourceBindingId" text;', ans_tbl);
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS "sourceValueSnapshotJson" text;', ans_tbl);
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS "resolvedValueSnapshotJson" text;', ans_tbl);
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS "isAutoFilled" boolean NOT NULL DEFAULT false;', ans_tbl);
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS "isOverridden" boolean NOT NULL DEFAULT false;', ans_tbl);
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS "overrideReason" text;', ans_tbl);
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS "overriddenBy" text;', ans_tbl);
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS "overriddenAt" timestamp(3);', ans_tbl);

  -- 4) ScoringNodeDataBinding table
  EXECUTE format($ct$
    CREATE TABLE IF NOT EXISTS public.%I (
      "id" text PRIMARY KEY,
      "nodeId" text NOT NULL,
      "sourceEntity" text NOT NULL,
      "sourceField" text,
      "sourcePath" text,
      "bindingMode" text NOT NULL,
      "dataType" text NOT NULL,
      "transformType" text NOT NULL DEFAULT 'NONE',
      "transformConfigJson" text,
      "defaultValueString" text,
      "defaultValueNumber" double precision,
      "defaultValueBoolean" boolean,
      "fallbackValueString" text,
      "fallbackValueNumber" double precision,
      "fallbackValueBoolean" boolean,
      "isRequired" boolean NOT NULL DEFAULT false,
      "isReadOnly" boolean NOT NULL DEFAULT false,
      "allowOverride" boolean NOT NULL DEFAULT false,
      "overrideRequiresReason" boolean NOT NULL DEFAULT false,
      "priority" integer NOT NULL DEFAULT 1,
      "isActive" boolean NOT NULL DEFAULT true,
      "description" text,
      "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  $ct$, bindings_tbl);

  BEGIN
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY ("nodeId") REFERENCES public.%I("id") ON DELETE CASCADE ON UPDATE CASCADE;',
      bindings_tbl,
      bindings_tbl || '_nodeId_fkey',
      node_tbl
    );
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I("nodeId");', bindings_tbl || '_nodeId_idx', bindings_tbl);
  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I("nodeId","priority");', bindings_tbl || '_nodeId_priority_idx', bindings_tbl);
  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I("sourceEntity");', bindings_tbl || '_sourceEntity_idx', bindings_tbl);

  BEGIN
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY ("sourceBindingId") REFERENCES public.%I("id") ON DELETE SET NULL ON UPDATE CASCADE;',
      ans_tbl,
      ans_tbl || '_sourceBindingId_fkey',
      bindings_tbl
    );
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I("sourceBindingId");', ans_tbl || '_sourceBindingId_idx', ans_tbl);

  -- 5) ScoringDataFieldRegistry
  EXECUTE format($ct$
    CREATE TABLE IF NOT EXISTS public.%I (
      "id" text PRIMARY KEY,
      "entityType" text NOT NULL,
      "fieldCode" text NOT NULL,
      "fieldPath" text NOT NULL,
      "label" text NOT NULL,
      "dataType" text NOT NULL,
      "description" text,
      "isBindable" boolean NOT NULL DEFAULT true,
      "isActive" boolean NOT NULL DEFAULT true,
      "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT %I UNIQUE("entityType", "fieldCode")
    );
  $ct$, registry_tbl, registry_tbl || '_entityType_fieldCode_key');

  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I("entityType");', registry_tbl || '_entityType_idx', registry_tbl);
  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I("isActive");', registry_tbl || '_isActive_idx', registry_tbl);

  -- 6) ScoringCalculatedField
  EXECUTE format($ct$
    CREATE TABLE IF NOT EXISTS public.%I (
      "id" text PRIMARY KEY,
      "versionId" text NOT NULL,
      "code" text NOT NULL,
      "label" text NOT NULL,
      "expression" text NOT NULL,
      "variablesJson" text,
      "outputType" text NOT NULL,
      "description" text,
      "isActive" boolean NOT NULL DEFAULT true,
      "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT %I UNIQUE("versionId", "code")
    );
  $ct$, calc_tbl, calc_tbl || '_versionId_code_key');

  BEGIN
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY ("versionId") REFERENCES public.%I("id") ON DELETE CASCADE ON UPDATE CASCADE;',
      calc_tbl,
      calc_tbl || '_versionId_fkey',
      version_tbl
    );
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I("versionId");', calc_tbl || '_versionId_idx', calc_tbl);

  RAISE NOTICE 'Scoring schema sync completed with prefix=%', pfx;
END $$;

