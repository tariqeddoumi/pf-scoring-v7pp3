import prisma from "@/lib/prisma-client";
import { auditSensitiveAction } from "@/lib/services/audit-trail-service";
import { RuntimeAnswerPayload } from "@/lib/scoring-runtime-contract";
import { ScoringRuntimeService } from "@/lib/services/scoring-runtime-service";

const ANSWER_EDITABLE_STATUSES = new Set(["brouillon", "retour_correction"]);

export class ScoringEvaluationService {
  /**
   * Create a new evaluation for a project
   */
  static async createEvaluation(data: {
    projectId: string;
    modelId: string;
    modelVersionId: string;
    evaluatedBy: string;
  }) {
    const version = await prisma.scoringModelVersion.findUnique({
      where: { id: data.modelVersionId },
    });

    if (!version) {
      throw new Error("Scoring model version not found");
    }

    const evaluation = await prisma.scoringEvaluation.create({
      data: {
        projectId: data.projectId,
        modelId: data.modelId,
        modelVersionId: data.modelVersionId,
        analystId: data.evaluatedBy,
        status: "brouillon",
      },
      include: {
        answers: true,
      },
    });

    await auditSensitiveAction({
      userId: data.evaluatedBy,
      action: "SCORING_EVALUATION_CREATE",
      evaluationId: evaluation.id,
      projectId: data.projectId,
      entityType: "ScoringEvaluation",
      entityId: evaluation.id,
      details: { modelId: data.modelId, modelVersionId: data.modelVersionId },
    });

    return evaluation;
  }

  /**
   * Record an answer for a node in an evaluation
   */
  static async recordAnswer(data: {
    evaluationId: string;
    nodeId: string;
    valueString?: string;
    valueNumber?: number;
    valueBoolean?: boolean;
    valueDate?: Date;
    manualScore?: number;
    comment?: string;
    recordedBy: string;
  }) {
    const evaluation = await prisma.scoringEvaluation.findUnique({
      where: { id: data.evaluationId },
    });

    if (!evaluation) {
      throw new Error("Evaluation not found");
    }

    if (!ANSWER_EDITABLE_STATUSES.has(evaluation.status)) {
      throw new Error(
        "Can only record answers on draft or returned-for-correction evaluations"
      );
    }

    const node = await prisma.scoringNode.findUnique({
      where: { id: data.nodeId },
    });

    if (!node) {
      throw new Error("Node not found");
    }

    // Check if answer already exists
    const existingAnswer = await prisma.scoringEvaluationAnswer.findFirst({
      where: {
        evaluationId: data.evaluationId,
        nodeId: data.nodeId,
      },
    });

    let answer;

    if (existingAnswer) {
      // Update existing answer
      answer = await prisma.scoringEvaluationAnswer.update({
        where: { id: existingAnswer.id },
        data: {
          valueString: data.valueString,
          valueNumber: data.valueNumber,
          valueBoolean: data.valueBoolean,
          valueDate: data.valueDate,
          manualScore: data.manualScore,
          comment: data.comment,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new answer
      answer = await prisma.scoringEvaluationAnswer.create({
        data: {
          evaluationId: data.evaluationId,
          nodeId: data.nodeId,
          answerType: node.answerType || "TEXT",
          valueString: data.valueString,
          valueNumber: data.valueNumber,
          valueBoolean: data.valueBoolean,
          valueDate: data.valueDate,
          manualScore: data.manualScore,
          comment: data.comment,
        },
      });
    }

    await auditSensitiveAction({
      userId: data.recordedBy,
      action: "SCORING_EVALUATION_ANSWER_UPSERT",
      evaluationId: data.evaluationId,
      entityType: "ScoringEvaluationAnswer",
      entityId: answer.id,
      details: { nodeId: data.nodeId },
    });

    return answer;
  }

  /**
   * Get all answers for an evaluation
   */
  static async getEvaluationAnswers(evaluationId: string) {
    return prisma.scoringEvaluationAnswer.findMany({
      where: { evaluationId },
      include: {
        node: true,
      },
    });
  }

  /**
   * Submit evaluation for review
   */
  static async submitEvaluation(evaluationId: string, submittedBy: string) {
    const evaluation = await prisma.scoringEvaluation.findUnique({
      where: { id: evaluationId },
    });

    if (!evaluation) {
      throw new Error("Evaluation not found");
    }

    if (evaluation.status !== "brouillon") {
      throw new Error("Only draft evaluations can be submitted");
    }

    // Calculate scores
    await this.calculateScores(evaluationId);

    const updated = await prisma.scoringEvaluation.update({
      where: { id: evaluationId },
      data: {
        status: "soumis",
        submittedAt: new Date(),
      },
    });

    await auditSensitiveAction({
      userId: submittedBy,
      action: "SCORING_EVALUATION_SUBMIT",
      evaluationId,
      projectId: evaluation.projectId,
      entityType: "ScoringEvaluation",
      entityId: evaluationId,
      details: { status: "soumis" },
    });

    return updated;
  }

  /**
   * Approve evaluation
   */
  static async approveEvaluation(evaluationId: string, approvedBy: string) {
    const evaluation = await prisma.scoringEvaluation.findUnique({
      where: { id: evaluationId },
    });

    if (!evaluation) {
      throw new Error("Evaluation not found");
    }

    if (evaluation.status !== "soumis") {
      throw new Error("Only submitted evaluations can be approved");
    }

    const updated = await prisma.scoringEvaluation.update({
      where: { id: evaluationId },
      data: {
        status: "valide",
        validatedAt: new Date(),
        approvedAt: new Date(),
      },
    });

    await auditSensitiveAction({
      userId: approvedBy,
      action: "SCORING_EVALUATION_VALIDATE",
      evaluationId,
      projectId: evaluation.projectId,
      entityType: "ScoringEvaluation",
      entityId: evaluationId,
      details: { status: "valide" },
    });

    return updated;
  }

  /**
   * Reject evaluation with comments
   */
  static async rejectEvaluation(
    evaluationId: string,
    reason: string,
    rejectedBy: string
  ) {
    const evaluation = await prisma.scoringEvaluation.findUnique({
      where: { id: evaluationId },
    });

    if (!evaluation) {
      throw new Error("Evaluation not found");
    }

    if (!["soumis", "en_revue", "valide"].includes(evaluation.status)) {
      throw new Error(
        "Can only reject submitted, in-review or validated evaluations"
      );
    }

    const updated = await prisma.scoringEvaluation.update({
      where: { id: evaluationId },
      data: {
        status: "rejete",
        notes: reason,
      },
    });

    await auditSensitiveAction({
      userId: rejectedBy,
      action: "SCORING_EVALUATION_REJECT",
      evaluationId,
      projectId: evaluation.projectId,
      entityType: "ScoringEvaluation",
      entityId: evaluationId,
      details: { status: "rejete", reason },
    });

    return updated;
  }

  /**
   * Calculate scores for evaluation using the governed V7++ runtime engine.
   */
  static async calculateScores(evaluationId: string) {
    const evaluation = await prisma.scoringEvaluation.findUnique({
      where: { id: evaluationId },
      include: { answers: true },
    });

    if (!evaluation) {
      throw new Error("Evaluation not found");
    }

    const model = await ScoringRuntimeService.getRuntimeModel(
      evaluation.modelVersionId
    );
    const runtimeAnswers: RuntimeAnswerPayload[] = evaluation.answers.map(
      (answer) => ({
        nodeId: answer.nodeId,
        valueString: answer.valueString,
        valueNumber: answer.valueNumber,
        valueBoolean: answer.valueBoolean,
        valueDate: answer.valueDate?.toISOString() ?? null,
        manualScore: answer.manualScore,
      })
    );

    const result = ScoringRuntimeService.evaluateAnswers(model, runtimeAnswers);
    const nodeResults = new Map(
      result.nodeScores.map((score) => [
        score.nodeId,
        {
          nodeId: score.nodeId,
          rawScore: score.rawScore,
          weightedScore: score.weightedScore,
          normalizedScore: score.rawScore,
          weight: score.weightApplied,
          aggregationMethod: score.aggregationMethod ?? undefined,
          explanation: `Runtime ${score.scoringMethod ?? "aggregation"} score`,
          ruleImpacts: [],
        },
      ])
    );

    const scoreWriteOperations = [
      prisma.scoringEvaluationNodeResult.deleteMany({
        where: { evaluationId },
      }),
      ...(result.nodeScores.length > 0
        ? [
            prisma.scoringEvaluationNodeResult.createMany({
              data: result.nodeScores.map((nodeScore) => ({
                evaluationId,
                nodeId: nodeScore.nodeId,
                rawScore: nodeScore.rawScore,
                weightedScore: nodeScore.weightedScore,
                normalizedScore: nodeScore.rawScore,
                aggregationMethod: nodeScore.aggregationMethod,
                traceJson: JSON.stringify(nodeScore),
              })),
            }),
          ]
        : []),
      prisma.scoringEvaluation.update({
        where: { id: evaluationId },
        data: {
          finalScore: result.globalScore,
          rating: this.ratingFromScore(result.globalScore),
          recommendation: result.decision.status,
          probabilityOfDefault: this.probabilityOfDefaultFromScore(
            result.globalScore
          ),
          malusTotal: result.triggeredRules.filter(
            (rule) => rule.actionType === "APPLY_MALUS"
          ).length,
          triggeredRulesJson: JSON.stringify(result.triggeredRules),
          summaryJson: JSON.stringify({
            alerts: result.alerts,
            decision: result.decision,
            domainScores: result.domainScores,
            nodeScores: result.nodeScores,
          }),
        },
      }),
    ];

    await prisma.$transaction(scoreWriteOperations);

    return {
      nodeResults,
      finalScores: {
        globalScore: result.globalScore,
        scores: nodeResults,
        summary: {
          totalNodes: result.nodeScores.length,
          rootNodeCount: result.domainScores.length,
          decision: result.decision,
          alerts: result.alerts,
          domainScores: result.domainScores,
          timestamp: new Date(),
        },
      },
    };
  }

  private static ratingFromScore(score: number): string {
    if (score >= 90) return "AAA";
    if (score >= 85) return "AA";
    if (score >= 75) return "A";
    if (score >= 65) return "BBB";
    if (score >= 55) return "BB";
    if (score >= 45) return "B";
    if (score >= 30) return "CCC";
    return "D";
  }

  private static probabilityOfDefaultFromScore(score: number): number {
    return Math.max(0.1, Math.min(35, Number((35 - score * 0.34).toFixed(2))));
  }

  /**
   * Get evaluation with all results
   */
  static async getEvaluationWithResults(evaluationId: string) {
    return prisma.scoringEvaluation.findUnique({
      where: { id: evaluationId },
      include: {
        answers: {
          include: {
            node: true,
          },
        },
        nodeResults: {
          include: {
            node: true,
          },
        },
        project: true,
        client: true,
        model: true,
        analyst: true,
        version: {
          include: {
            nodes: true,
          },
        },
      },
    });
  }

  /**
   * List evaluations for a project
   */
  static async getProjectEvaluations(projectId: string) {
    return prisma.scoringEvaluation.findMany({
      where: { projectId },
      include: {
        version: {
          select: {
            versionNumber: true,
            model: {
              select: { label: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
