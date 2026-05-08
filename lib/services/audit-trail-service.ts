import prisma from "@/lib/prisma-client";

interface AuditSensitiveActionInput {
  userId: string;
  action: string;
  projectId?: string | null;
  evaluationId?: string | null;
  entityType?: string;
  entityId?: string;
  details?: unknown;
  comment?: string;
}

function serializeDetails(details: unknown): string {
  if (details === undefined) return "{}";
  try {
    return JSON.stringify(details);
  } catch {
    return JSON.stringify({ serializationError: true });
  }
}

export async function auditSensitiveAction(input: AuditSensitiveActionInput): Promise<void> {
  const details = serializeDetails(input.details);

  await prisma.auditLog.create({
    data: {
      projectId: input.projectId ?? null,
      utilisateurId: input.userId,
      action: input.action,
      details,
    },
  });

  if (input.evaluationId || input.entityId) {
    await prisma.scoringChangeLog.create({
      data: {
        entityType: input.entityType ?? "SENSITIVE_ACTION",
        entityId: input.entityId ?? input.evaluationId ?? input.projectId ?? input.action,
        evaluationId: input.evaluationId ?? null,
        action: input.action,
        newValueJson: details,
        changedBy: input.userId,
        comment: input.comment,
      },
    });
  }
}
