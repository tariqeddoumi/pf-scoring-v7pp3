import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageShell, Card, Button, Badge, Textarea } from '@/components/ui';

export default async function EvaluationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const evaluation = await prisma.evaluation.findUniqueOrThrow({
    where: { id },
    include: {
      project: true,
      domainScores: true,
      criteriaValues: { include: { criterion: true } },
      decisions: { include: { decidedBy: true }, orderBy: { decidedAt: 'asc' } },
      auditLogs: { orderBy: { performedAt: 'desc' }, take: 20 },
    },
  });

  return (
    <PageShell title={`Évaluation ${evaluation.reference}`} subtitle={evaluation.project.name} actions={<div style={{ display: 'flex', gap: 8 }}><Link href={`/api/exports/committee/${evaluation.id}?format=csv`}>CSV</Link><Link href={`/api/exports/committee/${evaluation.id}?format=pdf`}>PDF</Link><Link href={`/api/exports/committee/${evaluation.id}?format=docx`}>DOCX</Link></div>}>
      <div className="grid grid-3">
        <Card title="Synthèse"><div>Statut: <Badge>{evaluation.status}</Badge></div><div>Score: {evaluation.score.toString()}</div><div>Grade: {evaluation.grade ?? '-'}</div><div>PD: {evaluation.probabilityDefault?.toString() ?? '-'}</div></Card>
        <Card title="Projet"><div>Code: {evaluation.project.projectCode}</div><div>Sponsor: {evaluation.project.sponsor}</div><div>Secteur: {evaluation.project.sector}</div></Card>
        <Card title="Résumé"><div>{evaluation.summary ?? '-'}</div></Card>
      </div>
      <div className="grid grid-2">
        <Card title="Scores par domaine">
          <table className="table"><thead><tr><th>Domaine</th><th>Raw</th><th>Weighted</th></tr></thead><tbody>{evaluation.domainScores.map((d) => <tr key={d.id}><td>{d.domainName}</td><td>{d.rawScore.toString()}</td><td>{d.weightedScore.toString()}</td></tr>)}</tbody></table>
        </Card>
        <Card title="Valeurs des critères">
          <table className="table"><thead><tr><th>Critère</th><th>Valeur</th><th>Score</th></tr></thead><tbody>{evaluation.criteriaValues.map((v) => <tr key={v.id}><td>{v.criterion.code}</td><td>{v.selectedLabel}</td><td>{v.numericScore.toString()}</td></tr>)}</tbody></table>
        </Card>
      </div>
      <div className="grid grid-2">
        <Card title="Décisions workflow">
          <table className="table"><thead><tr><th>Étape</th><th>Action</th><th>Décideur</th><th>Date</th></tr></thead><tbody>{evaluation.decisions.map((d) => <tr key={d.id}><td>{d.stepCode}</td><td>{d.action}</td><td>{d.decidedBy.fullName}</td><td>{d.decidedAt.toLocaleString('fr-FR')}</td></tr>)}</tbody></table>
          <form action={`/api/evaluations/${evaluation.id}/decision`} method="post" className="grid" style={{ gap: 12 }}>
            <select name="action"><option value="APPROVE">Approuver</option><option value="REJECT">Rejeter</option><option value="RETURN">Retourner</option></select>
            <Textarea name="comment" rows={3} placeholder="Commentaire" />
            <Button type="submit">Soumettre la décision</Button>
          </form>
        </Card>
        <Card title="Audit trail">
          <table className="table"><thead><tr><th>Action</th><th>Champ</th><th>Ancienne valeur</th><th>Nouvelle valeur</th></tr></thead><tbody>{evaluation.auditLogs.map((a) => <tr key={a.id}><td>{a.action}</td><td>{a.fieldName ?? '-'}</td><td>{a.oldValue ?? '-'}</td><td>{a.newValue ?? '-'}</td></tr>)}</tbody></table>
        </Card>
      </div>
    </PageShell>
  );
}
