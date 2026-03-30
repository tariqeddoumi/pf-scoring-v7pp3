import { SectionHeader } from "@/components/section-header";
import { StatCard } from "@/components/stat-card";
import { committeeTimeline, kpis, pipeline, portfolioHeatmap, projects } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <main className="grid gap-6">
      <section className="card">
        <SectionHeader
          title="Dashboard exécutif"
          subtitle="Synthèse opérationnelle de la chaîne d'analyse, du portefeuille et des urgences."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Évaluations en cours" value={String(kpis.evaluationsInProgress)} hint="Dossiers actifs dans le workflow" />
          <StatCard label="Score moyen" value={String(kpis.averageScore)} hint="Moyenne pondérée des évaluations récentes" />
          <StatCard label="Hard stops" value={String(kpis.hardStops)} hint="No-go et blocages critiques" />
          <StatCard label="Encours comité" value={`${kpis.committeePendingMad} MDH`} hint="Montants en attente de comité" />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="card">
          <SectionHeader title="Pipeline workflow" subtitle="Lecture rapide des volumes par étape." />
          <div className="mt-6 space-y-5">
            {pipeline.map((step) => (
              <div key={step.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{step.label}</span>
                  <span className="text-slate-500">{step.value} dossiers</span>
                </div>
                <div className="metric-bar"><span style={{ width: `${Math.min(100, step.value * 8)}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <SectionHeader title="Chronologie comité" subtitle="Vue macro des validations en cours." />
          <div className="mt-6 space-y-4">
            {committeeTimeline.map((item) => (
              <div key={item.step} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">{item.step}</div>
                    <div className="text-sm text-slate-500">{item.owner}</div>
                  </div>
                  <span className={`badge ${item.status === "Terminé" ? "badge-ok" : item.status === "En cours" ? "badge-warn" : "badge-info"}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="table-shell">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <h3 className="section-title">Évaluations récentes</h3>
              <p className="section-subtitle">Vue orientée comité et délégations.</p>
            </div>
            <button className="btn-secondary">Exporter la liste</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Projet</th>
                <th>Secteur</th>
                <th>Phase</th>
                <th>Montant</th>
                <th>Score</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.code}>
                  <td className="font-medium text-slate-900">{project.code}</td>
                  <td>{project.name}</td>
                  <td>{project.sector}</td>
                  <td>{project.phase}</td>
                  <td>{project.amount}</td>
                  <td>{project.score}</td>
                  <td><span className={`badge ${project.grade === "A" ? "badge-ok" : project.grade === "B" ? "badge-info" : project.grade === "C" ? "badge-warn" : "badge-bad"}`}>{project.grade}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <SectionHeader title="Heatmap portefeuille" subtitle="Lecture simplifiée exposition / concentration / score." />
          <div className="mt-4 space-y-4">
            {portfolioHeatmap.map((row) => (
              <div key={row.sector} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold">{row.sector}</div>
                    <div className="mt-1 text-sm text-slate-500">Exposition {row.exposure}% · Concentration {row.concentration}</div>
                  </div>
                  <span className={`badge ${row.score >= 7.5 ? "badge-ok" : row.score >= 6 ? "badge-warn" : "badge-bad"}`}>Score {row.score}</span>
                </div>
                <div className="mt-4 metric-bar"><span style={{ width: `${row.exposure * 2.5}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
