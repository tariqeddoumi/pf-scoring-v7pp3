import { prisma } from '@/lib/prisma';

export async function resolveDelegation(projectId: string) {
  const project = await prisma.project.findUniqueOrThrow({ where: { id: projectId } });
  const rules = await prisma.delegationRule.findMany({ where: { isActive: true } });
  const amount = Number(project.requestedAmount);

  const matched = rules.find((rule) =>
    amount >= Number(rule.minAmount) && amount <= Number(rule.maxAmount) &&
    (!rule.sector || rule.sector === project.sector) &&
    (!rule.country || rule.country === project.country)
  );

  return matched ?? null;
}
