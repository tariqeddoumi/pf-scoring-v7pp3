import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(['ADMIN', 'REVIEWER', 'RISK', 'COMMITTEE']);
  const { id } = await params;
  const form = await request.formData();
  const action = String(form.get('action') ?? 'APPROVE');
  const comment = String(form.get('comment') ?? '');

  const evaluation = await prisma.evaluation.findUniqueOrThrow({ where: { id } });
  const currentStatus = evaluation.status;
  let nextStatus = currentStatus;
  if (action === 'APPROVE') {
    if (currentStatus === 'SUBMITTED') nextStatus = 'UNDER_REVIEW';
    else if (currentStatus === 'UNDER_REVIEW') nextStatus = 'RISK_REVIEW';
    else if (currentStatus === 'RISK_REVIEW') nextStatus = 'COMMITTEE_REVIEW';
    else if (currentStatus === 'COMMITTEE_REVIEW') nextStatus = 'APPROVED';
  } else if (action === 'REJECT') nextStatus = 'REJECTED';
  else if (action === 'RETURN') nextStatus = 'RETURNED';

  await prisma.decision.create({ data: { evaluationId: id, decidedById: user.id, stepCode: currentStatus, action, comment } });
  await prisma.evaluation.update({ where: { id }, data: { status: nextStatus } });
  await createAuditLog({ entityType: 'Evaluation', entityId: id, action: 'DECISION', oldValue: currentStatus, newValue: nextStatus, performedById: user.id, evaluationId: id, fieldName: 'status' });
  return NextResponse.redirect(new URL(`/evaluations/${id}`, request.url));
}
