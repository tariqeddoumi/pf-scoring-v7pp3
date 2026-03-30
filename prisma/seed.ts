import { PrismaClient, UserRole, RuleSeverity } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function upsertUsers() {
  const passwordHash = await bcrypt.hash("ChangeMe123!", 10);
  const users = [
    ["admin@bank.local", "Admin PF", UserRole.ADMIN],
    ["analyst@bank.local", "Analyst PF", UserRole.ANALYST],
    ["reviewer@bank.local", "Reviewer PF", UserRole.REVIEWER],
    ["risk@bank.local", "Risk Manager PF", UserRole.RISK],
    ["committee@bank.local", "Committee Secretary", UserRole.COMMITTEE],
  ] as const;

  for (const [email, fullName, role] of users) {
    await prisma.user.upsert({
      where: { email },
      update: { fullName, role, passwordHash, isActive: true },
      create: { email, fullName, role, passwordHash, isActive: true },
    });
  }
}

async function seedScoreModel() {
  const domains = [
    { code: "D1", label: "Project Fundamentals", weightDev: 0.18, weightConstr: 0.12, weightOps: 0.08, displayOrder: 10 },
    { code: "D2", label: "Sponsor & Counterparties", weightDev: 0.17, weightConstr: 0.10, weightOps: 0.08, displayOrder: 20 },
    { code: "D3", label: "Construction", weightDev: 0.20, weightConstr: 0.24, weightOps: 0.08, displayOrder: 30 },
    { code: "D4", label: "Operations & Market", weightDev: 0.10, weightConstr: 0.14, weightOps: 0.28, displayOrder: 40 },
    { code: "D5", label: "Financial Structure", weightDev: 0.20, weightConstr: 0.22, weightOps: 0.24, displayOrder: 50 },
    { code: "D6", label: "Risk Mitigants & Legal", weightDev: 0.15, weightConstr: 0.18, weightOps: 0.22, displayOrder: 60 },
  ];

  for (const domain of domains) {
    await prisma.scoreDomain.upsert({
      where: { code: domain.code },
      update: domain,
      create: domain,
    });
  }

  const d1 = await prisma.scoreDomain.findUniqueOrThrow({ where: { code: "D1" } });
  const d3 = await prisma.scoreDomain.findUniqueOrThrow({ where: { code: "D3" } });
  const d5 = await prisma.scoreDomain.findUniqueOrThrow({ where: { code: "D5" } });

  const criteria = [
    { domainId: d1.id, code: "D1_01", label: "Market positioning", inputType: "OPTION", weight: 0.40, displayOrder: 10 },
    { domainId: d1.id, code: "D1_02", label: "Demand visibility", inputType: "OPTION", weight: 0.60, displayOrder: 20 },
    { domainId: d3.id, code: "D3_01", label: "Construction progress %", inputType: "RANGE", weight: 0.55, displayOrder: 10, hardStopIfBelow: 2 },
    { domainId: d3.id, code: "D3_02", label: "Permits completeness", inputType: "OPTION", weight: 0.45, displayOrder: 20 },
    { domainId: d5.id, code: "D5_01", label: "Minimum DSCR", inputType: "RANGE", weight: 0.70, displayOrder: 10 },
    { domainId: d5.id, code: "D5_02", label: "DSRA months", inputType: "RANGE", weight: 0.30, displayOrder: 20 },
  ];

  for (const c of criteria) {
    await prisma.scoreCriterion.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    });
  }

  const d101 = await prisma.scoreCriterion.findUniqueOrThrow({ where: { code: "D1_01" } });
  const d102 = await prisma.scoreCriterion.findUniqueOrThrow({ where: { code: "D1_02" } });
  const d302 = await prisma.scoreCriterion.findUniqueOrThrow({ where: { code: "D3_02" } });
  const d301 = await prisma.scoreCriterion.findUniqueOrThrow({ where: { code: "D3_01" } });
  const d501 = await prisma.scoreCriterion.findUniqueOrThrow({ where: { code: "D5_01" } });
  const d502 = await prisma.scoreCriterion.findUniqueOrThrow({ where: { code: "D5_02" } });

  const options = [
    [d101.id, "LEADER", "Leader / top-tier", 9],
    [d101.id, "MID", "Mid-market / acceptable", 6],
    [d101.id, "WEAK", "Weak / crowded", 3],
    [d102.id, "SECURED", "Secured by contracts / strong visibility", 9],
    [d102.id, "PARTIAL", "Partial visibility", 6],
    [d102.id, "VOLATILE", "Volatile demand", 3],
    [d302.id, "COMPLETE", "All key permits obtained", 9],
    [d302.id, "MINOR", "Minor remaining permits", 6],
    [d302.id, "CRITICAL", "Critical permits pending", 2],
  ] as const;

  for (const [criterionId, valueCode, label, score] of options) {
    await prisma.scoreOption.upsert({
      where: { id: `${criterionId}-${valueCode}` },
      update: {},
      create: { id: `${criterionId}-${valueCode}`, criterionId, valueCode, label, score, isRedFlag: score <= 3 },
    }).catch(async () => {
      const exists = await prisma.scoreOption.findFirst({ where: { criterionId, valueCode } });
      if (!exists) {
        await prisma.scoreOption.create({ data: { criterionId, valueCode, label, score, isRedFlag: score <= 3 } });
      }
    });
  }

  const ranges = [
    [d301.id, 0, 25, 2, "<25%"],
    [d301.id, 25, 60, 5, "25%-60%"],
    [d301.id, 60, 1000, 8, ">=60%"],
    [d501.id, 0, 1.1, 2, "<1.10x"],
    [d501.id, 1.1, 1.25, 5, "1.10x-1.25x"],
    [d501.id, 1.25, 99, 9, ">=1.25x"],
    [d502.id, 0, 3, 2, "<3 months"],
    [d502.id, 3, 6, 6, "3-6 months"],
    [d502.id, 6, 99, 9, ">=6 months"],
  ] as const;

  for (const [criterionId, minInclusive, maxExclusive, score, label] of ranges) {
    const exists = await prisma.scoreRange.findFirst({ where: { criterionId, minInclusive, maxExclusive } });
    if (!exists) {
      await prisma.scoreRange.create({ data: { criterionId, minInclusive, maxExclusive, score, label } });
    }
  }
}

async function seedDelegations() {
  const delegations = [
    { levelCode: "L1", levelLabel: "Reviewer Level", role: UserRole.REVIEWER, minAmountMad: 0, maxAmountMad: 20000000, minScoreInclusive: 6, maxScoreExclusive: 11, canApprove: false, canRecommend: true, isCommittee: false, priority: 10 },
    { levelCode: "L2", levelLabel: "Risk Level", role: UserRole.RISK, minAmountMad: 0, maxAmountMad: 100000000, minScoreInclusive: 5, maxScoreExclusive: 11, canApprove: true, canRecommend: true, isCommittee: false, priority: 20 },
    { levelCode: "L3", levelLabel: "Committee", role: UserRole.COMMITTEE, minAmountMad: 100000000, maxAmountMad: 99999999999, minScoreInclusive: 0, maxScoreExclusive: 11, canApprove: true, canRecommend: true, isCommittee: true, priority: 30 },
  ];

  for (const d of delegations) {
    await prisma.delegationMatrix.upsert({ where: { levelCode: d.levelCode }, update: d, create: d });
  }
}

async function seedRules() {
  const ruleset = await prisma.ruleSet.upsert({
    where: { code: "DEFAULT" },
    update: { label: "Default Rule Set", isActive: true },
    create: { code: "DEFAULT", label: "Default Rule Set", description: "Règles de base V7++.3", isActive: true },
  });

  const rules = [
    { code: "NG-DSCR-01", title: "No-go DSCR minimal", scope: "Financial structure", severity: RuleSeverity.NO_GO, expression: "DSCR_MIN < 1.05", outcome: "Blocage immédiat du dossier", committeeFlag: true, displayOrder: 10 },
    { code: "RF-PERMIT-01", title: "Permis critiques manquants", scope: "Construction", severity: RuleSeverity.RED_FLAG, expression: "PERMITS_STATUS = 'CRITICAL'", outcome: "Malus et revue risques renforcée", committeeFlag: true, displayOrder: 20 },
    { code: "RF-OFFTAKER-02", title: "Offtaker fragile", scope: "Commercial", severity: RuleSeverity.RED_FLAG, expression: "OFFTAKER_SCORE < 4", outcome: "Comité obligatoire", committeeFlag: true, displayOrder: 30 },
  ];

  for (const rule of rules) {
    await prisma.noGoRule.upsert({
      where: { code: rule.code },
      update: { ...rule, ruleSetId: ruleset.id },
      create: { ...rule, ruleSetId: ruleset.id },
    });
  }
}

async function seedTemplates() {
  await prisma.committeeTemplate.upsert({
    where: { code: "BANK_DEFAULT" },
    update: {
      label: "Template Banque Défaut",
      headerTitle: "Comité Engagements Project Finance",
      subTitle: "Note de décision premium",
      footerText: "Document interne confidentiel - usage comité",
      primaryColor: "#0F172A",
      accentColor: "#1D4ED8",
      isDefault: true,
    },
    create: {
      code: "BANK_DEFAULT",
      label: "Template Banque Défaut",
      headerTitle: "Comité Engagements Project Finance",
      subTitle: "Note de décision premium",
      footerText: "Document interne confidentiel - usage comité",
      primaryColor: "#0F172A",
      accentColor: "#1D4ED8",
      isDefault: true,
    },
  });
}

async function main() {
  await upsertUsers();
  await seedScoreModel();
  await seedDelegations();
  await seedRules();
  await seedTemplates();
}

main().finally(async () => prisma.$disconnect());
