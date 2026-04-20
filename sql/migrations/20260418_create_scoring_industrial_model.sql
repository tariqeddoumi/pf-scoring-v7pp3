-- Industrial scoring model (data-driven) aligned with functional specification
-- Date: 2026-04-18

CREATE TABLE IF NOT EXISTS scoring_grid_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grid_code TEXT NOT NULL,
  grid_name TEXT NOT NULL,
  version_code TEXT NOT NULL,
  version_label TEXT NOT NULL,
  model_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'archived')),
  effective_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  published_at TIMESTAMPTZ,
  published_by UUID,
  notes TEXT,
  UNIQUE (grid_code, version_code)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_scoring_grid_active_per_model
  ON scoring_grid_versions(model_type)
  WHERE is_active = true;

CREATE TABLE IF NOT EXISTS scoring_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grid_version_id UUID NOT NULL REFERENCES scoring_grid_versions(id) ON DELETE CASCADE,
  domain_code TEXT NOT NULL,
  domain_name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_included_in_scoring BOOLEAN NOT NULL DEFAULT true,
  weight NUMERIC(10,4) NOT NULL DEFAULT 0,
  scoring_level TEXT NOT NULL CHECK (scoring_level IN ('CRITERION', 'SUBCRITERION', 'SUBSUBCRITERION')),
  allow_manual_override BOOLEAN NOT NULL DEFAULT false,
  help_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (grid_version_id, domain_code)
);

CREATE TABLE IF NOT EXISTS scoring_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES scoring_domains(id) ON DELETE CASCADE,
  criterion_code TEXT NOT NULL,
  criterion_name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_included_in_scoring BOOLEAN NOT NULL DEFAULT true,
  weight NUMERIC(10,4) NOT NULL DEFAULT 0,
  scoring_level TEXT CHECK (scoring_level IN ('CRITERION', 'SUBCRITERION', 'SUBSUBCRITERION')),
  allow_manual_override BOOLEAN NOT NULL DEFAULT false,
  help_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (domain_id, criterion_code)
);

CREATE TABLE IF NOT EXISTS scoring_subcriteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criterion_id UUID NOT NULL REFERENCES scoring_criteria(id) ON DELETE CASCADE,
  subcriterion_code TEXT NOT NULL,
  subcriterion_name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_included_in_scoring BOOLEAN NOT NULL DEFAULT true,
  weight NUMERIC(10,4) NOT NULL DEFAULT 0,
  scoring_level TEXT CHECK (scoring_level IN ('SUBCRITERION', 'SUBSUBCRITERION')),
  allow_manual_override BOOLEAN NOT NULL DEFAULT false,
  help_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (criterion_id, subcriterion_code)
);

CREATE TABLE IF NOT EXISTS scoring_subsubcriteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcriterion_id UUID NOT NULL REFERENCES scoring_subcriteria(id) ON DELETE CASCADE,
  subsubcriterion_code TEXT NOT NULL,
  subsubcriterion_name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_included_in_scoring BOOLEAN NOT NULL DEFAULT true,
  weight NUMERIC(10,4) NOT NULL DEFAULT 0,
  allow_manual_override BOOLEAN NOT NULL DEFAULT false,
  help_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (subcriterion_id, subsubcriterion_code)
);

CREATE TABLE IF NOT EXISTS scoring_value_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_code TEXT NOT NULL UNIQUE,
  list_name TEXT NOT NULL,
  description TEXT,
  usage_scope TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scoring_value_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value_list_id UUID NOT NULL REFERENCES scoring_value_lists(id) ON DELETE CASCADE,
  item_code TEXT NOT NULL,
  item_label TEXT NOT NULL,
  item_short_label TEXT,
  item_value TEXT NOT NULL,
  technical_value TEXT,
  score_value NUMERIC(10,4),
  color_code TEXT,
  icon_name TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  parent_item_id UUID REFERENCES scoring_value_list_items(id) ON DELETE SET NULL,
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (value_list_id, item_code)
);

CREATE TABLE IF NOT EXISTS scoring_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_code TEXT NOT NULL UNIQUE,
  mapping_name TEXT NOT NULL,
  mapping_type TEXT NOT NULL CHECK (mapping_type IN ('DIRECT_VALUE_SCORE','NUMERIC_RANGE_SCORE','QUALITATIVE_SCORE','BOOLEAN_SCORE','FORMULA_SCORE','FIXED_SCORE','MANUAL_SCORE')),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scoring_mapping_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id UUID NOT NULL REFERENCES scoring_mappings(id) ON DELETE CASCADE,
  line_code TEXT NOT NULL,
  source_value TEXT,
  min_value NUMERIC(18,6),
  max_value NUMERIC(18,6),
  operator TEXT,
  target_score NUMERIC(10,4) NOT NULL,
  target_label TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (mapping_id, line_code)
);

CREATE TABLE IF NOT EXISTS scoring_input_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grid_version_id UUID NOT NULL REFERENCES scoring_grid_versions(id) ON DELETE CASCADE,
  entity_level TEXT NOT NULL CHECK (entity_level IN ('DOMAIN', 'CRITERION', 'SUBCRITERION', 'SUBSUBCRITERION')),
  entity_id UUID NOT NULL,
  input_code TEXT NOT NULL,
  input_label TEXT NOT NULL,
  input_type TEXT NOT NULL CHECK (input_type IN ('SELECT','SELECT_DEPENDENT','MULTISELECT','RADIO','CHECKBOX','NUMBER','PERCENT','CURRENCY','DATE','TEXT','TEXTAREA','BOOLEAN')),
  data_type TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_read_only BOOLEAN NOT NULL DEFAULT false,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  visibility_rule_expression TEXT,
  default_value TEXT,
  placeholder TEXT,
  help_text TEXT,
  tooltip TEXT,
  validation_rule_expression TEXT,
  ui_section TEXT,
  ui_group TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  value_list_id UUID REFERENCES scoring_value_lists(id) ON DELETE SET NULL,
  scoring_mapping_id UUID REFERENCES scoring_mappings(id) ON DELETE SET NULL,
  allows_comment BOOLEAN NOT NULL DEFAULT false,
  requires_comment_on_low_score BOOLEAN NOT NULL DEFAULT false,
  requires_attachment BOOLEAN NOT NULL DEFAULT false,
  attachment_rule TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (grid_version_id, entity_level, entity_id, input_code)
);

CREATE TABLE IF NOT EXISTS scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grid_version_id UUID NOT NULL REFERENCES scoring_grid_versions(id) ON DELETE CASCADE,
  rule_code TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('NO_GO','KNOCK_OUT','MALUS','BONUS','RED_FLAG','WARNING','DECISION')),
  scope_level TEXT NOT NULL CHECK (scope_level IN ('GLOBAL','DOMAIN','CRITERION','SUBCRITERION','SUBSUBCRITERION')),
  scope_entity_id UUID,
  severity TEXT NOT NULL,
  condition_expression TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('BLOCK','SET_SCORE','ADD_FLAG','APPLY_MALUS_PERCENT','APPLY_MALUS_POINTS','APPLY_BONUS_POINTS','FORCE_DECISION','REQUIRE_COMMENT','REQUIRE_ATTACHMENT','SHOW_WARNING')),
  action_value TEXT,
  message_text TEXT NOT NULL,
  requires_comment BOOLEAN NOT NULL DEFAULT false,
  requires_attachment BOOLEAN NOT NULL DEFAULT false,
  overridable BOOLEAN NOT NULL DEFAULT false,
  override_role_codes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (grid_version_id, rule_code)
);

CREATE TABLE IF NOT EXISTS scoring_decision_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grid_version_id UUID NOT NULL REFERENCES scoring_grid_versions(id) ON DELETE CASCADE,
  decision_code TEXT NOT NULL,
  decision_label TEXT NOT NULL,
  min_score NUMERIC(10,4),
  max_score NUMERIC(10,4),
  precedence_order INTEGER NOT NULL DEFAULT 0,
  extra_condition_expression TEXT,
  final_status TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (grid_version_id, decision_code)
);

CREATE TABLE IF NOT EXISTS scoring_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_code TEXT NOT NULL UNIQUE,
  project_id UUID,
  client_id UUID,
  grid_version_id UUID NOT NULL REFERENCES scoring_grid_versions(id),
  evaluation_status TEXT NOT NULL CHECK (evaluation_status IN ('DRAFT','IN_PROGRESS','CALCULATED','VALIDATED','APPROVED','REJECTED','ARCHIVED')),
  scoring_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  as_of_date TIMESTAMPTZ,
  analyst_user_id UUID,
  reviewer_user_id UUID,
  final_score NUMERIC(10,4),
  final_decision TEXT,
  no_go_triggered BOOLEAN NOT NULL DEFAULT false,
  red_flags_count INTEGER NOT NULL DEFAULT 0,
  total_malus_points NUMERIC(10,4),
  total_bonus_points NUMERIC(10,4),
  calculation_snapshot_json JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scoring_evaluation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES scoring_evaluations(id) ON DELETE CASCADE,
  entity_level TEXT NOT NULL,
  entity_id UUID NOT NULL,
  input_definition_id UUID REFERENCES scoring_input_definitions(id) ON DELETE SET NULL,
  input_code TEXT NOT NULL,
  input_label_snapshot TEXT NOT NULL,
  input_type_snapshot TEXT NOT NULL,
  raw_value_text TEXT,
  raw_value_number NUMERIC(18,6),
  raw_value_boolean BOOLEAN,
  raw_value_date TIMESTAMPTZ,
  raw_value_json JSONB,
  selected_value_list_item_id UUID REFERENCES scoring_value_list_items(id),
  comment_text TEXT,
  attachment_count INTEGER NOT NULL DEFAULT 0,
  is_overridden BOOLEAN NOT NULL DEFAULT false,
  overridden_by UUID,
  override_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scoring_evaluation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES scoring_evaluations(id) ON DELETE CASCADE,
  entity_level TEXT NOT NULL,
  entity_id UUID NOT NULL,
  entity_code_snapshot TEXT NOT NULL,
  entity_name_snapshot TEXT NOT NULL,
  base_score NUMERIC(10,4) NOT NULL,
  weighted_score NUMERIC(10,4) NOT NULL,
  applied_weight NUMERIC(10,4) NOT NULL,
  included_in_scoring BOOLEAN NOT NULL DEFAULT true,
  scoring_level_used TEXT,
  no_go_triggered BOOLEAN NOT NULL DEFAULT false,
  red_flag_triggered BOOLEAN NOT NULL DEFAULT false,
  malus_points NUMERIC(10,4),
  bonus_points NUMERIC(10,4),
  final_score_after_adjustment NUMERIC(10,4) NOT NULL,
  result_details_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scoring_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES scoring_evaluations(id) ON DELETE CASCADE,
  entity_level TEXT,
  entity_id UUID,
  comment_type TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scoring_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES scoring_evaluations(id) ON DELETE CASCADE,
  entity_level TEXT,
  entity_id UUID,
  file_name TEXT NOT NULL,
  file_path_or_url TEXT NOT NULL,
  mime_type TEXT,
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scoring_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_type TEXT NOT NULL,
  object_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  action_label TEXT NOT NULL,
  old_value_json JSONB,
  new_value_json JSONB,
  performed_by UUID,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  context_json JSONB
);
