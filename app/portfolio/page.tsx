import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageShell, Card } from '@/components/ui';
import { formatAmount } from '@/lib/utils';

export default async function PortfolioPage() {
  await requireUser();
  const projects = await prisma.project.findMany({ include: { evaluations: true } });
  const bySector = new Map<string, { count: number; exposure: number }>();
  for (const p of projects) {
    const prev = bySector.get(p.sector) ?? { count: 0, exposure: 0 };
    prev.count += 1;
    prev.exposure += Number(p.requestedAmount);
    bySector.set(p.sector, prev);
  }

  return (
    <PageShell title="Dashboard portefeuille avancé" subtitle="Pilotage par secteur et exposition">
      <Card title="Répartition sectorielle">
        <table className="table">
          <thead><tr><th>Secteur</th><th>Nombre</th><th>Exposition</th></tr></thead>
          <tbody>{Array.from(bySector.entries()).map(([sector, row]) => <tr key={sector}><td>{sector}</td><td>{row.count}</td><td>{formatAmount(row.exposure)} MAD</td></tr>)}</tbody>
        </table>
      </Card>
    </PageShell>
  );
}
