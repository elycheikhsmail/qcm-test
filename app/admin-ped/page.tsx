import Link from "next/link";

export default function AdminPedHome() {
  const cards = [
    { href: "/admin-ped/questions", label: "Questions", desc: "Approuver / rejeter / éditer les questions pending" },
    { href: "/admin-ped/matieres", label: "Matières", desc: "Gérer les matières (CRUD)" },
    { href: "/admin-ped/niveaux", label: "Niveaux", desc: "Gérer les niveaux scolaires" },
    { href: "/admin-ped/chapitres", label: "Chapitres", desc: "Gérer les chapitres par matière/niveau" },
    { href: "/admin-ped/magic-links", label: "Magic links", desc: "Donner accès à un élève via un lien d'invitation" },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Tableau de bord — Administration Pédagogique</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-sm transition-all"
          >
            <p className="font-semibold text-gray-900">{c.label}</p>
            <p className="text-sm text-gray-500 mt-1">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
