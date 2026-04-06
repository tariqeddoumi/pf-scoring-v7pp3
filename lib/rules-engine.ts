import { prisma } from '@/lib/prisma';

export async function evaluateRules(evaluationId: string) {
  const values = await prisma.criterionValue.findMany({
    where: { evaluationId },
    include: { criterion: true },
  });
  const rules = await prisma.ruleDefinition.findMany({ where: { isActive: true } });
  const findings: { code: string; severity: string; message: string }[] = [];

  for (const rule of rules) {
    const value = values.find((v) => v.criterion.code === rule.criterionCode);
    if (!value) continue;
    let matched = false;
    if (rule.operator === 'EQUALS') matched = value.selectedValue === rule.expectedValue;
    if (matched) findings.push({ code: rule.code, severity: rule.severity, message: rule.message });
  }

  return {
    findings,
    hasNoGo: findings.some((f) => f.severity === 'BLOCKING'),
  };
}
