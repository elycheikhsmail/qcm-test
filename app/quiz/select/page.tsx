"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Subject = { id: number; name: string; language: string; nb_questions: number };
type Level = { id: number; name: string; order: number; nb_questions: number };
type Chapter = {
  id: number;
  title: string;
  nb_questions: number;
  nb_facile: number;
  nb_moyen: number;
  nb_difficile: number;
};

const DIFFICULTY_OPTIONS = [
  { value: "", label: "Toutes" },
  { value: "facile", label: "Facile" },
  { value: "moyen", label: "Moyen" },
  { value: "difficile", label: "Difficile" },
];

const COUNT_OPTIONS = [5, 10, 15, 20];

export default function SelectPage() {
  const router = useRouter();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [levelId, setLevelId] = useState<number | null>(null);
  const [chapterId, setChapterId] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState("");
  const [count, setCount] = useState(10);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function init() {
      const t = sessionStorage.getItem("quiz_token");
      if (!t) {
        const res = await fetch("/api/me");
        if (!res.ok) {
          router.push("/");
          return;
        }
      }
      const r = await fetch("/api/quiz/subjects");
      const d = await r.json();
      setSubjects(d.data ?? []);
    }
    init();
  }, [router]);

  useEffect(() => {
    if (!subjectId) {
      setLevels([]);
      setLevelId(null);
      return;
    }
    fetch(`/api/quiz/levels?subject_id=${subjectId}`)
      .then((r) => r.json())
      .then((d) => setLevels(d.data ?? []));
    setLevelId(null);
    setChapterId(null);
    setChapters([]);
  }, [subjectId]);

  useEffect(() => {
    if (!subjectId || !levelId) {
      setChapters([]);
      setChapterId(null);
      return;
    }
    fetch(`/api/quiz/chapters?subject_id=${subjectId}&level_id=${levelId}`)
      .then((r) => r.json())
      .then((d) => setChapters(d.data ?? []));
    setChapterId(null);
  }, [subjectId, levelId]);

  async function handleStart() {
    if (!subjectId) {
      setErrorMsg("Choisissez une matière pour continuer.");
      return;
    }
    setLoading(true);
    setErrorMsg("");

    const token = sessionStorage.getItem("quiz_token");
    const body: Record<string, unknown> = { subject_id: subjectId, question_count: count };
    if (token) body.token = token;
    if (levelId) body.level_id = levelId;
    if (chapterId) body.chapter_id = chapterId;
    if (difficulty) body.difficulty = difficulty;

    try {
      const res = await fetch("/api/quiz/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Impossible de créer la session.");
        return;
      }
      router.push(`/quiz/${data.data.session_id}`);
    } catch {
      setErrorMsg("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4" dir="ltr">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Configurer le quiz</h1>
          <p className="text-gray-500 text-sm mt-1">Choisissez vos critères puis démarrez</p>
        </div>

        <div className="space-y-4">
          {/* Matière */}
          <section className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Matière *</p>
            {subjects.length === 0 ? (
              <p className="text-sm text-gray-400">Chargement…</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {subjects.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSubjectId(s.id)}
                    className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors text-left ${
                      subjectId === s.id
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : "border-gray-200 text-gray-700 hover:border-blue-300"
                    }`}
                  >
                    {s.name}
                    <span className="block text-xs font-normal text-gray-400">
                      {s.nb_questions} questions
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Niveau */}
          {levels.length > 0 && (
            <section className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Niveau</p>
              <div className="flex flex-wrap gap-2">
                {levels.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLevelId(levelId === l.id ? null : l.id)}
                    className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                      levelId === l.id
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : "border-gray-200 text-gray-700 hover:border-blue-300"
                    }`}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Chapitre */}
          {chapters.length > 0 && (
            <section className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Chapitre</p>
              <select
                value={chapterId ?? ""}
                onChange={(e) => setChapterId(e.target.value ? Number(e.target.value) : null)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Tous les chapitres</option>
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.nb_questions} questions)
                  </option>
                ))}
              </select>
            </section>
          )}

          {/* Difficulté + Nb questions */}
          <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Difficulté</p>
              <div className="flex gap-2 flex-wrap">
                {DIFFICULTY_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setDifficulty(o.value)}
                    className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                      difficulty === o.value
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : "border-gray-200 text-gray-700 hover:border-blue-300"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Nombre de questions</p>
              <div className="flex gap-2">
                {COUNT_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCount(n)}
                    className={`flex-1 py-1.5 rounded-lg border-2 text-sm font-semibold transition-colors ${
                      count === n
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : "border-gray-200 text-gray-700 hover:border-blue-300"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

          <button
            type="button"
            onClick={handleStart}
            disabled={!subjectId || loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Démarrage…" : "Démarrer le quiz →"}
          </button>
        </div>
      </div>
    </main>
  );
}
