import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageShell, Card, Button, Input, Select, Textarea } from '@/components/ui';

export default async function NewEvaluationPage() {
  await requireUser();
  const [projects, domains] = await Promise.all([
    prisma.project.findMany({ orderBy: { name: 'asc' } }),
    prisma.scoreDomain.findMany({ where: { isActive: true }, include: { criteria: { where: { isActive: true }, include: { options: true } } }, orderBy: { sortOrder: 'asc' } }),
  ]);

  return (
    <PageShell title="Nouvelle évaluation" subtitle="Saisie du scoring V7++.3.1">
      <Card title="Formulaire d'évaluation">
        <form action="/api/evaluations" method="post" className="grid" style={{ gap: 16 }}>
          <div className="grid grid-3">
            <div>
              <label>Référence</label>
              <Input name="reference" required />
            </div>
            <div>
              <label>Projet</label>
              <Select name="projectId" required>
                <option value="">Choisir...</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.projectCode} - {p.name}</option>)}
              </Select>
            </div>
            <div>
              <label>Résumé</label>
              <Textarea name="summary" rows={2} />
            </div>
          </div>
          {domains.map((domain) => (
            <Card key={domain.id} title={`${domain.code} - ${domain.name}`}>
              <div className="grid grid-2">
                {domain.criteria.map((criterion) => (
                  <div key={criterion.id}>
                    <label>{criterion.name}</label>
                    <Select name={`criterion__${criterion.id}`} required>
                      <option value="">Choisir...</option>
                      {criterion.options.map((opt) => <option key={opt.id} value={opt.value}>{opt.label} ({opt.numericScore.toString()}/10)</option>)}
                    </Select>
                  </div>
                ))}
              </div>
            </Card>
          ))}
          <Button type="submit">Créer l'évaluation</Button>
        </form>
      </Card>
    </PageShell>
  );
}
