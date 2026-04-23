"use client";

import { useEffect, useState } from "react";

type SubjectIndicator = { subject_name: string; moyenne: number };
type RecentSession = { session_id: number; test_title: string; score_sur_20: number | null; submitted_at: string; subject_name: string | null };
type Summary = { moyenne_globale: number | null; nb_tests: number; recent: RecentSession[]; bySubject: SubjectIndicator[] };

function Indicator({ label, moyenne }: { label: string; moyenne: number }) {
  const color = moyenne >= 14 ? { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" }
    : moyenne >= 10 ? { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" }
    : { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", dot: "bg-red-500" };

  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${color.bg} ${color.border}`}>
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${color.dot}`} />
        <span className="text-sm font-medium text-gray-800">{label}</span>
      </div>
      <span className={`text-sm font-bold ${color.text}`}>{moyenne}/20</span>
    </div>
  );
}

export default function ParentPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/parent/summary")
      .then((r) => r.json())
      .then((d) => { setData(d.data); setLoading(false); });
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Chargement…</p>;
  if (!data) return <p className="text-sm text-red-500">Erreur de chargement.</p>;

  const { moyenne_globale, nb_tests, recent, bySubject } = data;
  const moyColor = moyenne_globale == null ? "text-gray-400"
    : moyenne_globale >= 14 ? "text-emerald-600"
    : moyenne_globale >= 10 ? "text-amber-600"
    : "text-red-600";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-bold text-gray-900 mb-1">Résumé du compte</h1>
        <p className="text-xs text-gray-400">Vue lecture seule — aucune action n'est disponible ici.</p>
      </div>

      {/* Moyenne globale */}
      <div className="flex gap-4">
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-5 text-center">
          <p className={`text-3xl font-bold ${moyColor}`}>
            {moyenne_globale != null ? `${moyenne_globale}/20` : "—"}
          </p>
          <p className="text-xs text-gray-500 mt-1">Moyenne générale</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-5 text-center">
          <p className="text-3xl font-bold text-gray-900">{nb_tests}</p>
          <p className="text-xs text-gray-500 mt-1">Tests passés</p>
        </div>
      </div>

      {/* Indicateurs par matière */}
      {bySubject.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Par matière</h2>
          <div className="space-y-2">
            {bySubject.map((s) => <Indicator key={s.subject_name} label={s.subject_name} moyenne={Number(s.moyenne)} />)}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1" />≥ 14 &nbsp;
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1" />10–13 &nbsp;
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />&lt; 10
          </p>
        </section>
      )}

      {/* 5 derniers tests */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">5 derniers tests</h2>
        {recent.length === 0 ? (
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
                {recent.map((r) => {
                  const v = r.score_sur_20;
                  const color = v == null ? "text-gray-400" : v >= 14 ? "text-emerald-600" : v >= 10 ? "text-amber-600" : "text-red-600";
                  return (
                    <tr key={r.session_id}>
                      <td className="px-4 py-3 font-medium">{r.test_title}</td>
                      <td className="px-4 py-3 text-gray-500">{r.subject_name ?? "—"}</td>
                      <td className={`px-4 py-3 text-center font-semibold ${color}`}>{v != null ? `${v}/20` : "—"}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(r.submitted_at).toLocaleDateString("fr-FR")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
