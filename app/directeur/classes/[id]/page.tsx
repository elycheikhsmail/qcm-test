"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

type Classe = { id: number; nom: string; niveau: string; filiere: string | null; nb_eleves: number };
type TestStat = { id: number; title: string; question_count: number; created_at: string; nb_soumis: number; moyenne: number | null; min_score: number | null; max_score: number | null };

function ScoreBadge({ v }: { v: number | null }) {
  if (v == null) return <span className="text-gray-400">—</span>;
  const color = v >= 14 ? "text-emerald-600" : v >= 10 ? "text-amber-600" : "text-red-600";
  return <span className={`font-semibold ${color}`}>{v}/20</span>;
}

export default function DirecteurClassePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<{ classe: Classe; tests: TestStat[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/directeur/classes/${id}`)
      .then((r) => r.json())
      .then((d) => { setData(d.data); setLoading(false); });
  }, [id]);

  if (loading) return <p className="text-sm text-gray-500">Chargement…</p>;
  if (!data) return <p className="text-sm text-red-500">Classe introuvable.</p>;

  const { classe, tests } = data;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/directeur/classes" className="text-sm text-gray-500 hover:text-gray-700">← Classes</Link>
        <div>
          <h1 className="text-lg font-bold text-gray-900">{classe.nom}</h1>
          <p className="text-sm text-gray-500">{classe.niveau}{classe.filiere ? ` · ${classe.filiere}` : ""} · {classe.nb_eleves} élèves</p>
        </div>
      </div>

      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Tests assignés</h2>

      {tests.length === 0 ? (
        <p className="text-sm text-gray-500">Aucun test assigné à cette classe.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Test</th>
                <th className="px-4 py-3 text-center">Soumis</th>
                <th className="px-4 py-3 text-center">Moy.</th>
                <th className="px-4 py-3 text-center">Min</th>
                <th className="px-4 py-3 text-center">Max</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tests.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{t.title}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{t.nb_soumis}</td>
                  <td className="px-4 py-3 text-center"><ScoreBadge v={t.moyenne} /></td>
                  <td className="px-4 py-3 text-center"><ScoreBadge v={t.min_score} /></td>
                  <td className="px-4 py-3 text-center"><ScoreBadge v={t.max_score} /></td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/directeur/classes/${id}/tests/${t.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Détail questions
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
