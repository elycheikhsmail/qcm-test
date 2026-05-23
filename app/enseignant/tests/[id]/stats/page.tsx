"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

type TestInfo = { id: number; title: string | null; question_count: number };
type QuestionStat = {
  id: number;
  content: string;
  order: number;
  nb_reponses: number;
  nb_correctes: number;
  taux_reussite: number;
};

function rateColor(t: number) {
  if (t >= 70) return { bar: "#10b981", text: "text-emerald-700" };
  if (t >= 40) return { bar: "#f59e0b", text: "text-amber-700" };
  return { bar: "#ef4444", text: "text-red-600" };
}

function HorizontalBar({ value }: { value: number }) {
  const { bar } = rateColor(value);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, backgroundColor: bar }}
        />
      </div>
      <span className="text-xs w-10 text-right text-gray-600 font-medium">{value}%</span>
    </div>
  );
}

export default function TestStatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [test, setTest] = useState<TestInfo | null>(null);
  const [questions, setQuestions] = useState<QuestionStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch(`/api/tests/${id}/stats`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setTest(d.data.test);
          setQuestions(d.data.questions);
        } else {
          setErr(d.error ?? "Erreur");
        }
        setLoading(false);
      })
      .catch(() => { setErr("Erreur réseau"); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Chargement…</p>
    </div>
  );

  if (err || !test) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-600 text-sm">{err || "Erreur"}</p>
        <Link href={`/enseignant/tests/${id}`} className="mt-4 inline-block text-sm text-blue-600 underline">Retour</Link>
      </div>
    </div>
  );

  const answered = questions.filter((q) => q.nb_reponses > 0);
  const avgRate = answered.length > 0
    ? Math.round(answered.reduce((s, q) => s + Number(q.taux_reussite), 0) / answered.length)
    : null;

  const sorted = [...questions].sort((a, b) => Number(a.taux_reussite) - Number(b.taux_reussite));
  const hardest = sorted.slice(0, 3).filter((q) => q.nb_reponses > 0);
  const easiest = sorted.slice(-3).reverse().filter((q) => q.nb_reponses > 0);

  return (
    <div>
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{test.title ?? `Test #${test.id}`}</h1>
            <p className="text-sm text-gray-500">Stats par question</p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/enseignant/tests/${id}/results`}
              className="text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"
            >
              Résultats classe
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

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Questions</p>
            <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Taux moyen</p>
            <p className={`text-2xl font-bold ${avgRate !== null ? rateColor(avgRate).text : "text-gray-400"}`}>
              {avgRate !== null ? `${avgRate}%` : "—"}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Sans réponse</p>
            <p className="text-2xl font-bold text-gray-900">
              {questions.filter((q) => q.nb_reponses === 0).length}
            </p>
          </div>
        </div>

        {/* Highlights */}
        {(hardest.length > 0 || easiest.length > 0) && (
          <div className="grid grid-cols-2 gap-4">
            {hardest.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-red-600 mb-2">Plus difficiles</p>
                {hardest.map((q) => (
                  <p key={q.id} className="text-xs text-gray-700 truncate">
                    Q{q.order}. {q.content.slice(0, 60)}{q.content.length > 60 ? "…" : ""}{" "}
                    <span className="font-semibold text-red-600">{q.taux_reussite}%</span>
                  </p>
                ))}
              </div>
            )}
            {easiest.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-emerald-600 mb-2">Plus faciles</p>
                {easiest.map((q) => (
                  <p key={q.id} className="text-xs text-gray-700 truncate">
                    Q{q.order}. {q.content.slice(0, 60)}{q.content.length > 60 ? "…" : ""}{" "}
                    <span className="font-semibold text-emerald-600">{q.taux_reussite}%</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Per-question bars */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Taux de réussite par question</h2>
          {questions.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune question dans ce test.</p>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.id}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-xs text-gray-700 flex-1">
                      <span className="text-gray-400 mr-1">Q{q.order}.</span>
                      {q.content.slice(0, 120)}{q.content.length > 120 ? "…" : ""}
                    </p>
                    <span className="text-xs text-gray-400 shrink-0">
                      {q.nb_correctes}/{q.nb_reponses} élèves
                    </span>
                  </div>
                  {q.nb_reponses > 0 ? (
                    <HorizontalBar value={Number(q.taux_reussite)} />
                  ) : (
                    <p className="text-xs text-gray-300 italic">Pas encore répondu</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
