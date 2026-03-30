import { SectionHeader } from "@/components/section-header";
import { domains } from "@/lib/mock-data";

export default function ScoreDesignerPage() {
  return (
    <main className="grid gap-6">
      <section className="card">
        <SectionHeader
          title="Édition graphique des grilles"
          subtitle="Designer visuel des domaines, critères, pondérations, options et barèmes."
          action={<button className="btn-primary">Publier une version</button>}
        />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <button className="btn-secondary">Nouveau domaine</button>
          <button className="btn-secondary">Nouveau critère</button>
          <button className="btn-secondary">Importer un barème</button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
        <div className="card space-y-4">
          <div className="text-sm font-medium text-slate-500">Arborescence du modèle</div>
          {domains.map((domain) => (
            <div key={domain.code} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold">{domain.code} — {domain.label}</div>
                  <div className="mt-1 text-sm text-slate-500">Dév {domain.dev} · Construction {domain.constr} · Exploitation {domain.ops}</div>
                </div>
                <button className="btn-secondary">Éditer</button>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="text-sm font-medium text-slate-500">Fiche critère</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input className="input" defaultValue="D5_01" />
            <input className="input" defaultValue="Minimum DSCR" />
            <select className="input" defaultValue="RANGE"><option>RANGE</option><option>OPTION</option></select>
            <input className="input" defaultValue="0.70" />
            <input className="input" defaultValue="2.00" />
            <input className="input" defaultValue="10" />
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200">
            <div className="border-b border-slate-200 px-4 py-3 font-medium">Barèmes</div>
            <div className="grid gap-3 p-4">
              <div className="grid gap-3 md:grid-cols-4">
                <input className="input" defaultValue="0" />
                <input className="input" defaultValue="1.10" />
                <input className="input" defaultValue="2" />
                <input className="input" defaultValue="<1.10x" />
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <input className="input" defaultValue="1.10" />
                <input className="input" defaultValue="1.25" />
                <input className="input" defaultValue="5" />
                <input className="input" defaultValue="1.10x-1.25x" />
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <input className="input" defaultValue="1.25" />
                <input className="input" defaultValue="99" />
                <input className="input" defaultValue="9" />
                <input className="input" defaultValue=">=1.25x" />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button className="btn-secondary">Prévisualiser</button>
            <button className="btn-primary">Enregistrer</button>
          </div>
        </div>
      </section>
    </main>
  );
}
