import Link from "next/link";
import { SectionHeader } from "@/components/section-header";

const modules = [
  ["Dashboard exécutif", "/dashboard", "Vision consolidée pipeline, score moyen, hard stops, portefeuille et alertes."],
  ["Projets & évaluations", "/projects", "Liste premium des projets, accès rapide aux fiches et évaluations."],
  ["Designer des grilles", "/admin/score-designer", "Édition graphique des domaines, critères, options et barèmes."],
  ["Moteur de règles", "/rules", "No-go, red flags, règles d'escalade et comité obligatoire."],
  ["Portefeuille avancé", "/portfolio", "Concentration, heatmap sectorielle, distribution des notes et stress."],
  ["Exports comité premium", "/committee/premium", "PDF, DOCX, CSV avec mise en page banque."],
];

export default function HomePage() {
  return (
    <main className="grid gap-6">
      <section className="card">
        <SectionHeader
          title="Socle V7++.3"
          subtitle="Version premium orientée usage bancaire réel, industrialisation et présentation comité."
          action={<Link href="/dashboard" className="btn-primary">Ouvrir le dashboard</Link>}
        />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="soft-card">
            <div className="text-sm font-medium text-slate-600">Bloc 1</div>
            <div className="mt-2 text-xl font-semibold">Front premium</div>
            <p className="mt-2 text-sm text-slate-500">Parcours écran par écran avec cartes, tableaux, filtres et blocs prêts à enrichir.</p>
          </div>
          <div className="soft-card">
            <div className="text-sm font-medium text-slate-600">Bloc 2</div>
            <div className="mt-2 text-xl font-semibold">Moteur paramétrable</div>
            <p className="mt-2 text-sm text-slate-500">Règles de red flags, no-go, délégations et escalades administrables.</p>
          </div>
          <div className="soft-card">
            <div className="text-sm font-medium text-slate-600">Bloc 3</div>
            <div className="mt-2 text-xl font-semibold">Livrables comité</div>
            <p className="mt-2 text-sm text-slate-500">Exports premium format décisionnel avec synthèse dossier et points de vigilance.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map(([title, href, desc]) => (
          <Link key={href} href={href} className="card transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-lg font-semibold tracking-tight">{title}</div>
            <div className="mt-2 text-sm text-slate-500">{desc}</div>
            <div className="mt-5 text-sm font-medium text-slate-900">Accéder au module →</div>
          </Link>
        ))}
      </section>
    </main>
  );
}
