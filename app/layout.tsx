import "./globals.css";
import type { Metadata } from "next";
import { MainNav } from "@/components/nav";

export const metadata: Metadata = {
  title: "PF Scoring V7++.3",
  description: "Project Finance scoring platform V7++.3 premium UI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="mx-auto min-h-screen max-w-7xl p-4 md:p-6">
          <header className="mb-6 overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-white/60">Project finance scoring suite</div>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">PF Scoring V7++.3</h1>
                  <p className="mt-2 max-w-3xl text-sm text-white/70 md:text-base">
                    UI premium complète, designer graphique des grilles, moteur de règles paramétrable,
                    dashboard portefeuille avancé et exports comité premium.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                  Mode cible: Git + PostgreSQL + Prisma + Vercel / hébergement interne
                </div>
              </div>
              <MainNav />
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
