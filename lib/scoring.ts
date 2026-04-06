import { prisma } from '@/lib/prisma';

export async function computeEvaluationScore(evaluationId: string) {
  const domains = await prisma.scoreDomain.findMany({
    where: { isActive: true },
    include: {
      criteria: {
        where: { isActive: true },
        include: {
          values: { where: { evaluationId } },
        },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  let total = 0;
  const domainOutputs: { domainCode: string; domainName: string; rawScore: number; weightedScore: number }[] = [];

  for (const domain of domains) {
    let domainWeighted = 0;
    let weightSum = 0;
    for (const criterion of domain.criteria) {
      const value = criterion.values[0];
      const criterionWeight = Number(criterion.weight);
      if (!value) continue;
      weightSum += criterionWeight;
      domainWeighted += Number(value.numericScore) * criterionWeight;
    }
    const rawScore = weightSum ? domainWeighted / weightSum : 0;
    const weightedScore = (rawScore / 10) * Number(domain.weight);
    total += weightedScore;
    domainOutputs.push({ domainCode: domain.code, domainName: domain.name, rawScore, weightedScore });
  }

  const grade = total >= 85 ? 'A' : total >= 75 ? 'A-' : total >= 65 ? 'BBB' : total >= 55 ? 'BB' : 'B';
  const probabilityDefault = Number((Math.max(0.005, (100 - total) / 1200)).toFixed(4));

  await prisma.$transaction([
    prisma.domainScore.deleteMany({ where: { evaluationId } }),
    ...domainOutputs.map((d) => prisma.domainScore.create({ data: { evaluationId, ...d } })),
    prisma.evaluation.update({
      where: { id: evaluationId },
      data: { score: total, grade, probabilityDefault },
    }),
  ]);

  return { score: total, grade, probabilityDefault, domains: domainOutputs };
}
