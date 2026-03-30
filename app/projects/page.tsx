import Link from "next/link";
import { SectionHeader } from "@/components/section-header";
import { projects } from "@/lib/mock-data";

export default function ProjectsPage() {
  return (
    <main className="grid gap-6">
      <section className="card">
        <SectionHeader
          title="Projets"
          subtitle="Référentiel premium des projets et accès rapide aux évaluations."
          action={<Link href="/evaluations/new" className="btn-primary">Créer une évaluation</Link>}
        />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <input className="input" placeholder="Recherche par code / nom" />
          <select className="input"><option>Tous les secteurs</option></select>
          <select className="input"><option>Toutes les phases</option></select>
        </div>
      </section>

      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Projet</th>
              <th>Secteur</th>
              <th>Phase</th>
              <th>Montant</th>
              <th>Score</th>
              <th>Action</th>
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
                <td><Link href="/committee/premium" className="text-sm font-medium text-slate-900">Voir dossier</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
