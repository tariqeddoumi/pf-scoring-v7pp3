import prisma from "@/lib/prisma-client";
import { auditSensitiveAction } from "@/lib/services/audit-trail-service";

export async function saveEvaluation(): Promise<never> {
  throw new Error(
    "Legacy Evaluation writes are disabled. Use ScoringEvaluationService and ScoringEvaluation instead."
  );
}

export async function getEvaluation(evaluationId: string) {
  const evaluation = await prisma.scoringEvaluation.findUnique({
    where: { id: evaluationId },
    include: {
      project: true,
      analyst: true,
      answers: true,
      nodeResults: true,
      changeLogs: true,
    },
  });

  if (!evaluation) return null;

  return {
    ...evaluation,
    project: evaluation.project
      ? { ...evaluation.project, name: evaluation.project.nom }
      : null,
    scoringResult: evaluation.summaryJson ? JSON.parse(evaluation.summaryJson) : {},
    stressTestResult: null,
    rating: evaluation.rating ?? "D",
    finalScore: evaluation.finalScore ?? 0,
    recommendation: evaluation.recommendation ?? "REVIEW",
    probabilityOfDefault: evaluation.probabilityOfDefault ?? 0,
    triggeredNOGOs: evaluation.triggeredRulesJson
      ? JSON.parse(evaluation.triggeredRulesJson)
      : [],
    appliedMALUS: [],
    malusTotal: evaluation.malusTotal ?? 0,
    version: "V7++.5",
  };
}

export async function getProjectEvaluations(projectId: string) {
  return prisma.scoringEvaluation.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateEvaluationStatus(
  evaluationId: string,
  status: "brouillon" | "soumis" | "en_revue" | "retour_correction" | "valide" | "rejete" | "archive",
  userId?: string,
  notes?: string
) {
  const evaluation = await prisma.scoringEvaluation.update({
    where: { id: evaluationId },
    data: { status, notes },
  });

  if (userId) {
    await auditSensitiveAction({
      userId,
      action: "SCORING_EVALUATION_STATUS_UPDATE",
      evaluationId,
      projectId: evaluation.projectId,
      entityType: "ScoringEvaluation",
      entityId: evaluationId,
      details: { status, notes },
    });
  }

  return evaluation;
}

export async function getLatestEvaluation(projectId: string) {
  return prisma.scoringEvaluation.findFirst({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
}

export async function saveStressTestResults(
  evaluationId: string,
  results: unknown,
  userId?: string
): Promise<void> {
  const evaluation = await prisma.scoringEvaluation.update({
    where: { id: evaluationId },
    data: {
      summaryJson: JSON.stringify({ stressTestResult: results }),
    },
  });

  if (userId) {
    await auditSensitiveAction({
      userId,
      action: "SCORING_EVALUATION_STRESS_TEST_SAVE",
      evaluationId,
      projectId: evaluation.projectId,
      entityType: "ScoringEvaluation",
      entityId: evaluationId,
      details: results,
    });
  }
}

export async function logScoringAction(
  evaluationId: string,
  userId: string,
  action: string,
  details?: unknown
): Promise<void> {
  const evaluation = await prisma.scoringEvaluation.findUnique({
    where: { id: evaluationId },
    select: { projectId: true },
  });

  await auditSensitiveAction({
    userId,
    action,
    evaluationId,
    projectId: evaluation?.projectId,
    entityType: "ScoringEvaluation",
    entityId: evaluationId,
    details,
  });
}

export async function getAuditLogs(evaluationId: string): Promise<unknown[]> {
  const [changeLogs, auditLogs] = await Promise.all([
    prisma.scoringChangeLog.findMany({
      where: { evaluationId },
      orderBy: { changedAt: "desc" },
    }),
    prisma.auditLog.findMany({
      where: { details: { contains: evaluationId } },
      orderBy: { dateAction: "desc" },
    }),
  ]);

  return [...changeLogs, ...auditLogs];
}

export async function getProjectEvaluationStats(projectId: string): Promise<{
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  averageScore: number;
}> {
  const evaluations = await prisma.scoringEvaluation.findMany({
    where: { projectId },
    select: { status: true, finalScore: true },
  });

  const scores = evaluations
    .map((evaluation) => evaluation.finalScore)
    .filter((score): score is number => typeof score === "number");

  return {
    total: evaluations.length,
    approved: evaluations.filter((evaluation) => evaluation.status === "valide").length,
    rejected: evaluations.filter((evaluation) => evaluation.status === "rejete").length,
    pending: evaluations.filter((evaluation) => ["brouillon", "soumis", "en_revue"].includes(evaluation.status)).length,
    averageScore: scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0,
  };
}

export async function exportEvaluationsToCSV(projectId?: string): Promise<string> {
  const evaluations = await prisma.scoringEvaluation.findMany({
    where: projectId ? { projectId } : undefined,
    include: { project: true, analyst: true },
    orderBy: { createdAt: "desc" },
  });

  const header = "id,project,analyst,status,finalScore,rating,createdAt";
  const rows = evaluations.map((evaluation) =>
    [
      evaluation.id,
      evaluation.project.nom,
      evaluation.analyst.email,
      evaluation.status,
      evaluation.finalScore ?? "",
      evaluation.rating ?? "",
      evaluation.createdAt.toISOString(),
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(",")
  );

  return [header, ...rows].join("\n");
}

export async function deleteOldEvaluations(): Promise<never> {
  throw new Error("Physical deletion of evaluations is disabled. Archive ScoringEvaluation records instead.");
}

export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}

export default {
  saveEvaluation,
  getEvaluation,
  getProjectEvaluations,
  updateEvaluationStatus,
  getLatestEvaluation,
  saveStressTestResults,
  logScoringAction,
  getAuditLogs,
  getProjectEvaluationStats,
  exportEvaluationsToCSV,
  deleteOldEvaluations,
  disconnect,
};
