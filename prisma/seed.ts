import { PrismaClient, UserRole, ProjectStatus, EvaluationStatus, RuleSeverity } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('ChangeMe123!', 10);

  const users = [
    ['admin@bank.local', 'Admin PF', UserRole.ADMIN],
    ['analyst@bank.local', 'Analyst PF', UserRole.ANALYST],
    ['reviewer@bank.local', 'Reviewer PF', UserRole.REVIEWER],
    ['risk@bank.local', 'Risk Manager PF', UserRole.RISK],
    ['committee@bank.local', 'Committee PF', UserRole.COMMITTEE],
  ] as const;

  for (const [email, fullName, role] of users) {
    await prisma.user.upsert({
      where: { email },
      update: { fullName, role, passwordHash, isActive: true },
      create: { email, fullName, role, passwordHash, isActive: true },
    });
  }

  const admin = await prisma.user.findUniqueOrThrow({ where: { email: 'admin@bank.local' } });
  const analyst = await prisma.user.findUniqueOrThrow({ where: { email: 'analyst@bank.local' } });

  const domains = [
    { code: 'D1', name: 'Sponsor & Gouvernance', weight: 20 },
    { code: 'D2', name: 'Risque Projet & Construction', weight: 20 },
    { code: 'D3', name: 'Risque Marché & Revenus', weight: 20 },
    { code: 'D4', name: 'Structure Financière', weight: 25 },
    { code: 'D5', name: 'Sécurité Juridique & ESG', weight: 15 },
  ];

  for (let i = 0; i < domains.length; i++) {
    const domain = await prisma.scoreDomain.upsert({
      where: { code: domains[i].code },
      update: { name: domains[i].name, weight: domains[i].weight, sortOrder: i + 1, isActive: true },
      create: { code: domains[i].code, name: domains[i].name, weight: domains[i].weight, sortOrder: i + 1, isActive: true },
    });

    const criterionCode = `${domains[i].code}_C1`;
    const criterion = await prisma.scoreCriterion.upsert({
      where: { code: criterionCode },
      update: { domainId: domain.id, name: `${domain.name} - Critère principal`, weight: 100, sortOrder: 1 },
      create: {
        domainId: domain.id,
        code: criterionCode,
        name: `${domain.name} - Critère principal`,
        description: `Critère principal du domaine ${domain.name}`,
        weight: 100,
        inputType: 'select',
        sortOrder: 1,
      },
    });

    const options = [
      ['Excellent', 'excellent', 10, false],
      ['Bon', 'good', 8, False],
      ['Moyen', 'average', 5, False],
      ['Faible', 'weak', 2, True],
    ];
    for (let j = 0; j < options.length; j++) {
      const [label, value, numericScore, isRedFlag] = options[j] as [string, string, number, boolean];
      await prisma.scoreOption.upsert({
        where: { id: `${criterion.id}-${value}` },
        update: {},
        create: {
          id: `${criterion.id}-${value}`,
          criterionId: criterion.id,
          label,
          value,
          numericScore,
          sortOrder: j + 1,
          isRedFlag,
        },
      });
    }
  }

  const workflow = [
    { code: 'SUBMISSION', name: 'Soumission', requiredRole: UserRole.ANALYST, sortOrder: 1, nextOnApprove: 'REVIEW', nextOnReject: 'RETURN', isFinal: false },
    { code: 'REVIEW', name: 'Revue métier', requiredRole: UserRole.REVIEWER, sortOrder: 2, nextOnApprove: 'RISK', nextOnReject: 'RETURN', isFinal: false },
    { code: 'RISK', name: 'Validation risque', requiredRole: UserRole.RISK, sortOrder: 3, nextOnApprove: 'COMMITTEE', nextOnReject: 'RETURN', isFinal: false },
    { code: 'COMMITTEE', name: 'Comité', requiredRole: UserRole.COMMITTEE, sortOrder: 4, nextOnApprove: 'APPROVED', nextOnReject: 'REJECTED', isFinal: false },
    { code: 'APPROVED', name: 'Approuvé', requiredRole: UserRole.COMMITTEE, sortOrder: 5, isFinal: true },
    { code: 'REJECTED', name: 'Rejeté', requiredRole: UserRole.COMMITTEE, sortOrder: 6, isFinal: true },
    { code: 'RETURN', name: 'Retour pour correction', requiredRole: UserRole.REVIEWER, sortOrder: 7, isFinal: true },
  ];

  for (const step of workflow) {
    await prisma.workflowStep.upsert({
      where: { code: step.code },
      update: step,
      create: step,
    });
  }

  await prisma.ruleDefinition.upsert({
    where: { code: 'NO_GO_WEAK_D4' },
    update: {},
    create: {
      code: 'NO_GO_WEAK_D4',
      name: 'No-Go structure financière faible',
      description: 'Bloque si le critère principal de structure financière est faible.',
      criterionCode: 'D4_C1',
      operator: 'EQUALS',
      expectedValue: 'weak',
      severity: RuleSeverity.BLOCKING,
      message: 'Structure financière jugée faible : no-go automatique.',
    },
  });

  await prisma.delegationRule.upsert({
    where: { code: 'DEL_COMMITTEE_GT_50M' },
    update: {},
    create: {
      code: 'DEL_COMMITTEE_GT_50M',
      name: 'Comité obligatoire > 50M',
      minAmount: 50000000,
      maxAmount: 999999999999,
      requiredFinalRole: UserRole.COMMITTEE,
    },
  });

  const project = await prisma.project.upsert({
    where: { projectCode: 'PF-2026-0001' },
    update: {},
    create: {
      projectCode: 'PF-2026-0001',
      name: 'Parc solaire Atlas I',
      sponsor: 'Atlas Energy Holding',
      country: 'Morocco',
      sector: 'Energy',
      currency: 'MAD',
      totalCost: 950000000,
      requestedAmount: 550000000,
      phase: 'Construction',
      offTaker: 'ONEE',
      epcContractor: 'EPC Maroc',
      oAndMOperator: 'O&M Atlas',
      status: ProjectStatus.ACTIVE,
      ownerId: analyst.id,
    },
  });

  const evaluation = await prisma.evaluation.upsert({
    where: { reference: 'EV-2026-0001' },
    update: {},
    create: {
      reference: 'EV-2026-0001',
      projectId: project.id,
      authorId: analyst.id,
      version: 1,
      status: EvaluationStatus.SUBMITTED,
      score: 78.5,
      grade: 'A-',
      probabilityDefault: 0.023,
      summary: 'Projet robuste avec sponsor expérimenté et offtaker de qualité.',
      recommendation: 'Poursuivre le processus sous réserve de validation risque et comité.',
    },
  });

  for (const domain of await prisma.scoreDomain.findMany({ include: { criteria: { include: { options: true } } } })) {
    const criterion = domain.criteria[0];
    const option = criterion.options.find((o) => o.value === 'good') ?? criterion.options[0];
    await prisma.criterionValue.upsert({
      where: { evaluationId_criterionId: { evaluationId: evaluation.id, criterionId: criterion.id } },
      update: {},
      create: {
        evaluationId: evaluation.id,
        criterionId: criterion.id,
        selectedValue: option.value,
        selectedLabel: option.label,
        numericScore: option.numericScore,
      },
    });

    await prisma.domainScore.create({
      data: {
        evaluationId: evaluation.id,
        domainCode: domain.code,
        domainName: domain.name,
        rawScore: 8,
        weightedScore: Number(domain.weight) * 0.8,
      },
    });
  }

  await prisma.decision.create({
    data: {
      evaluationId: evaluation.id,
      decidedById: admin.id,
      stepCode: 'SUBMISSION',
      action: 'SEEDED',
      comment: 'Données de démonstration initialisées.',
    },
  });
}

main().finally(async () => prisma.$disconnect());
