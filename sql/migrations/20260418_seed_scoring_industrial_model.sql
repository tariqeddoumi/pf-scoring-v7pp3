-- Seed starter grid based on validated hierarchy

INSERT INTO scoring_grid_versions (
  grid_code,
  grid_name,
  version_code,
  version_label,
  model_type,
  status,
  is_active
)
VALUES (
  'PF_V7PP',
  'Project Finance Scoring V7++',
  'v1',
  'Initial industrialized grid',
  'PROJECT_FINANCE',
  'draft',
  false
)
ON CONFLICT (grid_code, version_code) DO NOTHING;

INSERT INTO scoring_value_lists (list_code, list_name, usage_scope)
VALUES
  ('YES_NO', 'Yes / No', 'GLOBAL'),
  ('RISK_LEVEL', 'Risk level', 'SCORING')
ON CONFLICT (list_code) DO NOTHING;
