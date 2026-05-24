"use client";

import { useEffect, useState } from "react";

type Subject = { id: number; name: string };
type Level = { id: number; name: string; order: number };
type Chapter = { id: number; title: string };

type QuestionType = "qcm" | "true_false" | "fill_blank";
const QUESTION_TYPE_LABELS: { value: QuestionType; label: string; hint: string }[] = [
  { value: "qcm", label: "QCM (choix multiples)", hint: "Question avec plusieurs réponses possibles" },
  { value: "true_false", label: "Vrai / Faux", hint: "Question à deux choix" },
  { value: "fill_blank", label: "Réponse ouverte", hint: "Texte à saisir" },
];

type Props = {
  classe: { id: number; nom: string; niveau: string };
  onClose: () => void;
  onCreated: (testId: number) => void;
};

export default function CreateTestModal({ classe, onClose, onCreated }: Props) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [questionCount, setQuestionCount] = useState("10");
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);
  const [timeMode, setTimeMode] = useState<"libre" | "chrono" | "deadline">("libre");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [deadlineAt, setDeadlineAt] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetch("/api/quiz/subjects").then((r) => r.json()).then((d) => {
      if (!d.ok) return;
      setSubjects(d.data);
      // Mathématiques par défaut
      const math = d.data.find((s: Subject) => /math/i.test(s.name));
      if (math) setSubjectId(String(math.id));
    });
    fetch("/api/quiz/levels").then((r) => r.json()).then((d) => {
      if (!d.ok) return;
      setLevels(d.data);
      // Pré-sélectionner le niveau de la classe si match
      const lvl = d.data.find((l: Level) => l.name === classe.niveau);
      if (lvl) setLevelId(String(lvl.id));
    });
  }, [classe.niveau]);

  useEffect(() => {
    if (!subjectId && !levelId) { setChapters([]); return; }
    const params = new URLSearchParams();
    if (subjectId) params.set("subject_id", subjectId);
    if (levelId) params.set("level_id", levelId);
    fetch(`/api/quiz/chapters?${params}`).then((r) => r.json()).then((d) => {
      if (d.ok) setChapters(d.data);
    });
    setChapterId("");
  }, [subjectId, levelId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (timeMode === "chrono" && !durationMinutes) {
      setFormError("Durée requise pour le mode chrono");
      return;
    }
    if (timeMode === "deadline" && !deadlineAt) {
      setFormError("Date limite requise pour le mode deadline");
      return;
    }
    setSubmitting(true);

    const res = await fetch("/api/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim() || undefined,
        subject_id: subjectId ? Number(subjectId) : undefined,
        level_id: levelId ? Number(levelId) : undefined,
        chapter_id: chapterId ? Number(chapterId) : undefined,
        difficulty: difficulty || undefined,
        question_count: Number(questionCount) || 10,
        time_mode: timeMode,
        duration_minutes: timeMode === "chrono" ? Number(durationMinutes) : undefined,
        deadline_at: timeMode === "deadline" ? deadlineAt : undefined,
        question_types: questionTypes.length > 0 ? questionTypes : undefined,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      setSubmitting(false);
      setFormError(data.error);
      return;
    }

    // Assigner le test à la classe
    const assignRes = await fetch(`/api/tests/${data.data.test_id}/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_type: "classe", target_id: classe.id }),
    });
    const assignData = await assignRes.json();
    setSubmitting(false);
    if (!assignData.ok) {
      setFormError(`Test créé mais assignation échouée : ${assignData.error}`);
      return;
    }

    onCreated(data.data.test_id);
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-gray-200 w-full max-w-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Créer un test</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              pour la classe <span className="font-medium">{classe.nom}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre du test</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Contrôle Chapitre 3 — Algèbre"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Matière</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">— Toutes —</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
              <select
                value={levelId}
                onChange={(e) => setLevelId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">— Tous —</option>
                {levels.sort((a, b) => a.order - b.order).map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chapitre</label>
              <select
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                disabled={chapters.length === 0}
              >
                <option value="">— Tous —</option>
                {chapters.map((ch) => <option key={ch.id} value={ch.id}>{ch.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulté</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">— Toutes —</option>
                <option value="facile">Facile</option>
                <option value="moyen">Moyen</option>
                <option value="difficile">Difficile</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de questions <span className="text-gray-400">(1–50)</span>
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={questionCount}
              onChange={(e) => setQuestionCount(e.target.value)}
              className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Types de questions <span className="text-gray-400 font-normal">(aucune coche = tous types)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {QUESTION_TYPE_LABELS.map((t) => {
                const checked = questionTypes.includes(t.value);
                return (
                  <label
                    key={t.value}
                    className={`flex items-start gap-2 border rounded-lg px-3 py-2 cursor-pointer text-sm ${
                      checked ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setQuestionTypes((prev) =>
                          e.target.checked
                            ? [...prev, t.value]
                            : prev.filter((v) => v !== t.value),
                        );
                      }}
                      className="accent-blue-600 mt-0.5"
                    />
                    <span>
                      <span className="block font-medium text-gray-800">{t.label}</span>
                      <span className="block text-xs text-gray-500">{t.hint}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mode temps</label>
            <div className="flex flex-wrap gap-3">
              {(["libre", "chrono", "deadline"] as const).map((m) => (
                <label key={m} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="time_mode"
                    value={m}
                    checked={timeMode === m}
                    onChange={() => setTimeMode(m)}
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-gray-700 capitalize">{m}</span>
                </label>
              ))}
            </div>
          </div>

          {timeMode === "chrono" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durée (minutes)</label>
              <input
                type="number"
                min={1}
                max={180}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {timeMode === "deadline" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date limite</label>
              <input
                type="datetime-local"
                value={deadlineAt}
                onChange={(e) => setDeadlineAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {formError && (
            <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm border border-gray-200 rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="text-sm bg-blue-600 text-white rounded-lg px-6 py-2 hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Création…" : "Créer le test"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
