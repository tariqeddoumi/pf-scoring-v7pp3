import prisma from "@/lib/prisma-client";

export interface ComposanteInput {
  domainCode: string;
  score: number;
  weight?: number;
}

export interface GlobalScoreResultV2 {
  scoreGlobal: number;
  grade: string;
  composantes: ComposanteInput[];
  details: Record<string, { score: number; weight: number; weightedScore: number }>;
}

export async function calculateGlobalScoreV2(
  composantes: ComposanteInput[]
): Promise<GlobalScoreResultV2> {
  const activeDomains = await prisma.scoringNode.findMany({
    where: { parentNodeId: null, isActive: true },
    select: { code: true, weight: true },
  });
  const weightByCode = new Map(activeDomains.map((domain) => [domain.code, domain.weight ?? 0]));

  let totalWeighted = 0;
  let totalWeight = 0;
  const details: GlobalScoreResultV2["details"] = {};

  for (const composante of composantes) {
    const configuredWeight = weightByCode.get(composante.domainCode);
    const weight = configuredWeight ?? composante.weight ?? 0;
    totalWeighted += composante.score * weight;
    totalWeight += weight;
    details[composante.domainCode] = {
      score: composante.score,
      weight,
      weightedScore: composante.score * weight,
    };
  }

  const scoreGlobal = totalWeight > 0 ? totalWeighted / totalWeight : 0;

  return {
    scoreGlobal,
    grade: determineGradeV2(scoreGlobal),
    composantes,
    details,
  };
}

export function determineGradeV2(score: number): string {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  return "D";
}

export async function checkHardStopRules(domainCode: string, score: number): Promise<boolean> {
  const domain = await prisma.scoringNode.findFirst({
    where: { code: domainCode, parentNodeId: null, isActive: true },
    select: { id: true },
  });

  if (!domain) return false;

  const noGoRule = await prisma.scoringNodeRule.findFirst({
    where: {
      nodeId: domain.id,
      isActive: true,
      ruleType: { in: ["NO_GO", "HARD_STOP", "BLOCK_SUBMISSION"] },
      conditionExpression: { contains: "score" },
    },
  });

  return !!noGoRule && score <= 0;
}

export async function getCountryRiskScore(countryCode: string): Promise<number> {
  const country = await prisma.country.findUnique({ where: { code: countryCode } });
  return country?.riskScore ?? 50;
}

export function convertCountryRiskToScore(riskScore: number): number {
  return Math.max(0, Math.min(100, 100 - riskScore));
}

export async function getAvailableDomains() {
  return prisma.scoringNode.findMany({
    where: { parentNodeId: null },
    orderBy: { orderIndex: "asc" },
  });
}

export async function getActiveDomains() {
  return prisma.scoringNode.findMany({
    where: { parentNodeId: null, isActive: true },
    orderBy: { orderIndex: "asc" },
  });
}

export async function isCountryRiskActive(): Promise<boolean> {
  const countryRiskNode = await prisma.scoringNode.findFirst({
    where: { code: "pays", parentNodeId: null },
    select: { isActive: true },
  });
  return countryRiskNode?.isActive ?? false;
}

export async function getCountryRiskMode(): Promise<"AUTO_ASSIGN" | "MANUAL"> {
  const config = await prisma.systemConfig.findUnique({
    where: { key: "COUNTRY_RISK_MODE" },
  });
  return config?.value === "MANUAL" ? "MANUAL" : "AUTO_ASSIGN";
}
