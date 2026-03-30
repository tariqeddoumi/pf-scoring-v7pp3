CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL UNIQUE,
  "fullName" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  role TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Project" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectCode" TEXT NOT NULL UNIQUE,
  "sponsorName" TEXT NOT NULL,
  "projectName" TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT,
  sector TEXT NOT NULL,
  phase TEXT NOT NULL,
  "totalCostMad" NUMERIC(18,2) NOT NULL,
  "requestedDebtMad" NUMERIC(18,2) NOT NULL,
  "createdById" TEXT NOT NULL REFERENCES "User"(id),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Evaluation" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  reference TEXT NOT NULL UNIQUE,
  "projectId" TEXT NOT NULL REFERENCES "Project"(id),
  "modelVersion" TEXT NOT NULL DEFAULT 'V7++.2',
  "createdById" TEXT NOT NULL REFERENCES "User"(id),
  status TEXT NOT NULL DEFAULT 'DRAFT',
  phase TEXT NOT NULL,
  "requestedAmountMad" NUMERIC(18,2) NOT NULL,
  "finalScore" NUMERIC(8,2),
  "finalGrade" TEXT,
  "bamClass" TEXT,
  "hardStop" BOOLEAN NOT NULL DEFAULT FALSE,
  "hardStopReason" TEXT,
  "summaryJson" JSONB,
  "inputJson" JSONB NOT NULL,
  "submittedAt" TIMESTAMP,
  "approvedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "EvaluationDomainScore" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "evaluationId" TEXT NOT NULL REFERENCES "Evaluation"(id) ON DELETE CASCADE,
  "domainCode" TEXT NOT NULL,
  "domainName" TEXT NOT NULL,
  weight NUMERIC(8,4) NOT NULL,
  "rawScore" NUMERIC(8,2) NOT NULL,
  "weightedScore" NUMERIC(8,2) NOT NULL,
  "detailsJson" JSONB
);

CREATE TABLE IF NOT EXISTS "EvaluationDecision" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "evaluationId" TEXT NOT NULL REFERENCES "Evaluation"(id) ON DELETE CASCADE,
  "actorUserId" TEXT NOT NULL REFERENCES "User"(id),
  action TEXT NOT NULL,
  "levelCode" TEXT NOT NULL,
  "levelLabel" TEXT NOT NULL,
  comment TEXT,
  "delegatedLimitMad" NUMERIC(18,2),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "DelegationMatrix" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "levelCode" TEXT NOT NULL UNIQUE,
  "levelLabel" TEXT NOT NULL,
  role TEXT NOT NULL,
  "minAmountMad" NUMERIC(18,2) NOT NULL,
  "maxAmountMad" NUMERIC(18,2) NOT NULL,
  "minScoreInclusive" NUMERIC(8,2),
  "maxScoreExclusive" NUMERIC(8,2),
  "allowedSectors" TEXT,
  "allowedPhases" TEXT,
  "canApprove" BOOLEAN NOT NULL DEFAULT FALSE,
  "canRecommend" BOOLEAN NOT NULL DEFAULT TRUE,
  "isCommittee" BOOLEAN NOT NULL DEFAULT FALSE,
  priority INT NOT NULL DEFAULT 100,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ScoreDomain" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  "weightDev" NUMERIC(8,4) NOT NULL,
  "weightConstr" NUMERIC(8,4) NOT NULL,
  "weightOps" NUMERIC(8,4) NOT NULL,
  "displayOrder" INT NOT NULL DEFAULT 100,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS "ScoreCriterion" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "domainId" TEXT NOT NULL REFERENCES "ScoreDomain"(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  "inputType" TEXT NOT NULL,
  weight NUMERIC(8,4) NOT NULL,
  "hardStopIfBelow" NUMERIC(8,2),
  "displayOrder" INT NOT NULL DEFAULT 100,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS "ScoreOption" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "criterionId" TEXT NOT NULL REFERENCES "ScoreCriterion"(id) ON DELETE CASCADE,
  "valueCode" TEXT NOT NULL,
  label TEXT NOT NULL,
  score NUMERIC(8,2) NOT NULL,
  "displayOrder" INT NOT NULL DEFAULT 100,
  "isRedFlag" BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS "ScoreRange" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "criterionId" TEXT NOT NULL REFERENCES "ScoreCriterion"(id) ON DELETE CASCADE,
  "minInclusive" NUMERIC(18,4) NOT NULL,
  "maxExclusive" NUMERIC(18,4) NOT NULL,
  score NUMERIC(8,2) NOT NULL,
  label TEXT
);

CREATE TABLE IF NOT EXISTS "Notification" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'IN_APP',
  "readAt" TIMESTAMP,
  "sentAt" TIMESTAMP,
  "metaJson" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "evaluationId" TEXT REFERENCES "Evaluation"(id) ON DELETE CASCADE,
  "actorUserId" TEXT REFERENCES "User"(id),
  "entityName" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "fieldName" TEXT NOT NULL,
  "oldValue" TEXT,
  "newValue" TEXT,
  action TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
