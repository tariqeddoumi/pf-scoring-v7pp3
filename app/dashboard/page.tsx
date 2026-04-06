import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageShell, Card, Badge } from '@/components/ui';
import { formatAmount } from '@/lib/utils';

export default async function DashboardPage() {
  await requireUser();

  const [projects, evaluations, audits] = await Promise.all([
    prisma.project.findMany({ orderBy: { updatedAt: 'desc' }, take: 5 }),
    prisma.evaluation.findMany({ include: { project: true }, orderBy: { updatedAt: 'desc' }, take: 5 }),
    prisma.auditLog.findMany({ orderBy: { performedAt: 'desc' }, take: 5 }),
  ]);

  const totalExposure = projects.reduce((sum, p) => sum + Number(p.requestedAmount), 0);

  return (
    <PageShell title="Dashboard portefeuille" subtitle="Vue synthétique de l'activité Project Finance">
      <div className="grid grid-3">
        <Card title="Projets suivis"><div style={{ fontSize: 28, fontWeight: 700 }}>{projects.length}</div></Card>
        <Card title="Exposition visible"><div style={{ fontSize: 28, fontWeight: 700 }}>{formatAmount(totalExposure)} MAD</div></Card>
        <Card title="Évaluations récentes"><div style={{ fontSize: 28, fontWeight: 700 }}>{evaluations.length}</div></Card>
      </div>
      <div className="grid grid-2">
        <Card title="Derniers projets">
          <table className="table">
            <thead><tr><th>Code</th><th>Projet</th><th>Secteur</th><th>Montant</th></tr></thead>
            <tbody>
              {projects.map((p) => <tr key={p.id}><td>{p.projectCode}</td><td>{p.name}</td><td>{p.sector}</td><td>{formatAmount(p.requestedAmount)} {p.currency}</td></tr>)}
            </tbody>
          </table>
        </Card>
        <Card title="Évaluations à suivre">
          <table className="table">
            <thead><tr><th>Référence</th><th>Projet</th><th>Statut</th><th>Score</th></tr></thead>
            <tbody>
              {evaluations.map((e) => <tr key={e.id}><td><Link href={`/evaluations/${e.id}`}>{e.reference}</Link></td><td>{e.project.name}</td><td><Badge>{e.status}</Badge></td><td>{e.score.toString()}</td></tr>)}
            </tbody>
          </table>
        </Card>
      </div>
      <Card title="Journal d'audit récent">
        <table className="table">
          <thead><tr><th>Action</th><th>Entité</th><th>Champ</th><th>Date</th></tr></thead>
          <tbody>
            {audits.map((a) => <tr key={a.id}><td>{a.action}</td><td>{a.entityType}</td><td>{a.fieldName ?? '-'}</td><td>{a.performedAt.toLocaleString('fr-FR')}</td></tr>)}
          </tbody>
        </table>
      </Card>
    </PageShell>
  );
}
