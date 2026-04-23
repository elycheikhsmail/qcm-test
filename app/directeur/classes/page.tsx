"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Classe = { id: number; nom: string; niveau: string; filiere: string | null; annee_scolaire: string; nb_eleves: number };

export default function DirecteurClassesPage() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/directeur/classes")
      .then((r) => r.json())
      .then((d) => { setClasses(d.data ?? []); setLoading(false); });
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Chargement…</p>;

  return (
    <div>
      <h1 className="text-lg font-bold text-gray-900 mb-6">Mes classes</h1>
      {classes.length === 0 ? (
        <p className="text-sm text-gray-500">Aucune classe assignée.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c) => (
            <Link
              key={c.id}
              href={`/directeur/classes/${c.id}`}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-sm transition-all"
            >
              <p className="font-semibold text-gray-900">{c.nom}</p>
              <p className="text-sm text-gray-500 mt-0.5">{c.niveau}{c.filiere ? ` · ${c.filiere}` : ""} · {c.annee_scolaire}</p>
              <p className="text-xs text-gray-400 mt-2">{c.nb_eleves} élève{Number(c.nb_eleves) !== 1 ? "s" : ""}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
