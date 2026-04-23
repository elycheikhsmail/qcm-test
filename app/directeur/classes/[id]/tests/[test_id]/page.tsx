"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

type QuestionStat = { id: number; content: string; difficulty: string; nb_reponses: number; nb_correct: number; taux_reussite: number | null; temps_moyen: number | null };
type EleveRow = { id: number; first_name: string; last_name: string; score: number | null; score_sur_20: number | null; submitted_at: string | null };
type Test = { id: number; title: string; question_count: number };

function TauxBar({ v }: { v: number | null }) {
  if (v == null) return <span className="text-gray-400">—</span>;
  const color = v >= 70 ? "bg-emerald-500" : v >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${v}%` }} />
      </div>
      <span className="text-xs text-gray-600">{v}%</span>
    </div>
  );
}

export default function DirecteurTestDetailPage({ params }: { params: Promise<{ id: string; test_id: string }> }) {
  const { id, test_id } = use(params);
  const [data, setData] = useState<{ test: Test; questionStats: QuestionStat[]; eleves: EleveRow[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/directeur/classes/${id}/tests/${test_id}`)
      .then((r) => r.json())
      .then((d) => { setData(d.data); setLoading(false); });
  }, [id, test_id]);

  if (loading) return <p className="text-sm text-gray-500">Chargement…</p>;
  if (!data) return <p className="text-sm text-red-500">Données introuvables.</p>;

  const { test, questionStats, eleves } = data;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href={`/directeur/classes/${id}`} className="text-sm text-gray-500 hover:text-gray-700">← Retour classe</Link>
        <h1 className="text-lg font-bold text-gray-900">{test.title}</h1>
      </div>

      {/* Stats par question */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Taux de réussite par question</h2>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left w-8">#</th>
                <th className="px-4 py-3 text-left">Question</th>
                <th className="px-4 py-3 text-center">Difficulté</th>
                <th className="px-4 py-3 text-left">Réussite</th>
                <th className="px-4 py-3 text-center">Temps moy.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {questionStats.map((q, i) => (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 max-w-xs"><p className="truncate">{q.content}</p></td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${q.difficulty === "facile" ? "bg-green-100 text-green-700" : q.difficulty === "moyen" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                      {q.difficulty}
                    </span>
                  </td>
                  <td className="px-4 py-3"><TauxBar v={q.taux_reussite} /></td>
                  <td className="px-4 py-3 text-center text-gray-500">{q.temps_moyen ? `${q.temps_moyen}s` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Notes élèves */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Notes des élèves</h2>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Élève</th>
                <th className="px-4 py-3 text-center">Note /20</th>
                <th className="px-4 py-3 text-left">Rendu</th>
                <th className="px-4 py-3 text-left">Profil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {eleves.map((e) => {
                const v = e.score_sur_20;
                const color = v == null ? "text-gray-400" : v >= 14 ? "text-emerald-600" : v >= 10 ? "text-amber-600" : "text-red-600";
                return (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{e.last_name} {e.first_name}</td>
                    <td className={`px-4 py-3 text-center font-semibold ${color}`}>
                      {v != null ? `${v}/20` : "Non rendu"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {e.submitted_at ? new Date(e.submitted_at).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/directeur/eleves/${e.id}`} className="text-xs text-blue-600 hover:underline">Voir profil</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
