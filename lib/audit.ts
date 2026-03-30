import { prisma } from "@/lib/prisma";

export async function writeAuditTrail(params: {
  evaluationId?: string;
  actorUserId?: string;
  entityName: string;
  entityId: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  action: string;
}) {
  const keys = new Set([...Object.keys(params.before), ...Object.keys(params.after)]);
  const entries = [...keys]
    .filter((key) => JSON.stringify(params.before[key]) !== JSON.stringify(params.after[key]))
    .map((key) => ({
      evaluationId: params.evaluationId,
      actorUserId: params.actorUserId,
      entityName: params.entityName,
      entityId: params.entityId,
      fieldName: key,
      oldValue: params.before[key] == null ? null : JSON.stringify(params.before[key]),
      newValue: params.after[key] == null ? null : JSON.stringify(params.after[key]),
      action: params.action,
    }));

  if (entries.length) {
    await prisma.auditLog.createMany({ data: entries });
  }
}
