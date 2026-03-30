import { SectionHeader } from "@/components/section-header";
import { portfolioHeatmap } from "@/lib/mock-data";

export default function PortfolioPage() {
  return (
    <main className="grid gap-6">
      <section className="card">
        <SectionHeader title="Dashboard portefeuille avancé" subtitle="Concentration, qualité moyenne, expositions et points de vigilance." />
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="soft-card"><div className="text-sm text-slate-500">Encours PF</div><div className="mt-2 text-2xl font-semibold">6.4 Mds MAD</div></div>
          <div className="soft-card"><div className="text-sm text-slate-500">Qualité moyenne</div><div className="mt-2 text-2xl font-semibold">7.1 / 10</div></div>
          <div className="soft-card"><div className="text-sm text-slate-500">Secteurs > seuil</div><div className="mt-2 text-2xl font-semibold">2</div></div>
          <div className="soft-card"><div className="text-sm text-slate-500">Comité requis</div><div className="mt-2 text-2xl font-semibold">4 dossiers</div></div>
        </div>
      </section>

      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Secteur</th>
              <th>Exposition</th>
              <th>Concentration</th>
              <th>Score moyen</th>
              <th>Niveau</th>
            </tr>
          </thead>
          <tbody>
            {portfolioHeatmap.map((row) => (
              <tr key={row.sector}>
                <td className="font-medium text-slate-900">{row.sector}</td>
                <td>{row.exposure}%</td>
                <td>{row.concentration}</td>
                <td>{row.score}</td>
                <td>
                  <span className={`badge ${row.score >= 7.5 ? "badge-ok" : row.score >= 6 ? "badge-warn" : "badge-bad"}`}>
                    {row.score >= 7.5 ? "Confortable" : row.score >= 6 ? "Surveiller" : "Tendu"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
