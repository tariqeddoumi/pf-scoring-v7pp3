import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageShell, Card, Input, Button } from '@/components/ui';

export default async function AdminGridsPage() {
  await requireUser(['ADMIN']);
  const domains = await prisma.scoreDomain.findMany({ include: { criteria: { include: { options: true } } }, orderBy: { sortOrder: 'asc' } });

  return (
    <PageShell title="Édition graphique des grilles" subtitle="Administration des domaines, critères et options">
      <Card title="Ajouter un domaine">
        <form action="/api/admin/grids/domain" method="post" className="grid grid-3">
          <Input name="code" placeholder="Code" required />
          <Input name="name" placeholder="Nom" required />
          <Input name="weight" type="number" step="0.01" placeholder="Poids" required />
          <Button type="submit">Ajouter</Button>
        </form>
      </Card>
      {domains.map((domain) => (
        <Card key={domain.id} title={`${domain.code} - ${domain.name}`}>
          <div>Poids: {domain.weight.toString()}</div>
          {domain.criteria.map((criterion) => (
            <div key={criterion.id} style={{ marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
              <strong>{criterion.code} - {criterion.name}</strong> (poids {criterion.weight.toString()})
              <ul>
                {criterion.options.map((o) => <li key={o.id}>{o.label} - {o.numericScore.toString()}/10 {o.isRedFlag ? '(Red flag)' : ''}</li>)}
              </ul>
            </div>
          ))}
        </Card>
      ))}
    </PageShell>
  );
}
