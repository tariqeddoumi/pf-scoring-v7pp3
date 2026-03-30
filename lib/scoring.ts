import { prisma } from "@/lib/prisma";
import { runRules, hasNoGo } from "@/lib/rules-engine";

export type ScoringInput = Record<string, string | number | boolean | null | undefined>;

function gradeFromScore(score: number) {
  if (score >= 8.5) return "A";
  if (score >= 7) return "B";
  if (score >= 5.5) return "C";
  if (score >= 4) return "D";
  return "E";
}

function bamAdjustment(bamClass?: string | null) {
  const map: Record<string, number> = {
    SAIN: 0,
    SENSIBLE: -0.5,
    WATCHLIST: -1,
    DOUTEUX: -2,
    COMPROMIS: -3,
  };
  return bamClass ? map[bamClass] ?? 0 : 0;
}

export async function computeEvaluation(input: ScoringInput, phase: string, bamClass?: string | null) {
  const [domains, rules] = await Promise.all([
    prisma.scoreDomain.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      include: {
        criteria: {
          where: { isActive: true },
          orderBy: { displayOrder: "asc" },
          include: { options: true, ranges: true },
        },
      },
    }),
    prisma.noGoRule.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    }),
  ]);

  const phaseKey =
    phase.toLowerCase().includes("construct")
      ? "weightConstr"
      : phase.toLowerCase().includes("oper")
        ? "weightOps"
        : "weightDev";

  let total = 0;
  let hardStop = false;
  let hardStopReason: string | undefined;

  const domainResults: Array<{
    domainCode: string;
    domainName: string;
    weight: number;
    rawScore: number;
    weightedScore: number;
    details: unknown[];
  }> = [];

  for (const domain of domains) {
    const weight = Number(domain[phaseKey as keyof typeof domain] ?? 0);
    let domainScore = 0;
    let totalCriterionWeight = 0;
    const details: unknown[] = [];

    for (const criterion of domain.criteria) {
      const value = input[criterion.code];
      let score = 0;

      if (criterion.inputType === "OPTION") {
        const opt = criterion.options.find((o) => o.valueCode === value);
        score = opt ? Number(opt.score) : 0;
      } else if (criterion.inputType === "RANGE") {
        const num = Number(value ?? 0);
        const range = criterion.ranges.find((r) => num >= Number(r.minInclusive) && num < Number(r.maxExclusive));
        score = range ? Number(range.score) : 0;
      }

      if (criterion.hardStopIfBelow != null && score < Number(criterion.hardStopIfBelow)) {
        hardStop = true;
        hardStopReason = hardStopReason || `Hard stop triggered by ${criterion.code} - ${criterion.label}`;
      }

      domainScore += score * Number(criterion.weight);
      totalCriterionWeight += Number(criterion.weight);
      details.push({
        criterionCode: criterion.code,
        criterionLabel: criterion.label,
        value,
        score,
        weight: Number(criterion.weight),
      });
    }

    const rawScore = totalCriterionWeight > 0 ? domainScore / totalCriterionWeight : 0;
    const weightedScore = rawScore * weight;
    total += weightedScore;
    domainResults.push({
      domainCode: domain.code,
      domainName: domain.label,
      weight,
      rawScore,
      weightedScore,
      details,
    });
  }

  const decisions = runRules(
    rules.map((rule) => ({
      code: rule.code,
      title: rule.title,
      severity: rule.severity,
      expression: rule.expression,
      outcome: rule.outcome,
    })),
    input,
  );

  const hardStopByRules = hasNoGo(decisions);
  const firstNoGo = decisions.find((item) => item.matched && item.severity === "NO_GO");

  if (hardStopByRules) {
    hardStop = true;
    hardStopReason = hardStopReason || firstNoGo?.outcome || "No-go rule triggered";
  }

  const adjusted = Math.max(0, Math.min(10, total + bamAdjustment(bamClass)));
  return {
    finalScore: Number(adjusted.toFixed(2)),
    finalGrade: gradeFromScore(adjusted),
    hardStop,
    hardStopReason,
    domains: domainResults,
    triggeredRules: decisions.filter((item) => item.matched),
  };
}
