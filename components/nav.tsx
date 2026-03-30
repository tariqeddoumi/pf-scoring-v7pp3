import Link from "next/link";

const items = [
  { href: "/", label: "Accueil" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projets" },
  { href: "/evaluations/new", label: "Nouvelle évaluation" },
  { href: "/portfolio", label: "Portefeuille" },
  { href: "/rules", label: "Moteur de règles" },
  { href: "/admin", label: "Administration" },
  { href: "/admin/score-designer", label: "Designer des grilles" },
  { href: "/committee", label: "Comité" },
  { href: "/committee/premium", label: "Exports premium" },
  { href: "/sql", label: "SQL" }
];

export function MainNav() {
  return (
    <nav className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 transition hover:bg-white/10"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
