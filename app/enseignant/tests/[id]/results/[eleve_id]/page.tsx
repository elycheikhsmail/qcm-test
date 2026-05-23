"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

type TestInfo = { id: number; title: string | null; question_count: number };
type EleveInfo = { id: number; first_name: string | null; last_name: string | null; email: string | null };
type SessionInfo = {
  score: number;
  score_sur_20: number;
  started_at: string;
  submitted_at: string;
  duration_seconds: number | null;
};
type Answer = {
  question_id: number;
  content: string;
  type: string;
  options: unknown;
  correct_answer: unknown;
  given_answer: unknown;
  is_correct: boolean;
  answered_at: string | null;
  order: number;
};

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function fmtDuration(s: number | null) {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}min ${sec}s` : `${sec}s`;
}
function displayValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

export default function EleveDetailPage({
  params,
}: {
  params: Promise<{ id: string; eleve_id: string }>;
}) {
  const { id, eleve_id } = use(params);
  const [test, setTest] = useState<TestInfo | null>(null);
  const [eleve, setEleve] = useState<EleveInfo | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch(`/api/tests/${id}/results/eleve/${eleve_id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setTest(d.data.test);
          setEleve(d.data.eleve);
          setSession(d.data.session);
          setAnswers(d.data.answers);
        } else {
          setErr(d.error ?? "Erreur");
        }
        setLoading(false);
      })
      .catch(() => { setErr("Erreur réseau"); setLoading(false); });
  }, [id, eleve_id]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Chargement…</p>
    </div>
  );

  if (err || !test || !eleve || !session) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-600 text-sm">{err || "Données introuvables"}</p>
        <Link href={`/enseignant/tests/${id}/results`} className="mt-4 inline-block text-sm text-blue-600 underline">Retour</Link>
      </div>
    </div>
  );

  const score20 = Number(session.score_sur_20);
  const scoreColor = score20 >= 14 ? "text-emerald-700" : score20 >= 10 ? "text-amber-700" : "text-red-700";

  return (
    <div>
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {eleve.first_name} {eleve.last_name}
            </h1>
            <p className="text-sm text-gray-500">{test.title ?? `Test #${test.id}`}</p>
          </div>
          <Link
            href={`/enseignant/tests/${id}/results`}
            className="text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"
          >
            ← Résultats classe
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Session summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Résumé</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Note /20</p>
              <p className={`text-2xl font-bold ${scoreColor}`}>{score20.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Bonnes réponses</p>
              <p className="text-2xl font-bold text-gray-900">{session.score}/{test.question_count}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Durée</p>
              <p className="text-xl font-semibold text-gray-700">{fmtDuration(session.duration_seconds)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Soumis le</p>
              <p className="text-xs text-gray-700 mt-1">{fmt(session.submitted_at)}</p>
            </div>
          </div>
        </div>

        {/* Answers detail */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Détail des réponses ({answers.length} questions)
          </h2>
          <div className="space-y-3">
            {answers.map((a, i) => (
              <div
                key={a.question_id}
                className={`rounded-lg border p-4 ${a.is_correct ? "border-emerald-100 bg-emerald-50" : "border-red-100 bg-red-50"}`}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <p className="text-sm text-gray-800 font-medium">
                    <span className="text-gray-400 mr-2">Q{i + 1}.</span>
                    {a.content}
                  </p>
                  <span
                    className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded ${
                      a.is_correct
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {a.is_correct ? "Correct" : "Incorrect"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">Réponse donnée : </span>
                    <span className={a.is_correct ? "text-emerald-700 font-medium" : "text-red-700 font-medium"}>
                      {displayValue(a.given_answer)}
                    </span>
                  </div>
                  {!a.is_correct && (
                    <div>
                      <span className="text-gray-400">Bonne réponse : </span>
                      <span className="text-emerald-700 font-medium">{displayValue(a.correct_answer)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
