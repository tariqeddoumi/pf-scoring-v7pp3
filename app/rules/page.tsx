import { SectionHeader } from "@/components/section-header";
import { rules } from "@/lib/mock-data";

export default function RulesPage() {
  return (
    <main className="grid gap-6">
      <section className="card">
        <SectionHeader
          title="Moteur de règles / no-go paramétrable"
          subtitle="Règles administrables pour hard stop, red flags, escalade et comité obligatoire."
          action={<button className="btn-primary">Nouvelle règle</button>}
        />
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="soft-card"><div className="text-sm text-slate-500">Règles actives</div><div className="mt-2 text-2xl font-semibold">24</div></div>
          <div className="soft-card"><div className="text-sm text-slate-500">No-go</div><div className="mt-2 text-2xl font-semibold">7</div></div>
          <div className="soft-card"><div className="text-sm text-slate-500">Red flags</div><div className="mt-2 text-2xl font-semibold">12</div></div>
          <div className="soft-card"><div className="text-sm text-slate-500">Escalades comité</div><div className="mt-2 text-2xl font-semibold">5</div></div>
        </div>
      </section>

      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Règle</th>
              <th>Périmètre</th>
              <th>Sévérité</th>
              <th>Expression</th>
              <th>Effet</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.code}>
                <td className="font-medium text-slate-900">{rule.code}</td>
                <td>{rule.title}</td>
                <td>{rule.scope}</td>
                <td><span className={`badge ${rule.severity === "NO_GO" ? "badge-bad" : "badge-warn"}`}>{rule.severity}</span></td>
                <td><code className="text-xs">{rule.expression}</code></td>
                <td>{rule.outcome}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
