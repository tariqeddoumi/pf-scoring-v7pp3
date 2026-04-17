-- ============================================================================
-- PF_V7PP hierarchy upsert from JSON model payload
-- Date: 2026-04-17
--
-- Target tables:
--   scoring_models
--   scoring_domains
--   scoring_criteria
--   scoring_subcriteria
--   scoring_subsubcriteria
--
-- Rules implemented:
-- - Preserve hierarchy: domain -> criteria -> subcriteria -> subsubcriteria
-- - Use code as unique identifier with ON CONFLICT DO UPDATE
-- - Keep weights as decimal fractions (e.g. 0.15 = 15%)
-- - Ensure referential integrity by resolving FK ids from parent code upserts
-- ============================================================================

BEGIN;

-- Optional safety: ensure unique code constraints required by ON CONFLICT.
CREATE UNIQUE INDEX IF NOT EXISTS scoring_models_code_uidx ON scoring_models(code);
CREATE UNIQUE INDEX IF NOT EXISTS scoring_domains_code_uidx ON scoring_domains(code);
CREATE UNIQUE INDEX IF NOT EXISTS scoring_criteria_code_uidx ON scoring_criteria(code);
CREATE UNIQUE INDEX IF NOT EXISTS scoring_subcriteria_code_uidx ON scoring_subcriteria(code);
CREATE UNIQUE INDEX IF NOT EXISTS scoring_subsubcriteria_code_uidx ON scoring_subsubcriteria(code);

WITH raw AS (
  SELECT $$
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
  $$::jsonb AS model_json
),
model_upsert AS (
  INSERT INTO scoring_models (code, name)
  SELECT
    model_json->>'model_code' AS code,
    model_json->>'model_name' AS name
  FROM raw
  ON CONFLICT (code) DO UPDATE
    SET name = EXCLUDED.name
  RETURNING id, code
),
domain_input AS (
  SELECT
    m.id AS model_id,
    d.ordinality::int AS order_index,
    d.item->>'code' AS code,
    d.item->>'name' AS name,
    (d.item->>'weight')::numeric(12,6) AS weight,
    d.item AS domain_json
  FROM raw r
  JOIN model_upsert m ON m.code = r.model_json->>'model_code'
  CROSS JOIN LATERAL jsonb_array_elements(r.model_json->'domains') WITH ORDINALITY AS d(item, ordinality)
),
domain_upsert AS (
  INSERT INTO scoring_domains (model_id, code, name, weight, order_index)
  SELECT model_id, code, name, weight, order_index
  FROM domain_input
  ON CONFLICT (code) DO UPDATE
    SET
      model_id = EXCLUDED.model_id,
      name = EXCLUDED.name,
      weight = EXCLUDED.weight,
      order_index = EXCLUDED.order_index
  RETURNING id, code
),
criteria_input AS (
  SELECT
    du.id AS domain_id,
    c.ordinality::int AS order_index,
    c.item->>'code' AS code,
    c.item->>'name' AS name,
    (c.item->>'weight')::numeric(12,6) AS weight,
    c.item AS criteria_json
  FROM domain_input di
  JOIN domain_upsert du ON du.code = di.code
  CROSS JOIN LATERAL jsonb_array_elements(di.domain_json->'criteria') WITH ORDINALITY AS c(item, ordinality)
),
criteria_upsert AS (
  INSERT INTO scoring_criteria (domain_id, code, name, weight, order_index)
  SELECT domain_id, code, name, weight, order_index
  FROM criteria_input
  ON CONFLICT (code) DO UPDATE
    SET
      domain_id = EXCLUDED.domain_id,
      name = EXCLUDED.name,
      weight = EXCLUDED.weight,
      order_index = EXCLUDED.order_index
  RETURNING id, code
),
subcriteria_input AS (
  SELECT
    cu.id AS criteria_id,
    sc.ordinality::int AS order_index,
    sc.item->>'code' AS code,
    sc.item->>'name' AS name,
    (sc.item->>'weight')::numeric(12,6) AS weight,
    sc.item AS subcriteria_json
  FROM criteria_input ci
  JOIN criteria_upsert cu ON cu.code = ci.code
  CROSS JOIN LATERAL jsonb_array_elements(ci.criteria_json->'subcriteria') WITH ORDINALITY AS sc(item, ordinality)
),
subcriteria_upsert AS (
  INSERT INTO scoring_subcriteria (criteria_id, code, name, weight, order_index)
  SELECT criteria_id, code, name, weight, order_index
  FROM subcriteria_input
  ON CONFLICT (code) DO UPDATE
    SET
      criteria_id = EXCLUDED.criteria_id,
      name = EXCLUDED.name,
      weight = EXCLUDED.weight,
      order_index = EXCLUDED.order_index
  RETURNING id, code
),
subsubcriteria_input AS (
  SELECT
    scu.id AS subcriteria_id,
    ssc.ordinality::int AS order_index,
    ssc.item->>'code' AS code,
    ssc.item->>'name' AS name,
    (ssc.item->>'weight')::numeric(12,6) AS weight
  FROM subcriteria_input sci
  JOIN subcriteria_upsert scu ON scu.code = sci.code
  CROSS JOIN LATERAL jsonb_array_elements(sci.subcriteria_json->'subsubcriteria') WITH ORDINALITY AS ssc(item, ordinality)
)
INSERT INTO scoring_subsubcriteria (subcriteria_id, code, name, weight, order_index)
SELECT subcriteria_id, code, name, weight, order_index
FROM subsubcriteria_input
ON CONFLICT (code) DO UPDATE
  SET
    subcriteria_id = EXCLUDED.subcriteria_id,
    name = EXCLUDED.name,
    weight = EXCLUDED.weight,
    order_index = EXCLUDED.order_index;

COMMIT;
