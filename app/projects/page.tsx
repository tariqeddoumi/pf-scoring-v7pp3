import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageShell, Card, Button, Input } from '@/components/ui';
import { formatAmount } from '@/lib/utils';

export default async function ProjectsPage() {
  await requireUser();
  const projects = await prisma.project.findMany({ orderBy: { updatedAt: 'desc' }, include: { owner: true } });

  return (
    <PageShell title="Projets" subtitle="Consultation et création des dossiers projets">
      <div className="grid grid-2">
        <Card title="Créer un projet">
          <form action="/api/projects" method="post" className="grid grid-2">
            <div><label>Code projet</label><Input name="projectCode" required /></div>
            <div><label>Nom</label><Input name="name" required /></div>
            <div><label>Sponsor</label><Input name="sponsor" required /></div>
            <div><label>Pays</label><Input name="country" defaultValue="Morocco" required /></div>
            <div><label>Secteur</label><Input name="sector" required /></div>
            <div><label>Devise</label><Input name="currency" defaultValue="MAD" required /></div>
            <div><label>Coût total</label><Input name="totalCost" type="number" step="0.01" required /></div>
            <div><label>Montant demandé</label><Input name="requestedAmount" type="number" step="0.01" required /></div>
            <div><label>Phase</label><Input name="phase" defaultValue="Construction" required /></div>
            <div style={{ display: 'flex', alignItems: 'end' }}><Button type="submit">Créer</Button></div>
          </form>
        </Card>
        <Card title="Import Excel">
          <form action="/api/imports/excel" method="post" encType="multipart/form-data" className="grid" style={{ gap: 12 }}>
            <input name="file" type="file" accept=".xlsx,.xls" required />
            <Button type="submit">Importer</Button>
          </form>
          <p className="text-muted">Colonnes attendues : projectCode, name, sponsor, country, sector, currency, totalCost, requestedAmount, phase.</p>
        </Card>
      </div>
      <Card title="Liste des projets">
        <table className="table">
          <thead><tr><th>Code</th><th>Projet</th><th>Sponsor</th><th>Secteur</th><th>Montant</th><th>Owner</th></tr></thead>
          <tbody>
            {projects.map((p) => <tr key={p.id}><td>{p.projectCode}</td><td>{p.name}</td><td>{p.sponsor}</td><td>{p.sector}</td><td>{formatAmount(p.requestedAmount)} {p.currency}</td><td>{p.owner.fullName}</td></tr>)}
          </tbody>
        </table>
      </Card>
    </PageShell>
  );
}
