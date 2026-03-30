import { prisma } from "@/lib/prisma";

export async function resolveDelegationLevel(amountMad: number, finalScore: number, role?: string) {
  const rows = await prisma.delegationMatrix.findMany({ where: { isActive: true }, orderBy: { priority: "asc" } });
  return rows.find((row) => {
    const inAmount = amountMad >= Number(row.minAmountMad) && amountMad < Number(row.maxAmountMad);
    const minScore = row.minScoreInclusive == null || finalScore >= Number(row.minScoreInclusive);
    const maxScore = row.maxScoreExclusive == null || finalScore < Number(row.maxScoreExclusive);
    const roleOk = !role || row.role === role;
    return inAmount && minScore && maxScore && roleOk;
  }) || null;
}
