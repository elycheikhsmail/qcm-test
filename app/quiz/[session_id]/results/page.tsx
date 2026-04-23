"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ScoreCard } from "@/components/quiz/ScoreCard";
import { AnswersList, type ResultItem } from "@/components/quiz/AnswersList";

type Results = {
  session_id: number;
  score: number;
  correct: number;
  total: number;
  submitted_at: string;
  items: ResultItem[];
};

export default function ResultsPage({ params }: { params: Promise<{ session_id: string }> }) {
  const { session_id } = use(params);
  const sessionId = Number(session_id);
  const router = useRouter();

  const [results, setResults] = useState<Results | null>(null);
  const [loadError, setLoadError] = useState("");
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    fetch(`/api/quiz/sessions/${sessionId}/results`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) {
          setLoadError(d.error ?? "Impossible de charger les résultats.");
          return;
        }
        setResults(d.data);
      })
      .catch(() => setLoadError("Erreur réseau."));
  }, [sessionId]);

  if (loadError) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 font-medium">{loadError}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-sm text-blue-600 underline"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </main>
    );
  }

  if (!results) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-gray-400">Chargement des résultats…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4" dir="ltr">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">Résultats</h1>
        </div>

        <ScoreCard score={results.score ?? 0} correct={results.correct} total={results.total} />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowList((v) => !v)}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300 transition-colors"
          >
            {showList ? "Masquer les corrections" : "Voir mes réponses"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/quiz/select")}
            className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Nouveau quiz
          </button>
        </div>

        {showList && <AnswersList items={results.items} />}
      </div>
    </main>
  );
}
