"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Eleve = { id: number; first_name: string; last_name: string; email: string };
type Session = { session_id: number; test_id: number; test_title: string; question_count: number; score: number | null; score_sur_20: number | null; submitted_at: string; subject_name: string | null };
type AggData = { eleve: Eleve; sessions: Session[]; moyenne_globale: number | null; nb_tests: number };

export default function EleveProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<AggData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/directeur/eleves/${id}`)
      .then((r) => r.json())
      .then((d) => { setData(d.data); setLoading(false); });
  }, [id]);

  if (loading) return <p className="text-sm text-gray-500">Chargement…</p>;
  if (!data) return <p className="text-sm text-red-500">Élève introuvable.</p>;

  const { eleve, sessions, moyenne_globale, nb_tests } = data;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">← Retour</button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">{eleve.last_name} {eleve.first_name}</h1>
          <p className="text-sm text-gray-500">{eleve.email}</p>
        </div>
      </div>

      {/* Résumé */}
      <div className="flex gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 text-center min-w-[100px]">
          <p className="text-2xl font-bold text-gray-900">{moyenne_globale != null ? `${moyenne_globale}/20` : "—"}</p>
          <p className="text-xs text-gray-500 mt-1">Moyenne globale</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 text-center min-w-[100px]">
          <p className="text-2xl font-bold text-gray-900">{nb_tests}</p>
          <p className="text-xs text-gray-500 mt-1">Tests passés</p>
        </div>
        <Link
          href={`/directeur/eleves/${id}/evolution`}
          className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 text-center min-w-[100px] hover:bg-blue-100 transition-colors"
        >
          <p className="text-sm font-semibold text-blue-700">Voir l'évolution</p>
          <p className="text-xs text-blue-500 mt-1">Graphique</p>
        </Link>
      </div>

      {/* Historique */}
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Historique des tests</h2>
      {sessions.length === 0 ? (
        <p className="text-sm text-gray-500">Aucun test passé.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Test</th>
                <th className="px-4 py-3 text-left">Matière</th>
                <th className="px-4 py-3 text-center">Note</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map((s) => {
                const v = s.score_sur_20;
                const color = v == null ? "text-gray-400" : v >= 14 ? "text-emerald-600" : v >= 10 ? "text-amber-600" : "text-red-600";
                return (
                  <tr key={s.session_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{s.test_title}</td>
                    <td className="px-4 py-3 text-gray-500">{s.subject_name ?? "—"}</td>
                    <td className={`px-4 py-3 text-center font-semibold ${color}`}>{v != null ? `${v}/20` : "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(s.submitted_at).toLocaleDateString("fr-FR")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
