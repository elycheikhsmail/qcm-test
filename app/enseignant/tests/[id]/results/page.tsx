"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { HistogramChart } from "@/components/enseignant/HistogramChart";

type TestInfo = { id: number; title: string | null; question_count: number };
type Aggregate = {
  nb_eleves: number;
  moyenne: number | null;
  min_score: number | null;
  max_score: number | null;
};
type DistBar = { bucket: number; label: string; count: number };
type EleveRow = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  score: number;
  score_sur_20: number;
  submitted_at: string;
  duration_seconds: number | null;
};

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
function fmtDuration(s: number | null) {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}min ${sec}s` : `${sec}s`;
}
function scoreColor(n: number) {
  if (n >= 14) return "text-emerald-700 bg-emerald-50";
  if (n >= 10) return "text-amber-700 bg-amber-50";
  return "text-red-700 bg-red-50";
}

type SortKey = "name" | "score" | "duration";
type SortDir = "asc" | "desc";

function exportCsv(test: TestInfo, eleves: EleveRow[]) {
  const header = "Nom,Prénom,Email,Score,Note /20,Temps (s),Soumis le";
  const rows = eleves.map((e) =>
    [
      e.last_name ?? "",
      e.first_name ?? "",
      e.email ?? "",
      e.score,
      e.score_sur_20,
      e.duration_seconds ?? "",
      e.submitted_at ? new Date(e.submitted_at).toISOString() : "",
    ].join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `resultats-test-${test.id}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TestResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [test, setTest] = useState<TestInfo | null>(null);
  const [aggregate, setAggregate] = useState<Aggregate | null>(null);
  const [distribution, setDistribution] = useState<DistBar[]>([]);
  const [eleves, setEleves] = useState<EleveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    fetch(`/api/tests/${id}/results/classe`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setTest(d.data.test);
          setAggregate(d.data.aggregate);
          setDistribution(d.data.distribution);
          setEleves(d.data.eleves);
        } else {
          setErr(d.error ?? "Erreur");
        }
        setLoading(false);
      })
      .catch(() => { setErr("Erreur réseau"); setLoading(false); });
  }, [id]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const sorted = [...eleves].sort((a, b) => {
    let diff = 0;
    if (sortKey === "score") diff = a.score_sur_20 - b.score_sur_20;
    else if (sortKey === "duration") diff = (a.duration_seconds ?? 0) - (b.duration_seconds ?? 0);
    else diff = (a.last_name ?? "").localeCompare(b.last_name ?? "");
    return sortDir === "asc" ? diff : -diff;
  });

  const arw = (k: SortKey) => sortKey === k ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Chargement…</p>
    </div>
  );

  if (err || !test) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-600 text-sm">{err || "Test introuvable"}</p>
        <Link href={`/enseignant/tests/${id}`} className="mt-4 inline-block text-sm text-blue-600 underline">Retour</Link>
      </div>
    </div>
  );

  return (
    <div>
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{test.title ?? `Test #${test.id}`}</h1>
            <p className="text-sm text-gray-500">Résultats classe</p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/enseignant/tests/${id}/stats`}
              className="text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"
            >
              Stats par question
            </Link>
            <Link
              href={`/enseignant/tests/${id}`}
              className="text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"
            >
              ← Test
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Agrégat */}
        {aggregate && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Élèves", value: aggregate.nb_eleves },
              { label: "Moyenne /20", value: aggregate.moyenne !== null ? Number(aggregate.moyenne).toFixed(2) : "—" },
              { label: "Min /20", value: aggregate.min_score !== null ? Number(aggregate.min_score).toFixed(2) : "—" },
              { label: "Max /20", value: aggregate.max_score !== null ? Number(aggregate.max_score).toFixed(2) : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Distribution des notes</h2>
          {distribution.every((d) => d.count === 0) ? (
            <p className="text-sm text-gray-400">Aucune donnée.</p>
          ) : (
            <HistogramChart data={distribution} />
          )}
        </div>

        {/* Tableau élèves */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">
              Élèves ({eleves.length})
            </h2>
            {eleves.length > 0 && (
              <button
                onClick={() => exportCsv(test, eleves)}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 text-gray-600"
              >
                Exporter CSV
              </button>
            )}
          </div>

          {eleves.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune soumission pour ce test.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th
                      className="text-left py-2 pr-4 text-gray-400 font-medium cursor-pointer hover:text-gray-600 select-none"
                      onClick={() => toggleSort("name")}
                    >
                      Élève{arw("name")}
                    </th>
                    <th
                      className="text-right py-2 px-4 text-gray-400 font-medium cursor-pointer hover:text-gray-600 select-none"
                      onClick={() => toggleSort("score")}
                    >
                      Note /20{arw("score")}
                    </th>
                    <th
                      className="text-right py-2 px-4 text-gray-400 font-medium cursor-pointer hover:text-gray-600 select-none hidden sm:table-cell"
                      onClick={() => toggleSort("duration")}
                    >
                      Durée{arw("duration")}
                    </th>
                    <th className="text-right py-2 pl-4 text-gray-400 font-medium hidden sm:table-cell">
                      Soumis le
                    </th>
                    <th className="py-2 pl-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sorted.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="py-2 pr-4 text-gray-900">
                        {e.first_name} {e.last_name}
                        <span className="block text-xs text-gray-400">{e.email}</span>
                      </td>
                      <td className="py-2 px-4 text-right">
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${scoreColor(Number(e.score_sur_20))}`}>
                          {Number(e.score_sur_20).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-right text-gray-500 hidden sm:table-cell">
                        {fmtDuration(e.duration_seconds)}
                      </td>
                      <td className="py-2 pl-4 text-right text-gray-400 text-xs hidden sm:table-cell">
                        {fmt(e.submitted_at)}
                      </td>
                      <td className="py-2 pl-4 text-right">
                        <Link
                          href={`/enseignant/tests/${id}/results/${e.id}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Détail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
