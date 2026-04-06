import './globals.css';
import Link from 'next/link';
import { getSession } from '@/lib/auth';

export const metadata = {
  title: 'PF Scoring V7++.3.1',
  description: 'Project Finance scoring platform',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <html lang="fr">
      <body>
        <div style={{ borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <strong>PF Scoring V7++.3.1</strong>
              {session ? (
                <nav style={{ display: 'flex', gap: 12, fontSize: 14 }}>
                  <Link href="/dashboard">Dashboard</Link>
                  <Link href="/projects">Projets</Link>
                  <Link href="/evaluations/new">Nouvelle évaluation</Link>
                  <Link href="/portfolio">Portefeuille</Link>
                  <Link href="/admin/grids">Grilles</Link>
                  <Link href="/admin/rules">Règles</Link>
                </nav>
              ) : null}
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 14 }}>
              {session ? (
                <>
                  <span>{session.email}</span>
                  <form action="/api/auth/logout" method="post"><button>Déconnexion</button></form>
                </>
              ) : <Link href="/login">Connexion</Link>}
            </div>
          </div>
        </div>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
