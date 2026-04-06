import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageShell, Card, Button, Input, Select } from '@/components/ui';

export default async function AdminRulesPage() {
  await requireUser(['ADMIN']);
  const [rules, criteria] = await Promise.all([
    prisma.ruleDefinition.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.scoreCriterion.findMany({ orderBy: { code: 'asc' } }),
  ]);

  return (
    <PageShell title="Moteur de règles / No-Go" subtitle="Paramétrage des règles automatiques">
      <Card title="Nouvelle règle">
        <form action="/api/admin/rules" method="post" className="grid grid-3">
          <Input name="code" placeholder="Code" required />
          <Input name="name" placeholder="Nom" required />
          <Select name="criterionCode" required>{criteria.map((c) => <option key={c.id} value={c.code}>{c.code}</option>)}</Select>
          <Select name="operator"><option value="EQUALS">EQUALS</option></Select>
          <Input name="expectedValue" placeholder="Valeur attendue" required />
          <Select name="severity"><option value="INFO">INFO</option><option value="WARNING">WARNING</option><option value="BLOCKING">BLOCKING</option></Select>
          <Input name="message" placeholder="Message" required />
          <Button type="submit">Créer</Button>
        </form>
      </Card>
      <Card title="Règles actives">
        <table className="table"><thead><tr><th>Code</th><th>Critère</th><th>Opérateur</th><th>Valeur</th><th>Sévérité</th></tr></thead><tbody>{rules.map((r) => <tr key={r.id}><td>{r.code}</td><td>{r.criterionCode}</td><td>{r.operator}</td><td>{r.expectedValue}</td><td>{r.severity}</td></tr>)}</tbody></table>
      </Card>
    </PageShell>
  );
}
