-- Seed script for legacy admin scoring grid API (/api/admin/scoring-criteria)
-- Targets Prisma-mapped tables:
--   BCP_SCORE_GP_scoring_criteria
--   BCP_SCORE_GP_scoring_thresholds
--   BCP_SCORE_GP_scoring_options
--
-- Usage:
--   psql "$DATABASE_URL" -f sql/migrations/20260420_seed_legacy_scoring_grid.sql

BEGIN;

-- Optional cleanup to reset the grid content before reseeding.
DELETE FROM "BCP_SCORE_GP_scoring_options";
DELETE FROM "BCP_SCORE_GP_scoring_thresholds";
DELETE FROM "BCP_SCORE_GP_scoring_criteria";

-- 1) Criteria
INSERT INTO "BCP_SCORE_GP_scoring_criteria"
("id","code","label","description","category","weight","minScore","maxScore","scoreType","isActive","orderIndex","createdBy","createdAt","updatedAt")
VALUES
(gen_random_uuid(),'leverage','Leverage Ratio','Debt to total capitalization','Financial',0.1200,0,100,'NUMERIC',true,1,NULL,now(),now()),
(gen_random_uuid(),'dscr','DSCR','Debt Service Coverage Ratio','Financial',0.1200,0,100,'NUMERIC',true,2,NULL,now(),now()),
(gen_random_uuid(),'llcr','LLCR','Loan Life Coverage Ratio','Financial',0.0800,0,100,'NUMERIC',true,3,NULL,now(),now()),
(gen_random_uuid(),'technology_maturity','Technology Maturity','Level of technology provenness','Technical',0.0800,0,100,'OPTION',true,4,NULL,now(),now()),
(gen_random_uuid(),'epc_quality','EPC Contract Quality','Quality and allocation of EPC risks','Technical',0.0800,0,100,'OPTION',true,5,NULL,now(),now()),
(gen_random_uuid(),'offtaker_quality','Offtaker Credit Quality','Counterparty quality','Market',0.1000,0,100,'OPTION',true,6,NULL,now(),now()),
(gen_random_uuid(),'contract_tenor','Contract Tenor Adequacy','Adequacy of tenor vs debt maturity','Market',0.0600,0,100,'NUMERIC',true,7,NULL,now(),now()),
(gen_random_uuid(),'legal_robustness','Legal Robustness','Strength of legal framework and contracts','Legal',0.1000,0,100,'OPTION',true,8,NULL,now(),now()),
(gen_random_uuid(),'governance_quality','Governance Quality','SPV governance and reporting quality','Governance',0.0600,0,100,'OPTION',true,9,NULL,now(),now()),
(gen_random_uuid(),'esg_risk','ESG Risk Level','Environmental and social risk profile','Environmental',0.0700,0,100,'OPTION',true,10,NULL,now(),now()),
(gen_random_uuid(),'country_risk','Country Risk','Macro/political/currency risk level','Country',0.0700,0,100,'OPTION',true,11,NULL,now(),now()),
(gen_random_uuid(),'fx_exposure','FX Exposure','FX mismatch risk','Country',0.0600,0,100,'OPTION',true,12,NULL,now(),now());

-- 2) Numeric thresholds
INSERT INTO "BCP_SCORE_GP_scoring_thresholds"
("id","criterionId","minValue","maxValue","score","label","orderIndex","createdAt","updatedAt")
SELECT gen_random_uuid(), c.id, t.minv, t.maxv, t.sc, t.lbl, t.ord, now(), now()
FROM "BCP_SCORE_GP_scoring_criteria" c
JOIN (
  VALUES
    (0.00::double precision,0.40::double precision,95.0::double precision,'<=40%',1),
    (0.40,0.55,80.0,'40-55%',2),
    (0.55,0.70,60.0,'55-70%',3),
    (0.70,0.85,35.0,'70-85%',4),
    (0.85,10.00,10.0,'>85%',5)
) AS t(minv,maxv,sc,lbl,ord) ON true
WHERE c.code = 'leverage';

INSERT INTO "BCP_SCORE_GP_scoring_thresholds"
("id","criterionId","minValue","maxValue","score","label","orderIndex","createdAt","updatedAt")
SELECT gen_random_uuid(), c.id, t.minv, t.maxv, t.sc, t.lbl, t.ord, now(), now()
FROM "BCP_SCORE_GP_scoring_criteria" c
JOIN (
  VALUES
    (0.00::double precision,1.10::double precision,10.0::double precision,'<1.10x',1),
    (1.10,1.20,35.0,'1.10-1.20x',2),
    (1.20,1.30,60.0,'1.20-1.30x',3),
    (1.30,1.50,80.0,'1.30-1.50x',4),
    (1.50,10.00,95.0,'>=1.50x',5)
) AS t(minv,maxv,sc,lbl,ord) ON true
WHERE c.code = 'dscr';

INSERT INTO "BCP_SCORE_GP_scoring_thresholds"
("id","criterionId","minValue","maxValue","score","label","orderIndex","createdAt","updatedAt")
SELECT gen_random_uuid(), c.id, t.minv, t.maxv, t.sc, t.lbl, t.ord, now(), now()
FROM "BCP_SCORE_GP_scoring_criteria" c
JOIN (
  VALUES
    (0.00::double precision,1.20::double precision,15.0::double precision,'<1.20x',1),
    (1.20,1.35,45.0,'1.20-1.35x',2),
    (1.35,1.50,70.0,'1.35-1.50x',3),
    (1.50,1.70,85.0,'1.50-1.70x',4),
    (1.70,10.00,95.0,'>=1.70x',5)
) AS t(minv,maxv,sc,lbl,ord) ON true
WHERE c.code = 'llcr';

INSERT INTO "BCP_SCORE_GP_scoring_thresholds"
("id","criterionId","minValue","maxValue","score","label","orderIndex","createdAt","updatedAt")
SELECT gen_random_uuid(), c.id, t.minv, t.maxv, t.sc, t.lbl, t.ord, now(), now()
FROM "BCP_SCORE_GP_scoring_criteria" c
JOIN (
  VALUES
    (0.00::double precision,0.90::double precision,20.0::double precision,'<0.9x',1),
    (0.90,1.00,50.0,'0.9-1.0x',2),
    (1.00,1.10,75.0,'1.0-1.1x',3),
    (1.10,10.00,95.0,'>1.1x',4)
) AS t(minv,maxv,sc,lbl,ord) ON true
WHERE c.code = 'contract_tenor';

-- 3) Qualitative options
WITH levels AS (
  SELECT * FROM (
    VALUES
      ('Très faible',10.0::double precision,1),
      ('Faible',35.0::double precision,2),
      ('Moyen',60.0::double precision,3),
      ('Bon',80.0::double precision,4),
      ('Excellent',95.0::double precision,5)
  ) x(lbl,score,ord)
)
INSERT INTO "BCP_SCORE_GP_scoring_options"
("id","criterionId","label","score","orderIndex","createdAt","updatedAt")
SELECT gen_random_uuid(), c.id, l.lbl, l.score, l.ord, now(), now()
FROM "BCP_SCORE_GP_scoring_criteria" c
JOIN levels l ON true
WHERE c.code IN (
  'technology_maturity',
  'epc_quality',
  'offtaker_quality',
  'legal_robustness',
  'governance_quality',
  'esg_risk',
  'country_risk',
  'fx_exposure'
);

COMMIT;
