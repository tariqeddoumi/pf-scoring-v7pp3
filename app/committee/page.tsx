import Link from "next/link";
import { SectionHeader } from "@/components/section-header";
import { committeeTimeline, projects } from "@/lib/mock-data";

export default function CommitteePage() {
  const dossier = projects[0];
  return (
    <main className="grid gap-6">
      <section className="card">
        <SectionHeader
          title="Préparation comité"
          subtitle="Vue synthétique du dossier avant génération du rapport premium."
          action={<Link href="/committee/premium" className="btn-primary">Ouvrir l'export premium</Link>}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="card">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{dossier.code}</div>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight">{dossier.name}</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="soft-card"><div className="text-sm text-slate-500">Secteur</div><div className="mt-2 font-semibold">{dossier.sector}</div></div>
            <div className="soft-card"><div className="text-sm text-slate-500">Phase</div><div className="mt-2 font-semibold">{dossier.phase}</div></div>
            <div className="soft-card"><div className="text-sm text-slate-500">Montant</div><div className="mt-2 font-semibold">{dossier.amount}</div></div>
            <div className="soft-card"><div className="text-sm text-slate-500">Score / grade</div><div className="mt-2 font-semibold">{dossier.score} / {dossier.grade}</div></div>
          </div>
        </div>

        <div className="card">
          <SectionHeader title="Workflow" subtitle="Trace de décision avant comité." />
          <div className="mt-5 space-y-4">
            {committeeTimeline.map((item) => (
              <div key={item.step} className="rounded-2xl border border-slate-200 p-4">
                <div className="font-semibold">{item.step}</div>
                <div className="mt-1 text-sm text-slate-500">{item.owner}</div>
                <div className="mt-3"><span className={`badge ${item.status === "Terminé" ? "badge-ok" : item.status === "En cours" ? "badge-warn" : "badge-info"}`}>{item.status}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
