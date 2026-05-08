import prisma from "@/lib/prisma-client";
import {
  RuntimeAnswerPayload,
  RuntimeScoreResult,
  RuntimeScoringModel,
  RuntimeScoringNode,
  RuntimeNodeScore,
  ScoringGranularityLevel,
} from "@/lib/scoring-runtime-contract";
import { evaluateSafeBooleanExpression } from "@/lib/services/safe-expression-engine";


const DEFAULT_QUALITATIVE_SCORES: Record<string, number> = {
  TRES_FAIBLE: 10,
  FAIBLE: 35,
  MOYEN: 60,
  BON: 80,
  EXCELLENT: 95,
};

function applyConfiguredWeight(score: number, weight: number | null | undefined): number {
  if (weight === null || weight === undefined || weight === 0) return score;
  return weight <= 1 ? score * weight : (score * weight) / 100;
}

function sumWeights(weights: Array<number | null | undefined>): number {
  return weights.reduce<number>((sum, weight) => sum + (weight ?? 0), 0);
}

function parseNodeMetadata(metadataJson: string | null): Record<string, unknown> {
  if (!metadataJson) return {};
  try {
    return JSON.parse(metadataJson) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function readGranularityLevel(metadataJson: string | null): ScoringGranularityLevel | null {
  const metadata = parseNodeMetadata(metadataJson);
  const value = metadata.scoringLevel;
  if (value === "CRITERION" || value === "SUB_CRITERION" || value === "SUB_SUB_CRITERION") {
    return value;
  }
  return null;
}

function inferGranularityFromHierarchy(nodes: RuntimeScoringNode[]): ScoringGranularityLevel {
  const queue = [...nodes];
  const scoredNodes: RuntimeScoringNode[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    if (current.isScored || current.isTerminal || current.children.length === 0) {
      scoredNodes.push(current);
    }
    queue.push(...current.children);
  }

  if (scoredNodes.some((node) => node.nodeType === "SUB_SUB_CRITERION")) {
    return "SUB_SUB_CRITERION";
  }
  if (scoredNodes.some((node) => node.nodeType === "SUB_CRITERION")) {
    return "SUB_CRITERION";
  }
  return "CRITERION";
}

function aggregateScores(rawScores: number[], weights: number[], aggregationMethod: string | null): number {
  if (rawScores.length === 0) return 0;

  switch (aggregationMethod) {
    case "SIMPLE_AVERAGE":
      return rawScores.reduce((sum, value) => sum + value, 0) / rawScores.length;
    case "SUM":
      return rawScores.reduce((sum, value) => sum + value, 0);
    case "MIN":
      return Math.min(...rawScores);
    case "MAX":
      return Math.max(...rawScores);
    case "FIRST_NON_NULL":
      return rawScores.find((value) => value !== 0) ?? 0;
    case "WEIGHTED_AVERAGE":
    case "CHILDREN_AGGREGATION":
    default: {
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      if (totalWeight === 0) {
        return rawScores.reduce((sum, value) => sum + value, 0) / rawScores.length;
      }
      const weightedSum = rawScores.reduce(
        (sum, value, index) => sum + value * (weights[index] ?? 0),
        0
      );
      return weightedSum / totalWeight;
    }
  }
}

function resolveRawScore(node: RuntimeScoringNode, answer?: RuntimeAnswerPayload): number {
  if (!answer) return 0;

  if (node.scoringMethod === "MANUAL_SCORE") {
    return answer.manualScore ?? 0;
  }

  if (node.scoringMethod === "NUMERIC_DIRECT") {
    return answer.valueNumber ?? 0;
  }

  if (node.scoringMethod === "OPTION_SCORE" || node.answerType === "OPTION_SINGLE" || node.answerType === "OPTION_MULTI" || typeof answer.valueString === "string") {
    const option = node.valueList.find((item) => item.value === answer.valueString);
    return option?.score ?? (answer.valueString ? DEFAULT_QUALITATIVE_SCORES[answer.valueString] ?? 0 : 0);
  }

  if ((node.scoringMethod === "RANGE_SCORE" || node.answerType === "NUMERIC_RANGE" || node.ranges.length > 0) && typeof answer.valueNumber === "number") {
    const range = node.ranges.find(
      (item) => answer.valueNumber! >= item.minValue && answer.valueNumber! <= item.maxValue
    );
    return range?.score ?? 0;
  }

  if (typeof answer.valueBoolean === "boolean") return answer.valueBoolean ? 100 : 0;

  return answer.valueNumber ?? 0;
}

export class ScoringRuntimeService {
  static async getRuntimeModel(versionId?: string): Promise<RuntimeScoringModel> {
    const version = await prisma.scoringModelVersion.findFirst({
      where: versionId
        ? { id: versionId }
        : {
            OR: [{ isPublished: true }, { status: "PUBLISHED" }],
          },
      include: {
        model: true,
        rules: {
          where: { isActive: true },
          orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
        },
        nodes: {
          where: { isActive: true },
          include: {
            options: { orderBy: { orderIndex: "asc" } },
            ranges: { orderBy: { orderIndex: "asc" } },
          },
          orderBy: [{ depth: "asc" }, { orderIndex: "asc" }],
        },
      },
      orderBy: versionId ? undefined : { publishedAt: "desc" },
    });

    if (!version) {
      throw new Error("No scoring model version found");
    }

    const nodeMap = new Map<string, RuntimeScoringNode>();
    const roots: RuntimeScoringNode[] = [];

    version.nodes.forEach((node) => {
      const configuredScoringLevel =
        readGranularityLevel(node.metadataJson) ??
        (node.nodeType === "SUB_SUB_CRITERION"
          ? "SUB_SUB_CRITERION"
          : node.nodeType === "SUB_CRITERION"
            ? "SUB_CRITERION"
            : "CRITERION");
      const runtimeNode: RuntimeScoringNode = {
        id: node.id,
        versionId: node.versionId,
        parentNodeId: node.parentNodeId,
        nodeType: node.nodeType,
        code: node.code,
        label: node.label,
        description: node.description,
        depth: node.depth,
        orderIndex: node.orderIndex,
        isActive: node.isActive,
        isTerminal: node.isTerminal,
        isScored: node.isScored,
        isMandatory: node.isMandatory,
        weight: node.weight,
        weightMode: node.weightMode,
        answerType: node.answerType,
        scoringMethod: node.scoringMethod,
        aggregationMethod: node.aggregationMethod,
        configuredScoringLevel,
        valueList: node.options.map((option) => ({
          id: option.id,
          code: option.code,
          label: option.label,
          value: option.value,
          score: option.score,
          orderIndex: option.orderIndex,
          isActive: option.isActive,
          color: option.color,
          metadataJson: option.metadataJson,
        })),
        ranges: node.ranges.map((range) => ({
          id: range.id,
          label: range.label,
          minValue: range.minValue,
          maxValue: range.maxValue,
          score: range.score,
          orderIndex: range.orderIndex,
          isActive: range.isActive,
        })),
        metadataJson: node.metadataJson,
        uiSchemaJson: node.uiSchemaJson,
        children: [],
      };

      nodeMap.set(node.id, runtimeNode);
      if (!node.parentNodeId) roots.push(runtimeNode);
    });

    version.nodes.forEach((node) => {
      if (!node.parentNodeId) return;
      const parent = nodeMap.get(node.parentNodeId);
      const child = nodeMap.get(node.id);
      if (parent && child) {
        parent.children.push(child);
      }
    });

    const rootScoringLevel = inferGranularityFromHierarchy(roots);

    return {
      modelId: version.modelId,
      modelCode: version.model.code,
      modelLabel: version.model.label,
      versionId: version.id,
      versionLabel: version.label,
      versionNumber: version.versionNumber,
      effectiveDate: version.effectiveDate?.toISOString() ?? null,
      rootScoringLevel,
      includedDomainIds: roots.map((root) => root.id),
      nodes: roots,
      rules: version.rules.map((rule) => ({
        id: rule.id,
        nodeId: rule.nodeId,
        ruleType: rule.ruleType,
        code: rule.code,
        label: rule.label,
        severity: rule.severity,
        actionType: rule.actionType,
        penaltyValue: rule.penaltyValue,
        blocking: rule.blocking,
        conditionExpression: rule.conditionExpression,
        messageUser: rule.messageUser,
        isActive: rule.isActive,
      })),
    };
  }

  static evaluateAnswers(model: RuntimeScoringModel, answers: RuntimeAnswerPayload[]): RuntimeScoreResult {
    const answerMap = new Map(answers.map((answer) => [answer.nodeId, answer]));
    const nodeScores: RuntimeNodeScore[] = [];
    const alerts: RuntimeScoreResult["alerts"] = [];

    const compute = (node: RuntimeScoringNode): number => {
      if (!node.isActive) return 0;

      if (node.isScored || node.children.length === 0 || node.isTerminal) {
        const raw = resolveRawScore(node, answerMap.get(node.id));
        const weight = node.weight ?? 0;
        const weighted = applyConfiguredWeight(raw, weight);
        nodeScores.push({
          nodeId: node.id,
          code: node.code,
          rawScore: raw,
          weightedScore: weighted,
          weightApplied: weight,
          scoringMethod: node.scoringMethod,
          aggregationMethod: node.aggregationMethod,
          level: node.configuredScoringLevel,
        });
        return raw;
      }

      const childrenRaw = node.children.map(compute);
      const childrenWeights = node.children.map((child) => child.weight ?? 0);

      const totalWeight = sumWeights(childrenWeights);
      const expectedWeight = totalWeight <= 1.5 ? 1 : 100;
      if (Math.abs(totalWeight - expectedWeight) > 0.001) {
        alerts.push({
          code: "WEIGHT_SUM_WARNING",
          message: `Node ${node.code} has children weights sum ${totalWeight} instead of ${expectedWeight}`,
          severity: "WARNING",
        });
      }

      const raw = aggregateScores(childrenRaw, childrenWeights, node.aggregationMethod);
      const weight = node.weight ?? 0;
      const weighted = applyConfiguredWeight(raw, weight);

      nodeScores.push({
        nodeId: node.id,
        code: node.code,
        rawScore: raw,
        weightedScore: weighted,
        weightApplied: weight,
        scoringMethod: node.scoringMethod,
        aggregationMethod: node.aggregationMethod,
        level: node.configuredScoringLevel,
      });

      return raw;
    };

    const domainScores = model.nodes.map((domain) => {
      const raw = compute(domain);
      const domainWeight = domain.weight ?? 0;
      const weighted = applyConfiguredWeight(raw, domainWeight);
      return {
        nodeId: domain.id,
        code: domain.code,
        rawScore: raw,
        weightedScore: weighted,
        weightApplied: domainWeight,
        scoringMethod: domain.scoringMethod,
        aggregationMethod: domain.aggregationMethod,
        level: domain.configuredScoringLevel,
      } satisfies RuntimeNodeScore;
    });

    const rootWeightTotal = sumWeights(model.nodes.map((domain) => domain.weight));
    let globalScore = rootWeightTotal > 0
      ? domainScores.reduce((sum, domain) => sum + domain.weightedScore, 0)
      : domainScores.length > 0
        ? domainScores.reduce((sum, domain) => sum + domain.rawScore, 0) / domainScores.length
        : 0;
    const triggeredRules: RuntimeScoreResult["triggeredRules"] = [];
    let malusTotal = 0;

    const scoresByCode = Object.fromEntries(
      nodeScores.map((score) => [score.code, score.rawScore])
    );
    const scoresByNodeId = Object.fromEntries(
      nodeScores.map((score) => [score.nodeId, score.rawScore])
    );
    const answersByNodeId = Object.fromEntries(
      answers.map((answer) => [answer.nodeId, answer])
    );

    for (const rule of model.rules) {
      const scopedScore = rule.nodeId ? scoresByNodeId[rule.nodeId] : globalScore;
      const triggered = evaluateSafeBooleanExpression(rule.conditionExpression, {
        globalScore,
        score: scopedScore ?? globalScore,
        scores: scoresByCode,
        nodeScores: scoresByNodeId,
        answers: answersByNodeId,
      });

      if (!triggered) continue;

      triggeredRules.push({
        ruleId: rule.id,
        code: rule.code,
        severity: rule.severity,
        actionType: rule.actionType,
        message: rule.messageUser,
      });

      if (rule.ruleType === "MALUS" || rule.actionType === "APPLY_MALUS") {
        malusTotal += Math.abs(rule.penaltyValue ?? 0);
      }

      if (
        rule.blocking ||
        ["NO_GO", "HARD_STOP", "BLOCK_SUBMISSION"].includes(rule.ruleType) ||
        ["REJECT", "BLOCK", "BLOCK_SUBMISSION"].includes(rule.actionType)
      ) {
        alerts.push({
          code: "BLOCKING_RULE_TRIGGERED",
          message: rule.messageUser ?? `Blocking rule ${rule.code} triggered`,
          severity: "CRITICAL",
        });
      } else if (rule.ruleType === "WARNING" || rule.actionType === "SHOW_WARNING") {
        alerts.push({
          code: "WARNING_RULE_TRIGGERED",
          message: rule.messageUser ?? `Warning rule ${rule.code} triggered`,
          severity: "WARNING",
        });
      }
    }

    globalScore = Math.max(0, Math.min(100, globalScore - malusTotal));

    const decision = alerts.some((alert) => alert.severity === "CRITICAL")
      ? { status: "REJECT" as const, reason: "At least one blocking rule has been triggered" }
      : globalScore >= 75
        ? { status: "APPROVE" as const, reason: "Global score above approval threshold" }
        : { status: "REVIEW" as const, reason: "Manual review required based on score and rules" };

    return {
      versionId: model.versionId,
      globalScore,
      domainScores,
      nodeScores,
      alerts,
      decision,
      triggeredRules,
    };
  }
}
