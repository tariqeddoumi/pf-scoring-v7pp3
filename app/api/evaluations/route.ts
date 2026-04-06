import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { computeEvaluationScore } from '@/lib/scoring';
import { evaluateRules } from '@/lib/rules-engine';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  const user = await requireUser(['ADMIN', 'ANALYST']);
  const form = await request.formData();
  const reference = String(form.get('reference'));
  const projectId = String(form.get('projectId'));
  const summary = String(form.get('summary') ?? '');

  const evaluation = await prisma.evaluation.create({
    data: {
      reference,
      projectId,
      authorId: user.id,
      summary,
      status: 'SUBMITTED',
    },
  });

  const criteria = await prisma.scoreCriterion.findMany({ include: { options: true } });
  for (const criterion of criteria) {
    const key = `criterion__${criterion.id}`;
    const selectedValue = String(form.get(key) ?? '');
    const selected = criterion.options.find((o) => o.value === selectedValue);
    if (!selected) continue;
    await prisma.criterionValue.create({
      data: {
        evaluationId: evaluation.id,
        criterionId: criterion.id,
        selectedValue: selected.value,
        selectedLabel: selected.label,
        numericScore: selected.numericScore,
      },
    });
  }

  await computeEvaluationScore(evaluation.id);
  const rules = await evaluateRules(evaluation.id);
  if (rules.hasNoGo) {
    await prisma.evaluation.update({ where: { id: evaluation.id }, data: { status: 'REJECTED', recommendation: rules.findings.map((f) => f.message).join(' | ') } });
  }
  await createAuditLog({ entityType: 'Evaluation', entityId: evaluation.id, action: 'CREATE', performedById: user.id, evaluationId: evaluation.id, projectId });
  return NextResponse.redirect(new URL(`/evaluations/${evaluation.id}`, request.url));
}
